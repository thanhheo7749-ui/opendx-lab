// ==============================================================================
// BizScan — Scanner Agent: 5 Anomaly Detection Checks
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Runs pure SQL checks (no LLM needed) to detect business anomalies.
// ==============================================================================

import { prisma } from "@/lib/prisma";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ScanCheckResult {
  id: string;
  name: string;
  category: "REVENUE" | "COST" | "INVENTORY" | "CUSTOMER" | "ADS";
  hasAnomaly: boolean;
  severity: "CRITICAL" | "WARNING" | "INFO";
  message: string;
  data: Record<string, unknown>;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function monthStart(monthsAgo: number = 0): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ── Check 1: Revenue Drop Detection ────────────────────────────────────────────

async function checkRevenueDrop(): Promise<ScanCheckResult> {
  const thisWeekStart = daysAgo(7);
  const lastWeekStart = daysAgo(14);

  const [thisWeek, lastWeek] = await Promise.all([
    prisma.sbOrder.aggregate({
      where: {
        orderDate: { gte: thisWeekStart },
        status: "COMPLETED",
      },
      _sum: { totalAmount: true, profit: true },
      _count: { id: true },
    }),
    prisma.sbOrder.aggregate({
      where: {
        orderDate: { gte: lastWeekStart, lt: thisWeekStart },
        status: "COMPLETED",
      },
      _sum: { totalAmount: true, profit: true },
      _count: { id: true },
    }),
  ]);

  const currentRevenue = thisWeek._sum.totalAmount ?? 0;
  const previousRevenue = lastWeek._sum.totalAmount ?? 0;
  const currentOrders = thisWeek._count.id;
  const previousOrders = lastWeek._count.id;

  const changePct =
    previousRevenue > 0
      ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 1000) / 10
      : 0;

  const hasAnomaly = changePct < -10;
  const severity = changePct < -20 ? "CRITICAL" : changePct < -10 ? "WARNING" : "INFO";

  const formatVND = (n: number) =>
    new Intl.NumberFormat("vi-VN").format(Math.round(n));

  return {
    id: "revenue_drop",
    name: "Kiểm tra doanh thu",
    category: "REVENUE",
    hasAnomaly,
    severity,
    message: hasAnomaly
      ? `Doanh thu giảm ${Math.abs(changePct)}% so với tuần trước (${formatVND(currentRevenue)}đ vs ${formatVND(previousRevenue)}đ). Số đơn: ${currentOrders} vs ${previousOrders}.`
      : `Doanh thu ổn định: ${changePct > 0 ? "+" : ""}${changePct}% so với tuần trước (${formatVND(currentRevenue)}đ).`,
    data: {
      currentRevenue,
      previousRevenue,
      changePct,
      currentOrders,
      previousOrders,
      currentProfit: thisWeek._sum.profit ?? 0,
      previousProfit: lastWeek._sum.profit ?? 0,
    },
  };
}

// ── Check 2: Ad Waste Detection ────────────────────────────────────────────────

async function checkAdWaste(): Promise<ScanCheckResult> {
  const sevenDaysAgo = daysAgo(7);

  // Get active campaigns with their last 7 days stats
  const campaigns = await prisma.sbAdCampaign.findMany({
    where: { status: "ACTIVE" },
    include: {
      dailyStats: {
        where: { date: { gte: sevenDaysAgo } },
      },
    },
  });

  const wastefulCampaigns: {
    name: string;
    channel: string;
    totalSpent: number;
    totalOrders: number;
    avgCpc: number;
    roas: number;
  }[] = [];

  for (const campaign of campaigns) {
    if (campaign.dailyStats.length === 0) continue;

    const totalSpent = campaign.dailyStats.reduce((s, d) => s + d.spent, 0);
    const totalClicks = campaign.dailyStats.reduce((s, d) => s + d.clicks, 0);
    const totalOrders = campaign.dailyStats.reduce((s, d) => s + d.orders, 0);
    const totalRevenue = campaign.dailyStats.reduce((s, d) => s + d.revenue, 0);

    const avgCpc = totalClicks > 0 ? Math.round(totalSpent / totalClicks) : 0;
    const roas = totalSpent > 0 ? Math.round((totalRevenue / totalSpent) * 100) / 100 : 0;

    // Flag if ROAS < 1.0 (spending more than earning) or CPC > 5000
    if (roas < 1.0 || avgCpc > 5000) {
      wastefulCampaigns.push({
        name: campaign.name,
        channel: campaign.channel,
        totalSpent,
        totalOrders,
        avgCpc,
        roas,
      });
    }
  }

  const hasAnomaly = wastefulCampaigns.length > 0;
  const totalWaste = wastefulCampaigns.reduce((s, c) => s + c.totalSpent, 0);
  const formatVND = (n: number) =>
    new Intl.NumberFormat("vi-VN").format(Math.round(n));

  return {
    id: "ad_waste",
    name: "Kiểm tra hiệu quả quảng cáo",
    category: "ADS",
    hasAnomaly,
    severity: wastefulCampaigns.length >= 3 ? "CRITICAL" : hasAnomaly ? "WARNING" : "INFO",
    message: hasAnomaly
      ? `${wastefulCampaigns.length} chiến dịch QC đang đốt tiền (ROAS < 1.0). Tổng chi phí lãng phí 7 ngày: ${formatVND(totalWaste)}đ. Campaigns: ${wastefulCampaigns.map((c) => `"${c.name}" (ROAS: ${c.roas})`).join(", ")}.`
      : "Tất cả chiến dịch quảng cáo đang hoạt động hiệu quả.",
    data: {
      totalCampaigns: campaigns.length,
      wastefulCount: wastefulCampaigns.length,
      totalWaste,
      wastefulCampaigns,
    },
  };
}

// ── Check 3: Dead Stock Detection ──────────────────────────────────────────────

async function checkDeadStock(): Promise<ScanCheckResult> {
  const deadStock = await prisma.sbInventory.findMany({
    where: {
      daysInStock: { gt: 30 },
      quantity: { gt: 0 },
    },
    include: {
      product: { select: { name: true, sku: true, costPrice: true, sellPrice: true } },
    },
    orderBy: { daysInStock: "desc" },
  });

  const outOfStock = await prisma.sbInventory.findMany({
    where: { quantity: 0 },
    include: {
      product: { select: { name: true, sku: true, sellPrice: true } },
    },
  });

  const stuckCapital = deadStock.reduce(
    (s, inv) => s + inv.quantity * inv.product.costPrice,
    0
  );

  const hasAnomaly = deadStock.length > 0 || outOfStock.length > 0;
  const formatVND = (n: number) =>
    new Intl.NumberFormat("vi-VN").format(Math.round(n));

  return {
    id: "dead_stock",
    name: "Kiểm tra tồn kho",
    category: "INVENTORY",
    hasAnomaly,
    severity: deadStock.length >= 5 ? "CRITICAL" : hasAnomaly ? "WARNING" : "INFO",
    message: hasAnomaly
      ? `${deadStock.length} sản phẩm tồn kho > 30 ngày (vốn kẹt: ${formatVND(stuckCapital)}đ). ${outOfStock.length} sản phẩm hết hàng hoàn toàn.`
      : "Tồn kho khỏe mạnh, không có sản phẩm ứ đọng.",
    data: {
      deadStockCount: deadStock.length,
      outOfStockCount: outOfStock.length,
      stuckCapital,
      deadStockProducts: deadStock.slice(0, 10).map((inv) => ({
        name: inv.product.name,
        sku: inv.product.sku,
        quantity: inv.quantity,
        daysInStock: inv.daysInStock,
        stuckValue: inv.quantity * inv.product.costPrice,
      })),
      outOfStockProducts: outOfStock.slice(0, 10).map((inv) => ({
        name: inv.product.name,
        sku: inv.product.sku,
        sellPrice: inv.product.sellPrice,
      })),
    },
  };
}

// ── Check 4: Customer Churn Detection ──────────────────────────────────────────

async function checkCustomerChurn(): Promise<ScanCheckResult> {
  const fortyFiveDaysAgo = daysAgo(45);

  const churnedVIPs = await prisma.sbCustomer.findMany({
    where: {
      tier: { in: ["VIP", "SUPER_VIP"] },
      lastPurchase: { lt: fortyFiveDaysAgo },
    },
    orderBy: { totalSpent: "desc" },
    take: 20,
  });

  const totalLostValue = churnedVIPs.reduce((s, c) => s + c.totalSpent, 0);
  const hasAnomaly = churnedVIPs.length > 0;
  const formatVND = (n: number) =>
    new Intl.NumberFormat("vi-VN").format(Math.round(n));

  return {
    id: "customer_churn",
    name: "Kiểm tra khách hàng VIP",
    category: "CUSTOMER",
    hasAnomaly,
    severity: churnedVIPs.length >= 10 ? "CRITICAL" : hasAnomaly ? "WARNING" : "INFO",
    message: hasAnomaly
      ? `${churnedVIPs.length} khách VIP/Super VIP không mua lại sau 45 ngày. Tổng giá trị: ${formatVND(totalLostValue)}đ. Khách lâu nhất: ${churnedVIPs[0]?.name} (${Math.round((Date.now() - (churnedVIPs[0]?.lastPurchase?.getTime() ?? 0)) / 86400000)} ngày).`
      : "Tất cả khách hàng VIP vẫn đang hoạt động.",
    data: {
      churnedCount: churnedVIPs.length,
      totalLostValue,
      churnedCustomers: churnedVIPs.slice(0, 10).map((c) => ({
        name: c.name,
        tier: c.tier,
        totalSpent: c.totalSpent,
        orderCount: c.orderCount,
        lastPurchase: c.lastPurchase,
        daysSinceLast: c.lastPurchase
          ? Math.round((Date.now() - c.lastPurchase.getTime()) / 86400000)
          : null,
      })),
    },
  };
}

// ── Check 5: Profit Margin Squeeze ─────────────────────────────────────────────

async function checkMarginSqueeze(): Promise<ScanCheckResult> {
  const thisMonthStart = monthStart(0);
  const lastMonthStart = monthStart(1);

  const [thisMonth, lastMonth] = await Promise.all([
    prisma.sbOrder.aggregate({
      where: {
        orderDate: { gte: thisMonthStart },
        status: "COMPLETED",
      },
      _sum: { totalAmount: true, profit: true, discount: true },
      _count: { id: true },
    }),
    prisma.sbOrder.aggregate({
      where: {
        orderDate: { gte: lastMonthStart, lt: thisMonthStart },
        status: "COMPLETED",
      },
      _sum: { totalAmount: true, profit: true, discount: true },
      _count: { id: true },
    }),
  ]);

  const currentRevenue = thisMonth._sum.totalAmount ?? 0;
  const currentProfit = thisMonth._sum.profit ?? 0;
  const currentDiscount = thisMonth._sum.discount ?? 0;
  const previousRevenue = lastMonth._sum.totalAmount ?? 0;
  const previousProfit = lastMonth._sum.profit ?? 0;

  const currentMargin =
    currentRevenue > 0 ? Math.round((currentProfit / currentRevenue) * 1000) / 10 : 0;
  const previousMargin =
    previousRevenue > 0
      ? Math.round((previousProfit / previousRevenue) * 1000) / 10
      : 0;
  const marginChange = Math.round((currentMargin - previousMargin) * 10) / 10;

  const hasAnomaly = marginChange < -5;
  const formatVND = (n: number) =>
    new Intl.NumberFormat("vi-VN").format(Math.round(n));

  return {
    id: "margin_squeeze",
    name: "Kiểm tra biên lợi nhuận",
    category: "REVENUE",
    hasAnomaly,
    severity: marginChange < -10 ? "CRITICAL" : hasAnomaly ? "WARNING" : "INFO",
    message: hasAnomaly
      ? `Biên lợi nhuận giảm ${Math.abs(marginChange)} điểm % (${currentMargin}% vs ${previousMargin}% tháng trước). Tổng discount tháng này: ${formatVND(currentDiscount)}đ.`
      : `Biên lợi nhuận ổn định: ${currentMargin}% (${marginChange > 0 ? "+" : ""}${marginChange} điểm % so với tháng trước).`,
    data: {
      currentMargin,
      previousMargin,
      marginChange,
      currentRevenue,
      currentProfit,
      currentDiscount,
      previousRevenue,
      previousProfit,
      currentOrders: thisMonth._count.id,
      previousOrders: lastMonth._count.id,
    },
  };
}

// ── Run All Checks ─────────────────────────────────────────────────────────────

export const SCAN_CHECKS = [
  { id: "revenue_drop", fn: checkRevenueDrop },
  { id: "ad_waste", fn: checkAdWaste },
  { id: "dead_stock", fn: checkDeadStock },
  { id: "customer_churn", fn: checkCustomerChurn },
  { id: "margin_squeeze", fn: checkMarginSqueeze },
] as const;

export async function runAllChecks(): Promise<ScanCheckResult[]> {
  const results: ScanCheckResult[] = [];

  for (const check of SCAN_CHECKS) {
    try {
      const result = await check.fn();
      results.push(result);
    } catch (error) {
      console.error(`[BizScan] Check "${check.id}" failed:`, error);
      results.push({
        id: check.id,
        name: check.id,
        category: "REVENUE",
        hasAnomaly: false,
        severity: "INFO",
        message: `Lỗi khi chạy kiểm tra: ${error instanceof Error ? error.message : "Unknown"}`,
        data: { error: true },
      });
    }
  }

  return results;
}

/**
 * Run a full scan: execute all checks → save results to DB → return findings.
 */
export async function runFullScan(scanType: "SCHEDULED" | "MANUAL" = "MANUAL") {
  const startTime = Date.now();

  // Create scan record
  const scan = await prisma.sbScanResult.create({
    data: {
      status: "RUNNING",
      scanType,
    },
  });

  try {
    // Run all checks
    const results = await runAllChecks();
    const anomalies = results.filter((r) => r.hasAnomaly);

    // Save findings
    if (anomalies.length > 0) {
      await prisma.sbScanFinding.createMany({
        data: anomalies.map((a) => ({
          scanId: scan.id,
          severity: a.severity,
          category: a.category,
          title: a.message.split(".")[0] + ".", // First sentence as title
          description: a.message,
          rawData: a.data as object,
          status: "PENDING",
        })),
      });
    }

    // Update scan record
    const durationMs = Date.now() - startTime;
    const updatedScan = await prisma.sbScanResult.update({
      where: { id: scan.id },
      data: {
        status: "COMPLETED",
        durationMs,
        completedAt: new Date(),
        summary: anomalies.length > 0
          ? `Phát hiện ${anomalies.length} vấn đề (${anomalies.filter((a) => a.severity === "CRITICAL").length} critical, ${anomalies.filter((a) => a.severity === "WARNING").length} warning).`
          : "Mọi thứ ổn! Không phát hiện bất thường.",
      },
      include: { findings: true },
    });

    return {
      scan: updatedScan,
      results,
      anomalyCount: anomalies.length,
      durationMs,
    };
  } catch (error) {
    // Mark scan as failed
    await prisma.sbScanResult.update({
      where: { id: scan.id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        durationMs: Date.now() - startTime,
        summary: `Scan thất bại: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
    });
    throw error;
  }
}
