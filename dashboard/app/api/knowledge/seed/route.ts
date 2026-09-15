// ==============================================================================
// OpenDX-Lab Dashboard - API: Seed Knowledge Graph with Sample Data
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Creates realistic HR knowledge graph nodes and edges based on existing
// system context (departments, policies, processes).
// ==============================================================================

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireRole } from "@/lib/api-auth";

const prisma = new PrismaClient();

// ── Sample Data — ShopWise E-commerce Knowledge Graph ────────────────────────

const NODES = [
  // CATEGORY — Danh mục sản phẩm
  { type: "CATEGORY", name: "Áo", description: "Danh mục áo: áo khoác, áo thun, sơ mi, blazer, hoodie, cardigan. 15 SKU, chiếm ~35% doanh thu.", source: "system", sourceUrl: null },
  { type: "CATEGORY", name: "Quần", description: "Danh mục quần: jean, ống rộng, legging, jogger, culottes. 10 SKU, chiếm ~20% doanh thu.", source: "system", sourceUrl: null },
  { type: "CATEGORY", name: "Váy & Đầm", description: "Danh mục váy/đầm: midi, maxi, bodycon, babydoll, bút chì. 10 SKU, margin cao nhất (~60%).", source: "system", sourceUrl: null },
  { type: "CATEGORY", name: "Phụ kiện & Giày", description: "Túi, giày, sandal, mũ, kính, thắt lưng. 12 SKU, AOV thấp nhưng tần suất mua cao.", source: "system", sourceUrl: null },
  { type: "CATEGORY", name: "Set đồ", description: "Bộ áo+quần, áo+váy, đồ ngủ, thể thao. 5 SKU, giá trị đơn hàng trung bình cao nhất.", source: "system", sourceUrl: null },

  // CHANNEL — Kênh bán hàng
  { type: "CHANNEL", name: "Facebook", description: "Kênh bán chính: 30% đơn hàng. Chạy ads + inbox. Khách trung thành, AOV cao. Chi phí CPA trung bình 25k/đơn.", source: "system", sourceUrl: null },
  { type: "CHANNEL", name: "TikTok Shop", description: "Kênh tăng trưởng nhanh: 25% đơn. Livestream + short video. Khách trẻ 18-25, mua theo trend.", source: "system", sourceUrl: null },
  { type: "CHANNEL", name: "Shopee", description: "Sàn TMĐT lớn nhất: 25% đơn. Flash sale, voucher. Phí hoa hồng 5-8%. Cạnh tranh giá gay gắt.", source: "system", sourceUrl: null },
  { type: "CHANNEL", name: "Lazada", description: "Sàn TMĐT: 15% đơn. LazMall cho brand. Phí hoa hồng 4-6%. Khách hàng có thu nhập khá hơn.", source: "system", sourceUrl: null },
  { type: "CHANNEL", name: "Zalo", description: "Kênh bổ trợ: 5% đơn. OA + Mini App. Chăm sóc khách cũ, remarketing. Chi phí thấp nhất.", source: "system", sourceUrl: null },

  // SUPPLIER — Nhà cung cấp
  { type: "SUPPLIER", name: "Xưởng Tân Bình", description: "NCC chính tại TP.HCM. Giao nhanh 1 ngày. Chất lượng 4.8/5. Chuyên áo khoác, blazer.", source: "system", sourceUrl: null },
  { type: "SUPPLIER", name: "Công ty May Bình Dương", description: "NCC lớn tại Bình Dương. Giao 2 ngày. MOQ cao. Giá tốt cho đơn sỉ. Chuyên quần jean, ống rộng.", source: "system", sourceUrl: null },
  { type: "SUPPLIER", name: "NCC Đồng Nai Fabric", description: "Chuyên vải và phụ kiện. Giao 3 ngày. Rating 4.2/5. Nguồn cung nguyên liệu chính.", source: "system", sourceUrl: null },
  { type: "SUPPLIER", name: "Xưởng Hà Nội Textile", description: "NCC miền Bắc. Giao 5 ngày. Chất lượng cao 4.6/5. Chuyên set đồ linen, đầm lụa.", source: "system", sourceUrl: null },
  { type: "SUPPLIER", name: "NCC Đà Nẵng Fashion", description: "NCC miền Trung. Giao 4 ngày. Rating 4.0/5. Váy vintage, đầm boho.", source: "system", sourceUrl: null },

  // PRODUCT — Top sản phẩm bán chạy
  { type: "PRODUCT", name: "Áo khoác denim nữ (AO-001)", description: "Bestseller #1. Giá bán 450k, margin 60%. Bán ~120 cái/tháng. Trend score: 85/100.", source: "auto", sourceUrl: null },
  { type: "PRODUCT", name: "Váy hoa vintage midi (VA-001)", description: "Bestseller #2. Giá bán 350k, margin 63%. Trend đang tăng mạnh +120%. Mùa hè đặc biệt hot.", source: "auto", sourceUrl: null },
  { type: "PRODUCT", name: "Quần jean baggy (QU-001)", description: "Bestseller #3. Giá bán 380k, margin 61%. Ổn định quanh năm. Kênh Shopee bán mạnh nhất.", source: "auto", sourceUrl: null },
  { type: "PRODUCT", name: "Đầm babydoll xoè (VA-008)", description: "Top 5 SP. Giá bán 260k, margin 62%. Trend tăng +80%. TikTok Shop là kênh chủ lực.", source: "auto", sourceUrl: null },
  { type: "PRODUCT", name: "Set bộ áo quần linen (ST-001)", description: "AOV cao nhất 500k, margin 60%. Khách VIP mua nhiều. Chủ yếu qua Facebook.", source: "auto", sourceUrl: null },
  { type: "PRODUCT", name: "Áo blazer oversized (AO-005)", description: "Giá bán 550k — SP đắt nhất. Margin 64%. Bán chậm nhưng lợi nhuận/SP cao.", source: "auto", sourceUrl: null },

  // SEGMENT — Phân khúc khách hàng
  { type: "SEGMENT", name: "Khách Super VIP", description: "Chi tiêu >5 triệu. Chiếm ~5% KH nhưng ~25% doanh thu. Mua qua Facebook/Zalo. Cần chăm sóc riêng.", source: "auto", sourceUrl: null },
  { type: "SEGMENT", name: "Khách VIP", description: "Chi tiêu 2-5 triệu. ~15% KH, ~35% doanh thu. Đa kênh. Quan tâm chất lượng hơn giá.", source: "auto", sourceUrl: null },
  { type: "SEGMENT", name: "Khách mới & Bình thường", description: "Chi tiêu <2 triệu. ~80% KH, ~40% doanh thu. Phần lớn từ Shopee/TikTok. Nhạy cảm về giá.", source: "auto", sourceUrl: null },

  // STRATEGY — Chiến lược kinh doanh
  { type: "STRATEGY", name: "Chiến lược Nhập hàng", description: "Nhập theo batch 2 tuần/lần. Ưu tiên SP trend score >70. Giữ tồn kho tối đa 30 ngày. Xử lý hàng chậm bằng giảm giá.", source: "system", sourceUrl: null },
  { type: "STRATEGY", name: "Chiến lược Giá", description: "Markup 2.5-3x giá gốc. Flash sale tối đa giảm 15%. Giá Shopee/Lazada cộng thêm phí sàn. Giá FB/Zalo linh hoạt.", source: "system", sourceUrl: null },
  { type: "STRATEGY", name: "Chiến lược Quảng cáo", description: "Budget 15-20 triệu/tháng. Facebook 40%, TikTok 35%, Google 25%. Dừng campaign ROAS <1.5. Scale campaign ROAS >3.", source: "system", sourceUrl: null },
  { type: "STRATEGY", name: "Chiến lược Khách hàng", description: "Upsell khách VIP qua Zalo OA. Remarketing 7 ngày sau mua. Giảm 10% đơn thứ 2. Loyalty program từ đơn thứ 5.", source: "system", sourceUrl: null },
];

// Edge definitions: [sourceName, targetName, relation, weight]
const EDGES: [string, string, string, number][] = [
  // Product → Category
  ["Áo khoác denim nữ (AO-001)", "Áo", "BELONGS_TO", 1.0],
  ["Áo blazer oversized (AO-005)", "Áo", "BELONGS_TO", 1.0],
  ["Quần jean baggy (QU-001)", "Quần", "BELONGS_TO", 1.0],
  ["Váy hoa vintage midi (VA-001)", "Váy & Đầm", "BELONGS_TO", 1.0],
  ["Đầm babydoll xoè (VA-008)", "Váy & Đầm", "BELONGS_TO", 1.0],
  ["Set bộ áo quần linen (ST-001)", "Set đồ", "BELONGS_TO", 1.0],

  // Product → Supplier (ai cung cấp SP nào)
  ["Áo khoác denim nữ (AO-001)", "Xưởng Tân Bình", "SUPPLIED_BY", 0.9],
  ["Áo khoác denim nữ (AO-001)", "Công ty May Bình Dương", "SUPPLIED_BY", 0.7],
  ["Áo blazer oversized (AO-005)", "Xưởng Tân Bình", "SUPPLIED_BY", 0.9],
  ["Quần jean baggy (QU-001)", "Công ty May Bình Dương", "SUPPLIED_BY", 1.0],
  ["Quần jean baggy (QU-001)", "NCC Đồng Nai Fabric", "SUPPLIED_BY", 0.6],
  ["Váy hoa vintage midi (VA-001)", "NCC Đà Nẵng Fashion", "SUPPLIED_BY", 0.9],
  ["Đầm babydoll xoè (VA-008)", "NCC Đà Nẵng Fashion", "SUPPLIED_BY", 0.8],
  ["Đầm babydoll xoè (VA-008)", "Xưởng Hà Nội Textile", "SUPPLIED_BY", 0.7],
  ["Set bộ áo quần linen (ST-001)", "Xưởng Hà Nội Textile", "SUPPLIED_BY", 1.0],

  // Channel → Product (kênh nào bán SP nào mạnh)
  ["Facebook", "Set bộ áo quần linen (ST-001)", "SELLS", 0.9],
  ["Facebook", "Áo blazer oversized (AO-005)", "SELLS", 0.8],
  ["TikTok Shop", "Đầm babydoll xoè (VA-008)", "SELLS", 0.9],
  ["TikTok Shop", "Áo khoác denim nữ (AO-001)", "SELLS", 0.7],
  ["Shopee", "Quần jean baggy (QU-001)", "SELLS", 0.9],
  ["Shopee", "Váy hoa vintage midi (VA-001)", "SELLS", 0.8],
  ["Lazada", "Áo blazer oversized (AO-005)", "SELLS", 0.7],
  ["Zalo", "Set bộ áo quần linen (ST-001)", "SELLS", 0.6],

  // Segment → Channel (khách nào mua ở đâu)
  ["Khách Super VIP", "Facebook", "PREFERS", 0.9],
  ["Khách Super VIP", "Zalo", "PREFERS", 0.8],
  ["Khách VIP", "Facebook", "PREFERS", 0.7],
  ["Khách VIP", "Shopee", "PREFERS", 0.6],
  ["Khách mới & Bình thường", "TikTok Shop", "PREFERS", 0.9],
  ["Khách mới & Bình thường", "Shopee", "PREFERS", 0.8],

  // Strategy → Category
  ["Chiến lược Nhập hàng", "Áo", "GOVERNS", 0.8],
  ["Chiến lược Nhập hàng", "Váy & Đầm", "GOVERNS", 0.9],
  ["Chiến lược Giá", "Phụ kiện & Giày", "GOVERNS", 0.7],
  ["Chiến lược Giá", "Set đồ", "GOVERNS", 0.8],
  ["Chiến lược Quảng cáo", "Facebook", "RELATES_TO", 0.9],
  ["Chiến lược Quảng cáo", "TikTok Shop", "RELATES_TO", 0.9],
  ["Chiến lược Khách hàng", "Khách Super VIP", "RELATES_TO", 1.0],
  ["Chiến lược Khách hàng", "Khách VIP", "RELATES_TO", 0.9],

  // Supplier → Category (NCC chuyên danh mục nào)
  ["Xưởng Tân Bình", "Áo", "SUPPLIES", 0.9],
  ["Công ty May Bình Dương", "Quần", "SUPPLIES", 0.9],
  ["NCC Đà Nẵng Fashion", "Váy & Đầm", "SUPPLIES", 0.8],
  ["Xưởng Hà Nội Textile", "Set đồ", "SUPPLIES", 0.9],
  ["NCC Đồng Nai Fabric", "Phụ kiện & Giày", "SUPPLIES", 0.7],
];

// Sample chunks (content snippets for RAG)
const CHUNKS: Record<string, string[]> = {
  "Chiến lược Nhập hàng": [
    "Quy tắc nhập hàng: Kiểm tra tồn kho mỗi tuần. SP có tồn kho <10 cái và bán >5 cái/tuần → nhập gấp. Ưu tiên NCC có leadtime ngắn nhất.",
    "Hàng tồn kho >30 ngày cần giảm giá 15-20% để xả. Hàng tồn >60 ngày giảm 30-50%. Không nhập thêm SP có trend score <40.",
    "Batch nhập: 2 tuần/lần vào thứ 2. Đặt hàng NCC chính trước 3 ngày. Kiểm tra chất lượng mẫu trước khi nhập sỉ.",
  ],
  "Chiến lược Quảng cáo": [
    "Budget phân bổ: Facebook 40% (8tr), TikTok 35% (7tr), Google 25% (5tr). Review ROAS hàng ngày. Campaign ROAS <1.0 sau 3 ngày → dừng.",
    "Facebook Ads: Target nữ 22-35, sở thích thời trang. Dùng Carousel + Video 15s. A/B test 3 creatives/campaign.",
    "TikTok Ads: Spark Ads từ video organic có engagement cao. Livestream 3 buổi/tuần (T3, T5, CN tối 20h). Budget livestream 200k/buổi.",
  ],
  "Áo khoác denim nữ (AO-001)": [
    "Bestseller liên tục 6 tháng. Giá gốc 180k, bán 450k, margin 60%. Bán trung bình 4 cái/ngày. Mùa đông tăng lên 8 cái/ngày.",
    "Nhập từ Xưởng Tân Bình (giá 180k, ship 20k, giao 1 ngày) hoặc Bình Dương (giá 165k, ship 50k, giao 2 ngày). Ưu tiên Tân Bình cho đơn gấp.",
  ],
  "Khách Super VIP": [
    "5% tổng KH nhưng 25% doanh thu. AOV trung bình 1.2 triệu/đơn. Tần suất mua: 2-3 lần/tháng. Kênh chính: Facebook inbox + Zalo.",
    "Chăm sóc: inbox riêng, gửi hàng mới trước khi đăng shop, giảm 10% cố định, free ship. Tặng quà sinh nhật.",
  ],
};

// ── Handler ──────────────────────────────────────────────────────────────────

export async function POST() {
  const authResult = await requireRole("admin");
  if (!authResult.ok) return authResult.response;

  try {
    // Check if data already exists — clear it to replace with fresh data
    const existing = await prisma.kgNode.count();
    if (existing > 0) {
      console.log(`[knowledge/seed] Clearing ${existing} existing nodes...`);
    }

    // Clear existing data
    await prisma.kgChunk.deleteMany();
    await prisma.kgEdge.deleteMany();
    await prisma.kgNode.deleteMany();

    // Create nodes
    const nodeMap = new Map<string, string>(); // name → id

    for (const node of NODES) {
      const created = await prisma.kgNode.create({
        data: {
          type: node.type,
          name: node.name,
          description: node.description,
          source: node.source,
          sourceUrl: node.sourceUrl,
          metadata: {},
        },
      });
      nodeMap.set(node.name, created.id);
    }

    // Create edges
    let edgeCount = 0;
    for (const [sourceName, targetName, relation, weight] of EDGES) {
      const sourceId = nodeMap.get(sourceName);
      const targetId = nodeMap.get(targetName);
      if (sourceId && targetId) {
        await prisma.kgEdge.create({
          data: { sourceId, targetId, relation, weight, metadata: {} },
        });
        edgeCount++;
      }
    }

    // Create chunks (without embeddings for now)
    let chunkCount = 0;
    for (const [nodeName, chunks] of Object.entries(CHUNKS)) {
      const nodeId = nodeMap.get(nodeName);
      if (!nodeId) continue;

      for (let i = 0; i < chunks.length; i++) {
        await prisma.kgChunk.create({
          data: {
            nodeId,
            content: chunks[i],
            chunkIndex: i,
            tokenCount: Math.ceil(chunks[i].length / 4), // Rough estimate
          },
        });
        chunkCount++;
      }
    }

    return NextResponse.json({
      message: `Đã tạo ${nodeMap.size} nodes, ${edgeCount} edges, ${chunkCount} chunks thành công!`,
      stats: {
        nodes: nodeMap.size,
        edges: edgeCount,
        chunks: chunkCount,
      },
    });
  } catch (err) {
    console.error("[knowledge/seed] Error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
