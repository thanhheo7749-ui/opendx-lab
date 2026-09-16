"use client";

// ==============================================================================
// ShopWise — Products Management Page (Full CRUD)
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/lib/toast";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  costPrice: number;
  sellPrice: number;
  margin: string;
  isActive: boolean;
  stock: number;
  orderCount: number;
  supplierCount: number;
  updatedAt: string;
}

interface CategoryInfo {
  name: string;
  count: number;
}

const CATEGORIES = ["Áo", "Quần", "Váy", "Đầm", "Túi", "Giày", "Phụ kiện", "Set đồ", "Khác"];

function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n);
}

// ══════════════════════════════════════════════════════════════════════════════

export default function ProductsPage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const userRoles = session?.user?.roles ?? [];
  const canEdit = userRoles.includes("admin") || userRoles.includes("manager") || userRoles.length === 0; // allow if no roles configured
  const canDelete = userRoles.includes("admin") || userRoles.length === 0;

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter) params.set("category", categoryFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products);
        setCategories(data.categories);
      }
    } catch {
      toast("error", "Không thể tải danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = useCallback(async (id: string, name: string) => {
    if (!confirm(`Ẩn sản phẩm "${name}"? (Soft delete — có thể khôi phục)`)) return;
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast("success", `Đã ẩn "${name}"`);
        fetchProducts();
      } else {
        const data = await res.json();
        toast("error", data.error || "Xóa thất bại");
      }
    } catch {
      toast("error", "Lỗi kết nối");
    }
  }, [fetchProducts]);

  // ── Restore ────────────────────────────────────────────────────────────────

  const handleRestore = useCallback(async (id: string) => {
    try {
      const res = await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: true }),
      });
      if (res.ok) {
        toast("success", "Đã khôi phục sản phẩm");
        fetchProducts();
      }
    } catch {
      toast("error", "Lỗi khôi phục");
    }
  }, [fetchProducts]);

  // ── Stats ──────────────────────────────────────────────────────────────────

  const activeProducts = products.filter((p) => p.isActive);
  const totalValue = activeProducts.reduce((s, p) => s + p.sellPrice * p.stock, 0);
  const avgMargin = activeProducts.length > 0
    ? (activeProducts.reduce((s, p) => s + parseFloat(p.margin), 0) / activeProducts.length).toFixed(1)
    : "0";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quản lý sản phẩm</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {products.length} sản phẩm • Tồn kho trị giá {formatVND(totalValue)}đ
          </p>
        </div>
        {canEdit && (
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditProduct(null); }}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Thêm SP
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editProduct ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}</DialogTitle>
              </DialogHeader>
              <ProductForm
                product={editProduct}
                onSuccess={() => { setDialogOpen(false); setEditProduct(null); fetchProducts(); }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Tổng SP" value={products.length.toString()} icon="📦" />
        <KpiCard label="Đang bán" value={activeProducts.length.toString()} icon="✅" color="emerald" />
        <KpiCard label="Margin TB" value={`${avgMargin}%`} icon="📈" color="blue" />
        <KpiCard label="Danh mục" value={categories.length.toString()} icon="🏷️" color="violet" />
      </div>

      {/* Filters */}
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
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px] h-9 text-sm">
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">Tất cả</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.name} value={c.name}>{c.name} ({c.count})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Đang bán</SelectItem>
                <SelectItem value="inactive">Đã ẩn</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchProducts} className="h-9">
              <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
              </svg>
              Tải lại
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <svg className="w-6 h-6 animate-spin text-muted-foreground" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              Không tìm thấy sản phẩm nào
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">Sản phẩm</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">SKU</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">Danh mục</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">Giá gốc</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">Giá bán</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">Margin</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">Tồn kho</th>
                    <th className="text-center px-4 py-2.5 font-semibold text-muted-foreground">Trạng thái</th>
                    {canEdit && <th className="text-center px-4 py-2.5 font-semibold text-muted-foreground w-24">Thao tác</th>}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-foreground">{p.name}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{p.sku}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant="secondary" className="text-[10px]">{p.category}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">{formatVND(p.costPrice)}</td>
                      <td className="px-4 py-2.5 text-right font-medium">{formatVND(p.sellPrice)}</td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={parseFloat(p.margin) >= 50 ? "text-emerald-600" : parseFloat(p.margin) >= 30 ? "text-blue-600" : "text-amber-600"}>
                          {p.margin}%
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium">
                        <span className={p.stock === 0 ? "text-red-500" : p.stock < 10 ? "text-amber-500" : "text-foreground"}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <Badge variant={p.isActive ? "default" : "destructive"} className="text-[10px]">
                          {p.isActive ? "Đang bán" : "Đã ẩn"}
                        </Badge>
                      </td>
                      {canEdit && (
                        <td className="px-4 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => { setEditProduct(p); setDialogOpen(true); }}
                              className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                              title="Sửa"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                              </svg>
                            </button>
                            {p.isActive ? (
                              canDelete && (
                                <button
                                  onClick={() => handleDelete(p.id, p.name)}
                                  className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                                  title="Ẩn"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                  </svg>
                                </button>
                              )
                            ) : (
                              <button
                                onClick={() => handleRestore(p.id)}
                                className="p-1 rounded hover:bg-emerald-50 text-muted-foreground hover:text-emerald-500 transition-colors"
                                title="Khôi phục"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon, color }: { label: string; value: string; icon: string; color?: string }) {
  const colorMap: Record<string, string> = {
    emerald: "text-emerald-600",
    blue: "text-blue-600",
    violet: "text-violet-600",
    amber: "text-amber-600",
    red: "text-red-600",
  };
  return (
    <Card className="shadow-sm">
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-lg font-bold ${color ? colorMap[color] : "text-foreground"}`}>{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Product Form ──────────────────────────────────────────────────────────────

function ProductForm({ product, onSuccess }: { product: Product | null; onSuccess: () => void }) {
  const [name, setName] = useState(product?.name || "");
  const [sku, setSku] = useState(product?.sku || "");
  const [category, setCategory] = useState(product?.category || "Áo");
  const [costPrice, setCostPrice] = useState(product?.costPrice?.toString() || "");
  const [sellPrice, setSellPrice] = useState(product?.sellPrice?.toString() || "");
  const [submitting, setSubmitting] = useState(false);

  const margin = costPrice && sellPrice && parseFloat(sellPrice) > 0
    ? ((parseFloat(sellPrice) - parseFloat(costPrice)) / parseFloat(sellPrice) * 100).toFixed(1) : null;

  const handleSubmit = async () => {
    if (!name || !sku) { toast("error", "Tên và SKU là bắt buộc"); return; }
    setSubmitting(true);
    try {
      const body = {
        ...(product && { id: product.id }),
        name, sku, category,
        costPrice: parseFloat(costPrice) || 0,
        sellPrice: parseFloat(sellPrice) || 0,
      };
      const res = await fetch("/api/products", {
        method: product ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        toast("success", product ? "Đã cập nhật sản phẩm" : "Đã thêm sản phẩm mới");
        onSuccess();
      } else {
        toast("error", data.error || "Lỗi lưu sản phẩm");
      }
    } catch {
      toast("error", "Lỗi kết nối");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500";

  return (
    <div className="space-y-3 pt-2">
      <div>
        <label className="text-xs font-medium text-foreground">Tên sản phẩm *</label>
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Áo khoác denim nữ" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-foreground">SKU *</label>
          <input className={inputClass} value={sku} onChange={(e) => setSku(e.target.value)} placeholder="AO-001" disabled={!!product} />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground">Danh mục</label>
          <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-foreground">Giá gốc (VNĐ)</label>
          <input className={inputClass} type="number" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} placeholder="180000" />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground">Giá bán (VNĐ)</label>
          <input className={inputClass} type="number" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} placeholder="450000" />
        </div>
      </div>
      {margin && (
        <p className="text-xs text-emerald-600">
          Margin: {margin}% • Lãi {formatVND(parseFloat(sellPrice) - parseFloat(costPrice))}đ/SP
        </p>
      )}
      <Button onClick={handleSubmit} disabled={submitting || !name || !sku} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
        {submitting ? "Đang lưu..." : (product ? "Cập nhật" : "Thêm sản phẩm")}
      </Button>
    </div>
  );
}
