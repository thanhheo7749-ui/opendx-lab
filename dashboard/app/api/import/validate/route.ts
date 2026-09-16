// ==============================================================================
// ShopWise — CSV Validation API (Pre-import review)
// Returns conflicts, new items, and invalid rows for user approval
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

interface CSVRow {
  [key: string]: string;
}

function parseCSV(text: string): CSVRow[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const delimiter = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map((v) => v.trim().replace(/^"|"$/g, ""));
    if (values.length < 2) continue;
    const row: CSVRow = {};
    headers.forEach((h, idx) => { row[h] = values[idx] || ""; });
    rows.push(row);
  }
  return rows;
}

function findColumn(row: CSVRow, candidates: string[]): string | undefined {
  for (const c of candidates) {
    const key = Object.keys(row).find(
      (k) => k.toLowerCase().replace(/[_\s-]/g, "") === c.toLowerCase().replace(/[_\s-]/g, "")
    );
    if (key && row[key]) return row[key];
  }
  return undefined;
}

function parseNumber(val: string | undefined): number {
  if (!val) return 0;
  return parseFloat(val.replace(/[^0-9.-]/g, "")) || 0;
}

// ── Validation result types ───────────────────────────────────────────────────

export interface ValidatedRow {
  rowIndex: number;
  status: "new" | "conflict" | "invalid" | "unchanged";
  reason?: string;
  newData: Record<string, unknown>;
  existingData?: Record<string, unknown>;
  changedFields?: string[];
}

// ── Validators ────────────────────────────────────────────────────────────────

async function validateProducts(rows: CSVRow[]): Promise<ValidatedRow[]> {
  const results: ValidatedRow[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = findColumn(row, ["name", "tenSanPham", "ten_san_pham", "productName", "Tên sản phẩm", "product_name"]);
    const sku = findColumn(row, ["sku", "maSP", "ma_sp", "SKU", "Mã SP", "product_sku", "seller_sku", "Seller SKU"]);
    const category = findColumn(row, ["category", "danhMuc", "danh_muc", "Danh mục", "loai"]) || "Khác";
    const costPrice = parseNumber(findColumn(row, ["costPrice", "giaGoc", "gia_goc", "Giá gốc", "cost_price", "cost"]));
    const sellPrice = parseNumber(findColumn(row, ["sellPrice", "giaBan", "gia_ban", "Giá bán", "sell_price", "price", "Giá", "SKU Unit Original Price"]));

    const newData = { name, sku, category, costPrice, sellPrice };

    // Invalid check
    if (!name || !sku) {
      results.push({ rowIndex: i, status: "invalid", reason: !name ? "Thiếu tên SP" : "Thiếu SKU", newData });
      continue;
    }
    if (sellPrice > 0 && costPrice > sellPrice) {
      results.push({ rowIndex: i, status: "invalid", reason: "Giá gốc cao hơn giá bán", newData });
      continue;
    }

    // Check existing
    const existing = await prisma.sbProduct.findUnique({ where: { sku } });
    if (existing) {
      const changedFields: string[] = [];
      if (existing.name !== name) changedFields.push("name");
      if (existing.category !== category) changedFields.push("category");
      if (costPrice > 0 && existing.costPrice !== costPrice) changedFields.push("costPrice");
      if (sellPrice > 0 && existing.sellPrice !== sellPrice) changedFields.push("sellPrice");

      if (changedFields.length === 0) {
        results.push({ rowIndex: i, status: "unchanged", newData, existingData: {
          name: existing.name, sku: existing.sku, category: existing.category,
          costPrice: existing.costPrice, sellPrice: existing.sellPrice,
        }});
      } else {
        results.push({
          rowIndex: i, status: "conflict", newData,
          existingData: {
            name: existing.name, sku: existing.sku, category: existing.category,
            costPrice: existing.costPrice, sellPrice: existing.sellPrice,
          },
          changedFields,
        });
      }
    } else {
      results.push({ rowIndex: i, status: "new", newData });
    }
  }

  return results;
}

async function validateOrders(rows: CSVRow[]): Promise<ValidatedRow[]> {
  const results: ValidatedRow[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const customerName = findColumn(row, ["buyer", "customerName", "tenKhach", "Tên người mua", "Buyer", "customer_name", "Người mua"]) || "Khách lẻ";
    const phone = findColumn(row, ["phone", "sdt", "SĐT", "Số điện thoại", "buyer_phone"]);
    const channel = findColumn(row, ["channel", "kenh", "Kênh bán", "source", "Channel"]) || "shopee";
    const totalAmount = parseNumber(findColumn(row, ["totalAmount", "tongTien", "Tổng tiền", "total", "Total Order Amount", "Order Amount", "Total Amount"]));
    const shippingFee = parseNumber(findColumn(row, ["shippingFee", "phiShip", "Phí ship", "shipping_fee", "Shipping Fee"]));
    const discount = parseNumber(findColumn(row, ["discount", "giamGia", "Giảm giá", "Voucher"]));
    const status = findColumn(row, ["status", "trangThai", "Trạng thái", "Order Status"]) || "COMPLETED";
    const orderDate = findColumn(row, ["orderDate", "ngayDat", "Ngày đặt", "Created Time", "order_date", "create_time"]);

    const newData = { customerName, phone, channel, totalAmount, shippingFee, discount, status, orderDate };

    if (totalAmount <= 0) {
      results.push({ rowIndex: i, status: "invalid", reason: "Tổng tiền <= 0", newData });
      continue;
    }

    // Check if customer exists with this phone
    if (phone) {
      const existing = await prisma.sbCustomer.findUnique({ where: { phone } });
      if (existing) {
        results.push({
          rowIndex: i, status: "new", newData,
          existingData: { customerName: existing.name, phone: existing.phone, tier: existing.tier, orderCount: existing.orderCount },
          reason: `KH đã tồn tại (${existing.name}, ${existing.orderCount} đơn) — sẽ gộp vào KH cũ`,
        });
        continue;
      }
    }

    results.push({ rowIndex: i, status: "new", newData });
  }

  return results;
}

async function validateSuppliers(rows: CSVRow[]): Promise<ValidatedRow[]> {
  const results: ValidatedRow[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = findColumn(row, ["name", "tenNCC", "Tên NCC", "supplier_name", "Nhà cung cấp"]);
    const province = findColumn(row, ["province", "tinh", "Tỉnh/Thành", "city"]) || "TP.HCM";
    const phone = findColumn(row, ["phone", "sdt", "SĐT", "Số điện thoại"]);
    const rating = parseNumber(findColumn(row, ["rating", "danhGia", "Đánh giá"])) || 4.0;
    const leadTimeDays = parseInt(findColumn(row, ["leadTimeDays", "thoiGianGiao", "Thời gian giao"]) || "3");
    const minOrder = parseNumber(findColumn(row, ["minOrder", "donToiThieu", "Đơn tối thiểu"]));

    const newData = { name, province, phone, rating, leadTimeDays, minOrder };

    if (!name) {
      results.push({ rowIndex: i, status: "invalid", reason: "Thiếu tên NCC", newData });
      continue;
    }

    const existing = await prisma.sbSupplier.findFirst({ where: { name } });
    if (existing) {
      const changedFields: string[] = [];
      if (existing.province !== province) changedFields.push("province");
      if (phone && existing.phone !== phone) changedFields.push("phone");
      if (existing.rating !== rating) changedFields.push("rating");
      if (existing.leadTimeDays !== leadTimeDays) changedFields.push("leadTimeDays");

      if (changedFields.length === 0) {
        results.push({ rowIndex: i, status: "unchanged", newData, existingData: {
          name: existing.name, province: existing.province, phone: existing.phone,
          rating: existing.rating, leadTimeDays: existing.leadTimeDays,
        }});
      } else {
        results.push({
          rowIndex: i, status: "conflict", newData,
          existingData: {
            name: existing.name, province: existing.province, phone: existing.phone,
            rating: existing.rating, leadTimeDays: existing.leadTimeDays,
          },
          changedFields,
        });
      }
    } else {
      results.push({ rowIndex: i, status: "new", newData });
    }
  }

  return results;
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  try {
    const body = await req.json();
    const { csvData, importType } = body as { csvData: string; importType: string };

    if (!csvData || !importType) {
      return NextResponse.json({ error: "Missing csvData or importType" }, { status: 400 });
    }

    const rows = parseCSV(csvData);
    if (rows.length === 0) {
      return NextResponse.json({ error: "No valid rows found" }, { status: 400 });
    }

    let validated: ValidatedRow[];
    switch (importType) {
      case "products": validated = await validateProducts(rows); break;
      case "orders": validated = await validateOrders(rows); break;
      case "suppliers": validated = await validateSuppliers(rows); break;
      default: return NextResponse.json({ error: `Unknown type: ${importType}` }, { status: 400 });
    }

    const summary = {
      total: validated.length,
      new: validated.filter((r) => r.status === "new").length,
      conflict: validated.filter((r) => r.status === "conflict").length,
      invalid: validated.filter((r) => r.status === "invalid").length,
      unchanged: validated.filter((r) => r.status === "unchanged").length,
    };

    return NextResponse.json({ validated, summary, importType });
  } catch (error) {
    console.error("Validate error:", error);
    return NextResponse.json({ error: "Validation failed" }, { status: 500 });
  }
}
