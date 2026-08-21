"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { LOCATIONS } from "@/lib/dataforseo/locations";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface Snapshot {
  id: string;
  position: number | null;
  visibility: number | null;
  capturedAt: string;
}

interface TrackedKeyword {
  id: string;
  keyword: string;
  device: string;
  snapshots: Snapshot[];
}

const PROJECT_ID = "demo-project";

export default function RankTrackerPage() {
  const [keywords, setKeywords] = useState<TrackedKeyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyword, setNewKeyword] = useState("");
  const [location, setLocation] = useState<string>(LOCATIONS[0].label);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadKeywords() {
    setLoading(true);
    const res = await fetch(
      `/api/rank-tracker/keywords?projectId=${PROJECT_ID}`
    );
    const json = await res.json();
    if (res.ok) setKeywords(json.keywords);
    setLoading(false);
  }

  useEffect(() => {
    loadKeywords();
  }, []);

  async function addKeyword() {
    setAdding(true);
    setError(null);
    const loc = LOCATIONS.find((l) => l.label === location) ?? LOCATIONS[0];

    try {
      const res = await fetch("/api/rank-tracker/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: PROJECT_ID,
          keyword: newKeyword,
          country: String(loc.code),
          language: loc.language,
          device,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to add keyword");
      setNewKeyword("");
      await loadKeywords();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAdding(false);
    }
  }

  async function removeKeyword(id: string) {
    await fetch(`/api/rank-tracker/keywords?id=${id}`, { method: "DELETE" });
    await loadKeywords();
  }

  return (
    <>
      <Topbar title="Rank Tracker" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-neutral-500">Keyword</label>
            <input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
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
            onClick={addKeyword}
            disabled={adding || !newKeyword}
            className="rounded-md bg-brand-500 px-4 py-1.5 text-sm text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {adding ? "Adding…" : "Track Keyword"}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-red-900 bg-red-950/40 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4 text-sm text-neutral-400">
          Positions update once a day via the scheduled snapshot job. Newly
          tracked keywords show their first position after the next run.
        </div>

        {loading ? (
          <div className="mt-6 text-sm text-neutral-500">Loading…</div>
        ) : keywords.length === 0 ? (
          <div className="mt-6 text-sm text-neutral-500">
            No keywords tracked yet — add one above.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {keywords.map((kw) => {
              const latest = kw.snapshots[0];
              const trend = [...kw.snapshots]
                .reverse()
                .map((s) => ({
                  date: new Date(s.capturedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  }),
                  position: s.position,
                }));

              return (
                <div
                  key={kw.id}
                  className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-neutral-100">
                        {kw.keyword}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {kw.device}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs text-neutral-500">
                          Position
                        </div>
                        <div className="text-lg text-neutral-100">
                          {latest?.position ?? "—"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-neutral-500">
                          Visibility
                        </div>
                        <div className="text-lg text-neutral-100">
                          {latest?.visibility ?? "—"}
                        </div>
                      </div>
                      <button
                        onClick={() => removeKeyword(kw.id)}
                        className="rounded-md border border-neutral-800 px-3 py-1.5 text-xs text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {trend.length > 1 && (
                    <div className="mt-3" style={{ width: "100%", height: 100 }}>
                      <ResponsiveContainer>
                        <LineChart data={trend}>
                          <XAxis dataKey="date" stroke="#525252" fontSize={10} />
                          <YAxis
                            reversed
                            stroke="#525252"
                            fontSize={10}
                            width={24}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "#0a0a0a",
                              border: "1px solid #262626",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="position"
                            stroke="#7c3aed"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
