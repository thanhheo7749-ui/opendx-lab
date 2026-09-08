// ==============================================================================
// Decision Intelligence — Simple Forecast Engine
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Linear regression based forecast using historical order data.
// ==============================================================================

import { prisma } from "@/lib/prisma";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface RevenueForecast {
  currentWeekRevenue: number;
  nextWeekForecast: number;
  trend: "UP" | "DOWN" | "STABLE";
  trendPercent: number;
  confidence: "Cao" | "Trung bình" | "Thấp";
  dailyData: { date: string; revenue: number }[];
  method: string;
}

export interface StockoutAlert {
  productName: string;
  productSku: string;
  currentStock: number;
  dailySalesRate: number;
  daysUntilStockout: number;
  urgency: "CRITICAL" | "WARNING" | "OK";
}

// ── Revenue Forecast ───────────────────────────────────────────────────────────

export async function forecastRevenue(): Promise<RevenueForecast> {
  // Get daily revenue for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const orders = await prisma.sbOrder.findMany({
    where: {
      orderDate: { gte: thirtyDaysAgo },
      status: "COMPLETED",
    },
    select: { orderDate: true, totalAmount: true },
    orderBy: { orderDate: "asc" },
  });

  // Group by day
  const dailyMap = new Map<string, number>();
  for (const o of orders) {
    const key = o.orderDate.toISOString().slice(0, 10);
    dailyMap.set(key, (dailyMap.get(key) ?? 0) + o.totalAmount);
  }

  // Fill missing days with 0
  const dailyData: { date: string; revenue: number }[] = [];
  for (let i = 30; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dailyData.push({ date: key, revenue: dailyMap.get(key) ?? 0 });
  }

  // Simple linear regression: y = a + bx
  const n = dailyData.length;
  const xs = dailyData.map((_, i) => i);
  const ys = dailyData.map((d) => d.revenue);

  const sumX = xs.reduce((s, x) => s + x, 0);
  const sumY = ys.reduce((s, y) => s + y, 0);
  const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0);
  const sumX2 = xs.reduce((s, x) => s + x * x, 0);

  const b = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const a = (sumY - b * sumX) / n;

  // Forecast next 7 days
  let nextWeekTotal = 0;
  for (let i = 1; i <= 7; i++) {
    nextWeekTotal += Math.max(0, a + b * (n + i));
  }

  // Current week (last 7 days)
  const currentWeekRevenue = dailyData.slice(-7).reduce((s, d) => s + d.revenue, 0);

  const trendPercent = currentWeekRevenue > 0
    ? Math.round(((nextWeekTotal - currentWeekRevenue) / currentWeekRevenue) * 100)
    : 0;

  const trend = trendPercent > 5 ? "UP" : trendPercent < -5 ? "DOWN" : "STABLE";

  // Confidence based on data variance
  const mean = sumY / n;
  const variance = ys.reduce((s, y) => s + (y - mean) ** 2, 0) / n;
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 1; // coefficient of variation
  const confidence = cv < 0.3 ? "Cao" : cv < 0.6 ? "Trung bình" : "Thấp";

  return {
    currentWeekRevenue: Math.round(currentWeekRevenue),
    nextWeekForecast: Math.round(nextWeekTotal),
    trend,
    trendPercent,
    confidence,
    dailyData,
    method: "Linear regression trên dữ liệu 30 ngày",
  };
}

// ── Stockout Alerts ────────────────────────────────────────────────────────────

export async function getStockoutAlerts(): Promise<StockoutAlert[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const products = await prisma.sbProduct.findMany({
    where: { isActive: true },
    include: { inventory: true },
  });

  const orderItems = await prisma.sbOrderItem.groupBy({
    by: ["productId"],
    where: {
      order: {
        orderDate: { gte: thirtyDaysAgo },
        status: "COMPLETED",
      },
    },
    _sum: { quantity: true },
  });

  const velocityMap = new Map(
    orderItems.map((oi) => [oi.productId, (oi._sum.quantity ?? 0) / 30])
  );

  const alerts: StockoutAlert[] = [];

  for (const p of products) {
    const stock = p.inventory?.quantity ?? 0;
    const dailyRate = velocityMap.get(p.id) ?? 0;

    if (dailyRate <= 0 || stock <= 0) continue;

    const daysLeft = Math.round(stock / dailyRate);
    const urgency = daysLeft <= 3 ? "CRITICAL" : daysLeft <= 7 ? "WARNING" : "OK";

    if (daysLeft <= 14) {
      alerts.push({
        productName: p.name,
        productSku: p.sku,
        currentStock: stock,
        dailySalesRate: Math.round(dailyRate * 10) / 10,
        daysUntilStockout: daysLeft,
        urgency,
      });
    }
  }

  return alerts.sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);
}
