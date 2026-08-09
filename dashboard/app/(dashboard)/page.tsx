"use client";

// ==============================================================================
// OpenDX-Lab Dashboard - Home Page (Enterprise Redesign)
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface DeptStats {
  name: string;
  code: string;
  total: number;
  active: number;
  onLeave: number;
  terminated: number;
}

interface RecentHire {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  status: string;
  hireDate: string;
  department: { name: string };
}

interface LogEntry {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

interface DashboardData {
  employeeCount: number;
  departmentCount: number;
  activeCount: number;
  onLeaveCount: number;
  terminatedCount: number;
  recentLogs: LogEntry[];
  deptStats: DeptStats[];
  recentHires: RecentHire[];
  workflowSummary?: {
    pending: number;
    failed: number;
    completed: number;
  };
}

// ---------------------------------------------------------------------------
// Status labels
// ---------------------------------------------------------------------------
const statusConfig: Record<string, { labelKey: "status.active" | "status.onLeave" | "status.terminated"; className: string }> = {
  ACTIVE: { labelKey: "status.active", className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800" },
  ON_LEAVE: { labelKey: "status.onLeave", className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800" },
  TERMINATED: { labelKey: "status.terminated", className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800" },
};

// ---------------------------------------------------------------------------
// Activity type config
// ---------------------------------------------------------------------------
const activityDots: Record<string, string> = {
  EMPLOYEE_CREATED: "bg-[var(--status-active)]",
  EMPLOYEE_UPDATED: "bg-[var(--status-info)]",
  EMPLOYEE_STATUS_CHANGE: "bg-[var(--status-warning)]",
  EMPLOYEE_TERMINATED: "bg-[var(--status-danger)]",
  SYSTEM: "bg-muted-foreground",
  SEED: "bg-[var(--hdpi-intelligence)]",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function DashboardHome() {
  const { data: session } = useSession();
  const { t, locale } = useTranslation();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      const json = await res.json();
      setData(json);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Failed to fetch dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-border border-t-foreground rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">{t("loading.dashboard")}</p>
        </div>
      </div>
    );
  }

  const maxDeptTotal = Math.max(...data.deptStats.map((d) => d.total), 1);

  return (
    <div className="space-y-6">
      {/* ---- Row 1: H-P-D-I System Status ---- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { labelKey: "home.human" as const, color: "var(--hdpi-human)", value: "3/3", descKey: "home.servicesUp" as const },
          { labelKey: "home.process" as const, color: "var(--hdpi-process)", value: "2", descKey: "home.workflowsActive" as const },
          { labelKey: "home.data" as const, color: "var(--hdpi-data)", value: "1", descKey: "home.databaseOnline" as const },
          { labelKey: "home.intelligence" as const, color: "var(--hdpi-intelligence)", value: "1", descKey: "home.aiReady" as const },
        ].map((item) => (
          <div
            key={item.labelKey}
            className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
          >
            <div
              className="w-2 h-8 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t(item.labelKey)}
              </p>
              <p className="text-lg font-semibold text-foreground tabular-nums">
                {item.value}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  {t(item.descKey)}
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ---- Row 2: Metrics (inline) ---- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { labelKey: "metrics.totalEmployees" as const, value: data.employeeCount },
          { labelKey: "metrics.active" as const, value: data.activeCount },
          { labelKey: "metrics.onLeave" as const, value: data.onLeaveCount },
          { labelKey: "metrics.departments" as const, value: data.departmentCount },
        ].map((metric) => (
          <Card key={metric.labelKey} className="bg-card border-border">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground mb-1">{t(metric.labelKey)}</p>
              <p className="text-2xl font-semibold text-foreground tabular-nums">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ---- Row 2.5: Workflow KPIs ---- */}
      {data.workflowSummary && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-card border-border border-l-2 border-l-amber-400">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground mb-1">Workflow Chờ</p>
              <p className="text-2xl font-semibold text-foreground tabular-nums">
                {data.workflowSummary.pending}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border border-l-2 border-l-red-400">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground mb-1">Workflow Lỗi</p>
              <p className="text-2xl font-semibold text-foreground tabular-nums">
                {data.workflowSummary.failed}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border border-l-2 border-l-emerald-400">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground mb-1">Workflow Xong</p>
              <p className="text-2xl font-semibold text-foreground tabular-nums">
                {data.workflowSummary.completed}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dept breakdown */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground">
                {t("section.staffByDept")}
              </CardTitle>
              <Link href="/employees" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                {t("section.viewAll")} →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.deptStats.map((dept) => (
              <div key={dept.code}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-foreground">{dept.name}</span>
                  <div className="flex items-center gap-2 text-xs tabular-nums">
                    <span className="text-[var(--status-active)]">{dept.active}</span>
                    {dept.onLeave > 0 && <span className="text-[var(--status-warning)]">{dept.onLeave}</span>}
                    {dept.terminated > 0 && <span className="text-[var(--status-danger)]">{dept.terminated}</span>}
                    <span className="text-muted-foreground font-medium">{dept.total}</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full flex rounded-full">
                    <div className="bg-[var(--status-active)] rounded-l-full" style={{ width: `${(dept.active / maxDeptTotal) * 100}%` }} />
                    <div className="bg-[var(--status-warning)]" style={{ width: `${(dept.onLeave / maxDeptTotal) * 100}%` }} />
                    <div className="bg-[var(--status-danger)] rounded-r-full" style={{ width: `${(dept.terminated / maxDeptTotal) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}

            {/* Legend */}
            <div className="flex items-center gap-4 pt-2 border-t border-border">
              {[
                { color: "bg-[var(--status-active)]", key: "status.active" as const },
                { color: "bg-[var(--status-warning)]", key: "status.onLeave" as const },
                { color: "bg-[var(--status-danger)]", key: "status.terminated" as const },
              ].map((l) => (
                <div key={l.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className={`w-2 h-2 rounded-full ${l.color}`} /> {t(l.key)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent hires */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">
              {t("section.recentHires")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {data.recentHires.map((emp) => {
              const st = statusConfig[emp.status] ?? statusConfig.ACTIVE;
              return (
                <div key={emp.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0">
                    {emp.firstName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{emp.firstName} {emp.lastName}</p>
                    <p className="text-xs text-muted-foreground truncate">{emp.position}</p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${st.className}`}>
                    {t(st.labelKey)}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* ---- Row 4: Activity Feed ---- */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground">
              {t("section.recentActivity")}
            </CardTitle>
            {lastRefresh && (
              <span className="text-xs text-muted-foreground">
                {t("time.updatedAt")} {lastRefresh.toLocaleTimeString(locale === "vi" ? "vi-VN" : "en-US")}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {data.recentLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">{t("empty.noActivity")}</p>
              <p className="text-muted-foreground/60 text-xs mt-1">{t("empty.noActivityHint")}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {data.recentLogs.map((log) => {
                const dot = activityDots[log.type] ?? activityDots.SYSTEM;
                return (
                  <div key={log.id} className="flex items-start gap-3 px-2 py-2 rounded-lg hover:bg-accent/30 transition-colors">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground/80">{log.message}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(log.createdAt).toLocaleString(locale === "vi" ? "vi-VN" : "en-US")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
