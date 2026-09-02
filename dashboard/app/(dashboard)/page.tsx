"use client";

// ==============================================================================
// OpenDX-Lab — Command Center (Redesigned Homepage)
// SPDX-License-Identifier: GPL-3.0-or-later
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

const LAYER_LABELS: Record<string, string> = {
  H: "Human",
  P: "Process",
  D: "Data",
  I: "Intelligence",
};

const LAYER_COLORS: Record<string, string> = {
  H: "var(--hdpi-human)",
  P: "var(--hdpi-process)",
  D: "var(--hdpi-data)",
  I: "var(--hdpi-intelligence)",
};

// ── Main Component ─────────────────────────────────────────────────────────────

export default function CommandCenter() {
  const { data: session } = useSession();

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
  const [scanResult, setScanResult] = useState<{ summary: string; anomalyCount: number; details?: string; timestamp?: string; durationMs?: number } | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    const [healthRes, pulseRes, scanRes, empRes] = await Promise.allSettled([
      fetch("/api/health"),
      fetch("/api/bizscan/pulse"),
      fetch("/api/bizscan/scan"),
      fetch("/api/employees"),
    ]);

    if (healthRes.status === "fulfilled" && healthRes.value.ok) {
      const h = await healthRes.value.json();
      setServices(h.services ?? []);
      setHealthOverall(h.overall ?? "DOWN");
    }

    if (pulseRes.status === "fulfilled" && pulseRes.value.ok) {
      const p = await pulseRes.value.json();
      if (p.success) {
        setPulse(p.summary);
        setDailyRevenue(p.dailyRevenue ?? []);
        setTopProducts(p.topProducts ?? []);
        setChannels(p.channels ?? []);
      }
    }

    if (scanRes.status === "fulfilled" && scanRes.value.ok) {
      const s = await scanRes.value.json();
      if (s.success && s.scans?.[0]) {
        setFindings(s.scans[0].findings?.filter((f: Finding) => f.status === "PENDING") ?? []);
      }
    }

    if (empRes.status === "fulfilled" && empRes.value.ok) {
      const e = await empRes.value.json();
      // API trả về mảng trực tiếp, không phải { employees: [...] }
      const list = Array.isArray(e) ? e : (e.employees ?? []);
      setEmployees(list.filter((emp: Employee) => emp.status === "ACTIVE"));
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
      setOffboardResult(data.success ? data.results : { error: data.error });
      if (data.success) await fetchAll();
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
      }
    } catch { /* ignore */ }
    finally { setTicketSubmitting(false); }
  };

  const handleScan = async () => {
    setScanning(true);
    setScanResult(null);
    try {
      const res = await fetch("/api/bizscan/scan", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        // Build detailed summary showing each check
        const checkDetails = (data.checks ?? [])
          .map((c: { name: string; hasAnomaly: boolean; message: string }) =>
            `${c.hasAnomaly ? "●" : "○"} ${c.name}: ${c.message.split(".")[0]}`
          )
          .join("\n");
        setScanResult({
          summary: data.scan.summary,
          anomalyCount: data.scan.anomalyCount,
          details: checkDetails,
          timestamp: new Date().toLocaleTimeString("vi-VN"),
          durationMs: data.scan.durationMs,
        });
        await fetchAll();
      }
    } catch { /* ignore */ }
    finally { setScanning(false); }
  };

  const maxRevenue = Math.max(...dailyRevenue.map((d) => d.revenue), 1);
  const totalChannelRevenue = channels.reduce((sum, c) => sum + c.revenue, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-border border-t-foreground rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* SECTION A: SERVICE HEALTH                                          */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              healthOverall === "HEALTHY" ? "bg-emerald-500" : healthOverall === "DEGRADED" ? "bg-amber-500" : "bg-red-500"
            }`} />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Trạng thái hạ tầng
            </span>
            <span className="text-[10px] text-muted-foreground">
              — {services.filter((s) => s.status === "UP").length}/{services.length} hoạt động
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground/50">
            Tự cập nhật mỗi 30s · Nguồn: Docker container ping
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {services.map((svc) => (
            <div
              key={svc.name}
              className={`p-2.5 rounded-lg border transition-all ${
                svc.status === "UP"
                  ? "border-border/40 bg-card/30"
                  : "border-red-500/30 bg-red-500/5"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: svc.status === "UP" ? "#22c55e" : "#ef4444" }}
                />
                <span className="text-xs font-medium truncate">{svc.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  {LAYER_LABELS[svc.layer]}
                </span>
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {svc.responseMs}ms
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* SECTION B: ALERTS + ACTIONS                                        */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Alerts */}
        <Card className="lg:col-span-2 bg-card/30 border-border/40">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium">Cảnh báo vận hành</CardTitle>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Nguồn: BizScan quét bảng sb_orders, sb_inventory, sb_ad_daily_stats
                </p>
              </div>
              {findings.length > 0 && (
                <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-400 border-red-500/20">
                  {findings.length} cần xử lý
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {findings.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                Không có cảnh báo. Bấm &quot;Quét vận hành&quot; để kiểm tra.
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto">
                {findings.slice(0, 5).map((f) => (
                  <div
                    key={f.id}
                    className={`p-3 rounded-lg border text-sm ${
                      f.severity === "CRITICAL"
                        ? "border-red-500/20 bg-red-500/5"
                        : "border-amber-500/20 bg-amber-500/5"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            f.severity === "CRITICAL" ? "bg-red-500" : "bg-amber-500"
                          }`}
                        />
                        <span className="text-xs truncate">{f.title}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0 uppercase">{f.category}</span>
                    </div>
                  </div>
                ))}
                {findings.length > 5 && (
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground w-full text-center py-1"
                    onClick={() => window.location.href = "/bizscan"}
                  >
                    Xem thêm {findings.length - 5} cảnh báo →
                  </button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-card/30 border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Thao tác nhanh</CardTitle>
            <p className="text-[10px] text-muted-foreground">
              Mỗi thao tác kết nối thật tới Keycloak, Mattermost, PostgreSQL
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Offboard */}
            <Dialog open={offboardOpen} onOpenChange={setOffboardOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-xs h-9 gap-2" id="btn-offboard">
                  <span className="w-4 h-4 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                  </span>
                  Thu hồi quyền nhân viên
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Thu hồi quyền truy cập</DialogTitle>
                  <DialogDescription>
                    Chọn nhân viên → Hệ thống tự động: khóa đăng nhập SSO (Keycloak), vô hiệu tài khoản chat (Mattermost), ghi nhật ký kiểm toán (PostgreSQL)
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
                    <div className="p-3 rounded-lg bg-muted/50 text-xs space-y-1 border">
                      <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Kết quả thực thi:</p>
                      {Object.entries(offboardResult).map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <span className="text-muted-foreground capitalize min-w-[80px]">{key}:</span>
                          <span>{value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button
                    onClick={handleOffboard}
                    disabled={!selectedEmployee || offboarding}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    {offboarding ? "Đang xử lý..." : "Xác nhận thu hồi"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Scan */}
            <Button
              variant="outline"
              className="w-full justify-start text-xs h-9 gap-2"
              onClick={handleScan}
              disabled={scanning}
              id="btn-scan"
            >
              <span className="w-4 h-4 flex items-center justify-center">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </span>
              {scanning ? "Đang quét..." : "Quét vận hành"}
            </Button>

            {/* Ticket */}
            <Dialog open={ticketOpen} onOpenChange={setTicketOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-xs h-9 gap-2" id="btn-ticket">
                  <span className="w-4 h-4 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
                    </svg>
                  </span>
                  Tạo yêu cầu hỗ trợ
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tạo yêu cầu hỗ trợ IT</DialogTitle>
                  <DialogDescription>
                    Tạo ticket → Lưu vào PostgreSQL → Gửi thông báo Mattermost webhook
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <Input
                    placeholder="Tiêu đề..."
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
                      <SelectItem value="LOW">Thấp</SelectItem>
                      <SelectItem value="NORMAL">Bình thường</SelectItem>
                      <SelectItem value="HIGH">Cao</SelectItem>
                      <SelectItem value="URGENT">Khẩn cấp</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleCreateTicket}
                    disabled={!ticketTitle.trim() || ticketSubmitting}
                    className="w-full"
                  >
                    {ticketSubmitting ? "Đang tạo..." : "Tạo và gửi thông báo"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Scan result */}
            {scanResult && (
              <div className={`p-3 rounded-lg text-xs border ${
                scanResult.anomalyCount > 0
                  ? "border-amber-500/20 bg-amber-500/5"
                  : "border-emerald-500/20 bg-emerald-500/5"
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium">{scanResult.summary}</p>
                  {scanResult.durationMs && (
                    <span className="text-[9px] text-muted-foreground">{scanResult.durationMs}ms</span>
                  )}
                </div>
                {scanResult.details && (
                  <pre className="text-[10px] text-muted-foreground mt-1 whitespace-pre-wrap font-mono leading-relaxed">
                    {scanResult.details}
                  </pre>
                )}
                <p className="text-[9px] text-muted-foreground mt-2 pt-1 border-t border-border/30">
                  Quét lúc {scanResult.timestamp} · 5 checks trên bảng sb_orders, sb_inventory, sb_ad_daily_stats, sb_customers
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* SECTION C: BUSINESS DATA                                           */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      {pulse && (
        <>
          {/* Data source banner */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border/30">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0" />
            <p className="text-[10px] text-muted-foreground">
              <strong>Nguồn dữ liệu:</strong> Bảng <code className="bg-muted px-1 rounded">sb_orders</code> ({pulse.totalOrders.toLocaleString()} đơn hàng),{" "}
              <code className="bg-muted px-1 rounded">sb_products</code> ({pulse.totalProducts} sản phẩm),{" "}
              <code className="bg-muted px-1 rounded">sb_customers</code> ({pulse.totalCustomers} khách hàng)
              — Dữ liệu mẫu 6 tháng, giả lập từ seed script
            </p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="bg-card/30 border-border/40">
              <CardContent className="pt-4 pb-3 px-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Doanh thu 7 ngày</p>
                <p className="text-xl font-bold tabular-nums">{formatVND(pulse.currentRevenue)}đ</p>
                <p className={`text-[10px] ${pulse.revenueChange >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {pulse.revenueChange >= 0 ? "+" : ""}{pulse.revenueChange}% so với tuần trước
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card/30 border-border/40">
              <CardContent className="pt-4 pb-3 px-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Đơn hàng (7 ngày)</p>
                <p className="text-xl font-bold tabular-nums">{pulse.currentOrders}</p>
                <p className="text-[10px] text-muted-foreground">Tổng cộng: {pulse.totalOrders.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/30 border-border/40">
              <CardContent className="pt-4 pb-3 px-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Sản phẩm đang bán</p>
                <p className="text-xl font-bold tabular-nums">{pulse.totalProducts}</p>
                <p className="text-[10px] text-muted-foreground">{pulse.totalCustomers} khách hàng</p>
              </CardContent>
            </Card>
            <Card className="bg-card/30 border-border/40">
              <CardContent className="pt-4 pb-3 px-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Lợi nhuận (7 ngày)</p>
                <p className="text-xl font-bold tabular-nums">{formatVND(pulse.currentProfit)}đ</p>
                <p className="text-[10px] text-muted-foreground">
                  Tính từ: sellPrice - costPrice
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Chart + Channels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 bg-card/30 border-border/40">
              <CardHeader className="pb-2">
                <div>
                  <CardTitle className="text-sm font-medium">Doanh thu theo ngày</CardTitle>
                  <p className="text-[10px] text-muted-foreground">
                    Truy vấn: SUM(totalAmount) FROM sb_orders WHERE status=COMPLETED GROUP BY DATE(orderDate)
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                {dailyRevenue.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">Chưa có dữ liệu trong 7 ngày gần</p>
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
                            className="w-full rounded-t bg-gradient-to-t from-violet-600/80 to-violet-400/80 hover:from-violet-500 hover:to-violet-300 transition-colors"
                            style={{ height: `${height}%` }}
                            title={`${dateLabel}: ${new Intl.NumberFormat("vi-VN").format(day.revenue)}đ / ${day.orders} đơn`}
                          />
                          <span className="text-[9px] text-muted-foreground">{dateLabel}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card/30 border-border/40">
              <CardHeader className="pb-2">
                <div>
                  <CardTitle className="text-sm font-medium">Kênh bán hàng</CardTitle>
                  <p className="text-[10px] text-muted-foreground">
                    Trường &quot;channel&quot; trong sb_orders
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {channels.map((ch) => {
                  const pct = totalChannelRevenue > 0 ? (ch.revenue / totalChannelRevenue) * 100 : 0;
                  return (
                    <div key={ch.channel}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="capitalize">{ch.channel}</span>
                        <span className="text-muted-foreground tabular-nums text-[10px]">
                          {ch.orders} đơn · {formatVND(ch.revenue)}đ
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-500/70 rounded-full transition-all"
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
            <Card className="bg-card/30 border-border/40">
              <CardHeader className="pb-2">
                <div>
                  <CardTitle className="text-sm font-medium">Sản phẩm bán chạy (7 ngày)</CardTitle>
                  <p className="text-[10px] text-muted-foreground">
                    Truy vấn: COUNT(sb_order_items) JOIN sb_products GROUP BY product ORDER BY sales DESC LIMIT 5
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {topProducts.map((p, i) => (
                    <div
                      key={p.sku}
                      className="p-3 rounded-lg border border-border/30 bg-muted/10 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{p.sku}</span>
                      </div>
                      <p className="text-xs font-medium truncate">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {p.sales} bán · {formatVND(p.revenue)}đ
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
