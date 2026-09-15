// ==============================================================================
// OpenDX-Lab Dashboard - Knowledge Graph Explorer Page
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Obsidian-style interactive knowledge graph visualization.
// ==============================================================================

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Upload,
  RefreshCw,
  Search,
  Loader2,
  Filter,
  X,
  Database,
} from "lucide-react";
import { GraphCanvas, type GraphNode, type GraphLink, type GraphData } from "@/components/knowledge/GraphCanvas";
import { NodeDetailPanel } from "@/components/knowledge/NodeDetailPanel";
import { toast } from "@/lib/toast";

// ── Types ────────────────────────────────────────────────────────────────────

interface GraphStats {
  totalNodes: number;
  totalLinks: number;
  nodeTypes: string[];
}

// ── Node Type Filter Config ──────────────────────────────────────────────────

const NODE_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  DOCUMENT: { label: "Tài liệu", color: "#6366f1" },
  DEPARTMENT: { label: "Phòng ban", color: "#06b6d4" },
  PROCESS: { label: "Quy trình", color: "#22c55e" },
  POLICY: { label: "Chính sách", color: "#f59e0b" },
  SERVICE: { label: "Dịch vụ", color: "#ec4899" },
  TOPIC: { label: "Chủ đề", color: "#8b5cf6" },
  ROLE: { label: "Vai trò", color: "#f97316" },
};

// ── Main Page ────────────────────────────────────────────────────────────────

export default function KnowledgeGraphPage() {
  const { t } = useTranslation();

  // State
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [stats, setStats] = useState<GraphStats>({ totalNodes: 0, totalLinks: 0, nodeTypes: [] });
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Measure container dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    // Delay first measurement to let DOM settle after panel open/close
    const raf = requestAnimationFrame(updateDimensions);
    window.addEventListener("resize", updateDimensions);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", updateDimensions);
    };
  }, [selectedNode]);

  // Fetch graph data
  const fetchGraph = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeFilters.size > 0) {
        params.set("types", Array.from(activeFilters).join(","));
      }

      const res = await fetch(`/api/knowledge/graph?${params}`);
      const data = await res.json();

      if (data.error) {
        setMessage({ type: "error", text: data.error });
        return;
      }

      setGraphData({ nodes: data.nodes || [], links: data.links || [] });
      setStats(data.stats || { totalNodes: 0, totalLinks: 0, nodeTypes: [] });
    } catch (err) {
      setMessage({ type: "error", text: "Không thể tải dữ liệu đồ thị." });
      console.error(err);
      toast("error", "Không thể tải dữ liệu đồ thị");
    } finally {
      setLoading(false);
    }
  }, [activeFilters]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  // Clear message after 5s
  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(t);
    }
  }, [message]);

  // Upload file
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/knowledge/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.error) {
        setMessage({ type: "error", text: data.error });
      } else {
        setMessage({ type: "success", text: data.message });
        await fetchGraph(); // Reload graph
      }
    } catch {
      setMessage({ type: "error", text: "Upload thất bại." });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Sync Wiki.js
  const handleSync = async () => {
    setSyncing(true);
    setMessage(null);

    try {
      const res = await fetch("/api/knowledge/sync", { method: "POST" });
      const data = await res.json();

      if (data.error) {
        setMessage({ type: "error", text: data.error });
      } else {
        setMessage({ type: "success", text: data.message });
        await fetchGraph();
      }
    } catch {
      setMessage({ type: "error", text: "Đồng bộ Wiki.js thất bại." });
    } finally {
      setSyncing(false);
    }
  };

  // Seed sample data
  const handleSeed = async () => {
    setSeeding(true);
    setMessage(null);

    try {
      const res = await fetch("/api/knowledge/seed", { method: "POST" });
      const data = await res.json();

      if (data.error) {
        setMessage({ type: "error", text: data.error });
      } else {
        setMessage({ type: "success", text: data.message });
        await fetchGraph();
      }
    } catch {
      setMessage({ type: "error", text: "Tạo dữ liệu mẫu thất bại." });
    } finally {
      setSeeding(false);
    }
  };

  // Delete node
  const handleDelete = async (nodeId: string) => {
    try {
      const res = await fetch(`/api/knowledge/nodes?id=${nodeId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSelectedNode(null);
        await fetchGraph();
        setMessage({ type: "success", text: "Đã xóa node." });
      }
    } catch {
      setMessage({ type: "error", text: "Xóa thất bại." });
    }
  };

  // Toggle filter
  const toggleFilter = (type: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  // Get edges for selected node
  const selectedEdges = selectedNode
    ? graphData.links.filter((l) => {
        const sId = typeof l.source === "string" ? l.source : l.source.id;
        const tId = typeof l.target === "string" ? l.target : l.target.id;
        return sId === selectedNode.id || tId === selectedNode.id;
      })
    : [];

  // Filter graph by search
  const filteredData: GraphData =
    searchQuery.trim().length > 0
      ? (() => {
          const q = searchQuery.toLowerCase();
          const matchedIds = new Set(
            graphData.nodes
              .filter((n) => n.name.toLowerCase().includes(q))
              .map((n) => n.id)
          );
          // Also include neighbors of matched nodes
          for (const link of graphData.links) {
            const sId = typeof link.source === "string" ? link.source : link.source.id;
            const tId = typeof link.target === "string" ? link.target : link.target.id;
            if (matchedIds.has(sId)) matchedIds.add(tId);
            if (matchedIds.has(tId)) matchedIds.add(sId);
          }
          return {
            nodes: graphData.nodes.filter((n) => matchedIds.has(n.id)),
            links: graphData.links.filter((l) => {
              const sId = typeof l.source === "string" ? l.source : l.source.id;
              const tId = typeof l.target === "string" ? l.target : l.target.id;
              return matchedIds.has(sId) && matchedIds.has(tId);
            }),
          };
        })()
      : graphData;

  return (
    <div className="space-y-4 h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-200 dark:border-violet-700">
              <Brain className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            {t("kg.title") || "Knowledge Graph"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("kg.subtitle") || "Khám phá và quản lý tri thức doanh nghiệp"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.md,.txt"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-xs"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-1.5" />
            )}
            Upload
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
            className="text-xs"
          >
            {syncing ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-1.5" />
            )}
            Sync Wiki.js
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSeed}
            disabled={seeding}
            className="text-xs"
          >
            {seeding ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Database className="w-4 h-4 mr-1.5" />
            )}
            Seed Data
          </Button>
        </div>
      </div>

      {/* Message banner */}
      {message && (
        <div
          className={`px-4 py-2 rounded-lg text-sm flex items-center justify-between ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content */}
      <Card className="shadow-sm flex-1 h-[calc(100%-5rem)]">
        <CardContent className="flex h-full p-0 overflow-hidden relative">
          {/* Graph Area */}
          <div className={`flex-1 flex flex-col min-w-0 ${selectedNode ? "border-r border-border" : ""}`}>
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/30">
              {/* Search */}
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm node..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500/30"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* Filter toggle */}
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="text-xs h-7"
              >
                <Filter className="w-3 h-3 mr-1" />
                Filter
                {activeFilters.size > 0 && (
                  <span className="ml-1 bg-violet-500 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center">
                    {activeFilters.size}
                  </span>
                )}
              </Button>

              {/* Stats */}
              <div className="text-[10px] text-muted-foreground ml-auto">
                {stats.totalNodes} nodes · {stats.totalLinks} edges
              </div>
            </div>

            {/* Filter bar */}
            {showFilters && (
              <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border bg-muted/20 flex-wrap">
                {Object.entries(NODE_TYPE_CONFIG).map(([type, config]) => (
                  <button
                    key={type}
                    onClick={() => toggleFilter(type)}
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium border transition-all ${
                      activeFilters.size === 0 || activeFilters.has(type)
                        ? "opacity-100"
                        : "opacity-40"
                    }`}
                    style={{
                      borderColor: config.color + "40",
                      backgroundColor:
                        activeFilters.has(type) ? config.color + "20" : "transparent",
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: config.color }}
                    />
                    {config.label}
                  </button>
                ))}
                {activeFilters.size > 0 && (
                  <button
                    onClick={() => setActiveFilters(new Set())}
                    className="text-[10px] text-muted-foreground hover:text-foreground ml-2"
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            )}

            {/* Graph Canvas */}
            <div ref={containerRef} className="flex-1 bg-gray-950 relative">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                </div>
              ) : filteredData.nodes.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <Brain className="w-16 h-16 text-violet-500/30 mb-4" />
                  <h3 className="text-lg font-medium text-gray-400 mb-2">
                    Knowledge Graph trống
                  </h3>
                  <p className="text-sm text-gray-500 max-w-md">
                    Hãy upload tài liệu hoặc đồng bộ từ Wiki.js để bắt đầu xây
                    dựng đồ thị tri thức.
                  </p>
                </div>
              ) : (
                <GraphCanvas
                  graphData={filteredData}
                  selectedNodeId={selectedNode?.id}
                  hoveredNodeId={hoveredNodeId}
                  onNodeClick={(node) => setSelectedNode(node)}
                  onNodeHover={(node) => setHoveredNodeId(node?.id || null)}
                  onBackgroundClick={() => setSelectedNode(null)}
                  width={selectedNode ? Math.max(dimensions.width - 320, 400) : dimensions.width}
                  height={dimensions.height}
                />
              )}
            </div>
          </div>

          {/* Detail Panel (right side) */}
          {selectedNode && (
            <div className="w-80 flex-shrink-0 overflow-y-auto h-full">
              <NodeDetailPanel
                node={selectedNode}
                edges={selectedEdges}
                allNodes={graphData.nodes}
                onClose={() => setSelectedNode(null)}
                onDelete={handleDelete}
                onNodeNavigate={(id) => {
                  const node = graphData.nodes.find((n) => n.id === id);
                  if (node) setSelectedNode(node);
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
