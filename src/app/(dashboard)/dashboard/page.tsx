import { Topbar } from "@/components/dashboard/topbar";

const METRICS = [
  { label: "Tracked Keywords", value: "—" },
  { label: "Avg. Position", value: "—" },
  { label: "Visibility", value: "—" },
  { label: "Site Audit Score", value: "—" },
];

export default function DashboardPage() {
  return (
    <>
      <Topbar title="Dashboard" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map((m) => (
            <div
              key={m.label}
              className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4"
            >
              <div className="text-xs text-neutral-500">{m.label}</div>
              <div className="mt-2 text-2xl text-neutral-100">{m.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-900/50 p-6">
          <p className="text-sm text-neutral-400">
            Connect a project and DataForSEO credentials in Settings, then run your
            first keyword research query to populate this dashboard.
          </p>
        </div>
      </main>
    </>
  );
}
