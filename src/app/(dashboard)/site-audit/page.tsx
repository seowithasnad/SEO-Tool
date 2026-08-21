"use client";

import { useEffect, useRef, useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";

interface IssuesSummary {
  pagesCrawled: number;
  brokenLinksCount: number;
  headingIssuesCount: number;
  metaIssuesCount: number;
  imageIssuesCount: number;
}

interface SiteAudit {
  id: string;
  target: string | null;
  status: string;
  startedAt: string;
  completedAt: string | null;
  issuesSummary: IssuesSummary | null;
  brokenLinks: { url: string; statusCode: number }[] | null;
  metaIssues: { url: string }[] | null;
  headingIssues: { url: string }[] | null;
  imageIssues: { url: string }[] | null;
}

const PROJECT_ID = "demo-project";

const ISSUE_TABLES: { key: keyof SiteAudit; label: string }[] = [
  { key: "brokenLinks", label: "Broken Links / 4xx-5xx" },
  { key: "metaIssues", label: "Missing / Duplicate Meta" },
  { key: "headingIssues", label: "Heading Structure Issues" },
  { key: "imageIssues", label: "Images Missing Alt Text" },
];

export default function SiteAuditPage() {
  const [target, setTarget] = useState("");
  const [audits, setAudits] = useState<SiteAudit[]>([]);
  const [active, setActive] = useState<SiteAudit | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function loadAudits() {
    const res = await fetch(`/api/site-audit/start?projectId=${PROJECT_ID}`);
    const json = await res.json();
    if (res.ok) setAudits(json.audits);
  }

  useEffect(() => {
    loadAudits();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function pollAudit(id: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/site-audit/status?id=${id}`);
      const json = await res.json();
      if (!res.ok) return;
      setActive(json.audit);
      if (json.audit.status === "completed" || json.audit.status === "failed") {
        if (pollRef.current) clearInterval(pollRef.current);
        loadAudits();
      }
    }, 8000);
  }

  async function startAudit() {
    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/site-audit/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: PROJECT_ID,
          target,
          maxCrawlPages: 100,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to start audit");
      setActive(json.audit);
      pollAudit(json.audit.id);
      await loadAudits();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setStarting(false);
    }
  }

  const summary = active?.issuesSummary;

  return (
    <>
      <Topbar title="Site Audit" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-neutral-500">Target</label>
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="e.g. example.com"
              className="w-64 rounded-md border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-100 outline-none focus:border-brand-500"
            />
          </div>
          <button
            onClick={startAudit}
            disabled={starting || !target}
            className="rounded-md bg-brand-500 px-4 py-1.5 text-sm text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {starting ? "Starting…" : "Run Site Audit"}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-red-900 bg-red-950/40 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        {active && active.status !== "completed" && active.status !== "failed" && (
          <div className="mt-4 rounded-md border border-neutral-800 bg-neutral-900/50 px-4 py-2 text-sm text-neutral-400">
            Crawling {active.target} — checking again every 8 seconds. Larger
            sites can take a few minutes.
          </div>
        )}

        {active?.status === "failed" && (
          <div className="mt-4 rounded-md border border-red-900 bg-red-950/40 px-4 py-2 text-sm text-red-300">
            The crawl failed. Check your DataForSEO credentials and target URL,
            then try again.
          </div>
        )}

        {summary && (
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
                <div className="text-xs text-neutral-500">Pages Crawled</div>
                <div className="mt-1 text-xl text-neutral-100">
                  {summary.pagesCrawled}
                </div>
              </div>
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
                <div className="text-xs text-neutral-500">Broken Links</div>
                <div className="mt-1 text-xl text-neutral-100">
                  {summary.brokenLinksCount}
                </div>
              </div>
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
                <div className="text-xs text-neutral-500">Meta Issues</div>
                <div className="mt-1 text-xl text-neutral-100">
                  {summary.metaIssuesCount}
                </div>
              </div>
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
                <div className="text-xs text-neutral-500">Heading Issues</div>
                <div className="mt-1 text-xl text-neutral-100">
                  {summary.headingIssuesCount}
                </div>
              </div>
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
                <div className="text-xs text-neutral-500">Images w/o Alt</div>
                <div className="mt-1 text-xl text-neutral-100">
                  {summary.imageIssuesCount}
                </div>
              </div>
            </div>

            {ISSUE_TABLES.map((t) => {
              const list = active?.[t.key] as { url: string }[] | null;
              if (!list || list.length === 0) return null;
              return (
                <div
                  key={t.key}
                  className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4"
                >
                  <div className="mb-3 text-xs text-neutral-500">
                    {t.label}
                  </div>
                  <ul className="max-h-64 space-y-1 overflow-y-auto text-sm text-neutral-300">
                    {list.slice(0, 50).map((item, i) => (
                      <li key={i} className="truncate">
                        {item.url}
                        {"statusCode" in item &&
                          ` — ${(item as any).statusCode}`}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        {audits.length > 0 && (
          <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="mb-3 text-xs text-neutral-500">Past Audits</div>
            <ul className="space-y-1.5 text-sm">
              {audits.map((a) => (
                <li
                  key={a.id}
                  className="flex cursor-pointer items-center justify-between rounded px-2 py-1 hover:bg-neutral-900"
                  onClick={() => setActive(a)}
                >
                  <span className="text-neutral-300">{a.target}</span>
                  <span
                    className={
                      a.status === "completed"
                        ? "text-brand-500"
                        : a.status === "failed"
                        ? "text-red-400"
                        : "text-neutral-500"
                    }
                  >
                    {a.status}
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
