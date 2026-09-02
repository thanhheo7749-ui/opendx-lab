// ==============================================================================
// BizScan — Business Pulse API: Dashboard summary data
// SPDX-License-Identifier: GPL-3.0-or-later
//
// GET /api/bizscan/pulse → Revenue chart, top products, channel breakdown
// ==============================================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000);

    // ── Revenue by day (last 7 days) ──
    const dailyRevenue = await prisma.$queryRaw<
      { day: string; revenue: number; orders: number; profit: number }[]
    >`
      SELECT 
        TO_CHAR("orderDate", 'YYYY-MM-DD') as day,
        COALESCE(SUM("totalAmount"), 0)::float as revenue,
        COUNT(*)::int as orders,
        COALESCE(SUM(profit), 0)::float as profit
      FROM sb_orders 
      WHERE status = 'COMPLETED' AND "orderDate" >= ${sevenDaysAgo}
      GROUP BY TO_CHAR("orderDate", 'YYYY-MM-DD')
      ORDER BY day ASC
    `;

    // ── This week vs last week ──
    const [thisWeek, lastWeek] = await Promise.all([
      prisma.sbOrder.aggregate({
        where: { status: "COMPLETED", orderDate: { gte: sevenDaysAgo } },
        _sum: { totalAmount: true, profit: true },
        _count: { id: true },
      }),
      prisma.sbOrder.aggregate({
        where: { status: "COMPLETED", orderDate: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
        _sum: { totalAmount: true, profit: true },
        _count: { id: true },
      }),
    ]);

    const currentRevenue = thisWeek._sum.totalAmount ?? 0;
    const previousRevenue = lastWeek._sum.totalAmount ?? 0;
    const revenueChange = previousRevenue > 0
      ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 1000) / 10
      : 0;

    // ── Top 5 products ──
    const topProducts = await prisma.$queryRaw<
      { name: string; sku: string; sales: number; revenue: number }[]
    >`
      SELECT p.name, p.sku, COUNT(oi.id)::int as sales, 
             COALESCE(SUM(oi."unitPrice" * oi.quantity), 0)::float as revenue
      FROM sb_order_items oi
      JOIN sb_products p ON oi."productId" = p.id
      JOIN sb_orders o ON oi."orderId" = o.id
      WHERE o.status = 'COMPLETED' AND o."orderDate" >= ${sevenDaysAgo}
      GROUP BY p.name, p.sku
      ORDER BY sales DESC
      LIMIT 5
    `;

    // ── Channel breakdown ──
    const channels = await prisma.$queryRaw<
      { channel: string; orders: number; revenue: number }[]
    >`
      SELECT channel, COUNT(*)::int as orders, 
             COALESCE(SUM("totalAmount"), 0)::float as revenue
      FROM sb_orders
      WHERE status = 'COMPLETED' AND "orderDate" >= ${sevenDaysAgo}
      GROUP BY channel
      ORDER BY revenue DESC
    `;

    // ── Total counts ──
    const [totalProducts, totalCustomers, totalOrders] = await Promise.all([
      prisma.sbProduct.count({ where: { isActive: true } }),
      prisma.sbCustomer.count(),
      prisma.sbOrder.count({ where: { status: "COMPLETED" } }),
    ]);

    // ── Pending alerts count ──
    const pendingFindings = await prisma.sbScanFinding.count({
      where: { status: "PENDING" },
    });

    return NextResponse.json({
      success: true,
      summary: {
        currentRevenue,
        previousRevenue,
        revenueChange,
        currentOrders: thisWeek._count.id,
        previousOrders: lastWeek._count.id,
        currentProfit: thisWeek._sum.profit ?? 0,
        totalProducts,
        totalCustomers,
        totalOrders,
        pendingFindings,
      },
      dailyRevenue,
      topProducts,
      channels,
    });
  } catch (error) {
    console.error("[Pulse] Failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
