// ==============================================================================
// ShopWise — Supplier Comparison API
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { compareSuppliers } from "@/lib/decision/supplier";
import { prisma } from "@/lib/prisma";

// GET /api/decision/supplier?productId=xxx&qty=100&province=TP.HCM
// If no productId, returns list of products that have suppliers
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const qty = parseInt(searchParams.get("qty") || "100", 10);
    const province = searchParams.get("province") || "TP.HCM";

    if (!productId) {
      // Return products that have suppliers
      const products = await prisma.sbProduct.findMany({
        where: { isActive: true, supplierProducts: { some: {} } },
        select: { id: true, name: true, sku: true, sellPrice: true, costPrice: true },
        orderBy: { name: "asc" },
      });
      return NextResponse.json({ products });
    }

    const comparison = await compareSuppliers(productId, qty, province);
    return NextResponse.json(comparison);
  } catch (error) {
    console.error("Supplier API error:", error);
    return NextResponse.json({ error: "Failed to compare suppliers" }, { status: 500 });
  }
}
