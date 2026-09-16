// ==============================================================================
// ShopWise — Approved Import API
// Only imports rows that user has explicitly approved
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

interface ApprovedRow {
  status: "new" | "conflict";
  newData: Record<string, unknown>;
}

export async function POST(req: Request) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  try {
    const body = await req.json();
    const { approvedRows, importType } = body as {
      approvedRows: ApprovedRow[];
      importType: "products" | "orders" | "suppliers";
    };

    if (!approvedRows?.length || !importType) {
      return NextResponse.json({ error: "Missing approvedRows or importType" }, { status: 400 });
    }

    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const row of approvedRows) {
      try {
        switch (importType) {
          case "products": {
            const { name, sku, category, costPrice, sellPrice } = row.newData as {
              name: string; sku: string; category: string; costPrice: number; sellPrice: number;
            };
            if (row.status === "conflict") {
              await prisma.sbProduct.update({
                where: { sku },
                data: {
                  name, category,
                  ...(costPrice > 0 && { costPrice }),
                  ...(sellPrice > 0 && { sellPrice }),
                },
              });
              updated++;
            } else {
              const product = await prisma.sbProduct.create({
                data: { name, sku, category: category || "Khác", costPrice: costPrice || 0, sellPrice: sellPrice || 0 },
              });
              await prisma.sbInventory.create({
                data: { productId: product.id, quantity: 0, daysInStock: 0 },
              });
              created++;
            }
            break;
          }
          case "orders": {
            const { customerName, phone, channel, totalAmount, shippingFee, discount, status, orderDate } = row.newData as {
              customerName: string; phone: string; channel: string; totalAmount: number;
              shippingFee: number; discount: number; status: string; orderDate: string;
            };

            let customer;
            if (phone) {
              customer = await prisma.sbCustomer.findUnique({ where: { phone } });
              if (!customer) {
                customer = await prisma.sbCustomer.create({
                  data: { name: customerName, phone, channel: (channel || "shopee").toLowerCase() },
                });
              }
            } else {
              customer = await prisma.sbCustomer.create({
                data: { name: customerName, channel: (channel || "shopee").toLowerCase() },
              });
            }

            const parsedDate = orderDate ? new Date(orderDate as string) : new Date();
            const normalizedStatus = (status || "").toUpperCase().includes("CANCEL") ? "CANCELLED"
              : (status || "").toUpperCase().includes("RETURN") ? "RETURNED"
              : "COMPLETED";

            // Get avg margin for profit calculation
            const allProducts = await prisma.sbProduct.findMany({ select: { costPrice: true, sellPrice: true } });
            const avgMargin = allProducts.length > 0
              ? allProducts.reduce((s, p) => s + (p.sellPrice > 0 ? (p.sellPrice - p.costPrice) / p.sellPrice : 0.4), 0) / allProducts.length
              : 0.4;
            const profit = normalizedStatus === "COMPLETED" ? Math.round((totalAmount - (discount || 0)) * avgMargin) : 0;

            await prisma.sbOrder.create({
              data: {
                customerId: customer.id,
                channel: (channel || "shopee").toLowerCase(),
                status: normalizedStatus,
                totalAmount, shippingFee: shippingFee || 0,
                discount: discount || 0, profit,
                orderDate: isNaN(parsedDate.getTime()) ? new Date() : parsedDate,
              },
            });
            created++;
            break;
          }
          case "suppliers": {
            const { name, province, phone, rating, leadTimeDays, minOrder } = row.newData as {
              name: string; province: string; phone: string; rating: number; leadTimeDays: number; minOrder: number;
            };
            if (row.status === "conflict") {
              await prisma.sbSupplier.updateMany({
                where: { name },
                data: {
                  province: province || "TP.HCM",
                  ...(phone && { phone }),
                  rating: rating || 4.0,
                  leadTimeDays: leadTimeDays || 3,
                  ...(minOrder > 0 && { minOrderValue: minOrder }),
                },
              });
              updated++;
            } else {
              await prisma.sbSupplier.create({
                data: {
                  name, province: province || "TP.HCM",
                  phone: phone || null, rating: rating || 4.0,
                  leadTimeDays: leadTimeDays || 3, minOrderValue: minOrder || 0,
                },
              });
              created++;
            }
            break;
          }
        }
      } catch (err) {
        console.error("Row import error:", err);
        errors++;
      }
    }

    return NextResponse.json({ success: true, created, updated, errors, total: approvedRows.length });
  } catch (error) {
    console.error("Approved import error:", error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
