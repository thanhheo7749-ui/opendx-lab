"use client";

// ==============================================================================
// ShopWise — Inventory Overview Page
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/lib/toast";

// ── Types ──────────────────────────────────────────────────────────────────────

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  costPrice: number;
  sellPrice: number;
  stock: number;
  dailySales: number;
  daysLeft: number;
  daysInStock: number;
  stockValue: number;
  lastRestock: string | null;
  inventoryId: string | null;
  status: "out" | "low" | "slow" | "ok";
}

interface KPI {
  totalProducts: number;
  totalStock: number;
  totalValue: number;
  outOfStock: number;
  lowStock: number;
  slowMoving: number;
  healthy: number;
}

type FilterType = "all" | "out" | "low" | "slow" | "ok";

function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN").format(Math.round(n));
}

const statusConfig = {
  out: { label: "Hết hàng", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", dot: "bg-red-500" },
  low: { label: "Sắp hết", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", dot: "bg-amber-500" },
  slow: { label: "Tồn lâu", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", dot: "bg-orange-500" },
  ok: { label: "Bình thường", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", dot: "bg-emerald-500" },
};

// ══════════════════════════════════════════════════════════════════════════════

export default function InventoryPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [kpi, setKpi] = useState<KPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);

  const userRoles = session?.user?.roles ?? [];
  const canEdit = userRoles.includes("admin") || userRoles.includes("manager") || userRoles.includes("staff") || userRoles.length === 0;

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("filter", filter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/inventory?${params}`);
      const data = await res.json();
      if (res.ok) {
        setItems(data.items);
        setKpi(data.kpi);
      }
    } catch {
      toast("error", "Không thể tải tồn kho");
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    const timer = setTimeout(fetchInventory, 300);
    return () => clearTimeout(timer);
  }, [fetchInventory]);

  // ── Update Stock ───────────────────────────────────────────────────────────

  const handleUpdateStock = useCallback(async (productId: string, quantity: number, action: "set" | "add" | "subtract") => {
    try {
      const res = await fetch("/api/inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity, action }),
      });
      if (res.ok) {
        toast("success", "Cập nhật tồn kho thành công");
        setEditItem(null);
        fetchInventory();
      } else {
        const data = await res.json();
        toast("error", data.error || "Cập nhật thất bại");
      }
    } catch {
      toast("error", "Lỗi kết nối");
    }
  }, [fetchInventory]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Quản lý kho hàng</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Tổng quan tồn kho, cảnh báo hết hàng và tốc độ bán
        </p>
      </div>

      {/* KPI Cards */}
      {kpi && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <KpiCard label="Tổng SP" value={kpi.totalProducts} icon="📦" />
          <KpiCard label="Tổng tồn kho" value={kpi.totalStock} icon="🏷️" />
          <KpiCard label="Giá trị kho" value={`${formatVND(kpi.totalValue)}đ`} icon="💰" small />
          <KpiCard label="Hết hàng" value={kpi.outOfStock} icon="🔴" color="red" clickable onClick={() => setFilter("out")} />
          <KpiCard label="Sắp hết" value={kpi.lowStock} icon="🟡" color="amber" clickable onClick={() => setFilter("low")} />
          <KpiCard label="Tồn lâu" value={kpi.slowMoving} icon="🟠" color="orange" clickable onClick={() => setFilter("slow")} />
          <KpiCard label="Bình thường" value={kpi.healthy} icon="🟢" color="emerald" clickable onClick={() => setFilter("ok")} />
        </div>
      )}

      {/* Filter bar */}
      <Card className="shadow-sm">
        <CardContent className="py-3 px-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Tìm theo tên hoặc SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="flex gap-1 bg-muted/50 rounded-lg p-0.5">
              {(["all", "out", "low", "slow", "ok"] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    filter === f
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f === "all" ? "Tất cả" : statusConfig[f].label}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={fetchInventory} className="h-8">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
              </svg>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <svg className="w-6 h-6 animate-spin text-muted-foreground" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              {filter !== "all" ? `Không có sản phẩm nào ${statusConfig[filter].label.toLowerCase()}` : "Không có sản phẩm nào"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">Sản phẩm</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">SKU</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">Danh mục</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">Tồn kho</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">Bán/ngày</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">Còn lại</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">Giá trị</th>
                    <th className="text-center px-4 py-2.5 font-semibold text-muted-foreground">Trạng thái</th>
                    {canEdit && <th className="text-center px-4 py-2.5 font-semibold text-muted-foreground w-20">Nhập kho</th>}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const sc = statusConfig[item.status];
                    return (
                      <tr key={item.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-foreground">{item.name}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{item.sku}</td>
                        <td className="px-4 py-2.5">
                          <Badge variant="secondary" className="text-[10px]">{item.category}</Badge>
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold">
                          <span className={item.stock === 0 ? "text-red-500" : item.stock < 10 ? "text-amber-500" : "text-foreground"}>
                            {item.stock}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right text-muted-foreground">
                          {item.dailySales > 0 ? `${item.dailySales}/ngày` : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {item.daysLeft === 999 ? (
                            <span className="text-muted-foreground text-xs">không bán</span>
                          ) : item.daysLeft === 0 ? (
                            <span className="text-red-500 font-medium">0 ngày</span>
                          ) : (
                            <span className={item.daysLeft < 7 ? "text-amber-500" : "text-foreground"}>
                              {item.daysLeft} ngày
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right text-muted-foreground text-xs">
                          {formatVND(item.stockValue)}đ
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${sc.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {sc.label}
                          </span>
                        </td>
                        {canEdit && (
                          <td className="px-4 py-2.5 text-center">
                            <button
                              onClick={() => setEditItem(item)}
                              className="p-1.5 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-muted-foreground hover:text-emerald-600 transition-colors"
                              title="Cập nhật tồn kho"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                              </svg>
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock Update Dialog */}
      <Dialog open={!!editItem} onOpenChange={(o) => { if (!o) setEditItem(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cập nhật tồn kho</DialogTitle>
          </DialogHeader>
          {editItem && (
            <StockUpdateForm item={editItem} onUpdate={handleUpdateStock} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon, color, small, clickable, onClick }: {
  label: string; value: string | number; icon: string; color?: string; small?: boolean; clickable?: boolean; onClick?: () => void;
}) {
  const colorMap: Record<string, string> = {
    red: "text-red-600", amber: "text-amber-600", orange: "text-orange-600",
    emerald: "text-emerald-600", blue: "text-blue-600",
  };
  return (
    <Card className={`shadow-sm ${clickable ? "cursor-pointer hover:ring-1 hover:ring-border transition-all" : ""}`} onClick={onClick}>
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <div>
            <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
            <p className={`font-bold ${small ? "text-sm" : "text-lg"} ${color ? colorMap[color] : "text-foreground"}`}>
              {value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Stock Update Form ─────────────────────────────────────────────────────────

function StockUpdateForm({ item, onUpdate }: {
  item: InventoryItem;
  onUpdate: (productId: string, quantity: number, action: "set" | "add" | "subtract") => Promise<void>;
}) {
  const [quantity, setQuantity] = useState("");
  const [action, setAction] = useState<"set" | "add" | "subtract">("add");
  const [submitting, setSubmitting] = useState(false);

  const preview = (() => {
    const q = parseInt(quantity) || 0;
    if (action === "add") return item.stock + q;
    if (action === "subtract") return Math.max(0, item.stock - q);
    return q;
  })();

  const handleSubmit = async () => {
    const q = parseInt(quantity);
    if (isNaN(q) || q < 0) { toast("error", "Số lượng không hợp lệ"); return; }
    setSubmitting(true);
    await onUpdate(item.id, q, action);
    setSubmitting(false);
  };

  const inputClass = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500";

  return (
    <div className="space-y-4 pt-2">
      <div className="p-3 rounded-lg bg-muted/30 border border-border">
        <p className="font-medium text-sm text-foreground">{item.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {item.sku} • Tồn hiện tại: <span className="font-bold text-foreground">{item.stock}</span>
        </p>
      </div>

      <div>
        <label className="text-xs font-medium text-foreground">Thao tác</label>
        <div className="flex gap-1 mt-1">
          {([
            { v: "add" as const, l: "➕ Nhập thêm" },
            { v: "subtract" as const, l: "➖ Xuất bớt" },
            { v: "set" as const, l: "✏️ Đặt số mới" },
          ]).map((a) => (
            <button
              key={a.v}
              onClick={() => setAction(a.v)}
              className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                action === a.v
                  ? "bg-emerald-600 text-white"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {a.l}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-foreground">Số lượng</label>
        <input
          className={inputClass}
          type="number"
          min="0"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder={action === "set" ? "Nhập số lượng mới" : "Số lượng thay đổi"}
          autoFocus
        />
      </div>

      {quantity && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Sau cập nhật:</span>
          <span className="font-bold text-foreground">{item.stock}</span>
          <span className="text-muted-foreground">→</span>
          <span className={`font-bold ${preview > item.stock ? "text-emerald-600" : preview < item.stock ? "text-amber-600" : "text-foreground"}`}>
            {preview}
          </span>
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={submitting || !quantity}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        {submitting ? "Đang lưu..." : "Cập nhật"}
      </Button>
    </div>
  );
}
