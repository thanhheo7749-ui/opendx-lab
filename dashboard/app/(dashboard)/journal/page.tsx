"use client";

// ==============================================================================
// ShopWise — Decision Journal Page
// Track decisions, compare predicted vs actual outcomes
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Decision {
  id: string;
  type: string;
  title: string;
  chosenOption: string | null;
  reason: string | null;
  predictedImpact: string | null;
  actualImpact: string | null;
  status: string;
  feedbackDue: string | null;
  createdAt: string;
}

interface Stats {
  total: number;
  done: number;
  pending: number;
  accuracy: number | null;
  decisions: Decision[];
}

const typeLabels: Record<string, string> = { inventory: "Nhập hàng", pricing: "Giá", adspend: "Quảng cáo", supplier: "NCC" };

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("vi", { day: "2-digit", month: "2-digit", year: undefined });
}

export default function JournalPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchStats = () => {
    setLoading(true);
    setErrorMsg(null);
    fetch("/api/decision/feedback")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok || data.error) throw new Error(data.error || `HTTP ${r.status}`);
        return data;
      })
      .then(setStats)
      .catch((err) => {
        console.error("Journal fetch error:", err);
        setErrorMsg(err.message || "Không thể tải nhật ký.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-muted-foreground">
          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span className="text-sm">Đang tải nhật ký...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Nhật ký quyết định</h1>
          <p className="text-sm text-muted-foreground mt-1">Theo dõi quyết định đã ra và so sánh dự đoán vs thực tế.</p>
        </div>
        <Link href="/decision">
          <Button variant="outline" size="sm" className="text-xs">Tư vấn mới</Button>
        </Link>
      </div>

      {errorMsg && (
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-800/40">
          <CardContent className="p-4 text-center space-y-2">
            <p className="text-sm font-medium text-red-600 dark:text-red-400">{errorMsg}</p>
            <p className="text-xs text-muted-foreground">Vui lòng kiểm tra phiên đăng nhập của bạn.</p>
            <Button variant="outline" size="sm" onClick={fetchStats} className="text-xs">Thử lại</Button>
          </CardContent>
        </Card>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats?.total || 0}</p>
            <p className="text-xs text-muted-foreground">Tổng QĐ</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{stats?.done || 0}</p>
            <p className="text-xs text-muted-foreground">Đã thực hiện</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{stats?.pending || 0}</p>
            <p className="text-xs text-muted-foreground">Đang chờ</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-violet-600">{stats && stats.accuracy !== null ? `${stats.accuracy}%` : "—"}</p>
            <p className="text-xs text-muted-foreground">Độ chính xác</p>
          </CardContent>
        </Card>
      </div>

      {/* Decision list */}
      {!stats?.decisions?.length ? (
        <Card className="bg-card/30 border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground space-y-3">
            <p className="text-sm">Chưa có quyết định nào được ghi nhận.</p>
            <p className="text-xs">Vào Tư vấn quyết định → chọn phương án → xác nhận để bắt đầu theo dõi.</p>
            <Link href="/decision">
              <Button variant="outline" size="sm" className="text-xs mt-2">Bắt đầu tư vấn</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {stats.decisions.map((d) => {
            const isPending = d.status === "PENDING";
            const dueDate = d.feedbackDue ? new Date(d.feedbackDue) : null;
            const daysLeft = dueDate ? Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

            return (
              <Card key={d.id} className={`shadow-sm transition-all hover:shadow-md ${isPending ? "border-l-2 border-l-amber-400" : "border-l-2 border-l-emerald-400"}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">{formatDate(d.createdAt)}</span>
                        <Badge variant="outline" className="text-[10px]">{typeLabels[d.type] || d.type}</Badge>
                        {isPending ? (
                          <Badge className="text-[10px] bg-amber-500/15 text-amber-600 border-amber-500/30">Đang theo dõi</Badge>
                        ) : (
                          <Badge className="text-[10px] bg-emerald-500/15 text-emerald-600 border-emerald-500/30">Đã thực hiện</Badge>
                        )}
                      </div>
                      <p className="text-sm font-semibold truncate">{d.title}</p>
                      {d.chosenOption && <p className="text-xs text-muted-foreground mt-0.5">Phương án: {d.chosenOption}</p>}
                      {d.reason && <p className="text-xs text-muted-foreground italic mt-0.5">Lý do: &quot;{d.reason}&quot;</p>}

                      {/* Predicted vs Actual */}
                      <div className="flex flex-wrap gap-3 mt-2">
                        {d.predictedImpact && (
                          <div className="text-xs">
                            <span className="text-muted-foreground">Dự đoán: </span>
                            <span className="font-medium text-violet-600">{d.predictedImpact}</span>
                          </div>
                        )}
                        {d.actualImpact && (
                          <div className="text-xs">
                            <span className="text-muted-foreground">Thực tế: </span>
                            <span className="font-medium text-emerald-600">{d.actualImpact}</span>
                          </div>
                        )}
                        {isPending && daysLeft !== null && daysLeft > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Còn {daysLeft} ngày theo dõi
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground text-center">
        Mỗi quyết định được theo dõi 7 ngày. Sau đó hệ thống so sánh dự đoán vs thực tế để đánh giá độ chính xác.
      </p>
    </div>
  );
}
