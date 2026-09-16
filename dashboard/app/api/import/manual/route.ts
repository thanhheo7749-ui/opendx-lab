// ==============================================================================
// ShopWise — Manual Entry API
// CRUD operations for products, orders, suppliers via manual forms
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function POST(req: Request) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  try {
    const body = await req.json();
    const { type, data } = body as { type: string; data: Record<string, unknown> };

    if (!type || !data) {
      return NextResponse.json({ error: "Missing type or data" }, { status: 400 });
    }

    let result;

    switch (type) {
      case "product": {
        const { name, sku, category, costPrice, sellPrice } = data as {
          name: string; sku: string; category: string; costPrice: number; sellPrice: number;
        };
        if (!name || !sku) {
          return NextResponse.json({ error: "Tên và SKU là bắt buộc" }, { status: 400 });
        }
        result = await prisma.sbProduct.create({
          data: { name, sku, category: category || "Khác", costPrice: costPrice || 0, sellPrice: sellPrice || 0 },
        });
        break;
      }

      case "order": {
        const { customerName, phone, channel, items, totalAmount, shippingFee, discount } = data as {
          customerName: string; phone?: string; channel: string;
          items?: { productId: string; quantity: number; unitPrice: number }[];
          totalAmount: number; shippingFee?: number; discount?: number;
        };

        // Find or create customer
        let customer;
        if (phone) {
          customer = await prisma.sbCustomer.findUnique({ where: { phone } });
          if (!customer) {
            customer = await prisma.sbCustomer.create({
              data: { name: customerName || "Khách lẻ", phone, channel: channel || "zalo" },
            });
          }
        } else {
          customer = await prisma.sbCustomer.create({
            data: { name: customerName || "Khách lẻ", channel: channel || "zalo" },
          });
        }

        const disc = discount || 0;
        const ship = shippingFee || 0;
        const profit = (totalAmount - disc) * 0.6;

        result = await prisma.sbOrder.create({
          data: {
            customerId: customer.id,
            channel: channel || "zalo",
            status: "COMPLETED",
            totalAmount,
            shippingFee: ship,
            discount: disc,
            profit,
            orderDate: new Date(),
            ...(items && items.length > 0 ? {
              items: {
                create: items.map((item) => ({
                  productId: item.productId,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                })),
              },
            } : {}),
          },
        });
        break;
      }

      case "supplier": {
        const { name, province, district, phone, rating, leadTimeDays, minOrder } = data as {
          name: string; province: string; district?: string; phone?: string;
          rating?: number; leadTimeDays?: number; minOrder?: number;
        };
        if (!name) {
          return NextResponse.json({ error: "Tên NCC là bắt buộc" }, { status: 400 });
        }
        result = await prisma.sbSupplier.create({
          data: {
            name,
            province: province || "TP.HCM",
            district,
            phone,
            rating: rating || 4.0,
            leadTimeDays: leadTimeDays || 3,
            minOrder: minOrder || 0,
          },
        });
        break;
      }

      case "inventory": {
        const { productId, quantity } = data as { productId: string; quantity: number };
        if (!productId) {
          return NextResponse.json({ error: "ProductId là bắt buộc" }, { status: 400 });
        }
        const existing = await prisma.sbInventory.findUnique({ where: { productId } });
        if (existing) {
          result = await prisma.sbInventory.update({
            where: { productId },
            data: { quantity, lastRestockAt: new Date(), daysInStock: 0 },
          });
        } else {
          result = await prisma.sbInventory.create({
            data: { productId, quantity, lastRestockAt: new Date(), daysInStock: 0 },
          });
        }
        break;
      }

      case "campaign": {
        const { name, channel, dailyBudget } = data as {
          name: string; channel: string; dailyBudget: number;
        };
        if (!name) {
          return NextResponse.json({ error: "Tên campaign là bắt buộc" }, { status: 400 });
        }
        result = await prisma.sbAdCampaign.create({
          data: {
            name,
            channel: channel || "facebook",
            dailyBudget: dailyBudget || 0,
            startDate: new Date(),
          },
        });
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, type, data: result });
  } catch (error: unknown) {
    console.error("Manual entry error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Lỗi khi thêm dữ liệu: ${message}` }, { status: 500 });
  }
}
