import Link from "next/link";
import {
  Search,
  FileSearch,
  LineChart,
  Users,
  ClipboardList,
  Wand2,
  Sparkles,
  FileBarChart2,
  ArrowRight,
} from "lucide-react";

const FEATURES = [
  {
    icon: Search,
    title: "Keyword Research",
    description:
      "Search volume, CPC, competition, related keywords, and suggestions for any term.",
  },
  {
    icon: FileSearch,
    title: "SERP Analysis",
    description:
      "Top-20 results, AI Overview and featured snippet detection, content gaps, and scores.",
  },
  {
    icon: LineChart,
    title: "Rank Tracker",
    description:
      "Daily position snapshots and visibility trends for every keyword you track.",
  },
  {
    icon: Users,
    title: "Competitor Analysis",
    description:
      "Top pages, top keywords, backlinks, and content gaps for any competitor domain.",
  },
  {
    icon: ClipboardList,
    title: "Site Audit",
    description:
      "Full-site crawls surfacing broken links, meta issues, and missing alt text.",
  },
  {
    icon: Wand2,
    title: "Content Optimizer",
    description:
      "AI-generated briefs and outlines, plus scoring for drafts against a target keyword.",
  },
  {
    icon: Sparkles,
    title: "AI Overview Monitor",
    description:
      "Track whether Google shows an AI Overview for your priority keywords over time.",
  },
  {
    icon: FileBarChart2,
    title: "Reports",
    description:
      "Export any result as PDF, Excel, CSV, or PPTX — white-label ready.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="Search Velocity" className="h-7 w-7 rounded" />
          <span className="text-sm font-medium">Search Velocity</span>
        </div>
        <Link
          href="/login"
          className="rounded-md border border-neutral-800 px-4 py-1.5 text-sm text-neutral-300 hover:border-neutral-700 hover:bg-neutral-900"
        >
          Sign in
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 sm:pt-24">
        <div className="flex flex-col items-start gap-6">
          <div className="flex items-center gap-3 rounded-full border border-neutral-800 bg-neutral-900/60 px-4 py-1.5 text-xs text-neutral-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#a3e635] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#a3e635]" />
            </span>
            Live rank checks running now
          </div>

          <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Every ranking has a speed.
            <br />
            <span className="text-brand-500">We measure it.</span>
          </h1>

          <p className="max-w-xl text-base text-neutral-400 sm:text-lg">
            Search Velocity pulls real keyword, SERP, and site data, then uses
            AI to tell you exactly what to fix and what to write next —
            keyword research, rank tracking, site audits, and content briefs,
            all in one workspace.
          </p>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-md bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
            >
              Sign in to your workspace
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="mx-auto max-w-6xl border-t border-neutral-900 px-6 py-16">
        <h2 className="mb-8 text-sm uppercase tracking-wide text-neutral-500">
          What&apos;s inside
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-5 transition-colors hover:border-neutral-700"
              >
                <Icon className="mb-3 h-5 w-5 text-[#a3e635]" />
                <div className="mb-1.5 text-sm font-medium text-neutral-100">
                  {f.title}
                </div>
                <p className="text-sm leading-relaxed text-neutral-500">
                  {f.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="mx-auto max-w-6xl border-t border-neutral-900 px-6 py-16 text-center">
        <p className="mb-5 text-lg text-neutral-300">
          Your workspace is already set up.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-md bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
        >
          Sign in
          <ArrowRight className="h-4 w-4" />
        </Link>

        <p className="mt-12 text-sm text-neutral-600">
          Developed by <a href="http://growthandvelocity.com/" target="_blank" rel="noreferrer" className="text-neutral-500 hover:text-neutral-300">Growth And Velocity</a>
        </p>
      </section>
    </div>
  );
}
