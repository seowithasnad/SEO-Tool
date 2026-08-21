"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";

const PROJECT_ID = "demo-project";

type SourceType =
  | "keyword-research"
  | "serp-analysis"
  | "content-brief"
  | "competitor"
  | "site-audit";

const SOURCE_OPTIONS: {
  value: SourceType;
  label: string;
  endpoint: string;
  itemsKey: string;
  formats: ("pdf" | "excel" | "csv" | "pptx")[];
  labelOf: (item: any) => string;
}[] = [
  {
    value: "keyword-research",
    label: "Keyword Research",
    endpoint: "/api/keyword-research",
    itemsKey: "history",
    formats: ["excel", "csv"],
    labelOf: (i) => i.seedKeyword,
  },
  {
    value: "serp-analysis",
    label: "SERP Analysis",
    endpoint: "/api/serp-analysis",
    itemsKey: "history",
    formats: ["pdf", "pptx", "csv"],
    labelOf: (i) => i.keyword,
  },
  {
    value: "content-brief",
    label: "Content Brief",
    endpoint: "/api/content-optimizer/generate",
    itemsKey: "items",
    formats: ["pdf", "pptx"],
    labelOf: (i) => i.targetKeyword,
  },
  {
    value: "competitor",
    label: "Competitor Analysis",
    endpoint: "/api/competitor-analysis",
    itemsKey: "history",
    formats: ["excel"],
    labelOf: (i) => i.domain,
  },
  {
    value: "site-audit",
    label: "Site Audit",
    endpoint: "/api/site-audit/start",
    itemsKey: "audits",
    formats: ["pdf", "excel", "csv"],
    labelOf: (i) => i.target ?? "Untitled audit",
  },
];

interface PastReport {
  id: string;
  type: string;
  label: string | null;
  whiteLabel: boolean;
  createdAt: string;
}

export default function ReportsPage() {
  const [sourceType, setSourceType] = useState<SourceType>("serp-analysis");
  const [items, setItems] = useState<any[]>([]);
  const [sourceId, setSourceId] = useState("");
  const [format, setFormat] = useState<"pdf" | "excel" | "csv" | "pptx">("pdf");
  const [whiteLabel, setWhiteLabel] = useState(false);
  const [agencyName, setAgencyName] = useState("");
  const [clientName, setClientName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pastReports, setPastReports] = useState<PastReport[]>([]);

  const config = SOURCE_OPTIONS.find((s) => s.value === sourceType)!;

  async function loadItems() {
    setSourceId("");
    const res = await fetch(`${config.endpoint}?projectId=${PROJECT_ID}`);
    const json = await res.json();
    if (res.ok) {
      const list = json[config.itemsKey] ?? [];
      setItems(list);
      if (!config.formats.includes(format)) setFormat(config.formats[0]);
    }
  }

  async function loadPastReports() {
    const res = await fetch(`/api/reports/generate?projectId=${PROJECT_ID}`);
    const json = await res.json();
    if (res.ok) setPastReports(json.reports);
  }

  useEffect(() => {
    loadItems();
    loadPastReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceType]);

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: PROJECT_ID,
          source: sourceType,
          sourceId,
          format,
          whiteLabel,
          agencyName: whiteLabel ? agencyName : undefined,
          clientName: whiteLabel ? clientName : undefined,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Failed to generate report");
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="(.+)"/);
      const filename = match?.[1] ?? `report.${format}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      await loadPastReports();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <>
      <Topbar title="Reports" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 gap-4 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-neutral-500">Data Source</label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value as SourceType)}
              className="rounded-md border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-100 outline-none focus:border-brand-500"
            >
              {SOURCE_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-neutral-500">Item</label>
            <select
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className="rounded-md border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-100 outline-none focus:border-brand-500"
            >
              <option value="">Select…</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {config.labelOf(item)} —{" "}
                  {new Date(item.createdAt ?? item.startedAt).toLocaleDateString()}
                </option>
              ))}
            </select>
            {items.length === 0 && (
              <p className="mt-1 text-xs text-neutral-500">
                No saved {config.label.toLowerCase()} results yet for this
                project — run one first from its page.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-neutral-500">Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as any)}
              className="rounded-md border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-100 outline-none focus:border-brand-500"
            >
              {config.formats.map((f) => (
                <option key={f} value={f}>
                  {f.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 text-sm text-neutral-300">
              <input
                type="checkbox"
                checked={whiteLabel}
                onChange={(e) => setWhiteLabel(e.target.checked)}
                className="accent-brand-500"
              />
              White-label this report
            </label>
          </div>

          {whiteLabel && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-neutral-500">
                  Agency Name (replaces "SEO Platform")
                </label>
                <input
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  className="rounded-md border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-100 outline-none focus:border-brand-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-neutral-500">
                  Client Name
                </label>
                <input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="rounded-md border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-100 outline-none focus:border-brand-500"
                />
              </div>
            </>
          )}
        </div>

        <button
          onClick={generate}
          disabled={generating || !sourceId}
          className="mt-4 rounded-md bg-brand-500 px-4 py-1.5 text-sm text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {generating ? "Generating…" : "Generate & Download"}
        </button>

        {error && (
          <div className="mt-4 rounded-md border border-red-900 bg-red-950/40 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        {pastReports.length > 0 && (
          <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="mb-3 text-xs text-neutral-500">
              Recently Generated
            </div>
            <ul className="space-y-1.5 text-sm">
              {pastReports.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between text-neutral-300"
                >
                  <span>{r.label}</span>
                  <span className="text-neutral-500">
                    {r.type.toUpperCase()}
                    {r.whiteLabel ? " · white-label" : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </>
  );
}
