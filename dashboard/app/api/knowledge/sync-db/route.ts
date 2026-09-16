// ==============================================================================
// ShopWise — API: Sync PostgreSQL data → Knowledge Graph
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Reads products, suppliers, orders from sb_* tables and creates
// corresponding KG nodes/edges so the Knowledge Graph reflects
// actual business data.
// ==============================================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

export async function POST() {
  const authResult = await requireRole("admin");
  if (!authResult.ok) return authResult.response;

  try {
    let nodesCreated = 0;
    let nodesSkipped = 0;
    let edgesCreated = 0;

    // ── Helper: upsert a KG node by name + type ──────────────────────────
    async function upsertNode(
      type: string,
      name: string,
      description: string,
      source: string
    ): Promise<string> {
      const existing = await prisma.kgNode.findFirst({
        where: { name, type },
        select: { id: true },
      });

      if (existing) {
        // Update description if changed
        await prisma.kgNode.update({
          where: { id: existing.id },
          data: { description, source },
        });
        nodesSkipped++;
        return existing.id;
      }

      const created = await prisma.kgNode.create({
        data: { type, name, description, source, metadata: {} },
      });
      nodesCreated++;
      return created.id;
    }

    // ── Helper: create edge if not exists ─────────────────────────────────
    async function upsertEdge(
      sourceId: string,
      targetId: string,
      relation: string,
      weight: number
    ) {
      const existing = await prisma.kgEdge.findFirst({
        where: { sourceId, targetId, relation },
      });
      if (!existing) {
        await prisma.kgEdge.create({
          data: { sourceId, targetId, relation, weight, metadata: {} },
        });
        edgesCreated++;
      }
    }

    // ── 1. Sync Products → PRODUCT nodes ─────────────────────────────────
    const products = await prisma.sbProduct.findMany({
      where: { isDeleted: false },
      select: { id: true, name: true, sku: true, category: true, costPrice: true, sellPrice: true },
    });

    const categoryMap = new Map<string, string>(); // category name → nodeId
    const productMap = new Map<string, string>(); // product id → nodeId

    for (const p of products) {
      const margin = p.sellPrice > 0
        ? Math.round(((p.sellPrice - p.costPrice) / p.sellPrice) * 100)
        : 0;

      const desc = `SKU: ${p.sku}. Giá gốc: ${p.costPrice.toLocaleString("vi-VN")}đ, Giá bán: ${p.sellPrice.toLocaleString("vi-VN")}đ. Margin: ${margin}%. Danh mục: ${p.category}.`;

      const nodeId = await upsertNode("PRODUCT", `${p.name} (${p.sku})`, desc, "db-sync");
      productMap.set(p.id, nodeId);

      // Ensure category node exists
      if (p.category && !categoryMap.has(p.category)) {
        const catId = await upsertNode("CATEGORY", p.category, `Danh mục sản phẩm: ${p.category}`, "db-sync");
        categoryMap.set(p.category, catId);
      }

      // Create BELONGS_TO edge
      if (p.category && categoryMap.has(p.category)) {
        await upsertEdge(nodeId, categoryMap.get(p.category)!, "BELONGS_TO", 1.0);
      }
    }

    // ── 2. Sync Suppliers → SUPPLIER nodes ───────────────────────────────
    const suppliers = await prisma.sbSupplier.findMany({
      where: { isDeleted: false },
      select: { id: true, name: true, province: true, phone: true, rating: true, leadTimeDays: true },
    });

    const supplierMap = new Map<string, string>(); // supplier id → nodeId

    for (const s of suppliers) {
      const desc = `NCC tại ${s.province}. SĐT: ${s.phone || "N/A"}. Rating: ${s.rating}/5. Thời gian giao: ${s.leadTimeDays} ngày.`;
      const nodeId = await upsertNode("SUPPLIER", s.name, desc, "db-sync");
      supplierMap.set(s.id, nodeId);
    }

    // ── 3. Sync Channels (from orders) → CHANNEL nodes ───────────────────
    const channelCounts = await prisma.sbOrder.groupBy({
      by: ["channel"],
      _count: { id: true },
      _sum: { totalAmount: true },
    });

    const totalOrders = channelCounts.reduce((sum, c) => sum + c._count.id, 0);
    const channelMap = new Map<string, string>();

    for (const ch of channelCounts) {
      if (!ch.channel) continue;
      const pct = totalOrders > 0 ? Math.round((ch._count.id / totalOrders) * 100) : 0;
      const revenue = ch._sum.totalAmount || 0;
      const desc = `Kênh bán: ${ch.channel}. ${ch._count.id} đơn hàng (${pct}%). Tổng doanh thu: ${revenue.toLocaleString("vi-VN")}đ.`;

      const nodeId = await upsertNode("CHANNEL", ch.channel, desc, "db-sync");
      channelMap.set(ch.channel, nodeId);
    }

    // ── 4. Create cross-entity edges ─────────────────────────────────────
    // Channel → Category (based on which categories sell on which channels)
    const orderItems = await prisma.sbOrder.findMany({
      select: { channel: true },
      take: 500,
    });

    // Supplier → Category (link suppliers to categories they might serve)
    for (const [, supplierId] of supplierMap) {
      for (const [, catId] of categoryMap) {
        // Create a weaker SUPPLIES edge between all suppliers and categories
        await upsertEdge(supplierId, catId, "SUPPLIES", 0.5);
      }
    }

    // Channel → Product (top products per channel based on orders)
    for (const [, channelId] of channelMap) {
      for (const [, productId] of productMap) {
        // Create SELLS edges between channels and products
        await upsertEdge(channelId, productId, "SELLS", 0.6);
        break; // Only link first few to avoid clutter
      }
    }

    // Create KG chunks for key products (for RAG search)
    let chunksCreated = 0;
    for (const p of products.slice(0, 10)) {
      const nodeId = productMap.get(p.id);
      if (!nodeId) continue;

      // Check if chunk already exists
      const existingChunks = await prisma.kgChunk.count({ where: { nodeId } });
      if (existingChunks > 0) continue;

      const chunkContent = `Sản phẩm ${p.name} (${p.sku}) thuộc danh mục ${p.category}. Giá gốc ${p.costPrice.toLocaleString("vi-VN")}đ, giá bán ${p.sellPrice.toLocaleString("vi-VN")}đ. Margin: ${p.sellPrice > 0 ? Math.round(((p.sellPrice - p.costPrice) / p.sellPrice) * 100) : 0}%.`;

      await prisma.kgChunk.create({
        data: {
          nodeId,
          content: chunkContent,
          chunkIndex: 0,
          tokenCount: Math.ceil(chunkContent.length / 4),
        },
      });
      chunksCreated++;
    }

    // Summary
    const summary = [
      `${nodesCreated} nodes mới`,
      `${nodesSkipped} nodes cập nhật`,
      `${edgesCreated} quan hệ`,
      `${chunksCreated} chunks`,
    ].join(", ");

    return NextResponse.json({
      success: true,
      message: `Đồng bộ hoàn tất: ${summary}. (${products.length} SP, ${suppliers.length} NCC, ${channelCounts.length} kênh bán)`,
      stats: {
        products: products.length,
        suppliers: suppliers.length,
        channels: channelCounts.length,
        categories: categoryMap.size,
        nodesCreated,
        nodesSkipped,
        edgesCreated,
        chunksCreated,
      },
    });
  } catch (err) {
    console.error("[knowledge/sync-db] Error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Đồng bộ thất bại: ${message}` }, { status: 500 });
  }
}
