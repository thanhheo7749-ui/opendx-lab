"use client";

// ==============================================================================
// OpenDX-Lab / ShopWise
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================


import { CheckCircle2, XCircle, Clock, AlertTriangle, Loader2 } from "lucide-react";

interface WorkflowExecution {
  id: string;
  type: string;
  status: string;
  summary?: string | null;
  employeeId?: string | null;
  initiatedBy?: string | null;
  createdAt: string;
  finishedAt?: string | null;
}

const statusConfig: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
  COMPLETED: {
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
    label: "Hoàn tất",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-400/30",
  },
  FAILED: {
    icon: <XCircle className="h-4 w-4 text-red-500" />,
    label: "Lỗi",
    className: "bg-red-500/10 text-red-600 border-red-400/30",
  },
  RUNNING: {
    icon: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
    label: "Đang chạy",
    className: "bg-blue-500/10 text-blue-600 border-blue-400/30",
  },
  PENDING: {
    icon: <Clock className="h-4 w-4 text-gray-400" />,
    label: "Chờ xử lý",
    className: "bg-gray-500/10 text-gray-500 border-gray-400/30",
  },
  NEEDS_RETRY: {
    icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
    label: "Cần thử lại",
    className: "bg-amber-500/10 text-amber-600 border-amber-400/30",
  },
  WAITING_APPROVAL: {
    icon: <Clock className="h-4 w-4 text-purple-500" />,
    label: "Chờ duyệt",
    className: "bg-purple-500/10 text-purple-600 border-purple-400/30",
  },
};

const typeLabels: Record<string, string> = {
  ONBOARDING: "Onboarding",
  OFFBOARDING: "Offboarding",
  ACTIVATION: "Kích hoạt",
};

export function WorkflowExecutionTable({
  items,
  onSelect,
}: {
  items: WorkflowExecution[];
  onSelect?: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Chưa có workflow nào được thực thi.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const config = statusConfig[item.status] ?? statusConfig.PENDING;
        return (
          <div
            key={item.id}
            className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
            onClick={() => onSelect?.(item.id)}
          >
            <div className="flex items-center gap-3 min-w-0">
              {config.icon}
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">
                  {typeLabels[item.type] ?? item.type}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {item.summary ?? item.id.slice(0, 12)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${config.className}`}
              >
                {config.label}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {new Date(item.createdAt).toLocaleDateString("vi-VN")}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
