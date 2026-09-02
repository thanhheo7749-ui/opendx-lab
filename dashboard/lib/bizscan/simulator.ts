// ==============================================================================
// BizScan — Business Simulator
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Generates new orders/data every tick + periodically injects anomalies.
// ==============================================================================

import { prisma } from "@/lib/prisma";

// ── Helpers ────────────────────────────────────────────────────────────────────

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const CHANNELS = ["facebook", "tiktok", "shopee", "lazada", "zalo"];

// ── Simulator Tick ─────────────────────────────────────────────────────────────

export interface SimulatorTickResult {
  ordersCreated: number;
  inventoryUpdated: number;
  adStatsUpdated: number;
}

/**
 * Simulate a tick: create new orders, update inventory, update ad stats.
 * Should be called every 10 minutes.
 */
export async function simulateTick(): Promise<SimulatorTickResult> {
  // Get active products + customers
  const products = await prisma.sbProduct.findMany({
    where: { isActive: true },
    include: { inventory: true },
  });

  const customerIds = (
    await prisma.sbCustomer.findMany({ select: { id: true }, take: 200 })
  ).map((c) => c.id);

  const productsInStock = products.filter((p) => (p.inventory?.quantity ?? 0) > 0);
  if (productsInStock.length === 0 || customerIds.length === 0) {
    return { ordersCreated: 0, inventoryUpdated: 0, adStatsUpdated: 0 };
  }

  // Create 2-5 new orders
  const orderCount = randomInt(2, 5);
  let ordersCreated = 0;

  for (let i = 0; i < orderCount; i++) {
    const product = randomPick(productsInStock);
    const customerId = randomPick(customerIds);
    const quantity = randomInt(1, 2);
    const channel = randomPick(CHANNELS);
    const discount = Math.random() < 0.15 ? Math.floor(product.sellPrice * randomFloat(0.05, 0.1)) : 0;
    const totalAmount = product.sellPrice * quantity - discount;
    const profit = totalAmount - product.costPrice * quantity;

    await prisma.sbOrder.create({
      data: {
        customerId,
        channel,
        status: "COMPLETED",
        totalAmount,
        shippingFee: randomPick([0, 15000, 25000]),
        discount,
        profit,
        orderDate: new Date(),
        items: {
          create: {
            productId: product.id,
            quantity,
            unitPrice: product.sellPrice,
          },
        },
      },
    });

    // Decrease inventory
    if (product.inventory) {
      await prisma.sbInventory.update({
        where: { id: product.inventory.id },
        data: {
          quantity: Math.max(0, product.inventory.quantity - quantity),
        },
      });
    }

    // Update customer stats
    await prisma.sbCustomer.update({
      where: { id: customerId },
      data: {
        totalSpent: { increment: totalAmount },
        orderCount: { increment: 1 },
        lastPurchase: new Date(),
      },
    });

    ordersCreated++;
  }

  // Update ad daily stats for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const campaigns = await prisma.sbAdCampaign.findMany({
    where: { status: "ACTIVE" },
  });

  let adStatsUpdated = 0;
  for (const campaign of campaigns) {
    await prisma.sbAdDailyStat.upsert({
      where: {
        campaignId_date: { campaignId: campaign.id, date: today },
      },
      create: {
        campaignId: campaign.id,
        date: today,
        spent: campaign.dailyBudget * randomFloat(0.05, 0.1),
        impressions: randomInt(50, 200),
        clicks: randomInt(2, 20),
        orders: randomInt(0, 2),
        revenue: randomFloat(0, 300000),
        cpc: randomInt(1000, 8000),
        roas: randomFloat(0.2, 3.0),
      },
      update: {
        spent: { increment: campaign.dailyBudget * randomFloat(0.02, 0.05) },
        impressions: { increment: randomInt(30, 100) },
        clicks: { increment: randomInt(1, 10) },
        orders: { increment: Math.random() < 0.3 ? 1 : 0 },
        revenue: { increment: Math.random() < 0.3 ? randomFloat(100000, 500000) : 0 },
      },
    });
    adStatsUpdated++;
  }

  console.log(
    `[Simulator] Tick: ${ordersCreated} orders, ${adStatsUpdated} ad stats updated`
  );

  return {
    ordersCreated,
    inventoryUpdated: ordersCreated,
    adStatsUpdated,
  };
}

// ── Anomaly Injection ──────────────────────────────────────────────────────────

export type AnomalyType =
  | "REVENUE_DROP"
  | "AD_WASTE"
  | "STOCK_OUT"
  | "CUSTOMER_CHURN"
  | "MARGIN_SQUEEZE";

/**
 * Inject a specific anomaly into the data for testing/demo purposes.
 */
export async function injectAnomaly(
  type?: AnomalyType
): Promise<{ type: AnomalyType; message: string }> {
  const anomalyType = type ?? randomPick([
    "REVENUE_DROP",
    "AD_WASTE",
    "STOCK_OUT",
    "CUSTOMER_CHURN",
    "MARGIN_SQUEEZE",
  ] as AnomalyType[]);

  switch (anomalyType) {
    case "REVENUE_DROP": {
      // Cancel 50% of recent orders
      const recentOrders = await prisma.sbOrder.findMany({
        where: { orderDate: { gte: new Date(Date.now() - 3 * 86400000) } },
        take: 30,
      });
      const toCancel = recentOrders.slice(0, Math.floor(recentOrders.length * 0.5));
      for (const order of toCancel) {
        await prisma.sbOrder.update({
          where: { id: order.id },
          data: { status: "CANCELLED", profit: 0 },
        });
      }
      return {
        type: "REVENUE_DROP",
        message: `Đã huỷ ${toCancel.length} đơn hàng gần đây → Doanh thu sẽ giảm mạnh`,
      };
    }

    case "AD_WASTE": {
      // Triple the spending on a random campaign
      const campaign = await prisma.sbAdCampaign.findFirst({
        where: { status: "ACTIVE" },
      });
      if (campaign) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        await prisma.sbAdDailyStat.upsert({
          where: {
            campaignId_date: { campaignId: campaign.id, date: today },
          },
          create: {
            campaignId: campaign.id,
            date: today,
            spent: campaign.dailyBudget * 5,
            impressions: randomInt(5000, 10000),
            clicks: randomInt(10, 30),
            orders: 0,
            revenue: 0,
            cpc: randomInt(10000, 50000),
            roas: 0,
          },
          update: {
            spent: campaign.dailyBudget * 5,
            orders: 0,
            revenue: 0,
            roas: 0,
          },
        });
        return {
          type: "AD_WASTE",
          message: `Chiến dịch "${campaign.name}" chi tiêu tăng 5x, 0 đơn hàng`,
        };
      }
      return { type: "AD_WASTE", message: "Không có campaign active" };
    }

    case "STOCK_OUT": {
      // Set bestselling product to 0 stock
      const topProduct = await prisma.sbOrderItem.groupBy({
        by: ["productId"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 1,
      });
      if (topProduct[0]) {
        const product = await prisma.sbProduct.findUnique({
          where: { id: topProduct[0].productId },
        });
        await prisma.sbInventory.updateMany({
          where: { productId: topProduct[0].productId },
          data: { quantity: 0, daysInStock: 0 },
        });
        return {
          type: "STOCK_OUT",
          message: `Bestseller "${product?.name}" hết hàng (quantity = 0)`,
        };
      }
      return { type: "STOCK_OUT", message: "Không tìm thấy bestseller" };
    }

    case "CUSTOMER_CHURN": {
      // Set top VIP customers' last purchase to 60 days ago
      const topVIPs = await prisma.sbCustomer.findMany({
        where: { tier: { in: ["VIP", "SUPER_VIP"] } },
        orderBy: { totalSpent: "desc" },
        take: 10,
      });
      const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000);
      for (const vip of topVIPs) {
        await prisma.sbCustomer.update({
          where: { id: vip.id },
          data: { lastPurchase: sixtyDaysAgo },
        });
      }
      return {
        type: "CUSTOMER_CHURN",
        message: `${topVIPs.length} khách VIP hàng đầu ngừng mua hàng (60 ngày)`,
      };
    }

    case "MARGIN_SQUEEZE": {
      // Create orders with extreme discounts
      const products = await prisma.sbProduct.findMany({ take: 5 });
      const customer = await prisma.sbCustomer.findFirst();
      if (customer) {
        for (const product of products) {
          const discount = product.sellPrice * 0.5; // 50% off
          await prisma.sbOrder.create({
            data: {
              customerId: customer.id,
              channel: "shopee",
              status: "COMPLETED",
              totalAmount: product.sellPrice - discount,
              discount,
              profit: (product.sellPrice - discount) - product.costPrice,
              orderDate: new Date(),
              items: {
                create: {
                  productId: product.id,
                  quantity: 1,
                  unitPrice: product.sellPrice - discount,
                },
              },
            },
          });
        }
      }
      return {
        type: "MARGIN_SQUEEZE",
        message: `Tạo ${products.length} đơn hàng giảm giá 50% → Biên lợi nhuận giảm`,
      };
    }
  }
}
