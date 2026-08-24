"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  FileSearch,
  Users,
  LineChart,
  Sparkles,
  HelpCircle,
  Layers,
  FileCode2,
  Link2,
  ShieldCheck,
  ClipboardList,
  Wand2,
  Network,
  ImageIcon,
  Braces,
  FileBarChart2,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Research",
    items: [
      { href: "/keyword-research", label: "Keyword Research", icon: Search },
      { href: "/serp-analysis", label: "SERP Analysis", icon: FileSearch },
      { href: "/competitor-analysis", label: "Competitor Analysis", icon: Users },
      { href: "/rank-tracker", label: "Rank Tracker", icon: LineChart },
      { href: "/ai-overview-monitor", label: "AI Overview Monitor", icon: Sparkles },
      { href: "/people-also-ask", label: "People Also Ask", icon: HelpCircle },
      { href: "/content-gap", label: "Content Gap", icon: Layers },
    ],
  },
  {
    label: "Optimize",
    items: [
      { href: "/on-page-seo", label: "On-Page SEO", icon: FileCode2 },
      { href: "/backlinks", label: "Backlinks", icon: Link2 },
      { href: "/technical-seo", label: "Technical SEO", icon: ShieldCheck },
      { href: "/site-audit", label: "Site Audit", icon: ClipboardList },
      { href: "/content-optimizer", label: "Content Optimizer", icon: Wand2 },
      { href: "/topic-clusters", label: "Topic Cluster Generator", icon: Network },
      { href: "/internal-links", label: "Internal Link Suggestions", icon: Link2 },
      { href: "/image-seo", label: "Image SEO", icon: ImageIcon },
      { href: "/schema-generator", label: "Schema Generator", icon: Braces },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/reports", label: "Reports", icon: FileBarChart2 },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-neutral-800 bg-neutral-950">
      <div className="flex h-14 items-center gap-2 border-b border-neutral-800 px-4"> <img src="/logo.svg" alt="Search Velocity" className="h-6 w-6 rounded" /> <span className="text-sm text-neutral-100">Search Velocity</span> </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-4">
            <div className="px-2 pb-1 text-xs uppercase tracking-wide text-neutral-500">
              {section.label}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-neutral-100",
                    active && "bg-neutral-900 text-brand-500"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
