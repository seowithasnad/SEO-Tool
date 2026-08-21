"use client";

import { useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { LOCATIONS } from "@/lib/dataforseo/locations";
import type { SerpAiAnalysis } from "@/lib/ai/analyze-serp";

interface OrganicItem {
  rank_absolute?: number;
  title?: string;
  url?: string;
  domain?: string;
  description?: string;
}

interface SerpResult {
  id: string;
  keyword: string;
  hasAiOverview: boolean;
  hasFeaturedSnippet: boolean;
  peopleAlsoAsk: string[] | null;
  rawResults: OrganicItem[];
  aiAnalysis: SerpAiAnalysis | null;
  seoScore: number | null;
  aiSearchScore: number | null;
}

const SCORE_ROWS: { key: keyof SerpAiAnalysis; label: string }[] = [
  { key: "contentScore", label: "Content Score" },
  { key: "seoScore", label: "SEO Score" },
  { key: "aiSearchScore", label: "AI Search Score" },
  { key: "googleAiModeScore", label: "Google AI Mode Score" },
  { key: "llmScore", label: "LLM Score" },
];

const LIST_SECTIONS: { key: keyof SerpAiAnalysis; label: string }[] = [
  { key: "commonH2s", label: "Common H2s" },
  { key: "commonH3s", label: "Common H3s" },
  { key: "entities", label: "Entities" },
  { key: "semanticKeywords", label: "Semantic Keywords" },
  { key: "contentGaps", label: "Content Gaps" },
  { key: "missingFaqs", label: "Missing FAQs" },
  { key: "missingSections", label: "Missing Sections" },
  { key: "eeatOpportunities", label: "EEAT Opportunities" },
  { key: "internalLinkingIdeas", label: "Internal Linking Ideas" },
  { key: "suggestedTables", label: "Suggested Tables" },
  { key: "suggestedDiagrams", label: "Suggested Diagrams" },
  { key: "schemaTypes", label: "Schema Types" },
];

export default function SerpAnalysisPage() {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState<string>(LOCATIONS[0].label);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [result, setResult] = useState<SerpResult | null>(null);

  async function runAnalysis() {
    setLoading(true);
    setError(null);
    setAiError(null);
    setResult(null);

    const loc = LOCATIONS.find((l) => l.label === location) ?? LOCATIONS[0];

    try {
      const res = await fetch("/api/serp-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: "demo-project",
          keyword,
          locationCode: loc.code,
          languageCode: loc.language,
          device,
          depth: 20,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Request failed");
      setResult(json.result);
      if (json.aiError) setAiError(json.aiError);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const analysis = result?.aiAnalysis;

  return (
    <>
      <Topbar title="SERP Analysis" />
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
            onClick={runAnalysis}
            disabled={loading || !keyword}
            className="rounded-md bg-brand-500 px-4 py-1.5 text-sm text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {loading ? "Analyzing…" : "Analyze SERP"}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-red-900 bg-red-950/40 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}
        {aiError && (
          <div className="mt-4 rounded-md border border-amber-900 bg-amber-950/30 px-4 py-2 text-sm text-amber-300">
            SERP data was fetched, but AI analysis failed: {aiError}. Check your
            Claude API key in Settings.
          </div>
        )}

        {result && (
          <div className="mt-6 space-y-6">
            <div className="flex flex-wrap gap-2">
              <span
                className={`rounded-full border px-3 py-1 text-xs ${
                  result.hasAiOverview
                    ? "border-brand-500 text-brand-500"
                    : "border-neutral-800 text-neutral-500"
                }`}
              >
                AI Overview {result.hasAiOverview ? "present" : "not present"}
              </span>
              <span
                className={`rounded-full border px-3 py-1 text-xs ${
                  result.hasFeaturedSnippet
                    ? "border-brand-500 text-brand-500"
                    : "border-neutral-800 text-neutral-500"
                }`}
              >
                Featured Snippet{" "}
                {result.hasFeaturedSnippet ? "present" : "not present"}
              </span>
            </div>

            <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
              <div className="mb-3 text-xs text-neutral-500">
                Top Results
              </div>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-neutral-500">
                    <th className="pb-2 font-normal">#</th>
                    <th className="pb-2 font-normal">Title</th>
                    <th className="pb-2 font-normal">Domain</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rawResults.slice(0, 20).map((item, i) => (
                    <tr key={i} className="border-t border-neutral-800">
                      <td className="py-1.5 text-neutral-500">
                        {item.rank_absolute ?? i + 1}
                      </td>
                      <td className="py-1.5 text-neutral-200">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-brand-500"
                        >
                          {item.title}
                        </a>
                      </td>
                      <td className="py-1.5 text-neutral-400">
                        {item.domain}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {result.peopleAlsoAsk && result.peopleAlsoAsk.length > 0 && (
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
                <div className="mb-3 text-xs text-neutral-500">
                  People Also Ask
                </div>
                <ul className="space-y-1.5 text-sm text-neutral-300">
                  {result.peopleAlsoAsk.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis && (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                  {SCORE_ROWS.map((row) => (
                    <div
                      key={row.key}
                      className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4"
                    >
                      <div className="text-xs text-neutral-500">
                        {row.label}
                      </div>
                      <div className="mt-1 text-xl text-neutral-100">
                        {String(analysis[row.key])}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
                  <div className="text-xs text-neutral-500">
                    Search Intent
                  </div>
                  <p className="mt-1 text-sm text-neutral-300">
                    {analysis.searchIntent}
                  </p>
                  <div className="mt-3 text-xs text-neutral-500">
                    Content Structure
                  </div>
                  <p className="mt-1 text-sm text-neutral-300">
                    {analysis.contentStructure}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {LIST_SECTIONS.map((section) => {
                    const list = analysis[section.key] as string[];
                    if (!list || list.length === 0) return null;
                    return (
                      <div
                        key={section.key}
                        className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4"
                      >
                        <div className="mb-2 text-xs text-neutral-500">
                          {section.label}
                        </div>
                        <ul className="space-y-1 text-sm text-neutral-300">
                          {list.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </>
  );
}
