"use client";

// ==============================================================================
// OpenDX-Lab Dashboard - Service Control Center
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import {
  Activity,
  RefreshCw,
  ExternalLink,
  Clock,
  Zap,
  Shield,
  MessageSquare,
  BookOpen,
  Workflow,
  BarChart3,
  Bot,
  Database,
} from "lucide-react";

interface ServiceHealth {
  name: string;
  status: "UP" | "DOWN";
  url: string;
  port: number;
  description: string;
  responseTime?: number;
  checkedAt: string;
}

interface HealthResponse {
  services: ServiceHealth[];
  summary: { total: number; up: number; down: number };
}

const serviceIcons: Record<string, React.ElementType> = {
  Keycloak: Shield,
  Mattermost: MessageSquare,
  "Wiki.js": BookOpen,
  Activepieces: Workflow,
  Metabase: BarChart3,
  Ollama: Bot,
  PostgreSQL: Database,
};

export default function ServicesPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/services/health", { cache: "no-store" });
      const json = await res.json();
      setData(json);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Failed to fetch health:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const upPercent = data ? Math.round((data.summary.up / data.summary.total) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("services.controlCenter")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("services.subtitle")}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchHealth}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          {t("action.refresh")}
        </Button>
      </div>

      {/* Overall health bar */}
      {data && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground">
                {t("services.systemHealth")}: {data.summary.up}/{data.summary.total} {t("services.servicesRunning")}
              </span>
              <span className={`text-sm font-bold ${upPercent === 100 ? "text-emerald-600" : "text-amber-600"}`}>
                {upPercent}%
              </span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  upPercent === 100
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                    : upPercent >= 70
                    ? "bg-gradient-to-r from-amber-500 to-orange-500"
                    : "bg-gradient-to-r from-red-500 to-rose-500"
                }`}
                style={{ width: `${upPercent}%` }}
              />
            </div>
            {lastRefresh && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {t("time.updatedAt")} {lastRefresh.toLocaleTimeString("vi-VN")} • {t("services.autoRefresh30s")}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Service grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.services.map((service) => {
          const Icon = serviceIcons[service.name] ?? Activity;
          return (
            <Card
              key={service.name}
              className={`transition-all duration-200 hover:scale-[1.01] hover:shadow-md ${
                service.status === "UP"
                  ? "border-emerald-200 dark:border-emerald-800 hover:border-emerald-400"
                  : "border-red-200 dark:border-red-800 hover:border-red-400"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        service.status === "UP"
                          ? "bg-emerald-100 dark:bg-emerald-900/30"
                          : "bg-red-100 dark:bg-red-900/30"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          service.status === "UP" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                        }`}
                      />
                    </div>
                    <CardTitle className="text-base font-semibold text-foreground">
                      {service.name}
                    </CardTitle>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      service.status === "UP"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700"
                        : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700"
                    }
                  >
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      service.status === "UP" ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                    }`} />
                    {service.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
                <div className="flex items-center justify-between text-xs pt-1">
                  <a
                    href={service.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Port {service.port}
                  </a>
                  {service.responseTime != null && (
                    <span className="flex items-center gap-1 text-muted-foreground font-medium">
                      <Zap className="w-3 h-3 text-amber-500" />
                      {service.responseTime}ms
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
