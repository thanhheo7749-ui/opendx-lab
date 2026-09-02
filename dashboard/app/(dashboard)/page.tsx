"use client";

// ==============================================================================
// OpenDX-Lab — Command Center (Redesigned Homepage)
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Unified view: Service Health + Alerts + Business Pulse + Quick Actions
// ==============================================================================

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Types ──────────────────────────────────────────────────────────────────────

interface ServiceStatus {
  name: string;
  layer: "H" | "P" | "D" | "I";
  status: "UP" | "DOWN";
  responseMs: number;
}

interface Finding {
  id: string;
  severity: string;
  category: string;
  title: string;
  status: string;
  createdAt: string;
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

interface ChannelData {
  channel: string;
  orders: number;
  revenue: number;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  department: { name: string };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatVND(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} tỷ`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} tr`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toString();
}

function layerColor(layer: string) {
  return layer === "H"
    ? "var(--hdpi-human)"
    : layer === "P"
      ? "var(--hdpi-process)"
      : layer === "D"
        ? "var(--hdpi-data)"
        : "var(--hdpi-intelligence)";
}

const CHANNEL_EMOJI: Record<string, string> = {
  facebook: "📘",
  tiktok: "🎵",
  shopee: "🛒",
  lazada: "🔵",
  zalo: "💬",
};

// ── Main Component ─────────────────────────────────────────────────────────────

export default function CommandCenter() {
  const { data: session } = useSession();

  // State
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [healthOverall, setHealthOverall] = useState<string>("LOADING");
  const [pulse, setPulse] = useState<PulseSummary | null>(null);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [offboardOpen, setOffboardOpen] = useState(false);
  const [offboarding, setOffboarding] = useState(false);
  const [offboardResult, setOffboardResult] = useState<Record<string, string> | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");

  const [ticketOpen, setTicketOpen] = useState(false);
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDesc, setTicketDesc] = useState("");
  const [ticketPriority, setTicketPriority] = useState("NORMAL");

  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ summary: string; anomalyCount: number } | null>(null);

  // ── Fetch Data ────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    const [healthRes, pulseRes, scanRes, empRes] = await Promise.allSettled([
      fetch("/api/health"),
      fetch("/api/bizscan/pulse"),
      fetch("/api/bizscan/scan"),
      fetch("/api/employees"),
    ]);

    // Health
    if (healthRes.status === "fulfilled" && healthRes.value.ok) {
      const h = await healthRes.value.json();
      setServices(h.services ?? []);
      setHealthOverall(h.overall ?? "DOWN");
    }

    // Pulse
    if (pulseRes.status === "fulfilled" && pulseRes.value.ok) {
      const p = await pulseRes.value.json();
      if (p.success) {
        setPulse(p.summary);
        setDailyRevenue(p.dailyRevenue ?? []);
        setTopProducts(p.topProducts ?? []);
        setChannels(p.channels ?? []);
      }
    }

    // Scan findings
    if (scanRes.status === "fulfilled" && scanRes.value.ok) {
      const s = await scanRes.value.json();
      if (s.success && s.scans?.[0]) {
        setFindings(s.scans[0].findings?.filter((f: Finding) => f.status === "PENDING") ?? []);
      }
    }

    // Employees (for offboard dialog)
    if (empRes.status === "fulfilled" && empRes.value.ok) {
      const e = await empRes.value.json();
      setEmployees((e.employees ?? []).filter((emp: Employee) => emp.status === "ACTIVE"));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleOffboard = async () => {
    if (!selectedEmployee) return;
    setOffboarding(true);
    setOffboardResult(null);
    try {
      const res = await fetch("/api/offboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: selectedEmployee }),
      });
      const data = await res.json();
      if (data.success) {
        setOffboardResult(data.results);
        await fetchAll();
      } else {
        setOffboardResult({ error: data.error });
      }
    } catch {
      setOffboardResult({ error: "Kết nối thất bại" });
    } finally {
      setOffboarding(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!ticketTitle.trim()) return;
    setTicketSubmitting(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: ticketTitle,
          description: ticketDesc || ticketTitle,
          priority: ticketPriority,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTicketOpen(false);
        setTicketTitle("");
        setTicketDesc("");
        alert("✅ Ticket đã tạo và gửi thông báo Mattermost!");
      }
    } catch {
      alert("❌ Tạo ticket thất bại");
    } finally {
      setTicketSubmitting(false);
    }
  };

  const handleScan = async () => {
    setScanning(true);
    setScanResult(null);
    try {
      const res = await fetch("/api/bizscan/scan", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setScanResult({
          summary: data.scan.summary,
          anomalyCount: data.scan.anomalyCount,
        });
        await fetchAll();
      }
    } catch {
      // ignore
    } finally {
      setScanning(false);
    }
  };

  // ── Revenue chart (pure CSS bars) ──
  const maxRevenue = Math.max(...dailyRevenue.map((d) => d.revenue), 1);
  const totalChannelRevenue = channels.reduce((sum, c) => sum + c.revenue, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-border border-t-foreground rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Đang tải Command Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SECTION A: LIVE SERVICE STATUS BAR                                 */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${healthOverall === "HEALTHY" ? "bg-emerald-500 animate-pulse" : healthOverall === "DEGRADED" ? "bg-amber-500 animate-pulse" : "bg-red-500"}`} />
            Hạ tầng H-P-D-I
            <Badge variant="outline" className={`text-[10px] ml-1 ${
              healthOverall === "HEALTHY" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : healthOverall === "DEGRADED" ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
              : "bg-red-500/10 text-red-400 border-red-500/20"
            }`}>
              {services.filter((s) => s.status === "UP").length}/{services.length} UP
            </Badge>
          </h2>
          <span className="text-[10px] text-muted-foreground">
            Auto-refresh 30s
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {services.map((svc) => (
            <div
              key={svc.name}
              className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all ${
                svc.status === "UP"
                  ? "border-border/50 bg-card/50 hover:bg-card"
                  : "border-red-500/30 bg-red-500/5"
              }`}
            >
              <div
                className="w-1.5 h-6 rounded-full flex-shrink-0"
                style={{ backgroundColor: layerColor(svc.layer) }}
              />
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{svc.name}</p>
                <div className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${svc.status === "UP" ? "bg-emerald-500" : "bg-red-500"}`} />
                  <span className="text-[10px] text-muted-foreground">{svc.responseMs}ms</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SECTION B: ALERT CENTER + QUICK ACTIONS                            */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Alert Center (2 cols) ── */}
        <Card className="lg:col-span-2 bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                ⚠️ Cảnh báo cần xử lý
                {findings.length > 0 && (
                  <Badge className="text-[10px] bg-red-500/15 text-red-400">{findings.length}</Badge>
                )}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={() => window.location.href = "/bizscan"}
              >
                Xem tất cả →
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {findings.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-3xl mb-2">✅</p>
                <p className="text-sm text-muted-foreground">Mọi thứ ổn! Không có cảnh báo.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                {findings.slice(0, 5).map((f) => (
                  <div
                    key={f.id}
                    className={`p-3 rounded-lg border text-sm transition-all hover:shadow-sm ${
                      f.severity === "CRITICAL"
                        ? "bg-red-500/5 border-red-500/20"
                        : "bg-amber-500/5 border-amber-500/20"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm flex-shrink-0">
                          {f.severity === "CRITICAL" ? "🔴" : "🟡"}
                        </span>
                        <span className="text-xs truncate">{f.title}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] flex-shrink-0">{f.category}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Quick Actions (1 col) ── */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">⚡ Hành động nhanh</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Offboard button */}
            <Dialog open={offboardOpen} onOpenChange={setOffboardOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-xs h-10 gap-2 hover:bg-red-500/5 hover:border-red-500/30" id="btn-offboard">
                  🔒 Offboard nhân viên
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>🔒 Thu hồi quyền truy cập</DialogTitle>
                  <DialogDescription>
                    Chọn nhân viên → Khóa SSO + Chat + Ghi audit log
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn nhân viên..." />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName} — {emp.department?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {offboardResult && (
                    <div className="p-3 rounded-lg bg-muted/50 text-xs space-y-1">
                      {Object.entries(offboardResult).map(([key, value]) => (
                        <div key={key}>
                          <strong className="capitalize">{key}:</strong> {value}
                        </div>
                      ))}
                    </div>
                  )}

                  <Button
                    onClick={handleOffboard}
                    disabled={!selectedEmployee || offboarding}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    {offboarding ? "⏳ Đang xử lý..." : "🔒 Xác nhận Offboard"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Scan button */}
            <Button
              variant="outline"
              className="w-full justify-start text-xs h-10 gap-2 hover:bg-violet-500/5 hover:border-violet-500/30"
              onClick={handleScan}
              disabled={scanning}
              id="btn-scan"
            >
              {scanning ? "⏳ Đang scan..." : "🔍 Scan kinh doanh"}
            </Button>

            {/* Ticket button */}
            <Dialog open={ticketOpen} onOpenChange={setTicketOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-xs h-10 gap-2 hover:bg-blue-500/5 hover:border-blue-500/30" id="btn-ticket">
                  🎫 Tạo DX-Ticket
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>🎫 Tạo Ticket IT</DialogTitle>
                  <DialogDescription>
                    Tạo yêu cầu hỗ trợ → Gửi thông báo Mattermost
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <Input
                    placeholder="Tiêu đề ticket..."
                    value={ticketTitle}
                    onChange={(e) => setTicketTitle(e.target.value)}
                  />
                  <textarea
                    placeholder="Mô tả chi tiết..."
                    className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={ticketDesc}
                    onChange={(e) => setTicketDesc(e.target.value)}
                  />
                  <Select value={ticketPriority} onValueChange={setTicketPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">🟢 Thấp</SelectItem>
                      <SelectItem value="NORMAL">🔵 Bình thường</SelectItem>
                      <SelectItem value="HIGH">🟡 Cao</SelectItem>
                      <SelectItem value="URGENT">🔴 Khẩn cấp</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleCreateTicket}
                    disabled={!ticketTitle.trim() || ticketSubmitting}
                    className="w-full"
                  >
                    {ticketSubmitting ? "⏳ Đang tạo..." : "📨 Tạo & Gửi Mattermost"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Scan result toast */}
            {scanResult && (
              <div className={`p-3 rounded-lg text-xs ${
                scanResult.anomalyCount > 0
                  ? "bg-amber-500/10 border border-amber-500/20"
                  : "bg-emerald-500/10 border border-emerald-500/20"
              }`}>
                <p className="font-medium">{scanResult.anomalyCount > 0 ? "⚠️" : "✅"} {scanResult.summary}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SECTION C: BUSINESS PULSE                                          */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {pulse && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="bg-card/50 border-border/50">
              <CardContent className="pt-4 pb-3 px-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Doanh thu 7 ngày</p>
                <p className="text-xl font-bold tabular-nums">{formatVND(pulse.currentRevenue)}đ</p>
                <p className={`text-xs ${pulse.revenueChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {pulse.revenueChange >= 0 ? "↑" : "↓"} {Math.abs(pulse.revenueChange)}% vs tuần trước
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="pt-4 pb-3 px-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Đơn hàng</p>
                <p className="text-xl font-bold tabular-nums">{pulse.currentOrders}</p>
                <p className="text-xs text-muted-foreground">{pulse.totalOrders} tổng cộng</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="pt-4 pb-3 px-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Sản phẩm</p>
                <p className="text-xl font-bold tabular-nums">{pulse.totalProducts}</p>
                <p className="text-xs text-muted-foreground">{pulse.totalCustomers} khách hàng</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="pt-4 pb-3 px-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Lợi nhuận</p>
                <p className="text-xl font-bold tabular-nums">{formatVND(pulse.currentProfit)}đ</p>
                <p className="text-xs text-muted-foreground">7 ngày gần nhất</p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Chart + Channel + Top Products */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Revenue bar chart */}
            <Card className="lg:col-span-2 bg-card/50 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">📊 Doanh thu 7 ngày</CardTitle>
              </CardHeader>
              <CardContent>
                {dailyRevenue.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">Chưa có dữ liệu</p>
                ) : (
                  <div className="flex items-end gap-2 h-[140px]">
                    {dailyRevenue.map((day) => {
                      const height = Math.max((day.revenue / maxRevenue) * 100, 4);
                      const dateLabel = new Date(day.day).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
                      return (
                        <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[9px] text-muted-foreground tabular-nums">
                            {formatVND(day.revenue)}
                          </span>
                          <div
                            className="w-full rounded-t-md bg-gradient-to-t from-violet-600 to-violet-400 transition-all hover:from-violet-500 hover:to-violet-300"
                            style={{ height: `${height}%` }}
                            title={`${dateLabel}: ${formatVND(day.revenue)}đ / ${day.orders} đơn`}
                          />
                          <span className="text-[9px] text-muted-foreground">{dateLabel}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Channel breakdown */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">📱 Kênh bán hàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {channels.map((ch) => {
                  const pct = totalChannelRevenue > 0 ? (ch.revenue / totalChannelRevenue) * 100 : 0;
                  return (
                    <div key={ch.channel}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>
                          {CHANNEL_EMOJI[ch.channel] ?? "📦"} {ch.channel}
                        </span>
                        <span className="text-muted-foreground tabular-nums">
                          {ch.orders} đơn · {formatVND(ch.revenue)}đ
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-indigo-400 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Top Products */}
          {topProducts.length > 0 && (
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">🏆 Top sản phẩm bán chạy (7 ngày)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {topProducts.map((p, i) => (
                    <div
                      key={p.sku}
                      className="p-3 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                        </span>
                        <Badge variant="outline" className="text-[10px]">{p.sku}</Badge>
                      </div>
                      <p className="text-xs font-medium truncate">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {p.sales} đã bán · {formatVND(p.revenue)}đ
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
