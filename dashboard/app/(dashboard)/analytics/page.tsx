"use client";

// ==============================================================================
// ShopWise — Analytics Dashboard (Built-in Charts)
// Revenue, Product, and Advertising analytics from real database data
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";

// ── Types ────────────────────────────────────────────────────────────────────

interface DailyData {
  date: string;
  revenue: number;
  profit: number;
  orders: number;
}

interface ChannelData {
  channel: string;
  revenue: number;
  orders: number;
}

interface RevenueData {
  dailyData: DailyData[];
  channelData: ChannelData[];
  summary: {
    totalRevenue: number;
    totalProfit: number;
    totalOrders: number;
    avgOrderValue: number;
  };
}

interface TopProduct {
  name: string;
  sku: string;
  category: string;
  totalSold: number;
  orderCount: number;
  revenue: number;
  stock: number;
  daysInStock: number;
}

interface InventoryWarning {
  id: string;
  quantity: number;
  daysInStock: number;
  product: { name: string; sku: string; category: string };
}

interface ProductData {
  topProducts: TopProduct[];
  inventoryWarnings: InventoryWarning[];
}

interface CampaignData {
  name: string;
  channel: string;
  dailyBudget: number;
  spent7d: number;
  revenue7d: number;
  orders7d: number;
  clicks7d: number;
  roas: number;
  cpc: number;
}

interface ChannelSummary {
  channel: string;
  spent: number;
  revenue: number;
  orders: number;
  roas: number;
}

interface AdsData {
  campaignData: CampaignData[];
  channelSummary: ChannelSummary[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatVND(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} tỷ`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} tr`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toLocaleString("vi");
}

function formatDate(s: string): string {
  const d = new Date(s);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

const CHANNEL_COLORS: Record<string, string> = {
  facebook: "#1877F2",
  tiktok: "#010101",
  shopee: "#EE4D2D",
  lazada: "#0F1689",
  zalo: "#0068FF",
  google: "#4285F4",
};

const CHANNEL_LABELS: Record<string, string> = {
  facebook: "Facebook",
  tiktok: "TikTok",
  shopee: "Shopee",
  lazada: "Lazada",
  zalo: "Zalo",
  google: "Google",
};

// ── Bar Chart Component ─────────────────────────────────────────────────────

function BarChart({ data, labelKey, valueKey, maxBars = 30 }: {
  data: Record<string, unknown>[];
  labelKey: string;
  valueKey: string;
  color?: string;
  maxBars?: number;
}) {
  const sliced = data.slice(-maxBars);
  const maxVal = Math.max(...sliced.map((d) => Number(d[valueKey]) || 0), 1);
  const midVal = maxVal * 0.5;

  return (
    <div className="w-full space-y-2">
      {/* Chart container with Y-axis markers */}
      <div className="relative h-56 w-full pt-3 pb-1">
        {/* Background Grid Lines & Y-axis labels */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-muted-foreground/60 select-none z-0">
          <div className="border-b border-border/40 border-dashed w-full flex justify-between pr-1 pb-0.5">
            <span className="font-mono">{formatVND(maxVal)}</span>
          </div>
          <div className="border-b border-border/30 border-dashed w-full flex justify-between pr-1 pb-0.5">
            <span className="font-mono">{formatVND(midVal)}</span>
          </div>
          <div className="border-b border-border/50 w-full flex justify-between pr-1 pb-0.5">
            <span className="font-mono">0đ</span>
          </div>
        </div>

        {/* Bars Container */}
        <div className="relative h-full flex items-end gap-1 sm:gap-1.5 w-full z-10">
          {sliced.map((d, i) => {
            const val = Number(d[valueKey]) || 0;
            const pct = Math.max(Math.round((val / maxVal) * 100), 3);
            const orders = Number(d.orders) || 0;
            const profit = Number(d.profit) || 0;

            return (
              <div key={i} className="flex-1 flex flex-col justify-end items-center h-full group relative min-w-0 cursor-pointer">
                {/* Bar */}
                <div
                  className="w-full rounded-t-sm transition-all duration-300 bg-gradient-to-t from-blue-600 via-blue-500 to-sky-400 group-hover:from-blue-500 group-hover:to-cyan-300 group-hover:shadow-lg group-hover:shadow-blue-500/25 group-hover:scale-y-105 origin-bottom"
                  style={{
                    height: `${pct}%`,
                    minHeight: "4px",
                  }}
                />

                {/* Rich Tooltip on hover */}
                <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                  <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-xl px-3 py-2 text-xs shadow-xl min-w-[130px] space-y-1">
                    <p className="font-semibold text-foreground border-b border-border/50 pb-1 text-[11px] flex justify-between">
                      <span>{String(d[labelKey])}</span>
                      {orders > 0 && <span className="text-muted-foreground font-normal">{orders} đơn</span>}
                    </p>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-muted-foreground">Doanh thu:</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">{formatVND(val)}</span>
                    </div>
                    {profit > 0 && (
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-muted-foreground">Lợi nhuận:</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400 font-mono">{formatVND(profit)}</span>
                      </div>
                    )}
                  </div>
                  {/* Tooltip triangle */}
                  <div className="w-2 h-2 bg-popover border-r border-b border-border rotate-45 -mt-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* X-axis date labels */}
      <div className="flex justify-between text-[11px] font-medium text-muted-foreground px-1 pt-0.5 border-t border-border/20">
        <span>{sliced[0] ? String(sliced[0][labelKey]) : ""}</span>
        {sliced.length > 10 && (
          <span className="hidden sm:inline">
            {sliced[Math.floor(sliced.length / 2)] ? String(sliced[Math.floor(sliced.length / 2)][labelKey]) : ""}
          </span>
        )}
        <span>{sliced.at(-1) ? String(sliced.at(-1)![labelKey]) : ""}</span>
      </div>
    </div>
  );
}

// ── Horizontal Bar ──────────────────────────────────────────────────────────

function HorizontalBar({ items, maxVal }: {
  items: { label: string; value: number; color: string; sub?: string }[];
  maxVal: number;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i}>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium truncate">{item.label}</span>
            <span className="text-muted-foreground ml-2 shrink-0">
              {item.sub || formatVND(item.value)}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div
              className="h-2.5 rounded-full transition-all duration-500"
              style={{
                width: `${Math.max((item.value / maxVal) * 100, 2)}%`,
                backgroundColor: item.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

type TabId = "revenue" | "products" | "ads";

const TABS: { id: TabId; label: string; desc: string }[] = [
  { id: "revenue", label: "Doanh thu & Đơn hàng", desc: "Doanh thu, lợi nhuận, kênh bán" },
  { id: "products", label: "Sản phẩm & Tồn kho", desc: "Top SP, cảnh báo tồn kho" },
  { id: "ads", label: "Quảng cáo & ROAS", desc: "Hiệu quả campaign, chi phí" },
];

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>("revenue");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [adsData, setAdsData] = useState<AdsData | null>(null);

  useEffect(() => {
    setLoading(true);
    setErrorMsg(null);
    fetch(`/api/analytics?tab=${activeTab}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok || data.error) {
          throw new Error(data.error || `HTTP ${r.status}`);
        }
        return data;
      })
      .then((data) => {
        if (activeTab === "revenue") setRevenueData(data);
        else if (activeTab === "products") setProductData(data);
        else if (activeTab === "ads") setAdsData(data);
      })
      .catch((err) => {
        console.error("Analytics fetch error:", err);
        setErrorMsg(err.message || "Không thể tải dữ liệu.");
      })
      .finally(() => setLoading(false));
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {t("analytics.title")}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Phân tích dữ liệu kinh doanh 30 ngày gần nhất — dữ liệu trực tiếp từ database
        </p>
      </div>

      {/* Tab selector */}
      <div className="flex gap-3">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 text-left px-4 py-3 rounded-xl border transition-all cursor-pointer ${
                isActive
                  ? "bg-card border-blue-500/40 text-foreground shadow-md ring-1 ring-blue-500/10"
                  : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-blue-300 dark:hover:border-blue-700"
              }`}
            >
              <p className="text-sm font-semibold">{tab.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{tab.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3 text-muted-foreground">
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            Đang tải dữ liệu...
          </div>
        </div>
      )}

      {/* Error state */}
      {!loading && errorMsg && (
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-800/40">
          <CardContent className="p-6 text-center space-y-2">
            <p className="text-sm font-medium text-red-600 dark:text-red-400">{errorMsg}</p>
            <p className="text-xs text-muted-foreground">Vui lòng kiểm tra đăng nhập hoặc kết nối cơ sở dữ liệu.</p>
            <button
              onClick={() => setActiveTab(activeTab)}
              className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Thử lại
            </button>
          </CardContent>
        </Card>
      )}

      {/* Revenue Tab */}
      {!loading && !errorMsg && activeTab === "revenue" && revenueData?.summary && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Tổng doanh thu", value: formatVND(revenueData.summary.totalRevenue), color: "text-blue-600 dark:text-blue-400" },
              { label: "Lợi nhuận", value: formatVND(revenueData.summary.totalProfit), color: "text-emerald-600 dark:text-emerald-400" },
              { label: "Tổng đơn hàng", value: revenueData.summary.totalOrders.toLocaleString("vi"), color: "text-amber-600 dark:text-amber-400" },
              { label: "Giá trị TB/đơn", value: formatVND(revenueData.summary.avgOrderValue), color: "text-purple-600 dark:text-purple-400" },
            ].map((s) => (
              <Card key={s.label} className="shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Revenue chart */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Doanh thu theo ngày (30 ngày)</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart
                data={revenueData.dailyData.map((d) => ({ ...d, label: formatDate(d.date) }))}
                labelKey="label"
                valueKey="revenue"
                color="#3b82f6"
              />
            </CardContent>
          </Card>

          {/* Channel breakdown */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Doanh thu theo kênh bán</CardTitle>
            </CardHeader>
            <CardContent>
              <HorizontalBar
                items={revenueData.channelData.map((c) => ({
                  label: CHANNEL_LABELS[c.channel] || c.channel,
                  value: c.revenue,
                  color: CHANNEL_COLORS[c.channel] || "#6b7280",
                  sub: `${formatVND(c.revenue)} · ${c.orders.toLocaleString("vi")} đơn`,
                }))}
                maxVal={Math.max(...revenueData.channelData.map((c) => c.revenue), 1)}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Products Tab */}
      {!loading && !errorMsg && activeTab === "products" && productData?.topProducts && (
        <div className="space-y-6">
          {/* Top products */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top 10 sản phẩm bán chạy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b border-border">
                      <th className="pb-2 font-medium">#</th>
                      <th className="pb-2 font-medium">Sản phẩm</th>
                      <th className="pb-2 font-medium text-right">Đã bán</th>
                      <th className="pb-2 font-medium text-right">Doanh thu</th>
                      <th className="pb-2 font-medium text-right">Tồn kho</th>
                      <th className="pb-2 font-medium text-right">Ngày tồn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productData.topProducts?.map((p, i) => (
                      <tr key={p.sku} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 text-muted-foreground">{i + 1}</td>
                        <td className="py-2.5">
                          <p className="font-medium truncate max-w-[250px]">{p.name}</p>
                          <p className="text-[10px] text-muted-foreground">{p.sku} · {p.category}</p>
                        </td>
                        <td className="py-2.5 text-right font-mono">{p.totalSold.toLocaleString("vi")}</td>
                        <td className="py-2.5 text-right font-mono text-blue-600 dark:text-blue-400">{formatVND(p.revenue)}</td>
                        <td className={`py-2.5 text-right font-mono ${p.stock === 0 ? "text-red-600 font-bold" : p.stock < 10 ? "text-amber-600" : ""}`}>
                          {p.stock}
                        </td>
                        <td className={`py-2.5 text-right font-mono ${p.daysInStock > 30 ? "text-red-600" : ""}`}>
                          {p.daysInStock}d
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Inventory warnings */}
          <Card className="shadow-sm border-amber-200/60 dark:border-amber-800/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-amber-700 dark:text-amber-400">
                Cảnh báo tồn kho ({productData.inventoryWarnings?.length || 0} SP)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {productData.inventoryWarnings?.map((w) => (
                  <div
                    key={w.id}
                    className={`p-3 rounded-lg border ${
                      w.quantity === 0
                        ? "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800"
                        : "bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800"
                    }`}
                  >
                    <p className="text-sm font-medium truncate">{w.product.name}</p>
                    <p className="text-[10px] text-muted-foreground">{w.product.sku} · {w.product.category}</p>
                    <div className="flex gap-3 mt-1.5 text-xs">
                      <span className={w.quantity === 0 ? "text-red-600 font-bold" : "text-amber-700 dark:text-amber-400"}>
                        Tồn: {w.quantity}
                      </span>
                      <span className="text-muted-foreground">
                        {w.daysInStock} ngày
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ads Tab */}
      {!loading && !errorMsg && activeTab === "ads" && adsData?.channelSummary && (
        <div className="space-y-6">
          {/* Channel summary */}
          <div className="grid grid-cols-3 gap-4">
            {adsData.channelSummary?.map((ch) => (
              <Card key={ch.channel} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: CHANNEL_COLORS[ch.channel] || "#6b7280" }}
                    />
                    <p className="text-sm font-semibold">{CHANNEL_LABELS[ch.channel] || ch.channel}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Chi phí 7 ngày</p>
                      <p className="font-mono font-medium">{formatVND(ch.spent)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Doanh thu 7 ngày</p>
                      <p className="font-mono font-medium text-blue-600 dark:text-blue-400">{formatVND(ch.revenue)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Đơn hàng</p>
                      <p className="font-mono font-medium">{ch.orders}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">ROAS</p>
                      <p className={`font-mono font-bold ${ch.roas >= 2 ? "text-emerald-600" : ch.roas >= 1 ? "text-amber-600" : "text-red-600"}`}>
                        {ch.roas}x
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Campaign table */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Hiệu quả từng Campaign (7 ngày)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b border-border">
                      <th className="pb-2 font-medium">Campaign</th>
                      <th className="pb-2 font-medium text-right">Chi phí</th>
                      <th className="pb-2 font-medium text-right">Doanh thu</th>
                      <th className="pb-2 font-medium text-right">Đơn</th>
                      <th className="pb-2 font-medium text-right">CPC</th>
                      <th className="pb-2 font-medium text-right">ROAS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adsData.campaignData?.map((c) => (
                      <tr key={c.name} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-2.5">
                          <p className="font-medium truncate max-w-[220px]">{c.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {CHANNEL_LABELS[c.channel] || c.channel} · Budget {formatVND(c.dailyBudget)}/ngày
                          </p>
                        </td>
                        <td className="py-2.5 text-right font-mono">{formatVND(c.spent7d)}</td>
                        <td className="py-2.5 text-right font-mono text-blue-600 dark:text-blue-400">{formatVND(c.revenue7d)}</td>
                        <td className="py-2.5 text-right font-mono">{c.orders7d}</td>
                        <td className="py-2.5 text-right font-mono">{formatVND(c.cpc)}</td>
                        <td className="py-2.5 text-right">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                            c.roas >= 3 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                            c.roas >= 1.5 ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                            c.roas >= 1 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                            "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }`}>
                            {c.roas}x
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
