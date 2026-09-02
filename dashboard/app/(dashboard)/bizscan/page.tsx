"use client";

// ==============================================================================
// BizScan — AI Business Operations Dashboard
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ── Types ──────────────────────────────────────────────────────────────────────

interface ScanFinding {
  id: string;
  severity: string;
  category: string;
  title: string;
  description: string;
  rootCause: string | null;
  recommendation: string | null;
  estimatedImpact: string | null;
  status: string;
  createdAt: string;
}

interface ScanResult {
  id: string;
  status: string;
  scanType: string;
  summary: string | null;
  durationMs: number | null;
  startedAt: string;
  findings: ScanFinding[];
}

interface MarketComparison {
  productName: string;
  productSku: string;
  yourPrice: number;
  marketAvgPrice: number | null;
  priceDiff: string | null;
  trendScore: number;
  trendChange: string | null;
  competitorCount: number | null;
  recommendation: string;
  category: "HOT" | "DECLINING" | "STABLE" | "NEW";
}

interface ScanApiResponse {
  success: boolean;
  scan: {
    id: string;
    status: string;
    summary: string;
    durationMs: number;
    anomalyCount: number;
    findings: ScanFinding[];
  };
  checks: {
    id: string;
    name: string;
    category: string;
    hasAnomaly: boolean;
    severity: string;
    message: string;
  }[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function severityEmoji(s: string) {
  return s === "CRITICAL" ? "🔴" : s === "WARNING" ? "🟡" : "🟢";
}

function severityColor(s: string) {
  return s === "CRITICAL"
    ? "bg-red-500/10 text-red-400 border-red-500/20"
    : s === "WARNING"
      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
}

function statusBadge(s: string) {
  const map: Record<string, { label: string; cls: string }> = {
    PENDING: { label: "⏳ Chờ duyệt", cls: "bg-yellow-500/15 text-yellow-400" },
    APPROVED: { label: "✅ Đã duyệt", cls: "bg-green-500/15 text-green-400" },
    DISMISSED: { label: "❌ Đã bỏ qua", cls: "bg-zinc-500/15 text-zinc-400" },
    EXECUTED: { label: "⚡ Đã thực hiện", cls: "bg-blue-500/15 text-blue-400" },
  };
  return map[s] ?? { label: s, cls: "bg-zinc-500/15 text-zinc-400" };
}

function trendEmoji(cat: string) {
  return cat === "HOT" ? "🔥" : cat === "DECLINING" ? "📉" : cat === "NEW" ? "✨" : "➡️";
}

function trendColor(cat: string) {
  return cat === "HOT"
    ? "bg-orange-500/10 border-orange-500/20 text-orange-400"
    : cat === "DECLINING"
      ? "bg-red-500/10 border-red-500/20 text-red-400"
      : "bg-zinc-500/10 border-zinc-500/20 text-zinc-400";
}

function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN").format(Math.round(n));
}

function timeAgo(dateStr: string) {
  const ms = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function BizScanPage() {
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [latestScan, setLatestScan] = useState<ScanApiResponse | null>(null);
  const [marketData, setMarketData] = useState<MarketComparison[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [injecting, setInjecting] = useState(false);
  const [stats, setStats] = useState({ totalScans: 0, totalFindings: 0, pendingFindings: 0 });

  // ── Fetch Data ────────────────────────────────────────────────────────────

  const fetchScans = useCallback(async () => {
    try {
      const res = await fetch("/api/bizscan/scan");
      const data = await res.json();
      if (data.success) {
        setScans(data.scans ?? []);
        setStats(data.stats ?? { totalScans: 0, totalFindings: 0, pendingFindings: 0 });
      }
    } catch (e) {
      console.error("Failed to fetch scans:", e);
    }
  }, []);

  const fetchMarket = useCallback(async () => {
    try {
      const res = await fetch("/api/bizscan/market");
      const data = await res.json();
      if (data.success) {
        setMarketData(data.comparisons ?? []);
      }
    } catch (e) {
      console.error("Failed to fetch market:", e);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchScans(), fetchMarket()]).finally(() => setLoading(false));
  }, [fetchScans, fetchMarket]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const runScan = async () => {
    setScanning(true);
    try {
      const res = await fetch("/api/bizscan/scan", { method: "POST" });
      const data: ScanApiResponse = await res.json();
      if (data.success) {
        setLatestScan(data);
        await fetchScans();
      }
    } catch (e) {
      console.error("Scan failed:", e);
    } finally {
      setScanning(false);
    }
  };

  const injectAnomaly = async () => {
    setInjecting(true);
    try {
      await fetch("/api/bizscan/simulator?action=inject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      // Show alert
      alert("💣 Anomaly đã được inject! Bấm 'Scan Now' để agent phát hiện.");
    } catch (e) {
      console.error("Inject failed:", e);
    } finally {
      setInjecting(false);
    }
  };

  const approveFinding = async (findingId: string, action: "APPROVE" | "DISMISS") => {
    try {
      await fetch("/api/bizscan/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ findingId, action }),
      });
      await fetchScans();
    } catch (e) {
      console.error("Approve failed:", e);
    }
  };

  const simulateTick = async () => {
    try {
      await fetch("/api/bizscan/simulator?action=tick", { method: "POST" });
    } catch (e) {
      console.error("Tick failed:", e);
    }
  };

  // ── All findings from latest scan ──
  const latestFindings = scans[0]?.findings ?? [];
  const criticalCount = latestFindings.filter((f) => f.severity === "CRITICAL").length;
  const warningCount = latestFindings.filter((f) => f.severity === "WARNING").length;
  const approvedCount = latestFindings.filter((f) => f.status === "APPROVED").length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            🔍 BizScan
            <Badge variant="outline" className="text-xs font-normal bg-violet-500/10 text-violet-400 border-violet-500/20">
              AI Agent
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI tự hành phân tích vận hành doanh nghiệp + xu hướng thị trường
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={simulateTick}
            className="text-xs"
          >
            ⏩ Simulator Tick
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={injectAnomaly}
            disabled={injecting}
            className="text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            {injecting ? "💣 Đang inject..." : "💣 Inject Anomaly"}
          </Button>
          <Button
            size="sm"
            onClick={runScan}
            disabled={scanning}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            {scanning ? (
              <>
                <span className="animate-spin mr-1">⏳</span> Đang scan...
              </>
            ) : (
              "🔍 Scan Now"
            )}
          </Button>
        </div>
      </div>

      {/* ── Status Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Scan gần nhất
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold">
              #{stats.totalScans}
            </div>
            <p className="text-xs text-muted-foreground">
              {scans[0] ? timeAgo(scans[0].startedAt) : "Chưa có scan"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Vấn đề phát hiện
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold flex items-center gap-2">
              {latestFindings.length}
              {criticalCount > 0 && (
                <span className="text-sm text-red-400">
                  ({criticalCount} 🔴)
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {warningCount} cảnh báo, {approvedCount} đã duyệt
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Chờ duyệt
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-amber-400">
              {stats.pendingFindings}
            </div>
            <p className="text-xs text-muted-foreground">
              Cần hành động
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Tổng scans
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold">{stats.totalScans}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalFindings} findings tổng cộng
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Latest Scan Result (if just ran) ── */}
      {latestScan && (
        <Card className="bg-violet-500/5 border-violet-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              ⚡ Kết quả Scan mới nhất
              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/20">
                {latestScan.scan.durationMs}ms
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">{latestScan.scan.summary}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {latestScan.checks.map((check) => (
                <div
                  key={check.id}
                  className={`p-3 rounded-lg border text-sm ${
                    check.hasAnomaly ? severityColor(check.severity) : "bg-emerald-500/5 border-emerald-500/15 text-emerald-400"
                  }`}
                >
                  <div className="font-medium text-xs mb-1">
                    {check.hasAnomaly ? severityEmoji(check.severity) : "✅"} {check.name}
                  </div>
                  <div className="text-xs opacity-80 line-clamp-2">{check.message}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Two Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Findings ── */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            ⚠️ Vấn đề nội bộ
            <Badge variant="outline" className="text-xs">{latestFindings.length}</Badge>
          </h2>

          {latestFindings.length === 0 && !loading ? (
            <Card className="bg-card/50">
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                Chưa có dữ liệu. Bấm "Scan Now" để bắt đầu.
              </CardContent>
            </Card>
          ) : (
            latestFindings.map((finding) => {
              const badge = statusBadge(finding.status);
              return (
                <Card
                  key={finding.id}
                  className={`border ${severityColor(finding.severity)} bg-card/50 transition-all hover:shadow-md`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">{severityEmoji(finding.severity)}</span>
                          <Badge variant="outline" className={`text-[10px] ${severityColor(finding.severity)}`}>
                            {finding.severity}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {finding.category}
                          </Badge>
                        </div>
                        <h3 className="text-sm font-semibold">{finding.title}</h3>
                      </div>
                      <Badge className={`text-[10px] ${badge.cls}`}>{badge.label}</Badge>
                    </div>

                    {finding.rootCause && (
                      <p className="text-xs text-muted-foreground mb-1">
                        🔎 <strong>Nguyên nhân:</strong> {finding.rootCause}
                      </p>
                    )}
                    {finding.recommendation && (
                      <p className="text-xs text-muted-foreground mb-1">
                        💡 <strong>Đề xuất:</strong> {finding.recommendation}
                      </p>
                    )}
                    {finding.estimatedImpact && (
                      <p className="text-xs text-muted-foreground mb-2">
                        📈 <strong>Tác động:</strong> {finding.estimatedImpact}
                      </p>
                    )}

                    {finding.status === "PENDING" && (
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20"
                          onClick={() => approveFinding(finding.id, "APPROVE")}
                        >
                          ✅ Duyệt
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => approveFinding(finding.id, "DISMISS")}
                        >
                          ❌ Bỏ qua
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20"
                          onClick={async () => {
                            try {
                              await fetch("/api/tickets", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  title: `[BizScan] ${finding.title}`,
                                  description: `${finding.description}\n\nĐề xuất: ${finding.recommendation ?? "N/A"}`,
                                  priority: finding.severity === "CRITICAL" ? "URGENT" : "HIGH",
                                  category: "IT",
                                  createdBy: "BizScan Agent",
                                }),
                              });
                              alert("📨 Đã tạo DX-Ticket và gửi Mattermost!");
                            } catch {
                              alert("❌ Tạo ticket thất bại");
                            }
                          }}
                        >
                          📨 Tạo task IT
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* ── Market Trends ── */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            🌐 Xu hướng thị trường
            <Badge variant="outline" className="text-xs">{marketData.length}</Badge>
          </h2>

          {marketData.length === 0 && !loading ? (
            <Card className="bg-card/50">
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                Chưa có dữ liệu thị trường. Sẽ tự cập nhật khi scan.
              </CardContent>
            </Card>
          ) : (
            marketData.slice(0, 8).map((item, i) => (
              <Card
                key={i}
                className={`border ${trendColor(item.category)} bg-card/50 transition-all hover:shadow-md`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span>{trendEmoji(item.category)}</span>
                        <Badge variant="outline" className={`text-[10px] ${trendColor(item.category)}`}>
                          {item.category}
                        </Badge>
                        {item.trendChange && (
                          <span className="text-xs text-muted-foreground">{item.trendChange} search</span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold">{item.productName}</h3>
                    </div>
                    <div className="text-right text-xs">
                      <div className="font-bold">Trend: {item.trendScore}/100</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-2">
                    <div>💰 Giá bạn: <strong>{formatVND(item.yourPrice)}đ</strong></div>
                    {item.marketAvgPrice && (
                      <div>📊 Thị trường: <strong>{formatVND(item.marketAvgPrice)}đ</strong></div>
                    )}
                  </div>

                  {item.priceDiff && (
                    <p className="text-xs mb-1">
                      {item.priceDiff.includes("đắt") ? "⚠️" : "✅"} {item.priceDiff}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground">
                    💡 {item.recommendation}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* ── Scan History Timeline ── */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="text-sm">📋 Lịch sử Scan</CardTitle>
        </CardHeader>
        <CardContent>
          {scans.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Chưa có lịch sử scan.
            </p>
          ) : (
            <div className="space-y-3">
              {scans.slice(0, 10).map((scan) => {
                const scanDate = new Date(scan.startedAt);
                const findingCount = scan.findings.length;
                const criticals = scan.findings.filter((f) => f.severity === "CRITICAL").length;
                const warnings = scan.findings.filter((f) => f.severity === "WARNING").length;

                return (
                  <div
                    key={scan.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-violet-500" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">
                          {scanDate.toLocaleDateString("vi-VN")} {scanDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {scan.scanType}
                        </Badge>
                        {scan.durationMs && (
                          <span className="text-[10px] text-muted-foreground">{scan.durationMs}ms</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {scan.summary ?? `${findingCount} findings`}
                      </p>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-1">
                      {findingCount === 0 ? (
                        <Badge className="text-[10px] bg-emerald-500/15 text-emerald-400">✅ OK</Badge>
                      ) : (
                        <>
                          {criticals > 0 && (
                            <Badge className="text-[10px] bg-red-500/15 text-red-400">🔴 {criticals}</Badge>
                          )}
                          {warnings > 0 && (
                            <Badge className="text-[10px] bg-amber-500/15 text-amber-400">🟡 {warnings}</Badge>
                          )}
                        </>
                      )}
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
