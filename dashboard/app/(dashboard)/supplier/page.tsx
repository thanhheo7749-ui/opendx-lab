"use client";

// ==============================================================================
// ShopWise — Supplier Matcher Page
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Product { id: string; name: string; sku: string; sellPrice: number; costPrice: number; }
interface SupplierScore {
  supplierId: string; supplierName: string; province: string;
  unitPrice: number; shippingCost: number; totalCost: number;
  leadTimeDays: number; rating: number; moq: number; score: number; rank: number;
  breakdown: { priceScore: number; qualityScore: number; deliveryScore: number; locationScore: number; };
}
interface Comparison {
  productName: string; productSku: string; quantity: number; shopProvince: string;
  suppliers: SupplierScore[]; recommendation: string; dataSource: string; confidence: string;
}

const PROVINCES = ["TP.HCM", "Hà Nội", "Đà Nẵng", "Bình Dương", "Đồng Nai", "Cần Thơ", "Long An"];

function formatVND(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}tr`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toString();
}

export default function SupplierPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [quantity, setQuantity] = useState(100);
  const [province, setProvince] = useState("TP.HCM");
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    fetch("/api/decision/supplier")
      .then(r => r.json())
      .then(d => setProducts(d.products || []))
      .catch(console.error)
      .finally(() => setLoadingProducts(false));
  }, []);

  const handleCompare = async () => {
    if (!selectedProduct) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/decision/supplier?productId=${selectedProduct}&qty=${quantity}&province=${encodeURIComponent(province)}`);
      const data = await res.json();
      setComparison(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">So sánh nhà cung cấp</h1>
        <p className="text-sm text-muted-foreground mt-1">Chọn SP cần nhập → so sánh NCC theo giá, vị trí, thời gian giao, chất lượng</p>
      </div>

      {/* Inputs */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Sản phẩm</label>
              <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}>
                <option value="">— Chọn sản phẩm —</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Số lượng</label>
              <input type="number" className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 100)} min={1} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Shop tại</label>
              <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={province} onChange={e => setProvince(e.target.value)}>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <Button className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm" onClick={handleCompare} disabled={!selectedProduct || loading}>
            {loading ? "Đang so sánh..." : "So sánh NCC"}
          </Button>
        </CardContent>
      </Card>

      {loadingProducts && <p className="text-sm text-muted-foreground text-center py-4">Đang tải danh sách SP...</p>}

      {/* Results */}
      {comparison && (
        <div className="space-y-4">
          {/* Context */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground px-1">
            <span>SP: <strong className="text-foreground">{comparison.productName}</strong> ({comparison.productSku})</span>
            <span>•</span>
            <span>SL: <strong className="text-foreground">{comparison.quantity}</strong></span>
            <span>•</span>
            <span>Shop: <strong className="text-foreground">{comparison.shopProvince}</strong></span>
            <span>•</span>
            <span>Nguồn: <code className="text-[10px] bg-muted px-1 rounded">{comparison.dataSource}</code></span>
            <span>•</span>
            <span>Tin cậy: <Badge variant="outline" className={`text-[10px] ${comparison.confidence === "Cao" ? "text-emerald-600 border-emerald-500/30" : comparison.confidence === "Trung bình" ? "text-amber-600 border-amber-500/30" : "text-red-600 border-red-500/30"}`}>{comparison.confidence}</Badge></span>
          </div>

          {/* Recommendation */}
          <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-3">
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-0.5">Khuyến nghị</p>
            <p className="text-sm">{comparison.recommendation}</p>
          </div>

          {comparison.suppliers.length === 0 ? (
            <Card className="bg-card/30 border-dashed">
              <CardContent className="py-8 text-center text-muted-foreground">
                <p className="text-sm">Không tìm thấy NCC nào cho sản phẩm này.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {comparison.suppliers.map((s) => (
                <Card key={s.supplierId} className={`transition-all ${s.rank === 1 ? "ring-2 ring-emerald-500 border-emerald-500/50" : "bg-card/50"}`}>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">{s.supplierName}</CardTitle>
                      {s.rank === 1 && <Badge className="text-[10px] bg-emerald-500/15 text-emerald-600 border-emerald-500/30">Tốt nhất</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{s.province}</p>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-3">
                    {/* Key metrics */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-md bg-muted/50 p-2 text-center">
                        <p className="text-[10px] text-muted-foreground">Giá nhập</p>
                        <p className="text-sm font-bold">{formatVND(s.unitPrice)}</p>
                      </div>
                      <div className="rounded-md bg-muted/50 p-2 text-center">
                        <p className="text-[10px] text-muted-foreground">Phí ship</p>
                        <p className="text-sm font-bold">{formatVND(s.shippingCost)}</p>
                      </div>
                      <div className="rounded-md bg-violet-500/5 p-2 text-center">
                        <p className="text-[10px] text-muted-foreground">Tổng chi phí</p>
                        <p className="text-sm font-bold text-violet-600">{formatVND(s.totalCost)}</p>
                      </div>
                      <div className="rounded-md bg-muted/50 p-2 text-center">
                        <p className="text-[10px] text-muted-foreground">Giao hàng</p>
                        <p className="text-sm font-bold">{s.leadTimeDays} ngày</p>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">Rating:</span>
                      {Array.from({ length: 5 }, (_, i) => (
                        <span key={i} className={`text-xs ${i < Math.round(s.rating) ? "text-amber-400" : "text-muted-foreground/30"}`}>★</span>
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">{s.rating.toFixed(1)}</span>
                    </div>

                    {/* Score breakdown */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Điểm tổng: {s.score}/100</p>
                      {[
                        { label: "Giá (40%)", value: s.breakdown.priceScore, color: "bg-emerald-500" },
                        { label: "Chất lượng (20%)", value: s.breakdown.qualityScore, color: "bg-blue-500" },
                        { label: "Giao hàng (20%)", value: s.breakdown.deliveryScore, color: "bg-amber-500" },
                        { label: "Vị trí (20%)", value: s.breakdown.locationScore, color: "bg-violet-500" },
                      ].map((bar) => (
                        <div key={bar.label} className="flex items-center gap-2">
                          <span className="text-[9px] text-muted-foreground w-24 flex-shrink-0">{bar.label}</span>
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full ${bar.color} rounded-full transition-all`} style={{ width: `${Math.max(bar.value, 2)}%` }} />
                          </div>
                          <span className="text-[9px] text-muted-foreground w-6 text-right">{Math.round(bar.value)}</span>
                        </div>
                      ))}
                    </div>

                    {/* MOQ */}
                    <p className="text-[10px] text-muted-foreground">MOQ: {s.moq} cái</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!comparison && !loadingProducts && (
        <Card className="bg-card/30 border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground space-y-2">
            <p className="text-sm">Chọn sản phẩm và bấm "So sánh NCC" để bắt đầu.</p>
            <p className="text-xs">Chấm điểm NCC theo: giá (40%), chất lượng (20%), thời gian giao (20%), khoảng cách (20%).</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
