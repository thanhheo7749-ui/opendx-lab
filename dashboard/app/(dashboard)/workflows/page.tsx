"use client";

// ==============================================================================
// OpenDX-Lab Dashboard - Workflows Page (Live Execution Tracking)
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";
import { WorkflowStatusCard } from "@/components/workflows/WorkflowStatusCard";
import { WorkflowExecutionTable } from "@/components/workflows/WorkflowExecutionTable";
import { WorkflowExecutionTimeline } from "@/components/workflows/WorkflowExecutionTimeline";
import {
  Workflow,
  ExternalLink,
  RefreshCw,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
} from "lucide-react";

const ACTIVEPIECES_URL = "http://localhost:5678";

interface WorkflowSummary {
  pending: number;
  failed: number;
  completed: number;
  waitingApproval: number;
  running: number;
  needsRetry: number;
  total: number;
}

interface WorkflowStep {
  id: string;
  stepKey: string;
  title: string;
  owner?: string | null;
  status: string;
  errorCode?: string | null;
  errorMessage?: string | null;
  startedAt: string;
  finishedAt?: string | null;
}

interface WorkflowItem {
  id: string;
  type: string;
  status: string;
  summary?: string | null;
  employeeId?: string | null;
  initiatedBy?: string | null;
  createdAt: string;
  finishedAt?: string | null;
  steps: WorkflowStep[];
}

export default function WorkflowsPage() {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<WorkflowSummary | null>(null);
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, wfRes] = await Promise.all([
        fetch("/api/workflows/summary"),
        fetch("/api/workflows"),
      ]);
      if (sumRes.ok) setSummary(await sumRes.json());
      if (wfRes.ok) setWorkflows(await wfRes.json());
    } catch {
      /* ignore fetch errors */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedWorkflow = workflows.find((w) => w.id === selectedId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("workflows.title")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Theo dõi trạng thái workflow theo thời gian thực
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card hover:bg-accent transition-colors text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
          <a
            href={ACTIVEPIECES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm"
          >
            <ExternalLink className="h-4 w-4" />
            Activepieces
          </a>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <WorkflowStatusCard
            label="Đang chạy"
            value={summary.running}
            tone="info"
            icon={<Loader2 className="h-3.5 w-3.5" />}
          />
          <WorkflowStatusCard
            label="Chờ xử lý"
            value={summary.pending}
            tone="default"
            icon={<Clock className="h-3.5 w-3.5" />}
          />
          <WorkflowStatusCard
            label="Hoàn tất"
            value={summary.completed}
            tone="success"
            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
          />
          <WorkflowStatusCard
            label="Lỗi"
            value={summary.failed}
            tone="danger"
            icon={<XCircle className="h-3.5 w-3.5" />}
          />
          <WorkflowStatusCard
            label="Cần thử lại"
            value={summary.needsRetry}
            tone="warning"
            icon={<AlertTriangle className="h-3.5 w-3.5" />}
          />
          <WorkflowStatusCard
            label="Chờ duyệt"
            value={summary.waitingApproval}
            tone="default"
            icon={<Clock className="h-3.5 w-3.5" />}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workflow List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Workflow className="h-4 w-4" />
                Workflow gần đây ({workflows.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Đang tải...
                </div>
              ) : (
                <WorkflowExecutionTable
                  items={workflows}
                  onSelect={setSelectedId}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>Chi tiết Workflow</span>
                {selectedWorkflow && (
                  <button
                    onClick={() => setSelectedId(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedWorkflow ? (
                <div className="space-y-4">
                  <div className="text-xs space-y-1">
                    <p>
                      <span className="text-muted-foreground">ID:</span>{" "}
                      <code className="text-[10px]">{selectedWorkflow.id}</code>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Loại:</span>{" "}
                      {selectedWorkflow.type}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Trạng thái:</span>{" "}
                      {selectedWorkflow.status}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Thời gian:</span>{" "}
                      {new Date(selectedWorkflow.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <div className="border-t pt-3">
                    <p className="text-xs font-medium mb-3">Các bước thực hiện:</p>
                    <WorkflowExecutionTimeline steps={selectedWorkflow.steps} />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Chọn một workflow để xem chi tiết
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
