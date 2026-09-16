// ==============================================================================
// ShopWise — Import CSV API
// Parses CSV data and imports into PostgreSQL
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

  // Parse header — handle both comma and semicolon delimiters
  const delimiter = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ""));

  const rows: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map((v) => v.trim().replace(/^"|"$/g, ""));
    if (values.length < 2) continue; // skip empty lines

    const row: CSVRow = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });
    rows.push(row);
  }
  return rows;
}

// ── Column mapping helpers ────────────────────────────────────────────────────

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

// ── Import handlers ───────────────────────────────────────────────────────────

async function importProducts(rows: CSVRow[]) {
  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const row of rows) {
    try {
      const name = findColumn(row, ["name", "tenSanPham", "ten_san_pham", "productName", "Tên sản phẩm", "product_name"]);
      const sku = findColumn(row, ["sku", "maSP", "ma_sp", "SKU", "Mã SP", "product_sku", "seller_sku", "Seller SKU"]);
      const category = findColumn(row, ["category", "danhMuc", "danh_muc", "Danh mục", "loai"]) || "Khác";
      const costPrice = parseNumber(findColumn(row, ["costPrice", "giaGoc", "gia_goc", "Giá gốc", "cost_price", "cost"]));
      const sellPrice = parseNumber(findColumn(row, ["sellPrice", "giaBan", "gia_ban", "Giá bán", "sell_price", "price", "Giá", "SKU Unit Original Price"]));

      if (!name || !sku) {
        errors++;
        continue;
      }

      const existing = await prisma.sbProduct.findUnique({ where: { sku } });
      if (existing) {
        await prisma.sbProduct.update({
          where: { sku },
          data: { name, category, costPrice: costPrice || existing.costPrice, sellPrice: sellPrice || existing.sellPrice },
        });
        updated++;
      } else {
        await prisma.sbProduct.create({
          data: { name, sku, category, costPrice, sellPrice },
        });
        created++;
      }
    } catch {
      errors++;
    }
  }

  return { created, updated, errors, total: rows.length };
}

async function importOrders(rows: CSVRow[]) {
  let created = 0;
  let skipped = 0;
  let errors = 0;

  // Pre-load product cost map for better profit estimation
  const allProducts = await prisma.sbProduct.findMany({ select: { id: true, costPrice: true, sellPrice: true } });
  const avgMargin = allProducts.length > 0
    ? allProducts.reduce((s, p) => s + (p.sellPrice > 0 ? (p.sellPrice - p.costPrice) / p.sellPrice : 0.4), 0) / allProducts.length
    : 0.4;

  const touchedCustomerIds = new Set<string>();

  for (const row of rows) {
    try {
      const customerName = findColumn(row, ["buyer", "customerName", "tenKhach", "Tên người mua", "Buyer", "customer_name", "Người mua"]) || "Khách lẻ";
      const phone = findColumn(row, ["phone", "sdt", "SĐT", "Số điện thoại", "buyer_phone"]);
      const channel = findColumn(row, ["channel", "kenh", "Kênh bán", "source", "Channel"]) || "shopee";
      const totalAmount = parseNumber(findColumn(row, ["totalAmount", "tongTien", "Tổng tiền", "total", "Total Order Amount", "Order Amount", "Total Amount"]));
      const shippingFee = parseNumber(findColumn(row, ["shippingFee", "phiShip", "Phí ship", "shipping_fee", "Shipping Fee"]));
      const discount = parseNumber(findColumn(row, ["discount", "giamGia", "Giảm giá", "Voucher"]));
      const status = findColumn(row, ["status", "trangThai", "Trạng thái", "Order Status"]) || "COMPLETED";
      const orderDateStr = findColumn(row, ["orderDate", "ngayDat", "Ngày đặt", "Created Time", "order_date", "create_time"]);

      if (totalAmount <= 0) {
        skipped++;
        continue;
      }

      // Find or create customer (upsert by phone)
      let customer;
      if (phone) {
        customer = await prisma.sbCustomer.findUnique({ where: { phone } });
        if (!customer) {
          customer = await prisma.sbCustomer.create({
            data: { name: customerName, phone, channel: channel.toLowerCase() },
          });
        }
      } else {
        customer = await prisma.sbCustomer.create({
          data: { name: customerName, channel: channel.toLowerCase() },
        });
      }
      touchedCustomerIds.add(customer.id);

      const orderDate = orderDateStr ? new Date(orderDateStr) : new Date();
      const normalizedStatus = status.toUpperCase().includes("CANCEL") ? "CANCELLED"
        : status.toUpperCase().includes("RETURN") ? "RETURNED"
        : "COMPLETED";

      // Calculate profit using actual average margin from products
      const profit = normalizedStatus === "COMPLETED" ? Math.round((totalAmount - discount) * avgMargin) : 0;

      await prisma.sbOrder.create({
        data: {
          customerId: customer.id,
          channel: channel.toLowerCase(),
          status: normalizedStatus,
          totalAmount,
          shippingFee,
          discount,
          profit,
          orderDate: isNaN(orderDate.getTime()) ? new Date() : orderDate,
        },
      });

      created++;
    } catch {
      errors++;
    }
  }

  // Update customer stats for touched customers
  for (const customerId of touchedCustomerIds) {
    try {
      const stats = await prisma.sbOrder.aggregate({
        where: { customerId, status: "COMPLETED" },
        _sum: { totalAmount: true },
        _count: { id: true },
        _min: { orderDate: true },
        _max: { orderDate: true },
      });
      const totalSpent = stats._sum.totalAmount ?? 0;
      const tier = totalSpent > 5000000 ? "SUPER_VIP" : totalSpent > 2000000 ? "VIP" : "NORMAL";
      await prisma.sbCustomer.update({
        where: { id: customerId },
        data: {
          totalSpent,
          orderCount: stats._count.id,
          firstPurchase: stats._min.orderDate,
          lastPurchase: stats._max.orderDate,
          tier,
        },
      });
    } catch { /* ignore stats update errors */ }
  }

  return { created, updated: 0, skipped, errors, total: rows.length };
}

async function importSuppliers(rows: CSVRow[]) {
  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const row of rows) {
    try {
      const name = findColumn(row, ["name", "tenNCC", "Tên NCC", "supplier_name", "Nhà cung cấp"]);
      const province = findColumn(row, ["province", "tinh", "Tỉnh/Thành", "city"]) || "TP.HCM";
      const district = findColumn(row, ["district", "quan", "Quận/Huyện"]);
      const phone = findColumn(row, ["phone", "sdt", "SĐT", "Số điện thoại"]);
      const rating = parseNumber(findColumn(row, ["rating", "danhGia", "Đánh giá"])) || 4.0;
      const leadTimeDays = parseInt(findColumn(row, ["leadTimeDays", "thoiGianGiao", "Thời gian giao"]) || "3");
      const minOrder = parseNumber(findColumn(row, ["minOrder", "donToiThieu", "Đơn tối thiểu"]));

      if (!name) {
        errors++;
        continue;
      }

      // Check if supplier exists by name
      const existing = await prisma.sbSupplier.findFirst({ where: { name } });
      if (existing) {
        await prisma.sbSupplier.update({
          where: { id: existing.id },
          data: { province, district, phone, rating, leadTimeDays, minOrder },
        });
        updated++;
      } else {
        await prisma.sbSupplier.create({
          data: { name, province, district, phone, rating, leadTimeDays, minOrder },
        });
        created++;
      }
    } catch {
      errors++;
    }
  }

  return { created, updated, errors, total: rows.length };
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
      return NextResponse.json({ error: "No valid rows found in CSV" }, { status: 400 });
    }

    let result;
    switch (importType) {
      case "products":
        result = await importProducts(rows);
        break;
      case "orders":
        result = await importOrders(rows);
        break;
      case "suppliers":
        result = await importSuppliers(rows);
        break;
      default:
        return NextResponse.json({ error: `Unknown import type: ${importType}` }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      importType,
      ...result,
    });
  } catch (error) {
    console.error("CSV Import error:", error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
