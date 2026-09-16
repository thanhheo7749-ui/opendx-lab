"use client";

// ==============================================================================
// ShopWise — Data Sources: CSV Import + Manual Entry
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/toast";

// ── Types ──────────────────────────────────────────────────────────────────────

type ImportType = "products" | "orders" | "suppliers";
type TabType = "csv" | "manual";

interface ImportResult {
  success: boolean;
  importType: string;
  created: number;
  updated: number;
  errors: number;
  total: number;
}

interface CSVPreviewRow {
  [key: string]: string;
}

interface ValidatedRow {
  rowIndex: number;
  status: "new" | "conflict" | "invalid" | "unchanged";
  reason?: string;
  newData: Record<string, unknown>;
  existingData?: Record<string, unknown>;
  changedFields?: string[];
}

interface ValidationResult {
  validated: ValidatedRow[];
  summary: { total: number; new: number; conflict: number; invalid: number; unchanged: number };
  importType: string;
}

interface ApprovedRow {
  status: "new" | "conflict";
  newData: Record<string, unknown>;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n);
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

export default function DataSourcesPage() {
  const [activeTab, setActiveTab] = useState<TabType>("csv");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nhập dữ liệu</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Import dữ liệu từ file CSV/Excel hoặc nhập tay trực tiếp
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("csv")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === "csv"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
          Import CSV / Excel
        </button>
        <button
          onClick={() => setActiveTab("manual")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === "manual"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
          </svg>
          Nhập tay
        </button>
      </div>

      {/* Tab content */}
      {activeTab === "csv" ? <CSVImportTab /> : <ManualEntryTab />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1: CSV IMPORT
// ══════════════════════════════════════════════════════════════════════════════

function CSVImportTab() {
  const [importType, setImportType] = useState<ImportType>("orders");
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<CSVPreviewRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse CSV for preview
  const parsePreview = useCallback((text: string) => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) {
      setPreview([]);
      setHeaders([]);
      return;
    }
    const delimiter = lines[0].includes(";") ? ";" : ",";
    const hdrs = lines[0].split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ""));
    setHeaders(hdrs);

    const rows: CSVPreviewRow[] = [];
    for (let i = 1; i < Math.min(lines.length, 6); i++) {
      const values = lines[i].split(delimiter).map((v) => v.trim().replace(/^"|"$/g, ""));
      const row: CSVPreviewRow = {};
      hdrs.forEach((h, idx) => { row[h] = values[idx] || ""; });
      rows.push(row);
    }
    setPreview(rows);
  }, []);

  // Handle file read
  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvText(text);
      parsePreview(text);
      setResult(null);
    };
    reader.readAsText(file, "utf-8");
  }, [parsePreview]);

  // Handle paste
  const handlePaste = useCallback((text: string) => {
    setCsvText(text);
    parsePreview(text);
    setResult(null);
    setValidationResult(null);
  }, [parsePreview]);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
    setValidationResult(null);
  }, [handleFile]);

  // Validate CSV (Step 3 → Step 4)
  const handleValidate = useCallback(async () => {
    if (!csvText.trim()) {
      toast("error", "Chưa có dữ liệu để kiểm tra");
      return;
    }
    setValidating(true);
    try {
      const res = await fetch("/api/import/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvData: csvText, importType }),
      });
      const data = await res.json();
      if (res.ok) {
        setValidationResult(data);
        const { summary } = data;
        toast(
          summary.conflict > 0 || summary.invalid > 0 ? "info" : "success",
          `Kiểm tra xong: ${summary.new} mới, ${summary.conflict} trùng, ${summary.invalid} lỗi`
        );
      } else {
        toast("error", data.error || "Kiểm tra thất bại");
      }
    } catch {
      toast("error", "Lỗi kết nối server");
    } finally {
      setValidating(false);
    }
  }, [csvText, importType]);

  // Import approved rows only
  const handleApprovedImport = useCallback(async (approvedRows: ApprovedRow[]) => {
    setImporting(true);
    try {
      const res = await fetch("/api/import/approved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvedRows, importType }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        setValidationResult(null);
        toast("success", `Import thành công: ${data.created} mới, ${data.updated} cập nhật`);
      } else {
        toast("error", data.error || "Import thất bại");
      }
    } catch {
      toast("error", "Lỗi kết nối server");
    } finally {
      setImporting(false);
    }
  }, [importType]);

  const totalLines = csvText.trim() ? csvText.trim().split("\n").length - 1 : 0;

  const typeConfig = {
    orders: {
      label: "Đơn hàng",
      icon: "🛒",
      desc: "Tên KH, SĐT, kênh bán, tổng tiền, phí ship, ngày đặt",
      columns: "Buyer, SĐT, Channel, Total Amount, Shipping Fee, Created Time",
    },
    products: {
      label: "Sản phẩm",
      icon: "📦",
      desc: "Tên SP, SKU, danh mục, giá gốc, giá bán",
      columns: "Tên sản phẩm, SKU, Danh mục, Giá gốc, Giá bán",
    },
    suppliers: {
      label: "Nhà cung cấp",
      icon: "🏭",
      desc: "Tên NCC, tỉnh/thành, SĐT, rating, thời gian giao",
      columns: "Tên NCC, Tỉnh/Thành, SĐT, Đánh giá, Thời gian giao",
    },
  };

  return (
    <div className="space-y-4">
      {/* Step 1: Choose type */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">1</span>
            Chọn loại dữ liệu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(Object.entries(typeConfig) as [ImportType, typeof typeConfig.orders][]).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setImportType(key)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  importType === key
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 ring-1 ring-emerald-500"
                    : "border-border hover:border-emerald-300 hover:bg-accent/50"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{cfg.icon}</span>
                  <span className="font-medium text-sm">{cfg.label}</span>
                  {importType === key && (
                    <svg className="w-4 h-4 text-emerald-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">{cfg.desc}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Upload / Paste */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">2</span>
            Tải file hoặc dán dữ liệu CSV
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Drag & drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
              dragOver
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                : "border-border hover:border-emerald-300 hover:bg-accent/30"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt,.tsv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            <svg className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            <p className="text-sm font-medium text-muted-foreground">
              Kéo thả file CSV vào đây hoặc <span className="text-emerald-600 underline">chọn file</span>
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Hỗ trợ .csv, .txt — Xuất từ Shopee Seller Center, TikTok Shop, hoặc tự tạo
            </p>
          </div>

          {/* Or paste */}
          <div className="relative">
            <div className="absolute -top-2.5 left-4 bg-card px-2 text-[10px] text-muted-foreground uppercase tracking-wider">
              Hoặc dán dữ liệu trực tiếp
            </div>
            <textarea
              value={csvText}
              onChange={(e) => handlePaste(e.target.value)}
              placeholder={`Ví dụ:\n${typeConfig[importType].columns}\nÁo khoác denim,AO-001,Áo,180000,450000`}
              rows={4}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none"
            />
          </div>

          {csvText && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              <span>{totalLines} dòng dữ liệu • {headers.length} cột</span>
              <button
                onClick={() => { setCsvText(""); setPreview([]); setHeaders([]); setResult(null); }}
                className="ml-auto text-red-500 hover:text-red-600 text-xs"
              >
                Xóa
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 3: Preview */}
      {preview.length > 0 && !validationResult && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">3</span>
              Xem trước dữ liệu
              <Badge variant="secondary" className="ml-auto text-[10px]">
                {Math.min(5, totalLines)} / {totalLines} dòng
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground w-8">#</th>
                    {headers.map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-semibold text-muted-foreground whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-t border-border hover:bg-accent/30 transition-colors">
                      <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                      {headers.map((h) => (
                        <td key={h} className="px-3 py-2 text-foreground whitespace-nowrap max-w-[200px] truncate">
                          {row[h] || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Validate button */}
            <div className="flex items-center gap-3 mt-4">
              <Button
                onClick={handleValidate}
                disabled={validating}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {validating ? (
                  <>
                    <svg className="w-4 h-4 mr-2 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Đang kiểm tra...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    Kiểm tra {totalLines} dòng trước khi import
                  </>
                )}
              </Button>
              <span className="text-xs text-muted-foreground">
                Hệ thống sẽ kiểm tra trùng lặp và dữ liệu không hợp lệ
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Validation Review — Conflict / New / Invalid comparison */}
      {validationResult && (
        <ValidationReviewPanel
          result={validationResult}
          importType={importType}
          onImportApproved={handleApprovedImport}
          onCancel={() => setValidationResult(null)}
          importing={importing}
        />
      )}

      {/* Result */}
      {result && (
        <Card className={`shadow-sm border-l-4 ${result.errors > 0 ? "border-l-amber-500" : "border-l-emerald-500"}`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                result.errors > 0 ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
              }`}>
                {result.errors > 0 ? "⚠️" : "✅"}
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">
                  Import {typeConfig[importType].label} hoàn tất
                </p>
                <div className="flex gap-4 mt-1.5">
                  <span className="text-xs text-emerald-600">✓ {result.created} tạo mới</span>
                  <span className="text-xs text-blue-600">↻ {result.updated} cập nhật</span>
                  {result.errors > 0 && (
                    <span className="text-xs text-red-500">✗ {result.errors} lỗi</span>
                  )}
                  <span className="text-xs text-muted-foreground">Tổng: {result.total} dòng</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help: Column mapping guide */}
      <Card className="shadow-sm bg-muted/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
            Hướng dẫn chuẩn bị file CSV
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2">
          <p>Hệ thống tự nhận dạng cột theo nhiều format:</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-2.5 rounded-md bg-background border border-border">
              <p className="font-medium text-foreground mb-1">📦 Sản phẩm</p>
              <code className="text-[10px] block bg-muted/50 px-2 py-1 rounded">
                Tên sản phẩm, SKU, Danh mục, Giá gốc, Giá bán
              </code>
            </div>
            <div className="p-2.5 rounded-md bg-background border border-border">
              <p className="font-medium text-foreground mb-1">🛒 Đơn hàng (Shopee format)</p>
              <code className="text-[10px] block bg-muted/50 px-2 py-1 rounded">
                Buyer, SĐT, Total Amount, Shipping Fee, Created Time
              </code>
            </div>
            <div className="p-2.5 rounded-md bg-background border border-border">
              <p className="font-medium text-foreground mb-1">🏭 Nhà cung cấp</p>
              <code className="text-[10px] block bg-muted/50 px-2 py-1 rounded">
                Tên NCC, Tỉnh/Thành, SĐT, Đánh giá, Thời gian giao
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2: MANUAL ENTRY
// ══════════════════════════════════════════════════════════════════════════════

type FormType = "product" | "order" | "supplier" | "inventory" | "campaign";

function ManualEntryTab() {
  const [formType, setFormType] = useState<FormType>("product");
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState<{ id: string; name: string; sku: string; sellPrice: number }[]>([]);

  // Load products for order form
  useEffect(() => {
    fetch("/api/decision/supplier")
      .then((r) => r.json())
      .then((d) => {
        if (d.products) setProducts(d.products);
      })
      .catch(() => {});
  }, []);

  const forms: { key: FormType; label: string; icon: string }[] = [
    { key: "product", label: "Sản phẩm", icon: "📦" },
    { key: "order", label: "Đơn hàng", icon: "🛒" },
    { key: "supplier", label: "Nhà cung cấp", icon: "🏭" },
    { key: "inventory", label: "Cập nhật kho", icon: "📋" },
    { key: "campaign", label: "Campaign QC", icon: "📊" },
  ];

  const handleSubmit = useCallback(async (data: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/import/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: formType, data }),
      });
      const result = await res.json();
      if (res.ok) {
        toast("success", `Đã thêm ${forms.find((f) => f.key === formType)?.label} thành công!`);
        return true;
      } else {
        toast("error", result.error || "Thêm thất bại");
        return false;
      }
    } catch {
      toast("error", "Lỗi kết nối server");
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [formType, forms]);

  return (
    <div className="space-y-4">
      {/* Form type selector */}
      <div className="flex gap-2 flex-wrap">
        {forms.map((f) => (
          <button
            key={f.key}
            onClick={() => setFormType(f.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              formType === f.key
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <span>{f.icon}</span>
            {f.label}
          </button>
        ))}
      </div>

      {/* Form content */}
      {formType === "product" && <ProductForm onSubmit={handleSubmit} submitting={submitting} />}
      {formType === "order" && <OrderForm onSubmit={handleSubmit} submitting={submitting} products={products} />}
      {formType === "supplier" && <SupplierForm onSubmit={handleSubmit} submitting={submitting} />}
      {formType === "inventory" && <InventoryForm onSubmit={handleSubmit} submitting={submitting} products={products} />}
      {formType === "campaign" && <CampaignForm onSubmit={handleSubmit} submitting={submitting} />}
    </div>
  );
}

// ── Form Components ───────────────────────────────────────────────────────────

interface FormProps {
  onSubmit: (data: Record<string, unknown>) => Promise<boolean>;
  submitting: boolean;
  products?: { id: string; name: string; sku: string; sellPrice: number }[];
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-foreground mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500";
const selectClass = inputClass;

function ProductForm({ onSubmit, submitting }: FormProps) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("Áo");
  const [costPrice, setCostPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");

  const margin = costPrice && sellPrice ? (((parseFloat(sellPrice) - parseFloat(costPrice)) / parseFloat(sellPrice)) * 100).toFixed(1) : null;

  const handleSubmit = async () => {
    const ok = await onSubmit({ name, sku, category, costPrice: parseFloat(costPrice) || 0, sellPrice: parseFloat(sellPrice) || 0 });
    if (ok) { setName(""); setSku(""); setCostPrice(""); setSellPrice(""); }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">📦 Thêm sản phẩm mới</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField label="Tên sản phẩm" required>
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Áo khoác denim nữ" />
          </FormField>
          <FormField label="SKU" required>
            <input className={inputClass} value={sku} onChange={(e) => setSku(e.target.value)} placeholder="AO-001" />
          </FormField>
          <FormField label="Danh mục">
            <select className={selectClass} value={category} onChange={(e) => setCategory(e.target.value)}>
              {["Áo", "Quần", "Váy", "Đầm", "Túi", "Giày", "Phụ kiện", "Set đồ", "Khác"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </FormField>
          <div /> {/* spacer */}
          <FormField label="Giá gốc (VNĐ)">
            <input className={inputClass} type="number" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} placeholder="180000" />
          </FormField>
          <FormField label="Giá bán (VNĐ)">
            <input className={inputClass} type="number" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} placeholder="450000" />
          </FormField>
        </div>
        {margin && parseFloat(margin) > 0 && (
          <p className="text-xs text-emerald-600">Biên lợi nhuận: {margin}% • Lãi {formatVND(parseFloat(sellPrice) - parseFloat(costPrice))}đ/SP</p>
        )}
        <Button onClick={handleSubmit} disabled={submitting || !name || !sku} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          {submitting ? "Đang lưu..." : "Thêm sản phẩm"}
        </Button>
      </CardContent>
    </Card>
  );
}

function OrderForm({ onSubmit, submitting, products }: FormProps) {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [channel, setChannel] = useState("facebook");
  const [totalAmount, setTotalAmount] = useState("");
  const [shippingFee, setShippingFee] = useState("0");
  const [discount, setDiscount] = useState("0");

  const handleSubmit = async () => {
    const ok = await onSubmit({
      customerName, phone: phone || undefined, channel,
      totalAmount: parseFloat(totalAmount) || 0,
      shippingFee: parseFloat(shippingFee) || 0,
      discount: parseFloat(discount) || 0,
    });
    if (ok) { setCustomerName(""); setPhone(""); setTotalAmount(""); setShippingFee("0"); setDiscount("0"); }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">🛒 Thêm đơn hàng mới</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField label="Tên khách hàng" required>
            <input className={inputClass} value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nguyễn Thị Mai" />
          </FormField>
          <FormField label="Số điện thoại">
            <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0901234567" />
          </FormField>
          <FormField label="Kênh bán">
            <select className={selectClass} value={channel} onChange={(e) => setChannel(e.target.value)}>
              {[
                { v: "facebook", l: "Facebook" }, { v: "tiktok", l: "TikTok" },
                { v: "shopee", l: "Shopee" }, { v: "lazada", l: "Lazada" },
                { v: "zalo", l: "Zalo" }, { v: "offline", l: "Tại cửa hàng" },
              ].map((c) => <option key={c.v} value={c.v}>{c.l}</option>)}
            </select>
          </FormField>
          <FormField label="Tổng tiền (VNĐ)" required>
            <input className={inputClass} type="number" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} placeholder="450000" />
          </FormField>
          <FormField label="Phí ship (VNĐ)">
            <input className={inputClass} type="number" value={shippingFee} onChange={(e) => setShippingFee(e.target.value)} />
          </FormField>
          <FormField label="Giảm giá (VNĐ)">
            <input className={inputClass} type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} />
          </FormField>
        </div>
        {totalAmount && (
          <p className="text-xs text-muted-foreground">
            Thực thu: {formatVND(parseFloat(totalAmount) - parseFloat(discount || "0"))}đ
          </p>
        )}
        <Button onClick={handleSubmit} disabled={submitting || !customerName || !totalAmount} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          {submitting ? "Đang lưu..." : "Thêm đơn hàng"}
        </Button>
      </CardContent>
    </Card>
  );
}

function SupplierForm({ onSubmit, submitting }: FormProps) {
  const [name, setName] = useState("");
  const [province, setProvince] = useState("TP.HCM");
  const [district, setDistrict] = useState("");
  const [phone, setPhone] = useState("");
  const [rating, setRating] = useState("4.0");
  const [leadTimeDays, setLeadTimeDays] = useState("3");
  const [minOrder, setMinOrder] = useState("500000");

  const handleSubmit = async () => {
    const ok = await onSubmit({
      name, province, district: district || undefined, phone: phone || undefined,
      rating: parseFloat(rating), leadTimeDays: parseInt(leadTimeDays), minOrder: parseFloat(minOrder),
    });
    if (ok) { setName(""); setDistrict(""); setPhone(""); }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">🏭 Thêm nhà cung cấp mới</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField label="Tên nhà cung cấp" required>
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Xưởng Tân Bình" />
          </FormField>
          <FormField label="Tỉnh/Thành phố" required>
            <select className={selectClass} value={province} onChange={(e) => setProvince(e.target.value)}>
              {["TP.HCM", "Hà Nội", "Đà Nẵng", "Bình Dương", "Đồng Nai", "Cần Thơ", "Hải Phòng", "Long An", "Khác"].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Quận/Huyện">
            <input className={inputClass} value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Tân Bình" />
          </FormField>
          <FormField label="Số điện thoại">
            <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0901234567" />
          </FormField>
          <FormField label="Rating (1-5)">
            <input className={inputClass} type="number" min="1" max="5" step="0.1" value={rating} onChange={(e) => setRating(e.target.value)} />
          </FormField>
          <FormField label="Thời gian giao (ngày)">
            <input className={inputClass} type="number" min="1" value={leadTimeDays} onChange={(e) => setLeadTimeDays(e.target.value)} />
          </FormField>
          <FormField label="Đơn tối thiểu (VNĐ)">
            <input className={inputClass} type="number" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} />
          </FormField>
        </div>
        <Button onClick={handleSubmit} disabled={submitting || !name} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          {submitting ? "Đang lưu..." : "Thêm NCC"}
        </Button>
      </CardContent>
    </Card>
  );
}

function InventoryForm({ onSubmit, submitting, products }: FormProps) {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");

  const handleSubmit = async () => {
    const ok = await onSubmit({ productId, quantity: parseInt(quantity) });
    if (ok) { setQuantity(""); }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">📋 Cập nhật tồn kho</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField label="Sản phẩm" required>
            <select className={selectClass} value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">— Chọn sản phẩm —</option>
              {(products || []).map((p) => (
                <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Số lượng mới" required>
            <input className={inputClass} type="number" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="100" />
          </FormField>
        </div>
        <Button onClick={handleSubmit} disabled={submitting || !productId || !quantity} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          {submitting ? "Đang lưu..." : "Cập nhật kho"}
        </Button>
      </CardContent>
    </Card>
  );
}

function CampaignForm({ onSubmit, submitting }: FormProps) {
  const [name, setName] = useState("");
  const [channel, setChannel] = useState("facebook");
  const [dailyBudget, setDailyBudget] = useState("");

  const handleSubmit = async () => {
    const ok = await onSubmit({ name, channel, dailyBudget: parseFloat(dailyBudget) || 0 });
    if (ok) { setName(""); setDailyBudget(""); }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">📊 Thêm Campaign quảng cáo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField label="Tên campaign" required>
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="FB - Flash Sale cuối tuần" />
          </FormField>
          <FormField label="Kênh quảng cáo">
            <select className={selectClass} value={channel} onChange={(e) => setChannel(e.target.value)}>
              {[
                { v: "facebook", l: "Facebook Ads" }, { v: "tiktok", l: "TikTok Ads" },
                { v: "google", l: "Google Ads" }, { v: "shopee", l: "Shopee Ads" },
              ].map((c) => <option key={c.v} value={c.v}>{c.l}</option>)}
            </select>
          </FormField>
          <FormField label="Budget/ngày (VNĐ)" required>
            <input className={inputClass} type="number" value={dailyBudget} onChange={(e) => setDailyBudget(e.target.value)} placeholder="500000" />
          </FormField>
        </div>
        {dailyBudget && (
          <p className="text-xs text-muted-foreground">
            Ước tính chi phí/tháng: {formatVND(parseFloat(dailyBudget) * 30)}đ
          </p>
        )}
        <Button onClick={handleSubmit} disabled={submitting || !name || !dailyBudget} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          {submitting ? "Đang lưu..." : "Thêm campaign"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// VALIDATION REVIEW PANEL — Shows conflicts, new, invalid rows for approval
// ══════════════════════════════════════════════════════════════════════════════

const statusLabels: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  new: { label: "Mới", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", icon: "✅" },
  conflict: { label: "Trùng — có thay đổi", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20", icon: "⚠️" },
  invalid: { label: "Không hợp lệ", color: "text-red-700 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20", icon: "❌" },
  unchanged: { label: "Trùng — không đổi", color: "text-gray-500", bg: "bg-gray-50 dark:bg-gray-800/30", icon: "➖" },
};

const fieldLabels: Record<string, string> = {
  name: "Tên", sku: "SKU", category: "Danh mục", costPrice: "Giá gốc", sellPrice: "Giá bán",
  province: "Tỉnh/Thành", phone: "SĐT", rating: "Đánh giá", leadTimeDays: "Thời gian giao",
  customerName: "Khách hàng", channel: "Kênh", totalAmount: "Tổng tiền",
};

function ValidationReviewPanel({
  result,
  importType,
  onImportApproved,
  onCancel,
  importing,
}: {
  result: ValidationResult;
  importType: ImportType;
  onImportApproved: (rows: ApprovedRow[]) => Promise<void>;
  onCancel: () => void;
  importing: boolean;
}) {
  const { validated, summary } = result;
  const [approvedIndices, setApprovedIndices] = useState<Set<number>>(() => {
    // Auto-approve all "new" items, and conflicts
    const initial = new Set<number>();
    validated.forEach((row, i) => {
      if (row.status === "new" || row.status === "conflict") initial.add(i);
    });
    return initial;
  });
  const [filter, setFilter] = useState<string>("all");

  const toggleRow = (i: number) => {
    setApprovedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const toggleAll = (status: string) => {
    setApprovedIndices((prev) => {
      const next = new Set(prev);
      const rowsOfStatus = validated
        .map((r, i) => ({ r, i }))
        .filter(({ r }) => r.status === status);
      const allChecked = rowsOfStatus.every(({ i }) => next.has(i));
      if (allChecked) {
        rowsOfStatus.forEach(({ i }) => next.delete(i));
      } else {
        rowsOfStatus.forEach(({ i }) => next.add(i));
      }
      return next;
    });
  };

  const importableRows = validated.filter((r) => r.status === "new" || r.status === "conflict");
  const approvedCount = importableRows.filter((_, i) => {
    const actualIndex = validated.indexOf(importableRows[i]);
    return approvedIndices.has(actualIndex);
  }).length;

  const filteredRows = filter === "all"
    ? validated
    : validated.filter((r) => r.status === filter);

  const handleImport = () => {
    const rows: ApprovedRow[] = [];
    validated.forEach((row, i) => {
      if (approvedIndices.has(i) && (row.status === "new" || row.status === "conflict")) {
        rows.push({ status: row.status, newData: row.newData });
      }
    });
    if (rows.length === 0) {
      return;
    }
    onImportApproved(rows);
  };

  // Determine which fields to show based on import type
  const displayFields: string[] = importType === "products"
    ? ["sku", "name", "category", "costPrice", "sellPrice"]
    : importType === "suppliers"
    ? ["name", "province", "phone", "rating", "leadTimeDays"]
    : ["customerName", "phone", "channel", "totalAmount", "status"];

  return (
    <Card className="shadow-sm border-t-2 border-t-blue-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">4</span>
          Xem xét & phê duyệt dữ liệu
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Kiểm tra từng dòng, bỏ chọn các dòng không muốn import
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary badges */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === "all" ? "bg-foreground text-background" : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            Tất cả ({summary.total})
          </button>
          {summary.new > 0 && (
            <button
              onClick={() => setFilter("new")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === "new" ? "bg-emerald-600 text-white" : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100"
              }`}
            >
              ✅ Mới ({summary.new})
            </button>
          )}
          {summary.conflict > 0 && (
            <button
              onClick={() => setFilter("conflict")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === "conflict" ? "bg-amber-600 text-white" : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100"
              }`}
            >
              ⚠️ Trùng ({summary.conflict})
            </button>
          )}
          {summary.invalid > 0 && (
            <button
              onClick={() => setFilter("invalid")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === "invalid" ? "bg-red-600 text-white" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100"
              }`}
            >
              ❌ Lỗi ({summary.invalid})
            </button>
          )}
          {summary.unchanged > 0 && (
            <button
              onClick={() => setFilter("unchanged")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === "unchanged" ? "bg-gray-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200"
              }`}
            >
              ➖ Không đổi ({summary.unchanged})
            </button>
          )}
        </div>

        {/* Comparison table */}
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-2 py-2 w-8">
                  {(filter === "new" || filter === "conflict") && (
                    <input
                      type="checkbox"
                      checked={filteredRows.every((_, i) => {
                        const actualIdx = validated.indexOf(filteredRows[i]);
                        return approvedIndices.has(actualIdx);
                      })}
                      onChange={() => toggleAll(filter)}
                      className="w-3.5 h-3.5 rounded border-border accent-emerald-600"
                    />
                  )}
                </th>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground w-8">#</th>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground w-28">Trạng thái</th>
                {displayFields.map((f) => (
                  <th key={f} className="px-3 py-2 text-left font-semibold text-muted-foreground whitespace-nowrap">
                    {fieldLabels[f] || f}
                  </th>
                ))}
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const actualIdx = validated.indexOf(row);
                const sl = statusLabels[row.status];
                const isApproved = approvedIndices.has(actualIdx);
                const canApprove = row.status === "new" || row.status === "conflict";

                return (
                  <tr
                    key={actualIdx}
                    className={`border-t border-border transition-colors ${sl.bg} ${
                      canApprove && !isApproved ? "opacity-50" : ""
                    }`}
                  >
                    <td className="px-2 py-2 text-center">
                      {canApprove && (
                        <input
                          type="checkbox"
                          checked={isApproved}
                          onChange={() => toggleRow(actualIdx)}
                          className="w-3.5 h-3.5 rounded border-border accent-emerald-600"
                        />
                      )}
                    </td>
                    <td className="px-2 py-2 text-muted-foreground font-mono">{row.rowIndex + 1}</td>
                    <td className="px-2 py-2">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${sl.color}`}>
                        {sl.icon} {sl.label}
                      </span>
                    </td>
                    {displayFields.map((field) => {
                      const newVal = row.newData[field];
                      const oldVal = row.existingData?.[field];
                      const isChanged = row.changedFields?.includes(field);
                      const displayVal = typeof newVal === "number"
                        ? (field.includes("Price") || field.includes("Amount") || field.includes("Order"))
                          ? formatVND(newVal) : String(newVal)
                        : String(newVal ?? "—");

                      return (
                        <td key={field} className="px-3 py-2">
                          {isChanged ? (
                            <div className="space-y-0.5">
                              <span className="line-through text-red-400 text-[10px] block">
                                {typeof oldVal === "number"
                                  ? (field.includes("Price") ? formatVND(oldVal) : String(oldVal))
                                  : String(oldVal ?? "")}
                              </span>
                              <span className="text-emerald-600 font-medium">{displayVal}</span>
                            </div>
                          ) : (
                            <span className="text-foreground">{displayVal}</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-muted-foreground text-[10px] max-w-[200px] truncate">
                      {row.reason || (row.changedFields?.length
                        ? `Thay đổi: ${row.changedFields.map((f) => fieldLabels[f] || f).join(", ")}`
                        : "")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            onClick={handleImport}
            disabled={importing || approvedCount === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {importing ? (
              <>
                <svg className="w-4 h-4 mr-2 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Đang import...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
                Import {approvedCount} dòng đã chọn
              </>
            )}
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={importing}>
            Quay lại
          </Button>
          <span className="text-xs text-muted-foreground ml-auto">
            {approvedCount}/{importableRows.length} dòng được chọn
            {summary.invalid > 0 && ` • ${summary.invalid} dòng lỗi sẽ bị bỏ qua`}
            {summary.unchanged > 0 && ` • ${summary.unchanged} dòng không thay đổi`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

