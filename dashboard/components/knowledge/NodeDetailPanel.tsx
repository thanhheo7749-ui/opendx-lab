// ==============================================================================
// OpenDX-Lab Dashboard - Knowledge Graph: Node Detail Panel
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Shows full detail when clicking a node:
// - Type badge, name, description
// - Content chunks (actual knowledge text)
// - Metadata (source, chunk count, connections)
// - Related nodes grouped by relation type
// ==============================================================================

"use client";

import { useEffect, useState } from "react";
import { X, ExternalLink, Trash2, FileText, Link2, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GraphNode, GraphLink } from "./GraphCanvas";

// ── Types ────────────────────────────────────────────────────────────────────

interface NodeDetailPanelProps {
  node: GraphNode;
  edges: GraphLink[];
  allNodes: GraphNode[];
  onClose: () => void;
  onDelete: (nodeId: string) => void;
  onNodeNavigate: (nodeId: string) => void;
}

interface ChunkData {
  id: string;
  content: string;
  chunkIndex: number;
  tokenCount?: number;
}

// ── Node Type badges ─────────────────────────────────────────────────────────

const TYPE_STYLES: Record<string, string> = {
  DOCUMENT: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  DEPARTMENT: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  PROCESS: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  POLICY: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  SERVICE: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  TOPIC: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  ROLE: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
};

const TYPE_LABELS: Record<string, string> = {
  DOCUMENT: "📄 Tài liệu",
  DEPARTMENT: "🏢 Phòng ban",
  PROCESS: "📋 Quy trình",
  POLICY: "📜 Chính sách",
  SERVICE: "🔧 Dịch vụ",
  TOPIC: "🏷️ Chủ đề",
  ROLE: "👤 Vai trò",
};

const RELATION_LABELS: Record<string, string> = {
  MENTIONS: "Đề cập",
  RELATES_TO: "Liên quan",
  GOVERNS: "Điều chỉnh",
  OWNED_BY: "Thuộc về",
  TAGGED_WITH: "Gắn thẻ",
  DEPENDS_ON: "Phụ thuộc",
  PART_OF: "Thuộc về",
  BELONGS_TO: "Thuộc về",
};

const NODE_COLORS: Record<string, string> = {
  DOCUMENT: "#6366f1",
  DEPARTMENT: "#06b6d4",
  PROCESS: "#22c55e",
  POLICY: "#f59e0b",
  SERVICE: "#ec4899",
  TOPIC: "#8b5cf6",
  ROLE: "#f97316",
};

// ── Component ────────────────────────────────────────────────────────────────

export function NodeDetailPanel({
  node,
  edges,
  allNodes,
  onClose,
  onDelete,
  onNodeNavigate,
}: NodeDetailPanelProps) {
  const [chunks, setChunks] = useState<ChunkData[]>([]);
  const [loadingChunks, setLoadingChunks] = useState(false);
  const [showChunks, setShowChunks] = useState(true);
  const [showRelations, setShowRelations] = useState(true);

  // Fetch chunks when node changes
  useEffect(() => {
    let cancelled = false;

    const fetchChunks = async () => {
      setLoadingChunks(true);
      try {
        const res = await fetch(`/api/knowledge/nodes?id=${node.id}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.node?.chunks) {
            setChunks(data.node.chunks);
          }
        }
      } catch (err) {
        console.error("[NodeDetail] Failed to fetch chunks:", err);
      } finally {
        if (!cancelled) setLoadingChunks(false);
      }
    };

    fetchChunks();
    return () => { cancelled = true; };
  }, [node.id]);

  // Get connected nodes with their relation
  const connections = edges
    .map((edge) => {
      const sourceId = typeof edge.source === "string" ? edge.source : edge.source.id;
      const targetId = typeof edge.target === "string" ? edge.target : edge.target.id;
      const isSource = sourceId === node.id;
      const otherId = isSource ? targetId : sourceId;
      const otherNode = allNodes.find((n) => n.id === otherId);

      return otherNode
        ? {
            node: otherNode,
            relation: edge.relation,
            direction: isSource ? "outgoing" : "incoming",
          }
        : null;
    })
    .filter(Boolean) as {
    node: GraphNode;
    relation: string;
    direction: string;
  }[];

  // Group connections by relation
  const grouped = connections.reduce(
    (acc, conn) => {
      if (!acc[conn.relation]) acc[conn.relation] = [];
      acc[conn.relation].push(conn);
      return acc;
    },
    {} as Record<string, typeof connections>
  );

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-border">
        <div className="flex-1 min-w-0">
          <span
            className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-medium mb-1.5 ${
              TYPE_STYLES[node.type] || "bg-gray-100 text-gray-700"
            }`}
          >
            {TYPE_LABELS[node.type] || node.type}
          </span>
          <h3 className="font-semibold text-foreground text-sm">{node.name}</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="ml-2 flex-shrink-0 h-7 w-7 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Description */}
        {node.description && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Mô tả
            </h4>
            <p className="text-sm text-foreground leading-relaxed">{node.description}</p>
          </div>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-muted rounded-lg p-2">
            <div className="text-muted-foreground">Nguồn</div>
            <div className="font-medium text-foreground capitalize">
              {node.source || "—"}
            </div>
          </div>
          <div className="bg-muted rounded-lg p-2">
            <div className="text-muted-foreground">Chunks</div>
            <div className="font-medium text-foreground">{node.chunkCount}</div>
          </div>
          <div className="bg-muted rounded-lg p-2">
            <div className="text-muted-foreground">Liên kết</div>
            <div className="font-medium text-foreground">{connections.length}</div>
          </div>
          <div className="bg-muted rounded-lg p-2">
            <div className="text-muted-foreground">Size</div>
            <div className="font-medium text-foreground">{node.val}</div>
          </div>
        </div>

        {/* Content Chunks (Knowledge Data) */}
        {node.chunkCount > 0 && (
          <div>
            <button
              onClick={() => setShowChunks(!showChunks)}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 hover:text-foreground transition-colors w-full"
            >
              {showChunks ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <FileText className="w-3 h-3" />
              Nội dung ({chunks.length || node.chunkCount} phần)
            </button>

            {showChunks && (
              <div className="space-y-2">
                {loadingChunks ? (
                  <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Đang tải nội dung...
                  </div>
                ) : chunks.length > 0 ? (
                  chunks.map((chunk) => (
                    <div
                      key={chunk.id}
                      className="bg-muted/50 rounded-lg p-2.5 border border-border/50"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-medium text-violet-500">
                          Phần {chunk.chunkIndex + 1}
                        </span>
                        {chunk.tokenCount && (
                          <span className="text-[10px] text-muted-foreground">
                            ~{chunk.tokenCount} tokens
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-foreground leading-relaxed">
                        {chunk.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic py-2">
                    Không có nội dung chi tiết.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Connections */}
        {Object.keys(grouped).length > 0 && (
          <div>
            <button
              onClick={() => setShowRelations(!showRelations)}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 hover:text-foreground transition-colors w-full"
            >
              {showRelations ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <Link2 className="w-3 h-3" />
              Quan hệ ({connections.length})
            </button>

            {showRelations && (
              <div className="space-y-3">
                {Object.entries(grouped).map(([relation, conns]) => (
                  <div key={relation}>
                    <div className="text-[10px] font-medium text-muted-foreground mb-1">
                      {RELATION_LABELS[relation] || relation} ({conns.length})
                    </div>
                    <div className="space-y-1">
                      {conns.map((conn, i) => (
                        <button
                          key={i}
                          onClick={() => onNodeNavigate(conn.node.id)}
                          className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors text-xs group"
                        >
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: NODE_COLORS[conn.node.type] || "#64748b",
                            }}
                          />
                          <span className="truncate text-foreground group-hover:text-indigo-500 transition-colors">
                            {conn.node.name}
                          </span>
                          <span className="ml-auto text-[10px] text-muted-foreground flex-shrink-0">
                            {conn.direction === "outgoing" ? "→" : "←"} {conn.node.type}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="p-3 border-t border-border flex gap-2">
        {node.source === "wikijs" && (
          <a
            href="http://localhost:3200"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center text-xs h-8 px-3 rounded-md border border-border hover:bg-muted transition-colors"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Wiki.js
          </a>
        )}
        <Button
          variant="outline"
          size="sm"
          className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs h-8"
          onClick={() => {
            if (confirm(`Xóa "${node.name}" và tất cả dữ liệu liên quan?`)) {
              onDelete(node.id);
            }
          }}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
