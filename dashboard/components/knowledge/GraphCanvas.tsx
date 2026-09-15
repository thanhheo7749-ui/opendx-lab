// ==============================================================================
// OpenDX-Lab Dashboard - Knowledge Graph: Graph Canvas (Obsidian-style)
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

"use client";

import { useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with canvas
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
      Đang tải đồ thị...
    </div>
  ),
});

// ── Types ────────────────────────────────────────────────────────────────────

export interface GraphNode {
  id: string;
  name: string;
  type: string;
  description?: string | null;
  source?: string | null;
  sourceUrl?: string | null;
  val: number;
  chunkCount: number;
  // Force graph internal props
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  relation: string;
  weight: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface GraphCanvasProps {
  graphData: GraphData;
  selectedNodeId?: string | null;
  hoveredNodeId?: string | null;
  onNodeClick?: (node: GraphNode) => void;
  onNodeHover?: (node: GraphNode | null) => void;
  onBackgroundClick?: () => void;
  width?: number;
  height?: number;
}

// ── Node Colors by Type ──────────────────────────────────────────────────────

export const NODE_COLORS: Record<string, string> = {
  // E-commerce types
  CATEGORY: "#06b6d4",   // Cyan / Danh mục
  CHANNEL: "#22c55e",    // Emerald Green / Kênh bán
  SUPPLIER: "#f59e0b",   // Amber / Nhà cung cấp
  PRODUCT: "#6366f1",    // Indigo Blue / Sản phẩm
  SEGMENT: "#ec4899",    // Pink / Phân khúc KH
  STRATEGY: "#f97316",   // Orange / Chiến lược
  // Legacy / Docs types
  DOCUMENT: "#818cf8",
  DEPARTMENT: "#06b6d4",
  PROCESS: "#22c55e",
  POLICY: "#f59e0b",
  SERVICE: "#ec4899",
  TOPIC: "#a855f7",
  ROLE: "#f97316",
};

export const EDGE_COLORS: Record<string, string> = {
  SUPPLIED_BY: "#f59e0b", // Amber
  PREFERS: "#ec4899",     // Pink
  SELLS: "#22c55e",       // Green
  SUPPLIES: "#f59e0b",    // Amber
  BELONGS_TO: "#06b6d4",  // Cyan
  GOVERNS: "#f97316",     // Orange
  RELATES_TO: "#38bdf8",  // Sky blue
  MENTIONS: "#94a3b8",
  OWNED_BY: "#06b6d4",
  TAGGED_WITH: "#a855f7",
  DEPENDS_ON: "#ec4899",
  PART_OF: "#22c55e",
};

const DEFAULT_COLOR = "#818cf8";

// ── Component ────────────────────────────────────────────────────────────────

export function GraphCanvas({
  graphData,
  selectedNodeId,
  hoveredNodeId,
  onNodeClick,
  onNodeHover,
  onBackgroundClick,
  width,
  height,
}: GraphCanvasProps) {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const fgRef = useRef<any>(null);

  // Zoom to fit on data change with wider spacing
  useEffect(() => {
    if (fgRef.current && graphData.nodes.length > 0) {
      // Configure stronger repulsion and longer link distance for airy, spacious layout
      fgRef.current.d3Force("charge")?.strength(-2800).distanceMax(2500);
      fgRef.current.d3Force("link")?.distance(320);
      fgRef.current.d3Force("center")?.strength(0.005);

      setTimeout(() => {
        fgRef.current?.zoomToFit(500, 100);
      }, 900);
    }
  }, [graphData]);

  // Build neighbor set for highlight
  const getNeighborIds = useCallback(
    (nodeId: string): Set<string> => {
      const ids = new Set<string>();
      for (const link of graphData.links) {
        const sourceId = typeof link.source === "string" ? link.source : link.source.id;
        const targetId = typeof link.target === "string" ? link.target : link.target.id;
        if (sourceId === nodeId) ids.add(targetId);
        if (targetId === nodeId) ids.add(sourceId);
      }
      return ids;
    },
    [graphData.links]
  );

  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const rawLabel = node.name || "";
      const maxChars = 22;
      const label = rawLabel.length > maxChars ? rawLabel.substring(0, maxChars) + "…" : rawLabel;
      const fontSize = Math.max(11 / globalScale, 3.5);
      const nodeSize = Math.max(Math.sqrt(node.val || 1) * 3.8 + 6, 8.5);
      const isSelected = node.id === selectedNodeId;
      const isHovered = node.id === hoveredNodeId;
      const isHighlighted =
        isSelected ||
        isHovered ||
        (hoveredNodeId ? getNeighborIds(hoveredNodeId).has(node.id) : false);

      const color = NODE_COLORS[node.type] || DEFAULT_COLOR;
      const alpha = hoveredNodeId && !isHighlighted ? 0.2 : 1;

      // 1. Soft glowing outer aura
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, nodeSize + 4 / globalScale, 0, 2 * Math.PI);
      ctx.fillStyle = `${color}${Math.round(alpha * 55).toString(16).padStart(2, "0")}`;
      ctx.fill();

      // 2. Main node circle
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, nodeSize, 0, 2 * Math.PI, false);
      ctx.fillStyle = `${color}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`;
      ctx.fill();

      // 3. Crisp white border
      ctx.strokeStyle = isSelected ? "#ffffff" : isHovered ? "#ffffff" : "rgba(255, 255, 255, 0.75)";
      ctx.lineWidth = isSelected ? 2.5 / globalScale : 1.2 / globalScale;
      ctx.stroke();

      // 4. Selection/hover extra highlight ring
      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, nodeSize + 3 / globalScale, 0, 2 * Math.PI);
        ctx.strokeStyle = isSelected ? "#ffffff" : color;
        ctx.lineWidth = 2 / globalScale;
        ctx.stroke();
      }

      // 5. Always-visible label badge (identifiable at default zoom)
      const showLabel = globalScale > 0.12 || isHighlighted;
      if (showLabel) {
        ctx.font = `${isHighlighted ? "bold " : "600 "}${fontSize}px Inter, -apple-system, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        const displayLabel = isHighlighted ? rawLabel : label;
        const textWidth = ctx.measureText(displayLabel).width;
        const textX = node.x!;
        const textY = node.y! + nodeSize + 4 / globalScale;
        const padX = 4.5 / globalScale;
        const padY = 2 / globalScale;

        const bx = textX - textWidth / 2 - padX;
        const by = textY - padY;
        const bw = textWidth + padX * 2;
        const bh = fontSize + padY * 2;
        const r = 3 / globalScale;

        // Label background pill
        ctx.fillStyle = isHighlighted ? "rgba(15, 23, 42, 0.96)" : "rgba(10, 15, 30, 0.90)";
        ctx.beginPath();
        if (typeof (ctx as any).roundRect === "function") {
          (ctx as any).roundRect(bx, by, bw, bh, r);
        } else {
          ctx.rect(bx, by, bw, bh);
        }
        ctx.fill();

        // Border colored by node type
        ctx.strokeStyle = isHighlighted ? "#ffffff" : `${color}88`;
        ctx.lineWidth = 1 / globalScale;
        ctx.stroke();

        ctx.fillStyle = isHighlighted ? "#ffffff" : "rgba(241, 245, 249, 0.95)";
        ctx.fillText(displayLabel, textX, textY);
      }
    },
    [selectedNodeId, hoveredNodeId, getNeighborIds]
  );

  const linkCanvasObject = useCallback(
    (link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const sourceId = typeof link.source === "string" ? link.source : link.source.id;
      const targetId = typeof link.target === "string" ? link.target : link.target.id;
      const isHighlighted =
        hoveredNodeId === sourceId ||
        hoveredNodeId === targetId ||
        selectedNodeId === sourceId ||
        selectedNodeId === targetId;
      const alpha = hoveredNodeId && !isHighlighted ? 0.08 : isHighlighted ? 0.95 : 0.65;
      const color = EDGE_COLORS[link.relation] || DEFAULT_COLOR;

      ctx.beginPath();
      ctx.moveTo(link.source.x, link.source.y);
      ctx.lineTo(link.target.x, link.target.y);
      ctx.strokeStyle = `${color}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`;
      ctx.lineWidth = isHighlighted ? 2.5 / globalScale : 1.2 / globalScale;
      ctx.stroke();

      // Show relation label when hovered/highlighted or zoomed in
      if ((isHighlighted && globalScale > 0.8) || globalScale > 1.4) {
        const midX = (link.source.x + link.target.x) / 2;
        const midY = (link.source.y + link.target.y) / 2;
        const fontSize = Math.max(9 / globalScale, 3);
        ctx.font = `600 ${fontSize}px Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const text = link.relation || "";
        const tw = ctx.measureText(text).width;
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.fillRect(midX - tw / 2 - 2, midY - fontSize / 2 - 1, tw + 4, fontSize + 2);

        ctx.fillStyle = isHighlighted ? "#ffffff" : "rgba(226, 232, 240, 0.9)";
        ctx.fillText(text, midX, midY);
      }
    },
    [hoveredNodeId, selectedNodeId]
  );
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return (
    <ForceGraph2D
      ref={fgRef}
      graphData={graphData as any}
      width={width}
      height={height}
      backgroundColor="transparent"
      // Node rendering
      nodeCanvasObject={nodeCanvasObject}
      nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
        const size = Math.sqrt(node.val || 1) * 3 + 4;
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, size + 2, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
      }}
      // Link rendering
      linkCanvasObjectMode={() => "replace"}
      linkCanvasObject={linkCanvasObject}
      // Interactions
      onNodeClick={(node: any) => onNodeClick?.(node as GraphNode)}
      onNodeHover={(node: any) => onNodeHover?.(node as GraphNode | null)}
      onBackgroundClick={() => onBackgroundClick?.()}
      // Physics — spread nodes apart generously
      d3AlphaDecay={0.01}
      d3VelocityDecay={0.2}
      warmupTicks={150}
      cooldownTicks={500}
      // Drag behavior
      enableNodeDrag={true}
      onNodeDragEnd={(node: any) => {
        // Pin node after drag
        node.fx = node.x;
        node.fy = node.y;
      }}
    />
  );
}
