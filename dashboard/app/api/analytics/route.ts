// ==============================================================================
// ShopWise — Analytics API
// Serves chart data for the built-in analytics dashboard
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  const { searchParams } = new URL(req.url);
  const tab = searchParams.get("tab") || "revenue";

  try {
    if (tab === "revenue") {
      // Revenue & Orders — last 30 days, grouped by day
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const orders = await prisma.sbOrder.findMany({
        where: {
          status: "COMPLETED",
          orderDate: { gte: thirtyDaysAgo },
        },
        select: { orderDate: true, totalAmount: true, profit: true, channel: true },
        orderBy: { orderDate: "asc" },
      });

      // Group by date
      const dailyMap = new Map<string, { revenue: number; profit: number; orders: number }>();
      for (const o of orders) {
        const key = o.orderDate.toISOString().split("T")[0];
        const curr = dailyMap.get(key) || { revenue: 0, profit: 0, orders: 0 };
        curr.revenue += o.totalAmount;
        curr.profit += o.profit;
        curr.orders += 1;
        dailyMap.set(key, curr);
      }

      const dailyData = Array.from(dailyMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Channel breakdown
      const channelMap = new Map<string, { revenue: number; orders: number }>();
      for (const o of orders) {
        const curr = channelMap.get(o.channel) || { revenue: 0, orders: 0 };
        curr.revenue += o.totalAmount;
        curr.orders += 1;
        channelMap.set(o.channel, curr);
      }

      const channelData = Array.from(channelMap.entries())
        .map(([channel, data]) => ({ channel, ...data }))
        .sort((a, b) => b.revenue - a.revenue);

      // Summary totals
      const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
      const totalProfit = orders.reduce((s, o) => s + o.profit, 0);
      const totalOrders = orders.length;

      return NextResponse.json({
        dailyData,
        channelData,
        summary: {
          totalRevenue,
          totalProfit,
          totalOrders,
          avgOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
        },
      });
    }

    if (tab === "products") {
      // Top products by revenue
      const topItems = await prisma.sbOrderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        _count: { id: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 10,
      });

      const productIds = topItems.map((i) => i.productId);
      const products = await prisma.sbProduct.findMany({
        where: { id: { in: productIds } },
        include: { inventory: true },
      });

      const productMap = new Map(products.map((p) => [p.id, p]));

      const topProducts = topItems.map((item) => {
        const product = productMap.get(item.productId);
        return {
          name: product?.name || "Unknown",
          sku: product?.sku || "",
          category: product?.category || "",
          totalSold: item._sum.quantity || 0,
          orderCount: item._count.id,
          revenue: (item._sum.quantity || 0) * (product?.sellPrice || 0),
          stock: product?.inventory?.quantity || 0,
          daysInStock: product?.inventory?.daysInStock || 0,
        };
      });

      // Inventory warnings
      const inventoryWarnings = await prisma.sbInventory.findMany({
        where: {
          OR: [
            { quantity: 0 },
            { daysInStock: { gte: 30 } },
          ],
        },
        include: { product: { select: { name: true, sku: true, category: true } } },
        orderBy: { daysInStock: "desc" },
        take: 15,
      });

      return NextResponse.json({ topProducts, inventoryWarnings });
    }

    if (tab === "ads") {
      // Campaign ROAS summary
      const campaigns = await prisma.sbAdCampaign.findMany({
        where: { status: "ACTIVE" },
        include: {
          dailyStats: {
            orderBy: { date: "desc" },
            take: 7, // Last 7 days
          },
        },
      });

      const campaignData = campaigns.map((c) => {
        const totalSpent = c.dailyStats.reduce((s, d) => s + d.spent, 0);
        const totalRevenue = c.dailyStats.reduce((s, d) => s + d.revenue, 0);
        const totalOrders = c.dailyStats.reduce((s, d) => s + d.orders, 0);
        const totalClicks = c.dailyStats.reduce((s, d) => s + d.clicks, 0);
        return {
          name: c.name,
          channel: c.channel,
          dailyBudget: c.dailyBudget,
          spent7d: totalSpent,
          revenue7d: totalRevenue,
          orders7d: totalOrders,
          clicks7d: totalClicks,
          roas: totalSpent > 0 ? Math.round((totalRevenue / totalSpent) * 100) / 100 : 0,
          cpc: totalClicks > 0 ? Math.round(totalSpent / totalClicks) : 0,
        };
      }).sort((a, b) => b.roas - a.roas);

      // Channel summary
      const channelAds = new Map<string, { spent: number; revenue: number; orders: number }>();
      for (const c of campaignData) {
        const curr = channelAds.get(c.channel) || { spent: 0, revenue: 0, orders: 0 };
        curr.spent += c.spent7d;
        curr.revenue += c.revenue7d;
        curr.orders += c.orders7d;
        channelAds.set(c.channel, curr);
      }

      const channelSummary = Array.from(channelAds.entries()).map(([channel, data]) => ({
        channel,
        ...data,
        roas: data.spent > 0 ? Math.round((data.revenue / data.spent) * 100) / 100 : 0,
      }));

      return NextResponse.json({ campaignData, channelSummary });
    }

    return NextResponse.json({ error: "Invalid tab parameter" }, { status: 400 });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
