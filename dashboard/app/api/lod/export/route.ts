// ==============================================================================
// OpenDX-Lab - Linked Open Data (LOD) Export API
// Kế thừa chủ đề OLP PMNM 2025: Dữ liệu mở liên kết (LOD)
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const download = searchParams.get("download") === "true";

    const [nodes, edges] = await Promise.all([
      prisma.kgNode.findMany({
        select: {
          id: true,
          type: true,
          name: true,
          description: true,
          source: true,
          sourceUrl: true,
          metadata: true,
          createdAt: true,
        },
      }),
      prisma.kgEdge.findMany({
        select: {
          id: true,
          sourceId: true,
          targetId: true,
          relation: true,
          weight: true,
        },
      }),
    ]);

    // Map internal entity types to Schema.org standard types
    const typeMapping: Record<string, string> = {
      PRODUCT: "Product",
      SUPPLIER: "Organization",
      CATEGORY: "CategoryCode",
      CHANNEL: "Service",
      DEPARTMENT: "Organization",
      PROCESS: "Action",
      POLICY: "DigitalDocument",
      DOCUMENT: "DigitalDocument",
      ROLE: "Role",
      TOPIC: "DefinedTerm",
    };

    // Construct Linked Open Data Graph according to JSON-LD W3C specifications
    const graph = nodes.map((node) => {
      const outgoing = edges
        .filter((e) => e.sourceId === node.id)
        .map((e) => ({
          "@type": "Link",
          relation: e.relation,
          target: `urn:opendx:node:${e.targetId}`,
          weight: e.weight,
        }));

      const incoming = edges
        .filter((e) => e.targetId === node.id)
        .map((e) => ({
          "@type": "Link",
          relation: e.relation,
          source: `urn:opendx:node:${e.sourceId}`,
          weight: e.weight,
        }));

      return {
        "@id": `urn:opendx:node:${node.id}`,
        "@type": typeMapping[node.type] || "Thing",
        "name": node.name,
        "description": node.description || "",
        "dxSpace": "DX-OS:KnowledgeGraph",
        "originalType": node.type,
        "paraCategory": (node.metadata && typeof node.metadata === "object" && "paraCategory" in node.metadata) ? (node.metadata as Record<string, unknown>).paraCategory : undefined,
        "source": node.source || "opendx-internal",
        "sourceUrl": node.sourceUrl || null,
        "dateCreated": node.createdAt.toISOString(),
        "outgoingLinks": outgoing.length > 0 ? outgoing : undefined,
        "incomingLinks": incoming.length > 0 ? incoming : undefined,
      };
    });

    const jsonLd = {
      "@context": {
        "@vocab": "https://schema.org/",
        "dx": "https://opendx-lab.org/ns#",
        "dxSpace": "dx:operatingSpace",
        "originalType": "dx:entityType",
        "outgoingLinks": "dx:outgoingEdges",
        "incomingLinks": "dx:incomingEdges",
        "relation": "dx:relationType",
        "target": { "@type": "@id" },
        "source": { "@type": "@id" },
      },
      "@id": "urn:opendx:graph:catalog",
      "@type": "DataCatalog",
      "name": "OpenDX-Lab Enterprise Linked Knowledge Graph",
      "description": "Linked Open Data (LOD) export for DX-OS H-P-D-I architecture and ShopWise Retail Sandbox",
      "license": "https://www.gnu.org/licenses/gpl-3.0.html",
      "publisher": {
        "@type": "Organization",
        "name": "OpenDX-Lab Contributors",
        "url": "https://github.com/thanhheo7749-ui/opendx-lab"
      },
      "datePublished": new Date().toISOString(),
      "totalEntities": nodes.length,
      "totalRelations": edges.length,
      "@graph": graph,
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/ld+json; charset=utf-8",
    };

    if (download) {
      headers["Content-Disposition"] = 'attachment; filename="opendx-knowledge-graph.jsonld"';
    }

    return new NextResponse(JSON.stringify(jsonLd, null, 2), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Failed to export LOD JSON-LD:", error);
    return NextResponse.json(
      { error: "Failed to export Linked Open Data graph" },
      { status: 500 }
    );
  }
}
