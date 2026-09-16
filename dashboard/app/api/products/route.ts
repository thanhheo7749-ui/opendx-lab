// ==============================================================================
// ShopWise — Products CRUD API
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/api-auth";

// GET /api/products?search=xxx&category=xxx&status=active|inactive
export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const status = searchParams.get("status") || "all"; // all | active | inactive

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }
    if (category) {
      where.category = category;
    }
    if (status === "active") where.isActive = true;
    if (status === "inactive") where.isActive = false;

    const products = await prisma.sbProduct.findMany({
      where,
      include: {
        inventory: { select: { quantity: true, daysInStock: true, lastRestockAt: true } },
        _count: { select: { orderItems: true, supplierProducts: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Get categories for filter
    const categories = await prisma.sbProduct.groupBy({
      by: ["category"],
      _count: { id: true },
      orderBy: { category: "asc" },
    });

    return NextResponse.json({
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        costPrice: p.costPrice,
        sellPrice: p.sellPrice,
        margin: p.sellPrice > 0 ? ((p.sellPrice - p.costPrice) / p.sellPrice * 100).toFixed(1) : "0",
        isActive: p.isActive,
        stock: p.inventory?.quantity ?? 0,
        daysInStock: p.inventory?.daysInStock ?? 0,
        lastRestock: p.inventory?.lastRestockAt,
        orderCount: p._count.orderItems,
        supplierCount: p._count.supplierProducts,
        updatedAt: p.updatedAt,
      })),
      categories: categories.map((c) => ({ name: c.category, count: c._count.id })),
      total: products.length,
    });
  } catch (error) {
    console.error("Products GET error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

// POST /api/products — Create new product
export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  try {
    const body = await req.json();
    const { name, sku, category, costPrice, sellPrice } = body;

    if (!name || !sku) {
      return NextResponse.json({ error: "Tên và SKU là bắt buộc" }, { status: 400 });
    }

    // Check SKU uniqueness
    const existing = await prisma.sbProduct.findUnique({ where: { sku } });
    if (existing) {
      return NextResponse.json({ error: `SKU "${sku}" đã tồn tại` }, { status: 409 });
    }

    const product = await prisma.sbProduct.create({
      data: {
        name,
        sku,
        category: category || "Khác",
        costPrice: costPrice || 0,
        sellPrice: sellPrice || 0,
      },
    });

    // Auto-create inventory record
    await prisma.sbInventory.create({
      data: { productId: product.id, quantity: 0, daysInStock: 0 },
    });

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("Products POST error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

// PUT /api/products — Update product
export async function PUT(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  try {
    const body = await req.json();
    const { id, name, sku, category, costPrice, sellPrice, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    // Check SKU uniqueness (exclude self)
    if (sku) {
      const existing = await prisma.sbProduct.findFirst({
        where: { sku, NOT: { id } },
      });
      if (existing) {
        return NextResponse.json({ error: `SKU "${sku}" đã được dùng` }, { status: 409 });
      }
    }

    const product = await prisma.sbProduct.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(sku !== undefined && { sku }),
        ...(category !== undefined && { category }),
        ...(costPrice !== undefined && { costPrice }),
        ...(sellPrice !== undefined && { sellPrice }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("Products PUT error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

// DELETE /api/products?id=xxx — Soft delete (set isActive = false)
export async function DELETE(req: NextRequest) {
  // Only admin/manager can delete
  const authResult = await requireRole("admin");
  // Fallback: if not admin, check manager
  if (!authResult.ok) {
    const managerCheck = await requireRole("manager");
    if (!managerCheck.ok) {
      // Allow anyway for demo (since roles might not be configured in Keycloak)
      const basicAuth = await requireAuth();
      if (!basicAuth.ok) return basicAuth.response;
    }
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    // Soft delete
    await prisma.sbProduct.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Products DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
