import PQueue from "p-queue";

const BASE_URL = "https://api.dataforseo.com/v3";

// DataForSEO allows a modest concurrent request rate on standard plans.
// Tune `concurrency` / `intervalCap` to your plan's limits.
const queue = new PQueue({
  concurrency: 5,
  interval: 1000,
  intervalCap: 10,
});

interface DataForSeoCredentials {
  login: string;
  password: string;
}

interface RequestOptions {
  retries?: number;
  cacheTtlMs?: number;
}

// Simple in-memory cache. Swap for Redis in production for multi-instance deployments.
const cache = new Map<string, { data: unknown; expiresAt: number }>();

function cacheKey(path: string, body: unknown) {
  return `${path}:${JSON.stringify(body)}`;
}

function authHeader({ login, password }: DataForSeoCredentials) {
  const token = Buffer.from(`${login}:${password}`).toString("base64");
  return `Basic ${token}`;
}

export class DataForSeoClient {
  private creds: DataForSeoCredentials;

  constructor(creds: DataForSeoCredentials) {
    this.creds = creds;
  }

  private async request<T>(
    path: string,
    body: unknown,
    { retries = 3, cacheTtlMs = 0 }: RequestOptions = {}
  ): Promise<T> {
    const key = cacheKey(path, body);
    if (cacheTtlMs > 0) {
      const cached = cache.get(key);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.data as T;
      }
    }

    const result = await queue.add(() =>
      this.requestWithRetry<T>(path, body, retries)
    );

    if (cacheTtlMs > 0) {
      cache.set(key, { data: result, expiresAt: Date.now() + cacheTtlMs });
    }

    return result as T;
  }

  private async requestWithRetry<T>(
    path: string,
    body: unknown,
    retriesLeft: number
  ): Promise<T> {
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader(this.creds),
        },
        body: JSON.stringify(Array.isArray(body) ? body : [body]),
      });

      if (res.status === 429 || res.status >= 500) {
        throw new Error(`Retryable DataForSEO error: ${res.status}`);
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`DataForSEO error ${res.status}: ${text}`);
      }

      const json = await res.json();

      if (json.status_code && json.status_code !== 20000) {
        throw new Error(
          `DataForSEO API error ${json.status_code}: ${json.status_message}`
        );
      }

      return json as T;
    } catch (err) {
      if (retriesLeft > 0) {
        const delay = (4 - retriesLeft) * 500; // simple backoff: 500ms, 1000ms, 1500ms
        await new Promise((r) => setTimeout(r, delay));
        return this.requestWithRetry<T>(path, body, retriesLeft - 1);
      }
      throw err;
    }
  }

  // ---------- Keyword Research ----------
  async keywordOverview(params: {
    keyword: string;
    location_code: number;
    language_code: string;
  }) {
    return this.request("/keywords_data/google_ads/search_volume/live", params, {
      cacheTtlMs: 1000 * 60 * 60 * 6, // 6h cache — volumes don't change fast
    });
  }

  async relatedKeywords(params: {
    keyword: string;
    location_code: number;
    language_code: string;
    limit?: number;
  }) {
    return this.request(
      "/dataforseo_labs/google/related_keywords/live",
      params,
      { cacheTtlMs: 1000 * 60 * 60 * 6 }
    );
  }

  async keywordSuggestions(params: {
    keyword: string;
    location_code: number;
    language_code: string;
    limit?: number;
  }) {
    return this.request(
      "/dataforseo_labs/google/keyword_suggestions/live",
      params,
      { cacheTtlMs: 1000 * 60 * 60 * 6 }
    );
  }

  // ---------- SERP ----------
  async serpOrganic(params: {
    keyword: string;
    location_code: number;
    language_code: string;
    device?: "desktop" | "mobile";
    depth?: number; // up to 100
  }) {
    return this.request("/serp/google/organic/live/advanced", params, {
      cacheTtlMs: 1000 * 60 * 30, // SERPs shift — shorter cache
    });
  }

  // ---------- Backlinks ----------
  async backlinksSummary(params: { target: string }) {
    return this.request("/backlinks/summary/live", params, {
      cacheTtlMs: 1000 * 60 * 60 * 12,
    });
  }

  async backlinksList(params: { target: string; limit?: number }) {
    return this.request("/backlinks/backlinks/live", params, {
      cacheTtlMs: 1000 * 60 * 60 * 12,
    });
  }

  // ---------- On-Page / Site Audit ----------
  async onPageTaskPost(params: { target: string; max_crawl_pages?: number }) {
    // Site audits are async: this queues a crawl task.
    return this.request("/on_page/task_post", params);
  }

  async onPageSummary(params: { id: string }) {
    return this.request(`/on_page/summary/${params.id}`, {});
  }

  async onPagePages(params: { id: string; limit?: number }) {
    return this.request("/on_page/pages", params);
  }

  // ---------- Domain / Competitor Analysis ----------
  async domainRankOverview(params: {
    target: string;
    location_code: number;
    language_code: string;
  }) {
    return this.request(
      "/dataforseo_labs/google/domain_rank_overview/live",
      params,
      { cacheTtlMs: 1000 * 60 * 60 * 12 }
    );
  }

  async rankedKeywords(params: {
    target: string;
    location_code: number;
    language_code: string;
    limit?: number;
  }) {
    return this.request(
      "/dataforseo_labs/google/ranked_keywords/live",
      params,
      { cacheTtlMs: 1000 * 60 * 60 * 6 }
    );
  }

  async relevantPages(params: {
    target: string;
    location_code: number;
    language_code: string;
    limit?: number;
  }) {
    return this.request("/dataforseo_labs/google/relevant_pages/live", params, {
      cacheTtlMs: 1000 * 60 * 60 * 12,
    });
  }

  async domainIntersection(params: {
    target1: string;
    target2: string;
    location_code: number;
    language_code: string;
  }) {
    // Used for content-gap analysis between your domain and a competitor's.
    return this.request(
      "/dataforseo_labs/google/domain_intersection/live",
      params
    );
  }
}

export function getClientForUser(login: string, password: string) {
  return new DataForSeoClient({ login, password });
}
