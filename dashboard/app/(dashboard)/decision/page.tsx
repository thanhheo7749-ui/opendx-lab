"use client";

// ==============================================================================
// ShopWise — Decision Advisor Page
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface DecisionOption {
  id: string;
  label: string;
  description: string;
  pros: string[];
  cons: string[];
  estimatedImpact: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  recommended: boolean;
}

interface DecisionResult {
  type: string;
  title: string;
  context: string;
  dataSource: string;
  confidence: string;
  options: DecisionOption[];
  rawMetrics: Record<string, unknown>;
}

const DECISION_TYPES = [
  { key: "inventory", label: "Nhập hàng", question: "Nên nhập thêm hàng gì?", description: "Phân tích tồn kho, tốc độ bán, sản phẩm sắp hết", simLink: "/simulator" },
  { key: "pricing", label: "Điều chỉnh giá", question: "Nên điều chỉnh giá SP nào?", description: "So sánh giá bạn với thị trường (Google Shopping)", simLink: "/simulator?scenario=price_change" },
  { key: "adspend", label: "Quảng cáo", question: "Nên điều chỉnh QC kênh nào?", description: "Phân tích ROAS, chi phí, hiệu quả từng campaign", simLink: "/simulator?scenario=channel_off" },
];

const riskColor = (l: string) => l === "LOW" ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" : l === "MEDIUM" ? "text-amber-600 bg-amber-500/10 border-amber-500/20" : "text-red-600 bg-red-500/10 border-red-500/20";
const riskLabel = (l: string) => l === "LOW" ? "Rủi ro thấp" : l === "MEDIUM" ? "Rủi ro vừa" : "Rủi ro cao";

export default function DecisionPage() {
  const searchParams = useSearchParams();
  const urlType = searchParams.get("type");
  const [selectedType, setSelectedType] = useState<string | null>(urlType);
  const [result, setResult] = useState<DecisionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showRawData, setShowRawData] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [reason, setReason] = useState("");
  const [showReasonInput, setShowReasonInput] = useState(false);

  useEffect(() => { if (urlType && DECISION_TYPES.some(d => d.key === urlType)) setSelectedType(urlType); }, [urlType]);

  useEffect(() => {
    if (!selectedType) { setResult(null); setSelectedOption(null); setRecorded(false); return; }
    setLoading(true); setSelectedOption(null); setRecorded(false);
    fetch(`/api/decision?type=${selectedType}`).then(r => r.json()).then(setResult).catch(console.error).finally(() => setLoading(false));
  }, [selectedType]);

  const handleRecord = async () => {
    if (!result || !selectedOption) return;
    const opt = result.options.find(o => o.id === selectedOption);
    if (!opt) return;
    setRecording(true);
    try {
      await fetch("/api/decision/log", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: result.type, title: result.title, chosenOption: opt.label, reason: reason || null, predictedImpact: opt.estimatedImpact }) });
      setRecorded(true); setShowReasonInput(false);
    } catch (e) { console.error(e); } finally { setRecording(false); }
  };

  const currentDT = DECISION_TYPES.find(d => d.key === selectedType);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tư vấn quyết định</h1>
          <p className="text-sm text-muted-foreground mt-1">Chọn loại quyết định — hệ thống phân tích dữ liệu và đề xuất phương án.</p>
        </div>
        <Link href="/bizscan">
          <Button variant="outline" size="sm" className="text-xs">Quét vấn đề</Button>
        </Link>
      </div>

      {/* Type selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {DECISION_TYPES.map(dt => (
          <Card key={dt.key} className={`cursor-pointer transition-all hover:shadow-md ${selectedType === dt.key ? "ring-2 ring-emerald-500 border-emerald-500/50 bg-emerald-500/5" : "bg-card/50 hover:bg-card/80"}`} onClick={() => setSelectedType(selectedType === dt.key ? null : dt.key)}>
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm">{dt.question}</h3>
              <p className="text-xs text-muted-foreground mt-1">{dt.description}</p>
              <Badge variant="outline" className="mt-2 text-[10px]">{dt.label}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading && (
        <Card className="bg-card/50"><CardContent className="py-12 text-center">
          <div className="inline-block w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-muted-foreground">Đang phân tích dữ liệu...</p>
        </CardContent></Card>
      )}

      {result && !loading && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground px-1">
            <span>Nguồn: <strong className="text-foreground">{result.dataSource}</strong></span>
            <span>•</span>
            <span>Độ tin cậy: <Badge variant="outline" className={`text-[10px] ${result.confidence === "Cao" ? "text-emerald-600 border-emerald-500/30" : result.confidence === "Trung bình" ? "text-amber-600 border-amber-500/30" : "text-red-600 border-red-500/30"}`}>{result.confidence}</Badge></span>
            <span>•</span>
            <span>{result.context}</span>
          </div>

          <h2 className="text-lg font-semibold">{result.title}</h2>

          <div className="grid grid-cols-1 gap-4">
            {result.options.map(opt => (
              <Card key={opt.id} className={`transition-all cursor-pointer ${selectedOption === opt.id ? "ring-2 ring-emerald-500 border-emerald-500/50" : opt.recommended ? "border-emerald-500/30 bg-emerald-500/3 hover:bg-emerald-500/5" : "bg-card/50 hover:bg-card/80"}`} onClick={() => setSelectedOption(opt.id)}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {opt.recommended && <Badge className="text-[10px] bg-emerald-500/15 text-emerald-600 border-emerald-500/30">Khuyến nghị</Badge>}
                        <Badge variant="outline" className={`text-[10px] ${riskColor(opt.riskLevel)}`}>{riskLabel(opt.riskLevel)}</Badge>
                      </div>
                      <h3 className="font-semibold text-sm">{opt.label}</h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{opt.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-md bg-emerald-500/5 p-2.5 border border-emerald-500/15">
                      <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mb-1">Lợi ích</p>
                      <ul className="space-y-0.5">{opt.pros.map((p, i) => <li key={i} className="text-xs flex gap-1.5"><span className="text-emerald-500">+</span><span>{p}</span></li>)}</ul>
                    </div>
                    {opt.cons.length > 0 && (
                      <div className="rounded-md bg-red-500/5 p-2.5 border border-red-500/15">
                        <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wider mb-1">Rủi ro / Đánh đổi</p>
                        <ul className="space-y-0.5">{opt.cons.map((c, i) => <li key={i} className="text-xs flex gap-1.5"><span className="text-red-500">−</span><span>{c}</span></li>)}</ul>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-md bg-violet-500/5 border border-violet-500/15">
                    <span className="text-[10px] font-semibold text-violet-600 uppercase">Tác động ước tính:</span>
                    <span className="text-violet-700 font-medium">{opt.estimatedImpact}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Action bar */}
          {selectedOption && !recorded && (
            <Card className="bg-emerald-500/5 border-emerald-500/20">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Bạn chọn: <strong>{result.options.find(o => o.id === selectedOption)?.label}</strong></p>
                    <p className="text-xs text-muted-foreground mt-0.5">Quyết định cuối cùng luôn thuộc về bạn.</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {currentDT && <Link href={currentDT.simLink}><Button variant="outline" size="sm" className="text-xs">Mô phỏng trước</Button></Link>}
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs" onClick={() => setShowReasonInput(true)}>Xác nhận</Button>
                  </div>
                </div>
                {showReasonInput && (
                  <div className="mt-4 p-3 rounded-lg bg-background border">
                    <p className="text-xs font-medium mb-2">Ghi chú lý do (tùy chọn):</p>
                    <textarea className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none h-16 focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="VD: Vì mùa đông sắp tới..." value={reason} onChange={e => setReason(e.target.value)} />
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs" onClick={handleRecord} disabled={recording}>{recording ? "Đang lưu..." : "Lưu quyết định"}</Button>
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowReasonInput(false)}>Hủy</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {recorded && (
            <Card className="bg-emerald-500/10 border-emerald-500/30">
              <CardContent className="p-4 text-center space-y-2">
                <p className="text-sm font-medium">Đã ghi nhận quyết định</p>
                <p className="text-xs text-muted-foreground">Hệ thống sẽ theo dõi kết quả sau 7 ngày.</p>
                <div className="flex gap-2 justify-center pt-2">
                  <Link href="/journal"><Button variant="outline" size="sm" className="text-xs">Xem nhật ký QĐ</Button></Link>
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setSelectedType(null); setRecorded(false); }}>Tư vấn tiếp</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="pt-2 border-t border-border/30">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setShowRawData(!showRawData)}>
              {showRawData ? "Ẩn dữ liệu gốc" : "Xem dữ liệu gốc"}
            </Button>
            {showRawData && <pre className="mt-2 p-3 rounded-md bg-muted/50 text-[11px] overflow-auto max-h-60">{JSON.stringify(result.rawMetrics, null, 2)}</pre>}
          </div>
        </div>
      )}

      {!selectedType && !loading && (
        <Card className="bg-card/30 border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground space-y-3">
            <p className="text-sm">Chọn một loại quyết định ở trên để bắt đầu.</p>
            <p className="text-xs">Hệ thống sẽ phân tích dữ liệu bán hàng và đề xuất phương án tối ưu.</p>
            <Link href="/bizscan"><Button variant="outline" size="sm" className="text-xs">Hoặc quét vấn đề trước</Button></Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
