"use client";

// ==============================================================================
// OpenDX-Lab Dashboard - Analytics Page (Metabase Embedded BI)
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart3,
  PieChart,
  Users,
  Building2,
  Activity,
  ExternalLink,
} from "lucide-react";
import MetabaseEmbed from "@/components/MetabaseEmbed";

const METABASE_URL = "http://localhost:3300";

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState(1);

  const dashboardConfigs = [
    {
      id: 1,
      metabaseId: 2,
      title: t("home.human"),
      description: t("metrics.totalEmployees"),
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      id: 2,
      metabaseId: 3,
      title: t("metrics.departments"),
      description: t("section.staffByDept"),
      icon: Building2,
      color: "text-emerald-600 dark:text-emerald-400",
    },
    {
      id: 3,
      metabaseId: 4,
      title: t("section.recentActivity"),
      description: "Activity & Trends",
      icon: Activity,
      color: "text-amber-600 dark:text-amber-400",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-amber-500" />
            {t("analytics.title")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("analytics.subtitle")}
          </p>
        </div>
        <a
          href={METABASE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700 dark:hover:bg-amber-900/40 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          {t("analytics.openMetabase")}
        </a>
      </div>

      {/* Dashboard selector tabs */}
      <div className="flex gap-3">
        {dashboardConfigs.map((cfg) => {
          const Icon = cfg.icon;
          const isActive = activeTab === cfg.id;
          return (
            <button
              key={cfg.id}
              onClick={() => setActiveTab(cfg.id)}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border transition-all cursor-pointer ${
                isActive
                  ? "bg-card border-amber-500/40 text-foreground shadow-md ring-1 ring-amber-500/10"
                  : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-amber-300 dark:hover:border-amber-700"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${isActive ? cfg.color : "text-muted-foreground"}`}
              />
              <div className="text-left">
                <p className="text-sm font-semibold">{cfg.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{cfg.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Embedded Metabase dashboard */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <MetabaseEmbed
            dashboardId={
              dashboardConfigs.find((c) => c.id === activeTab)?.metabaseId ?? 2
            }
            title={
              dashboardConfigs.find((c) => c.id === activeTab)?.title ??
              "Dashboard"
            }
            height="700px"
          />
        </CardContent>
      </Card>

      {/* Info banner */}
      <div className="rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-800/40 p-4">
        <div className="flex items-start gap-3">
          <PieChart className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Metabase Analytics
            </p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {t("analytics.subtitle")} —{" "}
              <a
                href={METABASE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-600 dark:text-amber-400 hover:text-amber-700 font-medium underline"
              >
                {METABASE_URL}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
