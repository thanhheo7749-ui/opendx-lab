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

const NODE_COLORS: Record<string, string> = {
  DOCUMENT: "#6366f1",   // Indigo
  DEPARTMENT: "#06b6d4", // Cyan
  PROCESS: "#22c55e",    // Green
  POLICY: "#f59e0b",     // Amber
  SERVICE: "#ec4899",    // Pink
  TOPIC: "#8b5cf6",      // Violet
  ROLE: "#f97316",       // Orange
};

const EDGE_COLORS: Record<string, string> = {
  MENTIONS: "#94a3b8",
  RELATES_TO: "#6366f1",
  GOVERNS: "#f59e0b",
  OWNED_BY: "#06b6d4",
  TAGGED_WITH: "#8b5cf6",
  DEPENDS_ON: "#ec4899",
  PART_OF: "#22c55e",
  BELONGS_TO: "#64748b",
};

const DEFAULT_COLOR = "#64748b";

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

  // Zoom to fit on data change
  useEffect(() => {
    if (fgRef.current && graphData.nodes.length > 0) {
      // Configure forces for ~5cm node spacing
      fgRef.current.d3Force("charge")?.strength(-300);
      fgRef.current.d3Force("link")?.distance(150);
      fgRef.current.d3Force("center")?.strength(0.05);

      setTimeout(() => {
        fgRef.current?.zoomToFit(400, 60);
      }, 800);
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
      const label = node.name || "";
      const fontSize = Math.max(10 / globalScale, 2);
      const nodeSize = Math.sqrt(node.val || 1) * 3 + 4;
      const isSelected = node.id === selectedNodeId;
      const isHovered = node.id === hoveredNodeId;
      const isHighlighted =
        isSelected ||
        isHovered ||
        (hoveredNodeId ? getNeighborIds(hoveredNodeId).has(node.id) : false);

      const color = NODE_COLORS[node.type] || DEFAULT_COLOR;
      const alpha = hoveredNodeId && !isHighlighted ? 0.15 : 1;

      // Draw node circle
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, nodeSize, 0, 2 * Math.PI, false);
      ctx.fillStyle = `${color}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`;
      ctx.fill();

      // Selection/hover ring
      if (isSelected || isHovered) {
        ctx.strokeStyle = isSelected ? "#ffffff" : color;
        ctx.lineWidth = isSelected ? 3 / globalScale : 2 / globalScale;
        ctx.stroke();

        // Glow effect
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, nodeSize + 2 / globalScale, 0, 2 * Math.PI);
        ctx.strokeStyle = `${color}80`;
        ctx.lineWidth = 1 / globalScale;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Label (only when zoomed in enough or highlighted)
      if (globalScale > 0.6 || isHighlighted) {
        ctx.font = `${isHighlighted ? "bold " : ""}${fontSize}px Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fillText(label, node.x!, node.y! + nodeSize + 2);
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
      const alpha = hoveredNodeId && !isHighlighted ? 0.05 : 0.4;
      const color = EDGE_COLORS[link.relation] || DEFAULT_COLOR;

      ctx.beginPath();
      ctx.moveTo(link.source.x, link.source.y);
      ctx.lineTo(link.target.x, link.target.y);
      ctx.strokeStyle = `${color}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`;
      ctx.lineWidth = isHighlighted ? 2 / globalScale : 0.5 / globalScale;
      ctx.stroke();

      // Show relation label when zoomed in and highlighted
      if (isHighlighted && globalScale > 1.2) {
        const midX = (link.source.x + link.target.x) / 2;
        const midY = (link.source.y + link.target.y) / 2;
        ctx.font = `${8 / globalScale}px Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillStyle = `rgba(148, 163, 184, ${alpha + 0.3})`;
        ctx.fillText(link.relation, midX, midY);
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
      // Physics — spread nodes ~5cm apart
      d3AlphaDecay={0.015}
      d3VelocityDecay={0.25}
      warmupTicks={100}
      cooldownTicks={300}
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
