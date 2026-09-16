// ==============================================================================
// ShopWise — Dashboard Pulse API
// Returns KPIs, daily revenue, and top products for the homepage
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();

    // ── Date ranges ──────────────────────────────────────────────────────
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // ── Current period (30 days) ─────────────────────────────────────────
    const currentOrders = await prisma.sbOrder.findMany({
      where: {
        orderDate: { gte: thirtyDaysAgo },
        status: "COMPLETED",
      },
      select: { totalAmount: true, profit: true, orderDate: true },
    });

    const currentRevenue = currentOrders.reduce((s, o) => s + o.totalAmount, 0);
    const currentProfit = currentOrders.reduce((s, o) => s + (o.profit ?? 0), 0);

    // ── Previous period (30-60 days ago) ──────────────────────────────────
    const prevOrders = await prisma.sbOrder.findMany({
      where: {
        orderDate: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        status: "COMPLETED",
      },
      select: { totalAmount: true },
    });

    const previousRevenue = prevOrders.reduce((s, o) => s + o.totalAmount, 0);
    const revenueChange = previousRevenue > 0
      ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
      : 0;

    // ── Counts ────────────────────────────────────────────────────────────
    const totalProducts = await prisma.sbProduct.count({ where: { isActive: true } });
    const totalCustomers = await prisma.sbCustomer.count();
    const totalOrdersCount = await prisma.sbOrder.count();

    // ── Pending findings ──────────────────────────────────────────────────
    let pendingFindings = 0;
    try {
      pendingFindings = await prisma.sbScanFinding.count({
        where: { status: "OPEN" },
      });
    } catch {
      // Table may not exist
    }

    // ── Daily revenue (last 7 days) ───────────────────────────────────────
    const recentOrders = await prisma.sbOrder.findMany({
      where: {
        orderDate: { gte: sevenDaysAgo },
        status: "COMPLETED",
      },
      select: { orderDate: true, totalAmount: true },
    });

    // Group by day
    const dailyMap = new Map<string, { revenue: number; orders: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyMap.set(key, { revenue: 0, orders: 0 });
    }

    for (const o of recentOrders) {
      const key = o.orderDate.toISOString().slice(0, 10);
      if (dailyMap.has(key)) {
        const entry = dailyMap.get(key)!;
        entry.revenue += o.totalAmount;
        entry.orders += 1;
      }
    }

    const dailyRevenue = Array.from(dailyMap.entries()).map(([day, data]) => ({
      day,
      revenue: Math.round(data.revenue),
      orders: data.orders,
    }));

    // ── Top products (last 30 days) ───────────────────────────────────────
    const topProductsRaw = await prisma.sbOrderItem.groupBy({
      by: ["productId"],
      where: {
        order: {
          orderDate: { gte: thirtyDaysAgo },
          status: "COMPLETED",
        },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    });

    const topProductIds = topProductsRaw.map((p) => p.productId);
    const productDetails = await prisma.sbProduct.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true, sku: true, sellPrice: true },
    });

    const productMap = new Map(productDetails.map((p) => [p.id, p]));

    const topProducts = topProductsRaw.map((p) => {
      const detail = productMap.get(p.productId);
      const sales = p._sum.quantity ?? 0;
      return {
        name: detail?.name ?? "Unknown",
        sku: detail?.sku ?? "",
        sales,
        revenue: sales * (detail?.sellPrice ?? 0),
      };
    });

    // ── Response ──────────────────────────────────────────────────────────
    return NextResponse.json({
      summary: {
        currentRevenue: Math.round(currentRevenue),
        previousRevenue: Math.round(previousRevenue),
        revenueChange,
        currentOrders: currentOrders.length,
        previousOrders: prevOrders.length,
        currentProfit: Math.round(currentProfit),
        totalProducts,
        totalCustomers,
        totalOrders: totalOrdersCount,
        pendingFindings,
      },
      dailyRevenue,
      topProducts,
    });
  } catch (error) {
    console.error("Dashboard pulse error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard pulse" },
      { status: 500 }
    );
  }
}
