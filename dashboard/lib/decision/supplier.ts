// ==============================================================================
// ShopWise — Supplier Matcher Logic
// Multi-criteria scoring: price × quality × delivery × location
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { prisma } from "@/lib/prisma";

export interface SupplierScore {
  supplierId: string;
  supplierName: string;
  province: string;
  unitPrice: number;
  shippingCost: number;
  totalCost: number; // unitPrice * qty + shippingCost
  leadTimeDays: number;
  rating: number;
  moq: number;
  score: number; // 0-100 composite score
  rank: number;
  breakdown: {
    priceScore: number;
    qualityScore: number;
    deliveryScore: number;
    locationScore: number;
  };
}

export interface SupplierComparison {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  shopProvince: string;
  suppliers: SupplierScore[];
  recommendation: string;
  dataSource: string;
  confidence: string;
}

// Simple distance estimate between provinces (km)
const PROVINCE_DISTANCES: Record<string, Record<string, number>> = {
  "TP.HCM": { "TP.HCM": 0, "Bình Dương": 30, "Đồng Nai": 40, "Long An": 50, "Hà Nội": 1700, "Đà Nẵng": 960, "Cần Thơ": 170 },
  "Hà Nội": { "Hà Nội": 0, "Bắc Ninh": 35, "Hải Phòng": 120, "TP.HCM": 1700, "Đà Nẵng": 770, "Bình Dương": 1720 },
  "Đà Nẵng": { "Đà Nẵng": 0, "TP.HCM": 960, "Hà Nội": 770, "Bình Dương": 970 },
};

function estimateDistance(from: string, to: string): number {
  // Check direct lookup
  if (PROVINCE_DISTANCES[from]?.[to] !== undefined) return PROVINCE_DISTANCES[from][to];
  if (PROVINCE_DISTANCES[to]?.[from] !== undefined) return PROVINCE_DISTANCES[to][from];
  // Same province
  if (from === to) return 0;
  // Default estimate based on common knowledge
  return 500; // default medium distance
}

export async function compareSuppliers(
  productId: string,
  quantity: number = 100,
  shopProvince: string = "TP.HCM"
): Promise<SupplierComparison> {
  // Get product info
  const product = await prisma.sbProduct.findUnique({
    where: { id: productId },
    include: {
      supplierProducts: {
        include: { supplier: true },
        where: { supplier: { isActive: true } },
      },
    },
  });

  if (!product) throw new Error(`Product ${productId} not found`);

  const supplierScores: SupplierScore[] = [];

  for (const sp of product.supplierProducts) {
    const s = sp.supplier;
    const totalCost = sp.unitPrice * quantity + sp.shippingCost;
    const distance = estimateDistance(shopProvince, s.province);

    // Normalize scores to 0-100
    // Will be relative — computed after all suppliers are collected
    supplierScores.push({
      supplierId: s.id,
      supplierName: s.name,
      province: s.province,
      unitPrice: sp.unitPrice,
      shippingCost: sp.shippingCost,
      totalCost,
      leadTimeDays: s.leadTimeDays,
      rating: s.rating,
      moq: sp.moq,
      score: 0, // will compute
      rank: 0,
      breakdown: {
        priceScore: 0,
        qualityScore: (s.rating / 5) * 100,
        deliveryScore: Math.max(0, 100 - s.leadTimeDays * 15),
        locationScore: Math.max(0, 100 - distance * 0.05),
      },
    });
  }

  if (supplierScores.length === 0) {
    return {
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      quantity,
      shopProvince,
      suppliers: [],
      recommendation: "Không tìm thấy nhà cung cấp nào cho sản phẩm này.",
      dataSource: "sb_suppliers, sb_supplier_products",
      confidence: "Thấp",
    };
  }

  // Compute relative price score (cheapest = 100, most expensive = 0)
  const costs = supplierScores.map((s) => s.totalCost);
  const minCost = Math.min(...costs);
  const maxCost = Math.max(...costs);
  const costRange = maxCost - minCost || 1;

  for (const s of supplierScores) {
    s.breakdown.priceScore = ((maxCost - s.totalCost) / costRange) * 100;

    // Weighted composite score: price 40%, quality 20%, delivery 20%, location 20%
    s.score = Math.round(
      s.breakdown.priceScore * 0.4 +
      s.breakdown.qualityScore * 0.2 +
      s.breakdown.deliveryScore * 0.2 +
      s.breakdown.locationScore * 0.2
    );
  }

  // Sort by score descending and assign rank
  supplierScores.sort((a, b) => b.score - a.score);
  supplierScores.forEach((s, i) => (s.rank = i + 1));

  const best = supplierScores[0];
  const recommendation =
    supplierScores.length === 1
      ? `Chỉ có 1 NCC: ${best.supplierName} (${best.province}).`
      : `Khuyến nghị ${best.supplierName} (${best.province}) — tổng chi phí ${formatVND(best.totalCost)}, giao trong ${best.leadTimeDays} ngày, rating ${best.rating}/5. Điểm tổng: ${best.score}/100.`;

  return {
    productId: product.id,
    productName: product.name,
    productSku: product.sku,
    quantity,
    shopProvince,
    suppliers: supplierScores,
    recommendation,
    dataSource: "sb_suppliers, sb_supplier_products",
    confidence: supplierScores.length >= 3 ? "Cao" : supplierScores.length >= 2 ? "Trung bình" : "Thấp",
  };
}

function formatVND(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}tr`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toString();
}
