"use client";

// ==============================================================================
// ShopWise — Homepage: Decision Feed + Business Pulse
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────────

interface DecisionFeedItem {
  type: string;
  urgency: "HIGH" | "MEDIUM" | "LOW";
  icon: string;
  title: string;
  summary: string;
  link: string;
  metric?: string;
}

interface PulseSummary {
  currentRevenue: number;
  previousRevenue: number;
  revenueChange: number;
  currentOrders: number;
  previousOrders: number;
  currentProfit: number;
  totalProducts: number;
  totalCustomers: number;
  totalOrders: number;
  pendingFindings: number;
}

interface DailyRevenue {
  day: string;
  revenue: number;
  orders: number;
}

interface TopProduct {
  name: string;
  sku: string;
  sales: number;
  revenue: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatVND(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} tỷ`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} tr`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toString();
}

// ── Mini spark chart ───────────────────────────────────────────────────────────

function SparkLine({ data, height = 40 }: { data: number[]; height?: number }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 120;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${height - ((v - min) / range) * (height - 4) - 2}`)
    .join(" ");
  return (
    <svg width={w} height={height} className="text-emerald-500">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

export default function HomePage() {
  const { data: session } = useSession();
  const [pulse, setPulse] = useState<PulseSummary | null>(null);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [decisions, setDecisions] = useState<DecisionFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [pulseRes, feedRes] = await Promise.all([
        fetch("/api/dashboard/pulse"),
        fetch("/api/decision/feed"),
      ]);

      if (pulseRes.ok) {
        const d = await pulseRes.json();
        setPulse(d.summary);
        setDailyRevenue(d.dailyRevenue || []);
        setTopProducts(d.topProducts || []);
      }

      if (feedRes.ok) {
        const d = await feedRes.json();
        setDecisions(d.decisions || []);
      }
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 120_000); // refresh every 2 min
    return () => clearInterval(interval);
  }, [fetchData]);

  const firstName = session?.user?.name?.split(" ")[0] || "Chủ shop";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-muted-foreground">
          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span className="text-sm">Đang tải dữ liệu shop...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Chào {firstName} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tổng quan hoạt động kinh doanh và các quyết định cần xử lý
        </p>
      </div>

      {/* ── Decision Feed ─────────────────────────────────────────────── */}
      <Card className="border-emerald-200/50 dark:border-emerald-800/30 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Quyết định cần xử lý
            {decisions.length > 0 && (
              <Badge variant="secondary" className="ml-auto text-xs">
                {decisions.length} vấn đề
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {decisions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-3xl mb-2">✅</p>
              <p className="text-sm">Không có vấn đề cần quyết định hôm nay</p>
              <p className="text-xs mt-1">Hệ thống quét tự động mỗi lần bạn truy cập</p>
            </div>
          ) : (
            decisions.map((d, i) => (
              <Link key={i} href={d.link}>
                <div
                  className={`group flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                    d.urgency === "HIGH"
                      ? "border-red-200 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/20 hover:border-red-300"
                      : d.urgency === "MEDIUM"
                      ? "border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20 hover:border-amber-300"
                      : "border-border bg-card hover:border-emerald-300"
                  }`}
                >
                  <span className="text-2xl flex-shrink-0 mt-0.5">{d.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-foreground truncate">{d.title}</p>
                      <Badge
                        variant={d.urgency === "HIGH" ? "destructive" : "secondary"}
                        className="text-[10px] px-1.5 py-0 flex-shrink-0"
                      >
                        {d.urgency === "HIGH" ? "Khẩn" : d.urgency === "MEDIUM" ? "Cần xử lý" : "Thông tin"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{d.summary}</p>
                  </div>
                  <svg
                    className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0 mt-1"
                    fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      {/* ── KPI Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Revenue */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Doanh thu 30 ngày</p>
            <p className="text-xl font-bold text-foreground">
              {pulse ? formatVND(pulse.currentRevenue) : "—"}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              {pulse && pulse.revenueChange !== 0 && (
                <span
                  className={`text-xs font-medium ${
                    pulse.revenueChange > 0 ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {pulse.revenueChange > 0 ? "↑" : "↓"}{" "}
                  {Math.abs(pulse.revenueChange).toFixed(1)}%
                </span>
              )}
              <span className="text-[10px] text-muted-foreground">vs tháng trước</span>
            </div>
          </CardContent>
        </Card>

        {/* Orders */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Đơn hàng</p>
            <p className="text-xl font-bold text-foreground">
              {pulse ? pulse.currentOrders.toLocaleString() : "—"}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              {pulse && (
                <span className="text-[10px] text-muted-foreground">
                  tháng trước: {pulse.previousOrders.toLocaleString()}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Profit */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Lợi nhuận</p>
            <p className="text-xl font-bold text-foreground">
              {pulse ? formatVND(pulse.currentProfit) : "—"}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              {pulse && pulse.currentRevenue > 0 && (
                <span className="text-xs text-muted-foreground">
                  Biên LN: {((pulse.currentProfit / pulse.currentRevenue) * 100).toFixed(1)}%
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Products */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Sản phẩm</p>
            <p className="text-xl font-bold text-foreground">
              {pulse ? pulse.totalProducts : "—"}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              {pulse && pulse.pendingFindings > 0 && (
                <span className="text-xs text-amber-600">
                  {pulse.pendingFindings} cảnh báo
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Revenue chart + Top products ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue trend */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Doanh thu 7 ngày gần nhất
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dailyRevenue.length > 0 ? (
              <div className="space-y-2">
                {/* Spark overview */}
                <div className="flex items-end gap-4">
                  <SparkLine data={dailyRevenue.map((d) => d.revenue)} height={48} />
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      {formatVND(dailyRevenue.reduce((s, d) => s + d.revenue, 0))}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {dailyRevenue.reduce((s, d) => s + d.orders, 0)} đơn
                    </p>
                  </div>
                </div>
                {/* Bar chart */}
                <div className="flex items-end gap-1 h-20">
                  {dailyRevenue.map((d, i) => {
                    const max = Math.max(...dailyRevenue.map((r) => r.revenue), 1);
                    const h = (d.revenue / max) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                        <div
                          className="w-full bg-emerald-500/20 rounded-t hover:bg-emerald-500/40 transition-colors relative group"
                          style={{ height: `${Math.max(h, 4)}%` }}
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            {formatVND(d.revenue)}
                          </div>
                        </div>
                        <span className="text-[9px] text-muted-foreground">
                          {new Date(d.day).toLocaleDateString("vi", { weekday: "narrow" })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Chưa có dữ liệu</p>
            )}
          </CardContent>
        </Card>

        {/* Top products */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Top sản phẩm bán chạy (30 ngày)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <div className="space-y-2">
                {topProducts.slice(0, 5).map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground">{p.sku}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold">{p.sales} bán</p>
                      <p className="text-[10px] text-muted-foreground">{formatVND(p.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Chưa có dữ liệu</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Quick links ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: "/decision", label: "Tư vấn quyết định", icon: "⚖️", desc: "Nhập hàng, giá, QC" },
          { href: "/simulator", label: "Mô phỏng What-if", icon: "🔮", desc: "Thử trước khi quyết" },
          { href: "/bizscan", label: "Quét vấn đề", icon: "🔍", desc: "Phát hiện bất thường" },
          { href: "/knowledge-graph", label: "Bản đồ quan hệ", icon: "🗺️", desc: "SP ↔ NCC ↔ Kênh" },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* ── Footer note ───────────────────────────────────────────────── */}
      <div className="rounded-xl bg-muted/30 border border-border p-3">
        <div className="flex items-start gap-2">
          <span className="text-sm">💡</span>
          <div>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">ShopWise</span> — Trí tuệ hỗ trợ quyết định kinh doanh.
              Dữ liệu từ <code className="text-[10px] bg-muted px-1 rounded">sb_orders</code>,{" "}
              <code className="text-[10px] bg-muted px-1 rounded">sb_products</code>,{" "}
              <code className="text-[10px] bg-muted px-1 rounded">sb_inventory</code>,{" "}
              <code className="text-[10px] bg-muted px-1 rounded">sb_ad_campaigns</code>.
              Mọi gợi ý đều ghi rõ nguồn dữ liệu và giả định.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
