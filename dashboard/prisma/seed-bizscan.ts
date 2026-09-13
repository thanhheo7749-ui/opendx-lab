// ==============================================================================
// BizScan — Seed Script: Generate 6 months of realistic business data
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Usage: npx tsx prisma/seed-bizscan.ts
// ==============================================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── Utilities ──────────────────────────────────────────────────────────────────

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// ── Vietnamese Data ────────────────────────────────────────────────────────────

const LAST_NAMES = [
  "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ",
  "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý",
];

const MIDDLE_NAMES = [
  "Thị", "Văn", "Minh", "Hoàng", "Thanh", "Đức", "Quốc", "Ngọc",
  "Hữu", "Phương", "Kim", "Xuân", "Hồng", "Bảo", "Tuấn",
];

const FIRST_NAMES = [
  "Mai", "Hương", "Lan", "Hoa", "Linh", "Trang", "Thảo", "Hằng",
  "Dung", "Yến", "Hùng", "Tuấn", "Đức", "Minh", "Phong", "Long",
  "Bình", "An", "Khoa", "Huy", "Thy", "Ngân", "Vy", "Trinh",
];

const CHANNELS = ["facebook", "tiktok", "shopee", "lazada", "zalo"];
const CHANNEL_WEIGHTS = [0.30, 0.25, 0.25, 0.15, 0.05]; // Distribution

function weightedRandomChannel(): string {
  const r = Math.random();
  let cumulative = 0;
  for (let i = 0; i < CHANNELS.length; i++) {
    cumulative += CHANNEL_WEIGHTS[i];
    if (r <= cumulative) return CHANNELS[i];
  }
  return CHANNELS[0];
}

function generateVietnameseName(): string {
  return `${randomPick(LAST_NAMES)} ${randomPick(MIDDLE_NAMES)} ${randomPick(FIRST_NAMES)}`;
}

function generatePhone(): string {
  const prefixes = ["09", "03", "07", "08", "05"];
  return `${randomPick(prefixes)}${randomInt(10000000, 99999999)}`;
}

// ── Product Catalog ────────────────────────────────────────────────────────────

interface ProductDef {
  name: string;
  sku: string;
  category: string;
  costPrice: number;
  sellPrice: number;
}

const PRODUCTS: ProductDef[] = [
  // Áo (20)
  { name: "Áo khoác denim nữ", sku: "AO-001", category: "Áo", costPrice: 180000, sellPrice: 450000 },
  { name: "Áo thun basic cotton", sku: "AO-002", category: "Áo", costPrice: 50000, sellPrice: 150000 },
  { name: "Áo sơ mi lụa công sở", sku: "AO-003", category: "Áo", costPrice: 120000, sellPrice: 350000 },
  { name: "Áo croptop rib tay ngắn", sku: "AO-004", category: "Áo", costPrice: 40000, sellPrice: 120000 },
  { name: "Áo blazer oversized", sku: "AO-005", category: "Áo", costPrice: 200000, sellPrice: 550000 },
  { name: "Áo hoodie unisex", sku: "AO-006", category: "Áo", costPrice: 130000, sellPrice: 320000 },
  { name: "Áo polo cổ bẻ", sku: "AO-007", category: "Áo", costPrice: 80000, sellPrice: 220000 },
  { name: "Áo len dệt kim cổ lọ", sku: "AO-008", category: "Áo", costPrice: 110000, sellPrice: 290000 },
  { name: "Áo cardigan dáng dài", sku: "AO-009", category: "Áo", costPrice: 150000, sellPrice: 380000 },
  { name: "Áo tank top thể thao", sku: "AO-010", category: "Áo", costPrice: 35000, sellPrice: 100000 },
  { name: "Áo phông in hoạ tiết", sku: "AO-011", category: "Áo", costPrice: 55000, sellPrice: 160000 },
  { name: "Áo khoác gió nhẹ", sku: "AO-012", category: "Áo", costPrice: 140000, sellPrice: 350000 },
  { name: "Áo babydoll xoè", sku: "AO-013", category: "Áo", costPrice: 70000, sellPrice: 190000 },
  { name: "Áo vest công sở nữ", sku: "AO-014", category: "Áo", costPrice: 160000, sellPrice: 420000 },
  { name: "Áo cổ vuông vintage", sku: "AO-015", category: "Áo", costPrice: 75000, sellPrice: 200000 },
  // Quần (15)
  { name: "Quần jean baggy", sku: "QU-001", category: "Quần", costPrice: 150000, sellPrice: 380000 },
  { name: "Quần ống rộng linen", sku: "QU-002", category: "Quần", costPrice: 120000, sellPrice: 300000 },
  { name: "Quần legging thể thao", sku: "QU-003", category: "Quần", costPrice: 60000, sellPrice: 180000 },
  { name: "Quần short jean rách", sku: "QU-004", category: "Quần", costPrice: 80000, sellPrice: 220000 },
  { name: "Quần tây công sở nữ", sku: "QU-005", category: "Quần", costPrice: 130000, sellPrice: 320000 },
  { name: "Quần jogger kaki", sku: "QU-006", category: "Quần", costPrice: 100000, sellPrice: 260000 },
  { name: "Quần culottes vải đũi", sku: "QU-007", category: "Quần", costPrice: 110000, sellPrice: 280000 },
  { name: "Quần biker shorts", sku: "QU-008", category: "Quần", costPrice: 45000, sellPrice: 130000 },
  { name: "Quần jean skinny co giãn", sku: "QU-009", category: "Quần", costPrice: 140000, sellPrice: 350000 },
  { name: "Quần ống suông kẻ sọc", sku: "QU-010", category: "Quần", costPrice: 115000, sellPrice: 290000 },
  // Váy & Đầm (15)
  { name: "Váy hoa vintage midi", sku: "VA-001", category: "Váy", costPrice: 130000, sellPrice: 350000 },
  { name: "Đầm maxi boho", sku: "VA-002", category: "Đầm", costPrice: 180000, sellPrice: 450000 },
  { name: "Váy tennis xếp ly", sku: "VA-003", category: "Váy", costPrice: 80000, sellPrice: 220000 },
  { name: "Đầm bodycon tay dài", sku: "VA-004", category: "Đầm", costPrice: 120000, sellPrice: 320000 },
  { name: "Váy chữ A tweed", sku: "VA-005", category: "Váy", costPrice: 150000, sellPrice: 400000 },
  { name: "Đầm sơ mi cổ đức", sku: "VA-006", category: "Đầm", costPrice: 140000, sellPrice: 380000 },
  { name: "Váy bút chì công sở", sku: "VA-007", category: "Váy", costPrice: 110000, sellPrice: 290000 },
  { name: "Đầm babydoll xoè", sku: "VA-008", category: "Đầm", costPrice: 100000, sellPrice: 260000 },
  { name: "Váy jean dáng suông", sku: "VA-009", category: "Váy", costPrice: 130000, sellPrice: 340000 },
  { name: "Đầm linen cổ vuông", sku: "VA-010", category: "Đầm", costPrice: 160000, sellPrice: 420000 },
  // Phụ kiện (15)
  { name: "Túi xách tote canvas", sku: "PK-001", category: "Túi", costPrice: 60000, sellPrice: 180000 },
  { name: "Túi đeo chéo mini", sku: "PK-002", category: "Túi", costPrice: 80000, sellPrice: 220000 },
  { name: "Balo học sinh ulzzang", sku: "PK-003", category: "Túi", costPrice: 100000, sellPrice: 260000 },
  { name: "Giày sneaker trắng", sku: "PK-004", category: "Giày", costPrice: 180000, sellPrice: 450000 },
  { name: "Giày cao gót 5cm", sku: "PK-005", category: "Giày", costPrice: 150000, sellPrice: 380000 },
  { name: "Sandal quai ngang", sku: "PK-006", category: "Giày", costPrice: 70000, sellPrice: 190000 },
  { name: "Dép lê quai chéo", sku: "PK-007", category: "Giày", costPrice: 40000, sellPrice: 120000 },
  { name: "Mũ bucket hat", sku: "PK-008", category: "Phụ kiện", costPrice: 30000, sellPrice: 90000 },
  { name: "Kính mát thời trang", sku: "PK-009", category: "Phụ kiện", costPrice: 50000, sellPrice: 150000 },
  { name: "Thắt lưng da PU", sku: "PK-010", category: "Phụ kiện", costPrice: 40000, sellPrice: 120000 },
  { name: "Khăn choàng lụa", sku: "PK-011", category: "Phụ kiện", costPrice: 60000, sellPrice: 170000 },
  { name: "Vớ tất dài hoạ tiết", sku: "PK-012", category: "Phụ kiện", costPrice: 15000, sellPrice: 50000 },
  // Set đồ (10)
  { name: "Set bộ áo quần linen", sku: "ST-001", category: "Set đồ", costPrice: 200000, sellPrice: 500000 },
  { name: "Set váy áo công sở", sku: "ST-002", category: "Set đồ", costPrice: 250000, sellPrice: 600000 },
  { name: "Set đồ ngủ lụa", sku: "ST-003", category: "Set đồ", costPrice: 120000, sellPrice: 300000 },
  { name: "Set croptop + chân váy", sku: "ST-004", category: "Set đồ", costPrice: 140000, sellPrice: 350000 },
  { name: "Set thể thao nữ", sku: "ST-005", category: "Set đồ", costPrice: 160000, sellPrice: 400000 },
];

// ── Ad Campaign Templates ──────────────────────────────────────────────────────

interface CampaignDef {
  name: string;
  channel: string;
  dailyBudget: number;
  isWasteful: boolean; // For anomaly detection
}

const AD_CAMPAIGNS: CampaignDef[] = [
  // Facebook (10)
  { name: "FB - Áo khoác mùa đông", channel: "facebook", dailyBudget: 500000, isWasteful: false },
  { name: "FB - Flash Sale cuối tuần", channel: "facebook", dailyBudget: 800000, isWasteful: false },
  { name: "FB - Váy hoa vintage HOT", channel: "facebook", dailyBudget: 300000, isWasteful: false },
  { name: "FB - Retarget khách cũ", channel: "facebook", dailyBudget: 200000, isWasteful: false },
  { name: "FB - Brand Awareness", channel: "facebook", dailyBudget: 1000000, isWasteful: true }, // Đốt tiền
  { name: "FB - Quần jean bestseller", channel: "facebook", dailyBudget: 400000, isWasteful: false },
  { name: "FB - Set đồ công sở", channel: "facebook", dailyBudget: 350000, isWasteful: false },
  { name: "FB - Phụ kiện giá rẻ", channel: "facebook", dailyBudget: 200000, isWasteful: true }, // Đốt tiền
  // TikTok (7)
  { name: "TT - Áo croptop viral", channel: "tiktok", dailyBudget: 600000, isWasteful: false },
  { name: "TT - Summer Collection", channel: "tiktok", dailyBudget: 700000, isWasteful: true }, // Đốt tiền
  { name: "TT - Đầm babydoll trend", channel: "tiktok", dailyBudget: 400000, isWasteful: false },
  { name: "TT - Live shopping push", channel: "tiktok", dailyBudget: 500000, isWasteful: false },
  { name: "TT - Giày sneaker HOT", channel: "tiktok", dailyBudget: 350000, isWasteful: false },
  // Google (5)
  { name: "GG - Shopping quần áo nữ", channel: "google", dailyBudget: 400000, isWasteful: false },
  { name: "GG - Search áo khoác", channel: "google", dailyBudget: 300000, isWasteful: false },
  { name: "GG - Display retarget", channel: "google", dailyBudget: 250000, isWasteful: true }, // Đốt tiền
];

// ── Seed Functions ─────────────────────────────────────────────────────────────

async function seedProducts() {
  console.log("📦 Seeding products...");
  const products = [];
  for (const p of PRODUCTS) {
    const product = await prisma.sbProduct.create({
      data: {
        name: p.name,
        sku: p.sku,
        category: p.category,
        costPrice: p.costPrice,
        sellPrice: p.sellPrice,
      },
    });
    products.push(product);
  }
  console.log(`   ✅ Created ${products.length} products`);
  return products;
}

async function seedCustomers() {
  console.log("👤 Seeding customers...");
  const customers = [];
  const usedPhones = new Set<string>();

  for (let i = 0; i < 500; i++) {
    let phone = generatePhone();
    while (usedPhones.has(phone)) phone = generatePhone();
    usedPhones.add(phone);

    const customer = await prisma.sbCustomer.create({
      data: {
        name: generateVietnameseName(),
        phone,
        email: i < 200 ? `customer${i}@gmail.com` : null,
        channel: weightedRandomChannel(),
      },
    });
    customers.push(customer);
  }
  console.log(`   ✅ Created ${customers.length} customers`);
  return customers;
}

async function seedInventory(productIds: string[]) {
  console.log("📦 Seeding inventory...");
  for (const productId of productIds) {
    const r = Math.random();
    let quantity: number;
    let daysInStock: number;

    if (r < 0.1) {
      // 10% sản phẩm hết hàng
      quantity = 0;
      daysInStock = randomInt(10, 60);
    } else if (r < 0.3) {
      // 20% sản phẩm tồn kho lâu (30-60 ngày) — cảnh báo
      quantity = randomInt(20, 200);
      daysInStock = randomInt(31, 60);
    } else {
      // 70% bình thường
      quantity = randomInt(5, 100);
      daysInStock = randomInt(1, 29);
    }

    await prisma.sbInventory.create({
      data: {
        productId,
        quantity,
        daysInStock,
        lastRestockAt: addDays(new Date(), -daysInStock),
      },
    });
  }
  console.log(`   ✅ Created inventory for ${productIds.length} products`);
}

async function seedOrders(
  productIds: string[],
  products: { id: string; costPrice: number; sellPrice: number }[],
  customerIds: string[],
  startDate: Date,
  days: number
) {
  console.log("🛒 Seeding orders...");
  let totalOrders = 0;

  const productMap = new Map(products.map((p) => [p.id, p]));

  for (let day = 0; day < days; day++) {
    const currentDate = addDays(startDate, day);
    const dayOfWeek = currentDate.getDay(); // 0=Sun, 6=Sat

    // Base orders per day: 30-80, weekends +30%
    let ordersToday = randomInt(30, 80);
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      ordersToday = Math.floor(ordersToday * 1.3);
    }

    // Simulate monthly sales events (ngày 11, 12 mỗi tháng → +50%)
    const dayOfMonth = currentDate.getDate();
    if (dayOfMonth === 11 || dayOfMonth === 12) {
      ordersToday = Math.floor(ordersToday * 1.5);
    }

    // Simulate a "dip" in the last 2 weeks (for anomaly detection)
    const daysFromEnd = days - day;
    if (daysFromEnd <= 14 && daysFromEnd > 7) {
      ordersToday = Math.floor(ordersToday * 0.65); // 35% drop
    }
    if (daysFromEnd <= 7) {
      ordersToday = Math.floor(ordersToday * 0.8); // Recovering
    }

    for (let o = 0; o < ordersToday; o++) {
      const customerId = randomPick(customerIds);
      const channel = weightedRandomChannel();
      const itemCount = randomInt(1, 3);

      // Random time during the day
      const orderDate = new Date(currentDate);
      orderDate.setHours(randomInt(6, 23), randomInt(0, 59), randomInt(0, 59));

      let totalAmount = 0;
      let totalCost = 0;
      const orderItems: { productId: string; quantity: number; unitPrice: number }[] = [];

      for (let i = 0; i < itemCount; i++) {
        const productId = randomPick(productIds);
        const product = productMap.get(productId)!;
        const quantity = randomInt(1, 2);
        const unitPrice = product.sellPrice;

        totalAmount += unitPrice * quantity;
        totalCost += product.costPrice * quantity;
        orderItems.push({ productId, quantity, unitPrice });
      }

      const discount = Math.random() < 0.2 ? Math.floor(totalAmount * randomFloat(0.05, 0.15)) : 0;
      const shippingFee = randomPick([0, 15000, 25000, 30000]);
      const profit = totalAmount - totalCost - discount;

      const status = Math.random() < 0.05 ? "CANCELLED" : Math.random() < 0.03 ? "RETURNED" : "COMPLETED";

      await prisma.sbOrder.create({
        data: {
          customerId,
          channel,
          status,
          totalAmount,
          shippingFee,
          discount,
          profit: status === "COMPLETED" ? profit : 0,
          orderDate,
          items: {
            create: orderItems,
          },
        },
      });

      totalOrders++;
    }

    // Progress every 30 days
    if (day % 30 === 0 && day > 0) {
      console.log(`   📅 Day ${day}/${days} — ${totalOrders} orders so far`);
    }
  }

  console.log(`   ✅ Created ${totalOrders} orders over ${days} days`);

  // Update customer stats
  console.log("   🔄 Updating customer stats...");
  const customerStats = await prisma.sbOrder.groupBy({
    by: ["customerId"],
    where: { status: "COMPLETED" },
    _count: { id: true },
    _sum: { totalAmount: true },
    _min: { orderDate: true },
    _max: { orderDate: true },
  });

  for (const stat of customerStats) {
    const totalSpent = stat._sum.totalAmount ?? 0;
    const tier = totalSpent > 5000000 ? "SUPER_VIP" : totalSpent > 2000000 ? "VIP" : "NORMAL";

    await prisma.sbCustomer.update({
      where: { id: stat.customerId },
      data: {
        totalSpent,
        orderCount: stat._count.id,
        firstPurchase: stat._min.orderDate,
        lastPurchase: stat._max.orderDate,
        tier,
      },
    });
  }
  console.log("   ✅ Customer stats updated");
}

async function seedAdCampaigns(startDate: Date, days: number) {
  console.log("📊 Seeding ad campaigns...");

  for (const def of AD_CAMPAIGNS) {
    const campaign = await prisma.sbAdCampaign.create({
      data: {
        name: def.name,
        channel: def.channel,
        status: "ACTIVE",
        dailyBudget: def.dailyBudget,
        startDate,
      },
    });

    // Generate daily stats
    const dailyStats = [];
    for (let day = 0; day < days; day++) {
      const date = addDays(startDate, day);
      const baseBudget = def.dailyBudget;

      // Wasteful campaigns: high spend, low orders
      let spent: number;
      let impressions: number;
      let clicks: number;
      let orders: number;
      let revenue: number;

      if (def.isWasteful) {
        spent = baseBudget * randomFloat(0.8, 1.2);
        impressions = randomInt(5000, 15000);
        clicks = randomInt(20, 80);
        orders = randomInt(0, 2); // Very few orders
        revenue = orders * randomFloat(150000, 400000);
      } else {
        spent = baseBudget * randomFloat(0.6, 1.0);
        impressions = randomInt(3000, 12000);
        clicks = randomInt(50, 300);
        orders = randomInt(3, 15);
        revenue = orders * randomFloat(200000, 600000);
      }

      // Last 2 weeks: wasteful campaigns get WORSE
      const daysFromEnd = days - day;
      if (daysFromEnd <= 14 && def.isWasteful) {
        spent *= 3; // 3x spending
        orders = randomInt(0, 1); // Even fewer orders
      }

      const cpc = clicks > 0 ? Math.round(spent / clicks) : 0;
      const roas = spent > 0 ? Math.round((revenue / spent) * 100) / 100 : 0;

      dailyStats.push({
        campaignId: campaign.id,
        date,
        spent,
        impressions,
        clicks,
        orders,
        revenue,
        cpc,
        roas,
      });
    }

    // Batch insert daily stats
    await prisma.sbAdDailyStat.createMany({ data: dailyStats });
  }

  console.log(`   ✅ Created ${AD_CAMPAIGNS.length} campaigns with ${days} days of stats each`);
}

async function seedMarketTrends() {
  console.log("🌐 Seeding market trends...");

  const trends = [
    { keyword: "áo khoác denim", trendScore: 85, changePercent: 45, avgPrice: 380000, competitorCount: 1200 },
    { keyword: "váy hoa vintage", trendScore: 92, changePercent: 120, avgPrice: 320000, competitorCount: 800 },
    { keyword: "áo croptop", trendScore: 35, changePercent: -35, avgPrice: 100000, competitorCount: 2500 },
    { keyword: "quần jean baggy", trendScore: 78, changePercent: 25, avgPrice: 350000, competitorCount: 1500 },
    { keyword: "đầm babydoll", trendScore: 88, changePercent: 80, avgPrice: 280000, competitorCount: 600 },
    { keyword: "set bộ linen", trendScore: 72, changePercent: 15, avgPrice: 480000, competitorCount: 400 },
    { keyword: "giày sneaker trắng", trendScore: 65, changePercent: -10, avgPrice: 420000, competitorCount: 3000 },
    { keyword: "túi xách tote canvas", trendScore: 58, changePercent: 5, avgPrice: 160000, competitorCount: 900 },
    { keyword: "áo blazer nữ", trendScore: 70, changePercent: 30, avgPrice: 500000, competitorCount: 700 },
    { keyword: "quần ống rộng", trendScore: 82, changePercent: 40, avgPrice: 290000, competitorCount: 1100 },
    { keyword: "đầm maxi boho", trendScore: 45, changePercent: -20, avgPrice: 420000, competitorCount: 500 },
    { keyword: "áo hoodie", trendScore: 40, changePercent: -25, avgPrice: 300000, competitorCount: 2000 },
  ];

  for (const t of trends) {
    await prisma.sbMarketTrend.create({
      data: {
        keyword: t.keyword,
        source: "seed_mock",
        searchVolume: randomInt(5000, 50000),
        trendScore: t.trendScore,
        changePercent: t.changePercent,
        avgPrice: t.avgPrice,
        competitorCount: t.competitorCount,
        snapshot: { source: "seed", note: "Initial mock data for demo" },
      },
    });
  }

  console.log(`   ✅ Created ${trends.length} market trends`);
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function seedSuppliers() {
  console.log("🏭 Seeding suppliers...");

  // Delete existing
  await prisma.sbSupplierProduct.deleteMany();
  await prisma.sbSupplier.deleteMany();

  const suppliers = [
    { name: "Xưởng Tân Bình", province: "TP.HCM", district: "Tân Bình", lat: 10.8012, lng: 106.6528, rating: 4.8, leadTimeDays: 1, minOrder: 500000, phone: "0901234567" },
    { name: "Công ty May Bình Dương", province: "Bình Dương", district: "Thuận An", lat: 10.9238, lng: 106.6526, rating: 4.5, leadTimeDays: 2, minOrder: 1000000, phone: "0912345678" },
    { name: "NCC Đồng Nai Fabric", province: "Đồng Nai", district: "Biên Hòa", lat: 10.9449, lng: 106.8315, rating: 4.2, leadTimeDays: 3, minOrder: 800000, phone: "0923456789" },
    { name: "Xưởng Hà Nội Textile", province: "Hà Nội", district: "Hoàng Mai", lat: 20.9816, lng: 105.8536, rating: 4.6, leadTimeDays: 5, minOrder: 2000000, phone: "0934567890" },
    { name: "NCC Đà Nẵng Fashion", province: "Đà Nẵng", district: "Hải Châu", lat: 16.0544, lng: 108.2022, rating: 4.0, leadTimeDays: 4, minOrder: 1500000, phone: "0945678901" },
    { name: "Xưởng Cần Thơ", province: "Cần Thơ", district: "Ninh Kiều", lat: 10.0341, lng: 105.7875, rating: 3.8, leadTimeDays: 3, minOrder: 600000, phone: "0956789012" },
  ];

  const createdSuppliers = [];
  for (const s of suppliers) {
    const created = await prisma.sbSupplier.create({ data: s });
    createdSuppliers.push(created);
  }

  // Link suppliers to products
  const products = await prisma.sbProduct.findMany({ where: { isActive: true } });

  for (const product of products) {
    // Each product gets 2-4 random suppliers
    const numSuppliers = randomInt(2, Math.min(4, createdSuppliers.length));
    const shuffled = [...createdSuppliers].sort(() => Math.random() - 0.5).slice(0, numSuppliers);

    for (const supplier of shuffled) {
      // Vary price: closer suppliers tend to be slightly more expensive (higher quality/faster)
      const baseCost = product.costPrice;
      const priceVariation = randomFloat(0.7, 1.3);
      const unitPrice = Math.round(baseCost * priceVariation);

      // Shipping cost depends on distance
      const isLocal = supplier.province === "TP.HCM";
      const isFar = supplier.province === "Hà Nội" || supplier.province === "Đà Nẵng";
      const shippingCost = isLocal ? randomInt(10000, 30000) : isFar ? randomInt(80000, 200000) : randomInt(30000, 80000);

      await prisma.sbSupplierProduct.create({
        data: {
          supplierId: supplier.id,
          productId: product.id,
          unitPrice,
          shippingCost,
          moq: randomInt(10, 100),
        },
      });
    }
  }

  console.log(`   ✅ Created ${createdSuppliers.length} suppliers, linked to ${products.length} products`);
}

async function main() {
  console.log("\n🔍 BizScan — Seed Script");
  console.log("========================\n");

  // Check if data already exists
  const existingProducts = await prisma.sbProduct.count();
  if (existingProducts > 0) {
    console.log("⚠️  BizScan data already exists. Clearing...");
    await prisma.sbMarketTrend.deleteMany();
    await prisma.sbScanFinding.deleteMany();
    await prisma.sbScanResult.deleteMany();
    await prisma.sbAdDailyStat.deleteMany();
    await prisma.sbAdCampaign.deleteMany();
    await prisma.sbOrderItem.deleteMany();
    await prisma.sbOrder.deleteMany();
    await prisma.sbInventory.deleteMany();
    await prisma.sbCustomer.deleteMany();
    await prisma.sbProduct.deleteMany();
    console.log("   ✅ Cleared existing data\n");
  }

  // Time range: 6 months ago → today
  const endDate = new Date();
  const startDate = addDays(endDate, -180);
  const days = 180;

  console.log(`📅 Data range: ${formatDate(startDate)} → ${formatDate(endDate)} (${days} days)\n`);

  // 1. Products
  const products = await seedProducts();
  const productIds = products.map((p) => p.id);

  // 2. Customers
  const customers = await seedCustomers();
  const customerIds = customers.map((c) => c.id);

  // 3. Orders (biggest part — 10,000+ orders)
  await seedOrders(productIds, products, customerIds, startDate, days);

  // 4. Inventory
  await seedInventory(productIds);

  // 5. Ad Campaigns
  await seedAdCampaigns(startDate, days);

  // 6. Market Trends
  await seedMarketTrends();

  // 7. Suppliers
  await seedSuppliers();

  // Summary
  const counts = {
    products: await prisma.sbProduct.count(),
    customers: await prisma.sbCustomer.count(),
    orders: await prisma.sbOrder.count(),
    orderItems: await prisma.sbOrderItem.count(),
    inventory: await prisma.sbInventory.count(),
    campaigns: await prisma.sbAdCampaign.count(),
    adStats: await prisma.sbAdDailyStat.count(),
    trends: await prisma.sbMarketTrend.count(),
    suppliers: await prisma.sbSupplier.count(),
    supplierProducts: await prisma.sbSupplierProduct.count(),
    vipCustomers: await prisma.sbCustomer.count({ where: { tier: { in: ["VIP", "SUPER_VIP"] } } }),
    completedOrders: await prisma.sbOrder.count({ where: { status: "COMPLETED" } }),
  };

  console.log("\n========================");
  console.log("📊 SEED SUMMARY:");
  console.log(`   📦 ${counts.products} products`);
  console.log(`   👤 ${counts.customers} customers (${counts.vipCustomers} VIP/Super VIP)`);
  console.log(`   🛒 ${counts.orders} orders (${counts.completedOrders} completed, ${counts.orderItems} items)`);
  console.log(`   📦 ${counts.inventory} inventory records`);
  console.log(`   📊 ${counts.campaigns} ad campaigns (${counts.adStats} daily stats)`);
  console.log(`   🌐 ${counts.trends} market trends`);
  console.log(`   🏭 ${counts.suppliers} suppliers (${counts.supplierProducts} product links)`);
  console.log("========================\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
