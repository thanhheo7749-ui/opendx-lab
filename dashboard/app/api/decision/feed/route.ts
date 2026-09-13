// ==============================================================================
// ShopWise — Decision Feed API
// Returns top issues that need decisions today
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface DecisionFeedItem {
  type: "inventory" | "pricing" | "adspend";
  urgency: "HIGH" | "MEDIUM" | "LOW";
  icon: string;
  title: string;
  summary: string;
  link: string;
  metric?: string;
}

export async function GET() {
  try {
    const decisions: DecisionFeedItem[] = [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // ── 1. Inventory: products running low ─────────────────────────────
    const products = await prisma.sbProduct.findMany({
      where: { isActive: true },
      include: { inventory: true },
    });

    const recentOrders = await prisma.sbOrderItem.findMany({
      where: { order: { orderDate: { gte: thirtyDaysAgo }, status: "COMPLETED" } },
      select: { productId: true, quantity: true },
    });

    // Calculate velocity per product
    const velocityMap = new Map<string, number>();
    for (const oi of recentOrders) {
      velocityMap.set(oi.productId, (velocityMap.get(oi.productId) || 0) + oi.quantity);
    }

    let lowStockCount = 0;
    let criticalDays = Infinity;
    for (const p of products) {
      const inv = p.inventory;
      if (!inv) continue;
      const velocity30 = velocityMap.get(p.id) || 0;
      const dailyVelocity = velocity30 / 30;
      if (dailyVelocity > 0) {
        const daysLeft = inv.quantity / dailyVelocity;
        if (daysLeft < 7) {
          lowStockCount++;
          if (daysLeft < criticalDays) criticalDays = daysLeft;
        }
      }
    }

    if (lowStockCount > 0) {
      decisions.push({
        type: "inventory",
        urgency: criticalDays < 3 ? "HIGH" : "MEDIUM",
        icon: "📦",
        title: `${lowStockCount} sản phẩm sắp hết hàng`,
        summary: `SP bán nhanh nhất còn ~${Math.round(criticalDays)} ngày tồn kho. Cần quyết định nhập hàng.`,
        link: "/decision?type=inventory",
        metric: `${lowStockCount} SP`,
      });
    }

    // ── 2. Pricing: products priced far from market ────────────────────
    const trends = await prisma.sbMarketTrend.findMany({
      where: { source: "google_shopping", avgPrice: { not: null } },
    });

    // Match trends to products by keyword overlap
    let overpriced = 0;
    for (const t of trends) {
      if (!t.avgPrice) continue;
      const matchedProduct = products.find(
        (p) => t.keyword.toLowerCase().includes(p.name.toLowerCase().split(" ")[0])
      );
      if (matchedProduct) {
        const diff = (matchedProduct.sellPrice - t.avgPrice) / t.avgPrice;
        if (diff > 0.15) overpriced++;
      }
    }

    if (overpriced > 0) {
      decisions.push({
        type: "pricing",
        urgency: overpriced >= 5 ? "HIGH" : "MEDIUM",
        icon: "💰",
        title: `${overpriced} SP giá cao hơn thị trường >15%`,
        summary: "Có thể mất khách nếu không điều chỉnh. Xem so sánh giá chi tiết.",
        link: "/decision?type=pricing",
        metric: `${overpriced} SP`,
      });
    }

    // ── 3. Ad spend: channels with low ROAS ────────────────────────────
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const campaigns = await prisma.sbAdCampaign.findMany({
      where: { status: "ACTIVE" },
      include: {
        dailyStats: { where: { date: { gte: sevenDaysAgo } } },
      },
    });

    // Group by channel
    const channelStats = new Map<string, { spent: number; revenue: number }>();
    for (const c of campaigns) {
      const existing = channelStats.get(c.channel) || { spent: 0, revenue: 0 };
      for (const d of c.dailyStats) {
        existing.spent += d.spent;
        existing.revenue += d.revenue;
      }
      channelStats.set(c.channel, existing);
    }

    const losingChannels: string[] = [];
    for (const [channel, stats] of channelStats) {
      if (stats.spent > 0 && stats.revenue / stats.spent < 1.0) {
        losingChannels.push(channel);
      }
    }

    if (losingChannels.length > 0) {
      const formatVND = (n: number) => {
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}tr`;
        if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
        return n.toString();
      };
      const channelData = channelStats.get(losingChannels[0])!;
      decisions.push({
        type: "adspend",
        urgency: "MEDIUM",
        icon: "📊",
        title: `${losingChannels.join(", ")} Ads ROAS < 1.0 — đang lỗ`,
        summary: `Chi ${formatVND(channelData.spent)} nhưng chỉ thu ${formatVND(channelData.revenue)} doanh thu trong 7 ngày.`,
        link: "/decision?type=adspend",
        metric: `${losingChannels.length} kênh`,
      });
    }

    // Sort by urgency
    const urgencyOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    decisions.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

    return NextResponse.json({ decisions, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Decision feed error:", error);
    return NextResponse.json({ decisions: [], error: "Failed to generate feed" }, { status: 500 });
  }
}
