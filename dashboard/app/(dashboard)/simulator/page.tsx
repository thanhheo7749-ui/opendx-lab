"use client";

// ==============================================================================
// Decision Intelligence — What-if Simulator Page
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(Math.abs(n)));

interface SimResult {
  scenario: string;
  current: Record<string, number>;
  projected: Record<string, number>;
  delta: Record<string, string | number>;
  assumption: string;
  dataSource: string;
  [key: string]: unknown;
}

export default function SimulatorPage() {
  const [activeTab, setActiveTab] = useState<"price" | "ad">("price");

  // Price simulator
  const [priceChange, setPriceChange] = useState(0);
  const [priceResult, setPriceResult] = useState<SimResult | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  // Ad simulator
  const [adChannel, setAdChannel] = useState("facebook");
  const [adResult, setAdResult] = useState<SimResult | null>(null);
  const [adLoading, setAdLoading] = useState(false);

  const runPriceSim = async () => {
    setPriceLoading(true);
    try {
      const res = await fetch("/api/simulator/whatif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: "price_change", params: { changePercent: priceChange } }),
      });
      const data = await res.json();
      setPriceResult(data);
    } catch (e) { console.error(e); }
    finally { setPriceLoading(false); }
  };

  const runAdSim = async () => {
    setAdLoading(true);
    try {
      const res = await fetch("/api/simulator/whatif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: "ad_toggle", params: { channelToToggle: adChannel } }),
      });
      const data = await res.json();
      setAdResult(data);
    } catch (e) { console.error(e); }
    finally { setAdLoading(false); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Mô phỏng What-if</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Thay đổi tham số và xem tác động dự kiến trước khi ra quyết định thực tế.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === "price" ? "default" : "outline"}
          size="sm"
          className="text-xs"
          onClick={() => setActiveTab("price")}
        >
          Mô phỏng thay đổi giá
        </Button>
        <Button
          variant={activeTab === "ad" ? "default" : "outline"}
          size="sm"
          className="text-xs"
          onClick={() => setActiveTab("ad")}
        >
          Mô phỏng tắt kênh QC
        </Button>
      </div>

      {/* ── Price Simulator ── */}
      {activeTab === "price" && (
        <div className="space-y-4">
          <Card className="bg-card/50">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-semibold text-sm">Nếu tôi thay đổi giá tất cả SP...</h3>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Thay đổi giá</span>
                  <span className={`text-lg font-bold tabular-nums ${
                    priceChange < 0 ? "text-red-500" : priceChange > 0 ? "text-emerald-500" : ""
                  }`}>
                    {priceChange > 0 ? "+" : ""}{priceChange}%
                  </span>
                </div>
                <input
                  type="range"
                  min={-30}
                  max={30}
                  step={5}
                  value={priceChange}
                  onChange={(e) => setPriceChange(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>-30% (giảm mạnh)</span>
                  <span>0%</span>
                  <span>+30% (tăng mạnh)</span>
                </div>
              </div>

              <Button
                size="sm"
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={runPriceSim}
                disabled={priceLoading || priceChange === 0}
              >
                {priceLoading ? "Đang tính..." : "Chạy mô phỏng"}
              </Button>
            </CardContent>
          </Card>

          {priceResult && !priceLoading && (
            <div className="space-y-4">
              {/* Comparison cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-card/50">
                  <CardContent className="p-4">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">Hiện tại (30 ngày)</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Doanh thu</span>
                        <span className="font-medium tabular-nums">{formatVND(priceResult.current.revenue)}đ</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lợi nhuận</span>
                        <span className="font-medium tabular-nums">{formatVND(priceResult.current.profit)}đ</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Số đơn</span>
                        <span className="font-medium tabular-nums">{priceResult.current.orders}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Biên LN</span>
                        <span className="font-medium tabular-nums">{priceResult.current.marginRate}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-indigo-500/5 border-indigo-500/20">
                  <CardContent className="p-4">
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase tracking-wider font-semibold mb-2">Dự kiến ({priceChange > 0 ? "+" : ""}{priceChange}%)</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Doanh thu</span>
                        <span className="font-medium tabular-nums">{formatVND(priceResult.projected.revenue)}đ</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lợi nhuận</span>
                        <span className="font-medium tabular-nums">{formatVND(priceResult.projected.profit)}đ</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Số đơn</span>
                        <span className="font-medium tabular-nums">{priceResult.projected.orders}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Biên LN</span>
                        <span className="font-medium tabular-nums">{priceResult.projected.marginRate}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Delta summary */}
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(priceResult.delta)
                  .filter(([k]) => k.endsWith("Text"))
                  .map(([key, val]) => (
                    <Card key={key} className="bg-card/50">
                      <CardContent className="p-3 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase mb-0.5">
                          {key.replace("Text", "").replace("revenue", "Doanh thu").replace("profit", "Lợi nhuận").replace("orders", "Đơn hàng")}
                        </p>
                        <p className={`text-sm font-bold ${
                          String(val).startsWith("+") ? "text-emerald-500" : String(val).startsWith("-") ? "text-red-500" : ""
                        }`}>
                          {String(val)}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
              </div>

              {/* Assumption */}
              <div className="text-xs text-muted-foreground px-1 space-y-1">
                <p><strong>Giả định:</strong> {priceResult.assumption}</p>
                <p><strong>Nguồn:</strong> {priceResult.dataSource}</p>
                <p className="text-amber-600 dark:text-amber-400">Lưu ý: Đây là ước lượng. Kết quả thực tế phụ thuộc vào thị trường, đối thủ và hành vi khách hàng.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Ad Toggle Simulator ── */}
      {activeTab === "ad" && (
        <div className="space-y-4">
          <Card className="bg-card/50">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-semibold text-sm">Nếu tôi tắt quảng cáo kênh...</h3>

              <div className="flex gap-2 flex-wrap">
                {["facebook", "tiktok", "shopee", "google", "lazada"].map((ch) => (
                  <Button
                    key={ch}
                    variant={adChannel === ch ? "default" : "outline"}
                    size="sm"
                    className="text-xs capitalize"
                    onClick={() => setAdChannel(ch)}
                  >
                    {ch}
                  </Button>
                ))}
              </div>

              <Button
                size="sm"
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={runAdSim}
                disabled={adLoading}
              >
                {adLoading ? "Đang tính..." : `Mô phỏng tắt ${adChannel}`}
              </Button>
            </CardContent>
          </Card>

          {adResult && !adLoading && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Card className="bg-card/50">
                  <CardContent className="p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase mb-0.5">Tiết kiệm chi phí</p>
                    <p className="text-sm font-bold text-emerald-500">{String(adResult.delta.spentText)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/50">
                  <CardContent className="p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase mb-0.5">Mất doanh thu</p>
                    <p className="text-sm font-bold text-red-500">{String(adResult.delta.revenueText)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/50">
                  <CardContent className="p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase mb-0.5">Kết quả ròng</p>
                    <p className={`text-sm font-bold ${
                      String(adResult.delta.netText).includes("Tiết kiệm") ? "text-emerald-500" : "text-red-500"
                    }`}>{String(adResult.delta.netText)}</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-card/50">
                <CardContent className="p-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">Chi tiết kênh {adChannel}</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                    <span className="text-muted-foreground">Chi phí 7 ngày:</span>
                    <span className="font-medium">{formatVND(adResult.current.channelSpent)}đ</span>
                    <span className="text-muted-foreground">Doanh thu từ kênh:</span>
                    <span className="font-medium">{formatVND(adResult.current.channelRevenue)}đ</span>
                    <span className="text-muted-foreground">Đơn từ kênh:</span>
                    <span className="font-medium">{adResult.current.channelOrders} đơn</span>
                    <span className="text-muted-foreground">ROAS:</span>
                    <span className={`font-bold ${
                      adResult.current.channelROAS >= 1 ? "text-emerald-500" : "text-red-500"
                    }`}>{adResult.current.channelROAS}</span>
                  </div>
                </CardContent>
              </Card>

              <div className="text-xs text-muted-foreground px-1 space-y-1">
                <p><strong>Giả định:</strong> {adResult.assumption}</p>
                <p><strong>Nguồn:</strong> {adResult.dataSource}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
