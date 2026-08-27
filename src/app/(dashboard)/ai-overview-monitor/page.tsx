"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { LOCATIONS } from "@/lib/dataforseo/locations";

const PROJECT_ID = "demo-project";

interface SerpHistoryItem {
  id: string;
  keyword: string;
  hasAiOverview: boolean;
  hasFeaturedSnippet: boolean;
  createdAt: string;
}

export default function AiOverviewMonitorPage() {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState<string>(LOCATIONS[0].label);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SerpHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [filterKeyword, setFilterKeyword] = useState("");

  async function loadHistory() {
    setLoadingHistory(true);
    const res = await fetch(`/api/serp-analysis?projectId=${PROJECT_ID}`);
    const json = await res.json();
    if (res.ok) setHistory(json.history);
    setLoadingHistory(false);
  }

  useEffect(() => {
    loadHistory();
  }, []);

  async function checkNow() {
    setChecking(true);
    setError(null);
    const loc = LOCATIONS.find((l) => l.label === location) ?? LOCATIONS[0];

    try {
      const res = await fetch("/api/serp-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: PROJECT_ID,
          keyword,
          locationCode: loc.code,
          languageCode: loc.language,
          device: "desktop",
          depth: 20,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Check failed");
      setKeyword("");
      await loadHistory();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setChecking(false);
    }
  }

  const filtered = filterKeyword
    ? history.filter((h) =>
        h.keyword.toLowerCase().includes(filterKeyword.toLowerCase())
      )
    : history;

  const latestByKeyword = new Map<string, SerpHistoryItem>();
  for (const item of history) {
    const existing = latestByKeyword.get(item.keyword);
    if (!existing || new Date(item.createdAt) > new Date(existing.createdAt)) {
      latestByKeyword.set(item.keyword, item);
    }
  }
  const trackedKeywords = Array.from(latestByKeyword.values());
  const withAiOverview = trackedKeywords.filter((k) => k.hasAiOverview).length;

  return (
    <>
      <Topbar title="AI Overview Monitor" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="text-xs text-neutral-500">Keywords Checked</div>
            <div className="mt-1 text-xl text-neutral-100">
              {trackedKeywords.length}
            </div>
          </div>
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="text-xs text-neutral-500">
              With AI Overview (latest check)
            </div>
            <div className="mt-1 text-xl text-brand-500">{withAiOverview}</div>
          </div>
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="text-xs text-neutral-500">Total Checks Logged</div>
            <div className="mt-1 text-xl text-neutral-100">
              {history.length}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-end gap-3 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-neutral-500">
              Check a Keyword Now
            </label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. odoo erp uae"
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
            onClick={checkNow}
            disabled={checking || !keyword}
            className="rounded-md bg-brand-500 px-4 py-1.5 text-sm text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {checking ? "Checking…" : "Check Now"}
          </button>
          <p className="w-full text-xs text-neutral-500">
            Each check runs a fresh SERP pull and logs whether Google shows an
            AI Overview for that keyword right now. Check the same keyword
            again later to see if it has changed.
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-red-900 bg-red-950/40 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-xs text-neutral-500">Check History</div>
            <input
              value={filterKeyword}
              onChange={(e) => setFilterKeyword(e.target.value)}
              placeholder="Filter by keyword…"
              className="rounded-md border border-neutral-800 bg-neutral-950 px-3 py-1 text-xs text-neutral-100 outline-none focus:border-brand-500"
            />
          </div>

          {loadingHistory ? (
            <div className="text-sm text-neutral-500">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-neutral-500">
              No checks yet — run one above, or check a keyword from the SERP
              Analysis page (results show up here automatically too).
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-neutral-500">
                  <th className="pb-2 font-normal">Keyword</th>
                  <th className="pb-2 font-normal">AI Overview</th>
                  <th className="pb-2 font-normal">Featured Snippet</th>
                  <th className="pb-2 font-normal">Checked</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-t border-neutral-800">
                    <td className="py-1.5 text-neutral-200">
                      {item.keyword}
                    </td>
                    <td className="py-1.5">
                      <span
                        className={
                          item.hasAiOverview
                            ? "rounded-full border border-brand-500 px-2 py-0.5 text-xs text-brand-500"
                            : "rounded-full border border-neutral-800 px-2 py-0.5 text-xs text-neutral-500"
                        }
                      >
                        {item.hasAiOverview ? "Present" : "Not present"}
                      </span>
                    </td>
                    <td className="py-1.5">
                      <span
                        className={
                          item.hasFeaturedSnippet
                            ? "rounded-full border border-brand-500 px-2 py-0.5 text-xs text-brand-500"
                            : "rounded-full border border-neutral-800 px-2 py-0.5 text-xs text-neutral-500"
                        }
                      >
                        {item.hasFeaturedSnippet ? "Present" : "Not present"}
                      </span>
                    </td>
                    <td className="py-1.5 text-neutral-400">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </>
  );
}
