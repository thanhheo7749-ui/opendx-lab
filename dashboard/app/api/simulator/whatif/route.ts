// ==============================================================================
// What-if Simulator — API Route
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(n));

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scenario, params } = body;

    switch (scenario) {
      case "price_change": {
        // params: { changePercent: number } e.g. -10 or +15
        const changePct = params.changePercent ?? 0;
        const thirtyDaysAgo = daysAgo(30);

        const stats = await prisma.sbOrder.aggregate({
          where: { orderDate: { gte: thirtyDaysAgo }, status: "COMPLETED" },
          _sum: { totalAmount: true, profit: true, discount: true },
          _count: { id: true },
          _avg: { totalAmount: true },
        });

        const currentRevenue = stats._sum.totalAmount ?? 0;
        const currentProfit = stats._sum.profit ?? 0;
        const currentOrders = stats._count.id;
        const avgOrderValue = stats._avg.totalAmount ?? 0;

        // Simple elasticity model: 1% price decrease → ~1.5% order increase (inelastic)
        const elasticity = 1.5;
        const orderChangePct = -changePct * elasticity; // negative price → positive orders
        const newOrders = Math.round(currentOrders * (1 + orderChangePct / 100));
        const newAvgOrder = avgOrderValue * (1 + changePct / 100);
        const newRevenue = newOrders * newAvgOrder;

        // Profit changes: margin shrinks when price drops
        const currentMargin = currentRevenue > 0 ? currentProfit / currentRevenue : 0.3;
        const newMarginRate = Math.max(0.05, currentMargin + (changePct / 100) * 0.7);
        const newProfit = newRevenue * newMarginRate;

        return NextResponse.json({
          scenario: "price_change",
          changePercent: changePct,
          current: {
            revenue: currentRevenue,
            profit: currentProfit,
            orders: currentOrders,
            avgOrderValue: Math.round(avgOrderValue),
            marginRate: Math.round(currentMargin * 1000) / 10,
          },
          projected: {
            revenue: Math.round(newRevenue),
            profit: Math.round(newProfit),
            orders: newOrders,
            avgOrderValue: Math.round(newAvgOrder),
            marginRate: Math.round(newMarginRate * 1000) / 10,
          },
          delta: {
            revenue: Math.round(newRevenue - currentRevenue),
            revenueText: `${newRevenue >= currentRevenue ? "+" : ""}${formatVND(newRevenue - currentRevenue)}đ`,
            profit: Math.round(newProfit - currentProfit),
            profitText: `${newProfit >= currentProfit ? "+" : ""}${formatVND(newProfit - currentProfit)}đ`,
            orders: newOrders - currentOrders,
            ordersText: `${newOrders >= currentOrders ? "+" : ""}${newOrders - currentOrders} đơn`,
          },
          assumption: `Mô hình: hệ số co giãn giá = ${elasticity} (giảm ${Math.abs(changePct)}% giá → tăng ~${Math.abs(Math.round(orderChangePct))}% đơn). Dữ liệu 30 ngày.`,
          dataSource: "sb_orders (30 ngày gần nhất)",
        });
      }

      case "ad_toggle": {
        // params: { channelToToggle: string } e.g. "facebook"
        const channel = (params.channelToToggle ?? "").toLowerCase();
        const sevenDaysAgo = daysAgo(7);

        const campaigns = await prisma.sbAdCampaign.findMany({
          where: { status: "ACTIVE" },
          include: {
            dailyStats: { where: { date: { gte: sevenDaysAgo } } },
          },
        });

        let channelSpent = 0;
        let channelRevenue = 0;
        let channelOrders = 0;
        let otherSpent = 0;
        let otherRevenue = 0;

        for (const c of campaigns) {
          const spent = c.dailyStats.reduce((s, d) => s + d.spent, 0);
          const revenue = c.dailyStats.reduce((s, d) => s + d.revenue, 0);
          const orders = c.dailyStats.reduce((s, d) => s + d.orders, 0);

          if (c.channel.toLowerCase().includes(channel)) {
            channelSpent += spent;
            channelRevenue += revenue;
            channelOrders += orders;
          } else {
            otherSpent += spent;
            otherRevenue += revenue;
          }
        }

        const totalSpent = channelSpent + otherSpent;
        const totalRevenue = channelRevenue + otherRevenue;

        return NextResponse.json({
          scenario: "ad_toggle",
          channel,
          current: {
            totalSpent: Math.round(totalSpent),
            totalRevenue: Math.round(totalRevenue),
            channelSpent: Math.round(channelSpent),
            channelRevenue: Math.round(channelRevenue),
            channelOrders,
            channelROAS: channelSpent > 0 ? Math.round((channelRevenue / channelSpent) * 100) / 100 : 0,
          },
          projected: {
            totalSpent: Math.round(otherSpent),
            totalRevenue: Math.round(otherRevenue),
            savedBudget: Math.round(channelSpent),
            lostRevenue: Math.round(channelRevenue),
            lostOrders: channelOrders,
            netSaving: Math.round(channelSpent - channelRevenue + (channelRevenue > channelSpent ? 0 : 0)),
          },
          delta: {
            spentText: `-${formatVND(channelSpent)}đ chi phí`,
            revenueText: `-${formatVND(channelRevenue)}đ doanh thu`,
            ordersText: `-${channelOrders} đơn/tuần`,
            netText: channelSpent > channelRevenue
              ? `Tiết kiệm ròng: +${formatVND(channelSpent - channelRevenue)}đ`
              : `Lỗ ròng: -${formatVND(channelRevenue - channelSpent)}đ`,
          },
          assumption: "Giả định: tắt kênh sẽ mất hoàn toàn doanh thu từ kênh đó. Thực tế ~20-30% khách có thể chuyển sang kênh khác.",
          dataSource: "sb_ad_campaigns, sb_ad_daily_stats (7 ngày)",
        });
      }

      default:
        return NextResponse.json({ error: `Unknown scenario: ${scenario}` }, { status: 400 });
    }
  } catch (error) {
    console.error("[Simulator API]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
