"use client";

import { useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { LOCATIONS } from "@/lib/dataforseo/locations";

interface CompetitorResult {
  id: string;
  domain: string;
  estTraffic: number | null;
  topPages: any[] | null;
  topKeywords: any[] | null;
  backlinks: any | null;
  contentGaps: any[] | null;
}

const PROJECT_ID = "demo-project";

export default function CompetitorAnalysisPage() {
  const [domain, setDomain] = useState("");
  const [location, setLocation] = useState<string>(LOCATIONS[0].label);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompetitorResult | null>(null);

  async function runAnalysis() {
    setLoading(true);
    setError(null);
    setResult(null);
    const loc = LOCATIONS.find((l) => l.label === location) ?? LOCATIONS[0];

    try {
      const res = await fetch("/api/competitor-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: PROJECT_ID,
          competitorDomain: domain,
          locationCode: loc.code,
          languageCode: loc.language,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Request failed");
      setResult(json.result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const topPages = result?.topPages ?? [];
  const topKeywords = result?.topKeywords ?? [];
  const contentGaps = result?.contentGaps ?? [];

  return (
    <>
      <Topbar title="Competitor Analysis" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-neutral-500">
              Competitor Domain
            </label>
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g. competitor.com"
              className="w-64 rounded-md border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-100 outline-none focus:border-brand-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-neutral-500">Country</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="rounded-md border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-100 outline-none focus:border-brand-500"
            >
              {LOCATIONS.map((l) => (
                <option key={l.label} value={l.label}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={runAnalysis}
            disabled={loading || !domain}
            className="rounded-md bg-brand-500 px-4 py-1.5 text-sm text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {loading ? "Analyzing…" : "Analyze Competitor"}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-red-900 bg-red-950/40 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
                <div className="text-xs text-neutral-500">Domain</div>
                <div className="mt-1 text-lg text-neutral-100">
                  {result.domain}
                </div>
              </div>
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
                <div className="text-xs text-neutral-500">
                  Est. Organic Traffic
                </div>
                <div className="mt-1 text-lg text-neutral-100">
                  {result.estTraffic?.toLocaleString() ?? "—"}
                </div>
              </div>
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
                <div className="text-xs text-neutral-500">
                  Referring Domains
                </div>
                <div className="mt-1 text-lg text-neutral-100">
                  {result.backlinks?.referring_domains?.toLocaleString() ??
                    "—"}
                </div>
              </div>
            </div>

            {topKeywords.length > 0 && (
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
                <div className="mb-3 text-xs text-neutral-500">
                  Top Ranking Keywords
                </div>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-neutral-500">
                      <th className="pb-2 font-normal">Keyword</th>
                      <th className="pb-2 font-normal">Position</th>
                      <th className="pb-2 font-normal">Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topKeywords.slice(0, 15).map((kw, i) => (
                      <tr key={i} className="border-t border-neutral-800">
                        <td className="py-1.5 text-neutral-200">
                          {kw.keyword_data?.keyword ?? kw.keyword}
                        </td>
                        <td className="py-1.5 text-neutral-400">
                          {kw.ranked_serp_element?.serp_item?.rank_absolute ??
                            "—"}
                        </td>
                        <td className="py-1.5 text-neutral-400">
                          {kw.keyword_data?.keyword_info?.search_volume ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {topPages.length > 0 && (
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
                <div className="mb-3 text-xs text-neutral-500">Top Pages</div>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-neutral-500">
                      <th className="pb-2 font-normal">URL</th>
                      <th className="pb-2 font-normal">Est. Traffic</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPages.slice(0, 15).map((p, i) => (
                      <tr key={i} className="border-t border-neutral-800">
                        <td className="py-1.5 text-neutral-200">
                          <a
                            href={p.page_address ?? p.url}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-brand-500"
                          >
                            {p.page_address ?? p.url}
                          </a>
                        </td>
                        <td className="py-1.5 text-neutral-400">
                          {p.metrics?.organic?.etv
                            ? Math.round(p.metrics.organic.etv)
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {contentGaps.length > 0 && (
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
                <div className="mb-1 text-xs text-neutral-500">
                  Content Gap
                </div>
                <p className="mb-3 text-xs text-neutral-500">
                  Keywords in this shared keyword universe — check rank_absolute
                  values below to spot the ones only the competitor ranks for.
                </p>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-neutral-500">
                      <th className="pb-2 font-normal">Keyword</th>
                      <th className="pb-2 font-normal">Your Position</th>
                      <th className="pb-2 font-normal">
                        Competitor Position
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {contentGaps.slice(0, 20).map((g, i) => (
                      <tr key={i} className="border-t border-neutral-800">
                        <td className="py-1.5 text-neutral-200">
                          {g.keyword_data?.keyword ?? g.keyword}
                        </td>
                        <td className="py-1.5 text-neutral-400">
                          {g.first_domain_serp_element?.rank_absolute ?? "—"}
                        </td>
                        <td className="py-1.5 text-neutral-400">
                          {g.second_domain_serp_element?.rank_absolute ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
