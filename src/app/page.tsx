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
  Check,
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

const PLANS = [
  {
    name: "Starter",
    price: "₹1,999",
    audience: "For freelancers & small businesses",
    highlight: false,
    features: [
      "2 projects",
      "250 keywords tracked",
      "Daily rank tracking",
      "3 competitors tracked",
      "2 site audits / month",
      "10 content optimizations / month",
      "AI Overview tracking — 50 keywords",
      "1 team member",
    ],
  },
  {
    name: "Growth",
    price: "₹2,999",
    audience: "For growing businesses & SEO professionals",
    highlight: true,
    features: [
      "5 projects",
      "1,000 keywords tracked",
      "10 competitors tracked",
      "5 site audits / month",
      "50 content optimizations / month",
      "AI Overview tracking — 250 keywords",
      "Scheduled reports",
      "Priority support",
      "3 team members",
    ],
  },
  {
    name: "Agency",
    price: "₹4,999",
    audience: "For SEO agencies & marketing teams",
    highlight: false,
    features: [
      "15 projects",
      "3,000 keywords tracked",
      "25 competitors tracked",
      "15 site audits / month",
      "200 content optimizations / month",
      "AI Overview tracking — 1,000 keywords",
      "White-label reports",
      "Priority support",
      "10 team members",
    ],
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center">
          <img src="/logo-wordmark.png" alt="Search Velocity" className="h-9 w-auto" />
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

      {/* Pricing */}
      <section className="mx-auto max-w-6xl border-t border-neutral-900 px-6 py-16">
        <div className="mb-10 text-center">
          <h2 className="mb-2 text-sm uppercase tracking-wide text-neutral-500">
            Pricing
          </h2>
          <p className="text-2xl font-semibold tracking-tight sm:text-3xl">
            SEO intelligence that moves your rankings
          </p>
          <p className="mt-2 text-neutral-400">
            Simple pricing. Powerful SEO insights. Built for growth.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={
                plan.highlight
                  ? "relative rounded-lg border-2 border-brand-500 bg-neutral-900/60 p-6"
                  : "relative rounded-lg border border-neutral-800 bg-neutral-900/40 p-6"
              }
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-6 rounded-full bg-brand-500 px-3 py-0.5 text-xs font-medium text-white">
                  Most popular
                </span>
              )}
              <div className="mb-1 text-sm font-medium text-neutral-100">
                {plan.name}
              </div>
              <p className="mb-4 text-sm text-neutral-500">{plan.audience}</p>
              <div className="mb-1 flex items-baseline gap-1">
                <span className="text-3xl font-semibold text-neutral-100">
                  {plan.price}
                </span>
                <span className="text-sm text-neutral-500">/month</span>
              </div>
              <p className="mb-5 text-xs text-neutral-600">
                or billed annually, ~17% off
              </p>

              <ul className="mb-6 space-y-2.5">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-neutral-300"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#a3e635]" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/login"
                className={
                  plan.highlight
                    ? "flex w-full items-center justify-center gap-2 rounded-md bg-brand-500 py-2 text-sm font-medium text-white hover:bg-brand-600"
                    : "flex w-full items-center justify-center gap-2 rounded-md border border-neutral-800 py-2 text-sm text-neutral-300 hover:border-neutral-700 hover:bg-neutral-900"
                }
              >
                Get started
              </Link>
            </div>
          ))}
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
