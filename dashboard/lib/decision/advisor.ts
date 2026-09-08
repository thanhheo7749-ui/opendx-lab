// ==============================================================================
// Decision Intelligence — Advisor Engine
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Generates actionable decision options based on real SQL data.
// ==============================================================================

import { prisma } from "@/lib/prisma";

// ── Types ──────────────────────────────────────────────────────────────────────

export type DecisionType = "inventory" | "pricing" | "adspend";

export interface DecisionOption {
  id: string;
  label: string;
  description: string;
  pros: string[];
  cons: string[];
  estimatedImpact: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  recommended: boolean;
}

export interface DecisionResult {
  type: DecisionType;
  title: string;
  context: string;
  dataSource: string;
  confidence: "Cao" | "Trung bình" | "Thấp";
  options: DecisionOption[];
  rawMetrics: Record<string, unknown>;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(n));

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ── Inventory Advisor ──────────────────────────────────────────────────────────

async function adviseInventory(): Promise<DecisionResult> {
  // Get products with inventory + recent sales velocity
  const products = await prisma.sbProduct.findMany({
    where: { isActive: true },
    include: {
      inventory: true,
    },
  });

  const thirtyDaysAgo = daysAgo(30);

  // Calculate sales velocity per product from order items
  const orderItems = await prisma.sbOrderItem.groupBy({
    by: ["productId"],
    where: {
      order: {
        orderDate: { gte: thirtyDaysAgo },
        status: "COMPLETED",
      },
    },
    _sum: { quantity: true },
    _count: { id: true },
  });

  const velocityMap = new Map(
    orderItems.map((oi) => [oi.productId, (oi._sum.quantity ?? 0) / 30])
  );

  // Categorize products
  const urgentRestock: { name: string; stock: number; dailySales: number; daysLeft: number; costToRestock: number }[] = [];
  const overstocked: { name: string; stock: number; dailySales: number; daysInStock: number; stuckCapital: number }[] = [];

  for (const p of products) {
    const stock = p.inventory?.quantity ?? 0;
    const dailySales = velocityMap.get(p.id) ?? 0;
    const daysLeft = dailySales > 0 ? Math.round(stock / dailySales) : 999;
    const daysInStock = p.inventory?.daysInStock ?? 0;

    if (dailySales > 0.5 && daysLeft < 7) {
      urgentRestock.push({
        name: p.name,
        stock,
        dailySales: Math.round(dailySales * 10) / 10,
        daysLeft,
        costToRestock: Math.round(dailySales * 30 * p.costPrice),
      });
    } else if (daysInStock > 30 && stock > 0) {
      overstocked.push({
        name: p.name,
        stock,
        dailySales: Math.round(dailySales * 10) / 10,
        daysInStock,
        stuckCapital: stock * p.costPrice,
      });
    }
  }

  const totalRestockCost = urgentRestock.reduce((s, r) => s + r.costToRestock, 0);
  const totalStuckCapital = overstocked.reduce((s, o) => s + o.stuckCapital, 0);

  const options: DecisionOption[] = [];

  if (urgentRestock.length > 0) {
    // Option A: Restock all urgent
    options.push({
      id: "restock_all",
      label: `Nhập gấp ${urgentRestock.length} SP sắp hết hàng`,
      description: `Các SP: ${urgentRestock.slice(0, 3).map(r => r.name).join(", ")}${urgentRestock.length > 3 ? ` (+${urgentRestock.length - 3} SP nữa)` : ""}. Nhập đủ cho 30 ngày bán.`,
      pros: [
        "Không mất doanh thu vì hết hàng",
        `Doanh thu dự kiến: +${formatVND(urgentRestock.reduce((s, r) => s + r.dailySales * 30 * 300000, 0))}đ/tháng`,
      ],
      cons: [
        `Cần vốn: ${formatVND(totalRestockCost)}đ`,
        "Rủi ro tồn kho nếu demand giảm",
      ],
      estimatedImpact: `+${formatVND(totalRestockCost * 0.3)}đ lợi nhuận/tháng`,
      riskLevel: "LOW",
      recommended: true,
    });

    // Option B: Restock top 3 only
    const top3 = urgentRestock.slice(0, 3);
    const top3Cost = top3.reduce((s, r) => s + r.costToRestock, 0);
    options.push({
      id: "restock_top3",
      label: `Chỉ nhập top 3 SP bán chạy nhất`,
      description: `${top3.map(r => r.name).join(", ")}. Tập trung vốn cho SP có tốc độ bán cao nhất.`,
      pros: [
        `Vốn cần ít hơn: ${formatVND(top3Cost)}đ`,
        "Tối ưu dòng tiền",
      ],
      cons: [
        `${urgentRestock.length - 3} SP khác có thể hết hàng`,
        "Mất doanh thu từ SP phụ",
      ],
      estimatedImpact: `+${formatVND(top3Cost * 0.3)}đ lợi nhuận/tháng`,
      riskLevel: "MEDIUM",
      recommended: false,
    });
  }

  if (overstocked.length > 0) {
    options.push({
      id: "clearance",
      label: `Xả ${overstocked.length} SP tồn kho > 30 ngày`,
      description: `Giảm 20-30% để giải phóng ${formatVND(totalStuckCapital)}đ vốn kẹt. SP: ${overstocked.slice(0, 3).map(o => o.name).join(", ")}.`,
      pros: [
        `Thu hồi ~${formatVND(totalStuckCapital * 0.7)}đ vốn`,
        "Giải phóng kho cho SP mới",
      ],
      cons: [
        "Giảm biên lợi nhuận trên SP này",
        "Khách có thể chờ sale tiếp",
      ],
      estimatedImpact: `Thu hồi ${formatVND(totalStuckCapital * 0.7)}đ vốn kẹt`,
      riskLevel: "LOW",
      recommended: overstocked.length >= 5,
    });
  }

  if (options.length === 0) {
    options.push({
      id: "maintain",
      label: "Giữ nguyên tồn kho hiện tại",
      description: "Tồn kho đang ổn, không có SP nào sắp hết hoặc tồn quá lâu.",
      pros: ["Không cần bỏ thêm vốn", "Dòng tiền ổn định"],
      cons: [],
      estimatedImpact: "Không thay đổi",
      riskLevel: "LOW",
      recommended: true,
    });
  }

  return {
    type: "inventory",
    title: "Nên nhập thêm hàng gì?",
    context: `Phân tích ${products.length} sản phẩm, dữ liệu bán hàng 30 ngày gần nhất.`,
    dataSource: "Bảng sb_products, sb_inventory, sb_order_items (30 ngày)",
    confidence: urgentRestock.length > 0 ? "Cao" : "Trung bình",
    options,
    rawMetrics: {
      totalProducts: products.length,
      urgentRestock: urgentRestock.length,
      overstocked: overstocked.length,
      totalRestockCost,
      totalStuckCapital,
      urgentItems: urgentRestock.slice(0, 5),
      overstockedItems: overstocked.slice(0, 5),
    },
  };
}

// ── Pricing Advisor ────────────────────────────────────────────────────────────

async function advisePricing(): Promise<DecisionResult> {
  // Get products with market trends
  const products = await prisma.sbProduct.findMany({
    where: { isActive: true },
    include: { inventory: true },
  });

  const trends = await prisma.sbMarketTrend.findMany({
    orderBy: { fetchedAt: "desc" },
    distinct: ["keyword"],
    take: 20,
  });

  const overpriced: { name: string; yourPrice: number; marketPrice: number; diffPct: number }[] = [];
  const underpriced: { name: string; yourPrice: number; marketPrice: number; diffPct: number }[] = [];

  for (const p of products) {
    const matchingTrend = trends.find((t) => {
      const pWords = p.name.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      const tWords = t.keyword.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      return pWords.filter(pw => tWords.some(tw => pw.includes(tw) || tw.includes(pw))).length >= 2;
    });

    if (!matchingTrend?.avgPrice || matchingTrend.avgPrice <= 0) continue;

    const diffPct = Math.round(((p.sellPrice - matchingTrend.avgPrice) / matchingTrend.avgPrice) * 100);

    if (diffPct > 15) {
      overpriced.push({ name: p.name, yourPrice: p.sellPrice, marketPrice: matchingTrend.avgPrice, diffPct });
    } else if (diffPct < -15) {
      underpriced.push({ name: p.name, yourPrice: p.sellPrice, marketPrice: matchingTrend.avgPrice, diffPct });
    }
  }

  const options: DecisionOption[] = [];

  if (overpriced.length > 0) {
    const potentialRevenueLoss = overpriced.reduce((s, p) => s + (p.yourPrice - p.marketPrice), 0);
    options.push({
      id: "reduce_overpriced",
      label: `Giảm giá ${overpriced.length} SP đắt hơn thị trường`,
      description: `${overpriced.slice(0, 3).map(p => `${p.name} (+${p.diffPct}%)`).join(", ")}. Hạ về ngang giá thị trường để tăng chuyển đổi.`,
      pros: [
        "Tăng tỷ lệ chuyển đổi (conversion rate)",
        "Cạnh tranh tốt hơn trên Shopee/Lazada",
      ],
      cons: [
        `Giảm biên LN ~${formatVND(potentialRevenueLoss)}đ/đơn`,
        "Khách cũ có thể phàn nàn giá cũ đắt",
      ],
      estimatedImpact: `Tăng ~15-25% đơn hàng cho ${overpriced.length} SP`,
      riskLevel: "MEDIUM",
      recommended: true,
    });

    options.push({
      id: "add_value",
      label: "Giữ giá nhưng thêm giá trị",
      description: `Thay vì giảm giá, thêm freeship, quà tặng hoặc bảo hành mở rộng cho ${overpriced.length} SP đắt hơn.`,
      pros: [
        "Giữ biên lợi nhuận",
        "Tạo sự khác biệt so với đối thủ",
      ],
      cons: [
        "Chi phí thêm cho quà/ship",
        "Hiệu quả chậm hơn giảm giá trực tiếp",
      ],
      estimatedImpact: "Tăng ~10-15% đơn hàng",
      riskLevel: "LOW",
      recommended: false,
    });
  }

  if (underpriced.length > 0) {
    options.push({
      id: "raise_underpriced",
      label: `Tăng giá ${underpriced.length} SP rẻ hơn thị trường`,
      description: `${underpriced.slice(0, 3).map(p => `${p.name} (${p.diffPct}%)`).join(", ")}. Bạn đang bán rẻ hơn — có thể tăng mà không giảm đơn.`,
      pros: [
        `Tăng biên LN ngay lập tức`,
        "Không ảnh hưởng nhiều đến đơn (vì vẫn ngang/rẻ hơn TT)",
      ],
      cons: [
        "Một số khách nhạy giá có thể chuyển đi",
      ],
      estimatedImpact: `+${formatVND(underpriced.length * 15000)}đ lợi nhuận/đơn`,
      riskLevel: "LOW",
      recommended: true,
    });
  }

  if (options.length === 0) {
    options.push({
      id: "maintain_pricing",
      label: "Giữ nguyên giá hiện tại",
      description: "Giá bạn đang ngang với thị trường — không cần điều chỉnh.",
      pros: ["Ổn định", "Không rủi ro"],
      cons: [],
      estimatedImpact: "Không thay đổi",
      riskLevel: "LOW",
      recommended: true,
    });
  }

  return {
    type: "pricing",
    title: "Nên điều chỉnh giá SP nào?",
    context: `So sánh ${products.length} SP với giá thị trường từ ${trends.length} keyword Google Shopping.`,
    dataSource: "Bảng sb_products, sb_market_trends (Google Shopping via SerpApi)",
    confidence: trends.length > 5 ? "Cao" : "Thấp",
    options,
    rawMetrics: {
      totalProducts: products.length,
      overpriced: overpriced.length,
      underpriced: underpriced.length,
      overpricedItems: overpriced.slice(0, 5),
      underpricedItems: underpriced.slice(0, 5),
    },
  };
}

// ── Ad Spend Advisor ───────────────────────────────────────────────────────────

async function adviseAdSpend(): Promise<DecisionResult> {
  const sevenDaysAgo = daysAgo(7);

  const campaigns = await prisma.sbAdCampaign.findMany({
    where: { status: "ACTIVE" },
    include: {
      dailyStats: {
        where: { date: { gte: sevenDaysAgo } },
      },
    },
  });

  const campaignMetrics = campaigns.map((c) => {
    const totalSpent = c.dailyStats.reduce((s, d) => s + d.spent, 0);
    const totalRevenue = c.dailyStats.reduce((s, d) => s + d.revenue, 0);
    const totalOrders = c.dailyStats.reduce((s, d) => s + d.orders, 0);
    const totalClicks = c.dailyStats.reduce((s, d) => s + d.clicks, 0);
    const roas = totalSpent > 0 ? Math.round((totalRevenue / totalSpent) * 100) / 100 : 0;
    const cpc = totalClicks > 0 ? Math.round(totalSpent / totalClicks) : 0;

    return { name: c.name, channel: c.channel, totalSpent, totalRevenue, totalOrders, roas, cpc };
  });

  const losers = campaignMetrics.filter((c) => c.roas < 1.0);
  const winners = campaignMetrics.filter((c) => c.roas >= 2.0);
  const totalWaste = losers.reduce((s, c) => s + c.totalSpent, 0);
  const totalWinnerSpent = winners.reduce((s, c) => s + c.totalSpent, 0);

  const options: DecisionOption[] = [];

  if (losers.length > 0) {
    options.push({
      id: "kill_losers",
      label: `Tắt ${losers.length} campaign lỗ (ROAS < 1.0)`,
      description: `${losers.map(l => `"${l.name}" (ROAS ${l.roas})`).join(", ")}. Đang chi nhiều hơn thu.`,
      pros: [
        `Tiết kiệm ngay ${formatVND(totalWaste)}đ/tuần`,
        "Tập trung budget cho kênh hiệu quả",
      ],
      cons: [
        `Mất ${losers.reduce((s, l) => s + l.totalOrders, 0)} đơn/tuần từ kênh này`,
        "Giảm brand awareness",
      ],
      estimatedImpact: `Tiết kiệm ${formatVND(totalWaste)}đ/tuần`,
      riskLevel: "LOW",
      recommended: true,
    });
  }

  if (winners.length > 0 && losers.length > 0) {
    options.push({
      id: "redistribute",
      label: "Chuyển budget từ kênh lỗ → kênh lãi",
      description: `Lấy ${formatVND(totalWaste)}đ từ campaign lỗ → đổ vào ${winners.map(w => `"${w.name}" (ROAS ${w.roas})`).join(", ")}.`,
      pros: [
        `Kênh lãi hiện có ROAS ${winners[0]?.roas} → có thể scale`,
        "Tổng budget không đổi",
      ],
      cons: [
        "Kênh lãi có thể giảm ROAS khi tăng budget",
        "Cần theo dõi sát 3-5 ngày đầu",
      ],
      estimatedImpact: `+${formatVND(totalWaste * ((winners[0]?.roas ?? 1) - 1))}đ doanh thu/tuần`,
      riskLevel: "MEDIUM",
      recommended: true,
    });
  }

  if (options.length === 0) {
    options.push({
      id: "maintain_ads",
      label: "Giữ nguyên phân bổ QC hiện tại",
      description: "Tất cả campaign đang có ROAS >= 1.0 — không có kênh lỗ.",
      pros: ["Ổn định", "Đang hiệu quả"],
      cons: [],
      estimatedImpact: "Không thay đổi",
      riskLevel: "LOW",
      recommended: true,
    });
  }

  return {
    type: "adspend",
    title: "Nên điều chỉnh QC kênh nào?",
    context: `Phân tích ${campaigns.length} campaign, dữ liệu 7 ngày gần nhất.`,
    dataSource: "Bảng sb_ad_campaigns, sb_ad_daily_stats (7 ngày)",
    confidence: campaigns.length > 0 ? "Cao" : "Thấp",
    options,
    rawMetrics: {
      totalCampaigns: campaigns.length,
      losers: losers.length,
      winners: winners.length,
      totalWaste,
      campaignDetails: campaignMetrics,
    },
  };
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function getDecisionAdvice(type: DecisionType): Promise<DecisionResult> {
  switch (type) {
    case "inventory":
      return adviseInventory();
    case "pricing":
      return advisePricing();
    case "adspend":
      return adviseAdSpend();
    default:
      throw new Error(`Unknown decision type: ${type}`);
  }
}

export async function getAllDecisions(): Promise<DecisionResult[]> {
  const [inventory, pricing, adspend] = await Promise.all([
    adviseInventory(),
    advisePricing(),
    adviseAdSpend(),
  ]);
  return [inventory, pricing, adspend];
}
