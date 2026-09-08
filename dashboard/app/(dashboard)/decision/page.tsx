"use client";

// ==============================================================================
// Decision Intelligence — Decision Advisor Page
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  {
    key: "inventory",
    label: "Nhập hàng",
    question: "Nên nhập thêm hàng gì?",
    description: "Phân tích tồn kho, tốc độ bán, sản phẩm sắp hết",
  },
  {
    key: "pricing",
    label: "Điều chỉnh giá",
    question: "Nên điều chỉnh giá SP nào?",
    description: "So sánh giá bạn với thị trường (Google Shopping)",
  },
  {
    key: "adspend",
    label: "Quảng cáo",
    question: "Nên điều chỉnh QC kênh nào?",
    description: "Phân tích ROAS, chi phí, hiệu quả từng campaign",
  },
];

const riskColor = (level: string) => {
  switch (level) {
    case "LOW": return "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    case "MEDIUM": return "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20";
    case "HIGH": return "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20";
    default: return "";
  }
};

const riskLabel = (level: string) => {
  switch (level) {
    case "LOW": return "Rủi ro thấp";
    case "MEDIUM": return "Rủi ro vừa";
    case "HIGH": return "Rủi ro cao";
    default: return level;
  }
};

export default function DecisionPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [result, setResult] = useState<DecisionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showRawData, setShowRawData] = useState(false);

  useEffect(() => {
    if (!selectedType) {
      setResult(null);
      setSelectedOption(null);
      return;
    }

    setLoading(true);
    setSelectedOption(null);
    fetch(`/api/decision?type=${selectedType}`)
      .then((r) => r.json())
      .then((data) => setResult(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedType]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Tư vấn quyết định</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Chọn loại quyết định — hệ thống sẽ phân tích dữ liệu và đề xuất các phương án so sánh.
        </p>
      </div>

      {/* Step 1: Choose decision type */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {DECISION_TYPES.map((dt) => (
          <Card
            key={dt.key}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedType === dt.key
                ? "ring-2 ring-indigo-500 border-indigo-500/50 bg-indigo-500/5"
                : "bg-card/50 hover:bg-card/80"
            }`}
            onClick={() => setSelectedType(selectedType === dt.key ? null : dt.key)}
          >
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm">{dt.question}</h3>
              <p className="text-xs text-muted-foreground mt-1">{dt.description}</p>
              <Badge variant="outline" className="mt-2 text-[10px]">{dt.label}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <Card className="bg-card/50">
          <CardContent className="py-12 text-center">
            <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm text-muted-foreground">Đang phân tích dữ liệu...</p>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Show analysis context */}
      {result && !loading && (
        <div className="space-y-4">
          {/* Context bar */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground px-1">
            <span>Nguồn: <strong className="text-foreground">{result.dataSource}</strong></span>
            <span>•</span>
            <span>Độ tin cậy: <Badge variant="outline" className={`text-[10px] ${
              result.confidence === "Cao" ? "text-emerald-600 border-emerald-500/30" :
              result.confidence === "Trung bình" ? "text-amber-600 border-amber-500/30" :
              "text-red-600 border-red-500/30"
            }`}>{result.confidence}</Badge></span>
            <span>•</span>
            <span>{result.context}</span>
          </div>

          {/* Step 3: Show options */}
          <h2 className="text-lg font-semibold">{result.title}</h2>

          <div className="grid grid-cols-1 gap-4">
            {result.options.map((opt) => (
              <Card
                key={opt.id}
                className={`transition-all cursor-pointer ${
                  selectedOption === opt.id
                    ? "ring-2 ring-indigo-500 border-indigo-500/50"
                    : opt.recommended
                    ? "border-emerald-500/30 bg-emerald-500/3 hover:bg-emerald-500/5"
                    : "bg-card/50 hover:bg-card/80"
                }`}
                onClick={() => setSelectedOption(opt.id)}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Option header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {opt.recommended && (
                          <Badge className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                            Khuyến nghị
                          </Badge>
                        )}
                        <Badge variant="outline" className={`text-[10px] ${riskColor(opt.riskLevel)}`}>
                          {riskLabel(opt.riskLevel)}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-sm">{opt.label}</h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{opt.description}</p>
                    </div>
                  </div>

                  {/* Pros & Cons */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-md bg-emerald-500/5 p-2.5 border border-emerald-500/15">
                      <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Lợi ích</p>
                      <ul className="space-y-0.5">
                        {opt.pros.map((p, i) => (
                          <li key={i} className="text-xs leading-relaxed flex gap-1.5">
                            <span className="text-emerald-500 flex-shrink-0">+</span>
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {opt.cons.length > 0 && (
                      <div className="rounded-md bg-red-500/5 p-2.5 border border-red-500/15">
                        <p className="text-[10px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">Rủi ro / Đánh đổi</p>
                        <ul className="space-y-0.5">
                          {opt.cons.map((c, i) => (
                            <li key={i} className="text-xs leading-relaxed flex gap-1.5">
                              <span className="text-red-500 flex-shrink-0">−</span>
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Impact */}
                  <div className="flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-md bg-violet-500/5 border border-violet-500/15">
                    <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 uppercase">Tác động ước tính:</span>
                    <span className="text-violet-700 dark:text-violet-300 font-medium">{opt.estimatedImpact}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Selected action */}
          {selectedOption && (
            <Card className="bg-indigo-500/5 border-indigo-500/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    Bạn chọn: <strong>{result.options.find(o => o.id === selectedOption)?.label}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Quyết định cuối cùng luôn thuộc về bạn. Hệ thống chỉ gợi ý dựa trên dữ liệu.
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                  onClick={() => {
                    alert("Đã lưu quyết định! Trong phiên bản thực tế, hệ thống sẽ tạo kế hoạch hành động chi tiết.");
                  }}
                >
                  Xác nhận quyết định
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Raw data toggle */}
          <div className="pt-2 border-t border-border/30">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => setShowRawData(!showRawData)}
            >
              {showRawData ? "Ẩn dữ liệu gốc" : "Xem dữ liệu gốc"}
            </Button>
            {showRawData && (
              <pre className="mt-2 p-3 rounded-md bg-muted/50 text-[11px] overflow-auto max-h-60">
                {JSON.stringify(result.rawMetrics, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!selectedType && !loading && (
        <Card className="bg-card/30 border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="text-sm">Chọn một loại quyết định ở trên để bắt đầu.</p>
            <p className="text-xs mt-1">Hệ thống sẽ phân tích dữ liệu bán hàng và đề xuất phương án tối ưu.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
