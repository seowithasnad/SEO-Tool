"use client";

import { useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { LOCATIONS } from "@/lib/dataforseo/locations";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  Tooltip,
} from "recharts";

interface KeywordResult {
  id: string;
  seedKeyword: string;
  searchVolume: number | null;
  cpc: number | null;
  competition: number | null;
  trendData: { year: number; month: number; search_volume: number }[] | null;
  relatedKeywords: any;
  suggestions: any;
}

export default function KeywordResearchPage() {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState<string>(LOCATIONS[0].label);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<KeywordResult | null>(null);

  async function runResearch() {
    setLoading(true);
    setError(null);
    setResult(null);

    const loc = LOCATIONS.find((l) => l.label === location) ?? LOCATIONS[0];

    try {
      const res = await fetch("/api/keyword-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: "demo-project",
          keyword,
          locationCode: loc.code,
          languageCode: loc.language,
          device,
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

  function exportCsv() {
    if (!result) return;
    const rows = [
      ["Keyword", "Search Volume", "CPC", "Competition"],
      [
        result.seedKeyword,
        String(result.searchVolume ?? ""),
        String(result.cpc ?? ""),
        String(result.competition ?? ""),
      ],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.seedKeyword}-keyword-research.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const trend = (result?.trendData ?? []).map((t) => ({
    label: `${t.month}/${String(t.year).slice(2)}`,
    volume: t.search_volume,
  }));

  const related: any[] = result?.relatedKeywords?.[0]?.items ?? [];
  const suggestions: any[] = result?.suggestions?.[0]?.items ?? [];

  return (
    <>
      <Topbar title="Keyword Research" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-neutral-500">Keyword</label>
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
          <div className="flex flex-col gap-1">
            <label className="text-xs text-neutral-500">Device</label>
            <select
              value={device}
              onChange={(e) => setDevice(e.target.value as "desktop" | "mobile")}
              className="rounded-md border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-100 outline-none focus:border-brand-500"
            >
              <option value="desktop">Desktop</option>
              <option value="mobile">Mobile</option>
            </select>
          </div>
          <button
            onClick={runResearch}
            disabled={loading || !keyword}
            className="rounded-md bg-brand-500 px-4 py-1.5 text-sm text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {loading ? "Researching…" : "Research"}
          </button>
          {result && (
            <button
              onClick={exportCsv}
              className="rounded-md border border-neutral-800 px-4 py-1.5 text-sm text-neutral-300 hover:bg-neutral-900"
            >
              Export CSV
            </button>
          )}
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
                <div className="text-xs text-neutral-500">Search Volume</div>
                <div className="mt-1 text-xl text-neutral-100">
                  {result.searchVolume?.toLocaleString() ?? "—"}
                </div>
              </div>
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
                <div className="text-xs text-neutral-500">CPC</div>
                <div className="mt-1 text-xl text-neutral-100">
                  {result.cpc ? `$${result.cpc.toFixed(2)}` : "—"}
                </div>
              </div>
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
                <div className="text-xs text-neutral-500">Competition</div>
                <div className="mt-1 text-xl text-neutral-100">
                  {result.competition != null
                    ? `${Math.round(result.competition * 100)}%`
                    : "—"}
                </div>
              </div>
            </div>

            {trend.length > 0 && (
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
                <div className="mb-2 text-xs text-neutral-500">Search Trend</div>
                <div style={{ width: "100%", height: 180 }}>
                  <ResponsiveContainer>
                    <LineChart data={trend}>
                      <XAxis dataKey="label" stroke="#525252" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          background: "#0a0a0a",
                          border: "1px solid #262626",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="volume"
                        stroke="#7c3aed"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {related.length > 0 && (
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
                <div className="mb-3 text-xs text-neutral-500">
                  Related Keywords
                </div>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-neutral-500">
                      <th className="pb-2 font-normal">Keyword</th>
                      <th className="pb-2 font-normal">Volume</th>
                      <th className="pb-2 font-normal">CPC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {related.slice(0, 15).map((r, i) => (
                      <tr key={i} className="border-t border-neutral-800">
                        <td className="py-1.5 text-neutral-200">
                          {r.keyword_data?.keyword ?? r.keyword}
                        </td>
                        <td className="py-1.5 text-neutral-400">
                          {r.keyword_data?.keyword_info?.search_volume ?? "—"}
                        </td>
                        <td className="py-1.5 text-neutral-400">
                          {r.keyword_data?.keyword_info?.cpc
                            ? `$${r.keyword_data.keyword_info.cpc.toFixed(2)}`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
                <div className="mb-3 text-xs text-neutral-500">
                  Keyword Suggestions
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.slice(0, 25).map((s, i) => (
                    <span
                      key={i}
                      className="rounded-full border border-neutral-800 px-3 py-1 text-xs text-neutral-300"
                    >
                      {s.keyword_data?.keyword ?? s.keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
