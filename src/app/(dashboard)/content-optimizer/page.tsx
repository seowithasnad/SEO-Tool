"use client";

import { useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import type { ContentBrief } from "@/lib/ai/generate-content-brief";
import type { ContentAnalysis } from "@/lib/ai/analyze-content";

const PROJECT_ID = "demo-project";

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="mt-1 text-xl text-neutral-100">{value}</div>
    </div>
  );
}

function ListPanel({ label, items }: { label: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
      <div className="mb-2 text-xs text-neutral-500">{label}</div>
      <ul className="space-y-1 text-sm text-neutral-300">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function GeneratorTab() {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brief, setBrief] = useState<ContentBrief | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    setBrief(null);
    try {
      const res = await fetch("/api/content-optimizer/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: PROJECT_ID, keyword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Request failed");
      setBrief(json.brief);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    if (!brief) return;
    const rows = [
      ["Field", "Value"],
      ["H1", brief.outline.h1],
      ["Meta Title", brief.metaTitle],
      ["Meta Description", brief.metaDescription],
      ["Slug", brief.slug],
      ["SEO Score", String(brief.seoScore)],
      ["EEAT Score", String(brief.eeatScore)],
      ["AI Search Visibility Score", String(brief.aiSearchVisibilityScore)],
      ...brief.outline.sections.map((s) => ["H2", s.h2]),
      ...brief.faqs.map((f) => ["FAQ", `${f.question} — ${f.answer}`]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${brief.slug || "content-brief"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-500">Target Keyword</label>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="e.g. odoo erp uae"
            className="w-64 rounded-md border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-100 outline-none focus:border-brand-500"
          />
        </div>
        <button
          onClick={generate}
          disabled={loading || !keyword}
          className="rounded-md bg-brand-500 px-4 py-1.5 text-sm text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {loading ? "Generating…" : "Generate Brief"}
        </button>
        {brief && (
          <button
            onClick={exportCsv}
            className="rounded-md border border-neutral-800 px-4 py-1.5 text-sm text-neutral-300 hover:bg-neutral-900"
          >
            Export CSV
          </button>
        )}
        <p className="w-full text-xs text-neutral-500">
          If you've already run SERP Analysis for this exact keyword, the brief
          builds on those content gaps automatically.
        </p>
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-red-900 bg-red-950/40 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {brief && (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ScoreCard label="SEO Score" value={brief.seoScore} />
            <ScoreCard label="EEAT Score" value={brief.eeatScore} />
            <ScoreCard
              label="AI Search Visibility"
              value={brief.aiSearchVisibilityScore}
            />
          </div>

          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="text-xs text-neutral-500">Meta Title</div>
            <p className="mt-1 text-sm text-neutral-200">{brief.metaTitle}</p>
            <div className="mt-3 text-xs text-neutral-500">
              Meta Description
            </div>
            <p className="mt-1 text-sm text-neutral-200">
              {brief.metaDescription}
            </p>
            <div className="mt-3 text-xs text-neutral-500">Slug</div>
            <p className="mt-1 text-sm text-neutral-200">/{brief.slug}</p>
          </div>

          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="mb-3 text-xs text-neutral-500">
              Content Outline
            </div>
            <p className="mb-2 text-sm text-neutral-100">
              {brief.outline.h1}
            </p>
            <ul className="space-y-2">
              {brief.outline.sections.map((s, i) => (
                <li key={i}>
                  <p className="text-sm text-neutral-200">{s.h2}</p>
                  {s.h3s.length > 0 && (
                    <ul className="mt-1 ml-4 list-disc space-y-0.5 text-sm text-neutral-400">
                      {s.h3s.map((h3, j) => (
                        <li key={j}>{h3}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="mb-2 text-xs text-neutral-500">
              Featured Snippet Answer
            </div>
            <p className="text-sm text-neutral-300">
              {brief.featuredSnippetAnswer}
            </p>
          </div>

          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="mb-3 text-xs text-neutral-500">FAQs</div>
            <ul className="space-y-3">
              {brief.faqs.map((f, i) => (
                <li key={i}>
                  <p className="text-sm text-neutral-200">{f.question}</p>
                  <p className="text-sm text-neutral-400">{f.answer}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="mb-3 text-xs text-neutral-500">
              Image Suggestions
            </div>
            <ul className="space-y-2 text-sm text-neutral-300">
              {brief.imageSuggestions.map((img, i) => (
                <li key={i}>
                  <span className="text-neutral-200">{img.filename}</span> —{" "}
                  {img.altText}
                  <div className="text-neutral-500">{img.caption}</div>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ListPanel label="Semantic Keywords" items={brief.semanticKeywords} />
            <ListPanel label="Entities" items={brief.entityList} />
            <ListPanel label="LSI Keywords" items={brief.lsiKeywords} />
            <ListPanel
              label="Internal Link Ideas"
              items={brief.internalLinkIdeas}
            />
            <ListPanel
              label="External Reference Ideas"
              items={brief.externalReferenceIdeas}
            />
            <ListPanel
              label="EEAT Recommendations"
              items={brief.eeatRecommendations}
            />
            <ListPanel
              label="Schema Types"
              items={brief.schema.map((s) => `${s.type} — ${s.notes}`)}
            />
          </div>

          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="mb-3 text-xs text-neutral-500">
              AI Engine Optimization Notes
            </div>
            <ul className="space-y-1.5 text-sm text-neutral-300">
              <li>
                <span className="text-neutral-200">Google AI Overview:</span>{" "}
                {brief.aiEngineNotes.googleAiOverview}
              </li>
              <li>
                <span className="text-neutral-200">ChatGPT:</span>{" "}
                {brief.aiEngineNotes.chatgpt}
              </li>
              <li>
                <span className="text-neutral-200">Claude:</span>{" "}
                {brief.aiEngineNotes.claude}
              </li>
              <li>
                <span className="text-neutral-200">Gemini:</span>{" "}
                {brief.aiEngineNotes.gemini}
              </li>
              <li>
                <span className="text-neutral-200">Perplexity:</span>{" "}
                {brief.aiEngineNotes.perplexity}
              </li>
              <li>
                <span className="text-neutral-200">Copilot:</span>{" "}
                {brief.aiEngineNotes.copilot}
              </li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

function OptimizerTab() {
  const [keyword, setKeyword] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ContentAnalysis | null>(null);

  async function analyze() {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const res = await fetch("/api/content-optimizer/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: PROJECT_ID,
          targetKeyword: keyword,
          body,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Request failed");
      setAnalysis(json.analysis);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-500">Target Keyword</label>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="e.g. odoo erp uae"
            className="w-64 rounded-md border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-100 outline-none focus:border-brand-500"
          />
        </div>
        <div className="mt-3 flex flex-col gap-1">
          <label className="text-xs text-neutral-500">
            Article Draft
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            placeholder="Paste your article draft here…"
            className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-brand-500"
          />
        </div>
        <button
          onClick={analyze}
          disabled={loading || !keyword || body.length < 50}
          className="mt-3 rounded-md bg-brand-500 px-4 py-1.5 text-sm text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {loading ? "Analyzing…" : "Analyze Content"}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-red-900 bg-red-950/40 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {analysis && (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <ScoreCard label="SEO Score" value={analysis.seoScore} />
            <ScoreCard label="Readability" value={analysis.readabilityScore} />
            <ScoreCard label="EEAT" value={analysis.eeatScore} />
            <ScoreCard
              label="AI Search Visibility"
              value={analysis.aiSearchVisibilityScore}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <ScoreCard
              label="Google AI Overview"
              value={analysis.llmScores.googleAiOverview}
            />
            <ScoreCard label="ChatGPT" value={analysis.llmScores.chatgpt} />
            <ScoreCard label="Claude" value={analysis.llmScores.claude} />
            <ScoreCard label="Gemini" value={analysis.llmScores.gemini} />
            <ScoreCard
              label="Perplexity"
              value={analysis.llmScores.perplexity}
            />
          </div>

          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="text-xs text-neutral-500">
              Keyword Density: {analysis.keywordDensityPercent}%
            </div>
            <div className="mt-2 text-xs text-neutral-500">
              Search Intent — {analysis.intentMatch}
            </div>
            <p className="mt-1 text-sm text-neutral-300">
              {analysis.searchIntent}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ListPanel
              label="Semantic Coverage — Missing"
              items={analysis.semanticCoverage.missing}
            />
            <ListPanel
              label="Entity Coverage — Missing"
              items={analysis.entityCoverage.missing}
            />
            <ListPanel
              label="Missing Questions"
              items={analysis.missingQuestions}
            />
            <ListPanel label="EEAT Notes" items={analysis.eeatNotes} />
          </div>

          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="mb-2 text-xs text-neutral-500">
              Top Recommendations
            </div>
            <ul className="list-decimal space-y-1 pl-4 text-sm text-neutral-300">
              {analysis.topRecommendations.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

export default function ContentOptimizerPage() {
  const [tab, setTab] = useState<"generate" | "optimize">("generate");

  return (
    <>
      <Topbar title="Content Optimizer" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setTab("generate")}
            className={`rounded-md px-3 py-1.5 text-sm ${
              tab === "generate"
                ? "bg-brand-500 text-white"
                : "border border-neutral-800 text-neutral-400 hover:bg-neutral-900"
            }`}
          >
            AI Content Generator
          </button>
          <button
            onClick={() => setTab("optimize")}
            className={`rounded-md px-3 py-1.5 text-sm ${
              tab === "optimize"
                ? "bg-brand-500 text-white"
                : "border border-neutral-800 text-neutral-400 hover:bg-neutral-900"
            }`}
          >
            Content Optimizer
          </button>
        </div>

        {tab === "generate" ? <GeneratorTab /> : <OptimizerTab />}
      </main>
    </>
  );
}
