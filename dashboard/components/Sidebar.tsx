"use client";

// ==============================================================================
// ShopWise — Sidebar Navigation
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { useState } from "react";
import type { DictionaryKey } from "@/lib/i18n-dictionaries";

// ---------------------------------------------------------------------------
// Navigation — grouped by function
// ---------------------------------------------------------------------------
interface NavItem {
  labelKey: DictionaryKey;
  href: string;
  layer: "overview" | "scan" | "decide" | "analyze";
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    labelKey: "nav.overview",
    href: "/",
    layer: "overview",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
      </svg>
    ),
  },
  {
    labelKey: "nav.bizscan",
    href: "/bizscan",
    layer: "scan",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
    ),
  },
  {
    labelKey: "nav.decision",
    href: "/decision",
    layer: "decide",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z" />
      </svg>
    ),
  },
  {
    labelKey: "nav.simulator",
    href: "/simulator",
    layer: "decide",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
      </svg>
    ),
  },
  {
    labelKey: "nav.knowledgeGraph",
    href: "/knowledge-graph",
    layer: "analyze",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
      </svg>
    ),
  },
  {
    labelKey: "nav.analytics",
    href: "/analytics",
    layer: "analyze",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
  },
  {
    labelKey: "nav.aiChat",
    href: "/ai-chat",
    layer: "decide",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
      </svg>
    ),
  },
];

// Layer color mapping
const layerColors: Record<NavItem["layer"], string> = {
  overview: "#6366f1",  // indigo
  scan: "#f59e0b",      // amber
  decide: "#10b981",    // emerald
  analyze: "#8b5cf6",   // violet
};

// Section labels
const sectionLabels: Record<string, string> = {
  scan: "Phát hiện",
  decide: "Quyết định",
  analyze: "Phân tích",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function AppSidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);

  // Group nav items by layer (skip overview — it's standalone)
  const overviewItem = navItems.find((i) => i.layer === "overview")!;
  const groups = ["scan", "decide", "analyze"] as const;

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-card border-r border-border z-40 transition-all duration-200 flex flex-col",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2.5 px-4 h-14 border-b border-border hover:bg-accent/50 transition-colors"
      >
        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z" />
          </svg>
        </div>
        {!collapsed && (
          <span className="text-base font-semibold text-foreground tracking-tight">
            Shop<span className="text-emerald-500">Wise</span>
          </span>
        )}
      </Link>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {/* Overview (standalone) */}
        {(() => {
          const isActive = pathname === "/";
          return (
            <Link
              href="/"
              className={cn(
                "group relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors mb-1",
                isActive
                  ? "bg-accent text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? t(overviewItem.labelKey) : undefined}
            >
              <span
                className={cn(
                  "absolute left-0 w-[3px] rounded-r-full transition-all",
                  isActive ? "h-5 opacity-100" : "h-0 opacity-0 group-hover:h-3 group-hover:opacity-60"
                )}
                style={{ backgroundColor: layerColors.overview }}
              />
              <span className="flex-shrink-0 text-current">{overviewItem.icon}</span>
              {!collapsed && <span>{t(overviewItem.labelKey)}</span>}
            </Link>
          );
        })()}

        {/* Grouped sections */}
        {groups.map((group) => {
          const items = navItems.filter((i) => i.layer === group);
          if (items.length === 0) return null;
          return (
            <div key={group} className="mt-4">
              {!collapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {sectionLabels[group]}
                </p>
              )}
              {collapsed && <div className="mx-3 mb-1.5 h-px bg-border" />}
              <div className="space-y-0.5">
                {items.map((item) => {
                  const isActive = pathname.startsWith(item.href) && item.href !== "/";
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                        isActive
                          ? "bg-accent text-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                        collapsed && "justify-center px-0"
                      )}
                      title={collapsed ? t(item.labelKey) : undefined}
                    >
                      <span
                        className={cn(
                          "absolute left-0 w-[3px] rounded-r-full transition-all",
                          isActive ? "h-5 opacity-100" : "h-0 opacity-0 group-hover:h-3 group-hover:opacity-60"
                        )}
                        style={{ backgroundColor: layerColors[item.layer] }}
                      />
                      <span className="flex-shrink-0 text-current">{item.icon}</span>
                      {!collapsed && <span>{t(item.labelKey)}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom: Metabase link + collapse toggle */}
      <div className="border-t border-border">
        {!collapsed && (
          <a
            href="http://localhost:3300"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            <span>Metabase BI</span>
          </a>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full h-10 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
        >
          <svg
            className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")}
            fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
