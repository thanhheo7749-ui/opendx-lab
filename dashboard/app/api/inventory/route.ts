// ==============================================================================
// ShopWise — Inventory API
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// GET /api/inventory?filter=all|out|low|slow|ok
export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all";
    const search = searchParams.get("search") || "";

    // Get all products with inventory
    const products = await prisma.sbProduct.findMany({
      where: {
        isActive: true,
        ...(search ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { sku: { contains: search, mode: "insensitive" as const } },
          ],
        } : {}),
      },
      include: {
        inventory: true,
      },
      orderBy: { name: "asc" },
    });

    // Calculate sales velocity from last 30 days
    const thirtyDaysAgo = daysAgo(30);
    const salesData = await prisma.sbOrderItem.groupBy({
      by: ["productId"],
      where: {
        order: { orderDate: { gte: thirtyDaysAgo }, status: "COMPLETED" },
      },
      _sum: { quantity: true },
    });
    const velocityMap = new Map(
      salesData.map((s) => [s.productId, (s._sum.quantity ?? 0) / 30])
    );

    // Build inventory items
    const items = products.map((p) => {
      const stock = p.inventory?.quantity ?? 0;
      const dailySales = velocityMap.get(p.id) ?? 0;
      const daysLeft = dailySales > 0 ? Math.round(stock / dailySales) : stock > 0 ? 999 : 0;
      const daysInStock = p.inventory?.daysInStock ?? 0;
      const stockValue = stock * p.costPrice;

      let status: "out" | "low" | "slow" | "ok";
      if (stock === 0) status = "out";
      else if (daysLeft < 7) status = "low";
      else if (daysInStock > 30 && dailySales < 0.5) status = "slow";
      else status = "ok";

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        costPrice: p.costPrice,
        sellPrice: p.sellPrice,
        stock,
        dailySales: Math.round(dailySales * 10) / 10,
        daysLeft,
        daysInStock,
        stockValue,
        lastRestock: p.inventory?.lastRestockAt,
        inventoryId: p.inventory?.id,
        status,
      };
    });

    // Apply filter
    const filtered = filter === "all" ? items : items.filter((i) => i.status === filter);

    // KPI summary
    const kpi = {
      totalProducts: items.length,
      totalStock: items.reduce((s, i) => s + i.stock, 0),
      totalValue: items.reduce((s, i) => s + i.stockValue, 0),
      outOfStock: items.filter((i) => i.status === "out").length,
      lowStock: items.filter((i) => i.status === "low").length,
      slowMoving: items.filter((i) => i.status === "slow").length,
      healthy: items.filter((i) => i.status === "ok").length,
    };

    return NextResponse.json({ items: filtered, kpi, total: filtered.length });
  } catch (error) {
    console.error("Inventory GET error:", error);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}

// PUT /api/inventory — Update stock quantity
export async function PUT(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  try {
    const body = await req.json();
    const { productId, quantity, action } = body as {
      productId: string; quantity: number; action?: "set" | "add" | "subtract";
    };

    if (!productId || quantity === undefined) {
      return NextResponse.json({ error: "productId and quantity required" }, { status: 400 });
    }

    const existing = await prisma.sbInventory.findUnique({ where: { productId } });

    let newQty: number;
    if (action === "add") {
      newQty = (existing?.quantity ?? 0) + quantity;
    } else if (action === "subtract") {
      newQty = Math.max(0, (existing?.quantity ?? 0) - quantity);
    } else {
      newQty = quantity; // "set" or default
    }

    const result = await prisma.sbInventory.upsert({
      where: { productId },
      update: {
        quantity: newQty,
        lastRestockAt: action === "add" || (!action && newQty > (existing?.quantity ?? 0)) ? new Date() : undefined,
        daysInStock: action === "add" ? 0 : undefined,
      },
      create: {
        productId,
        quantity: newQty,
        lastRestockAt: new Date(),
        daysInStock: 0,
      },
    });

    return NextResponse.json({ success: true, inventory: result });
  } catch (error) {
    console.error("Inventory PUT error:", error);
    return NextResponse.json({ error: "Failed to update inventory" }, { status: 500 });
  }
}
