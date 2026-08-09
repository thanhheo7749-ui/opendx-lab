"use client";

import { CheckCircle2, XCircle, Clock, AlertTriangle, Loader2 } from "lucide-react";

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

const stepIcons: Record<string, React.ReactNode> = {
  COMPLETED: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  FAILED: <XCircle className="h-4 w-4 text-red-500" />,
  RUNNING: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
  PENDING: <Clock className="h-4 w-4 text-gray-400" />,
  NEEDS_RETRY: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  WAITING_APPROVAL: <Clock className="h-4 w-4 text-purple-500" />,
};

export function WorkflowExecutionTimeline({ steps }: { steps: WorkflowStep[] }) {
  return (
    <div className="space-y-1">
      {steps.map((step, i) => (
        <div key={step.id} className="flex gap-3">
          {/* Timeline line + dot */}
          <div className="flex flex-col items-center">
            <div className="mt-1">{stepIcons[step.status] ?? stepIcons.PENDING}</div>
            {i < steps.length - 1 && (
              <div className="w-px flex-1 bg-border my-1" />
            )}
          </div>

          {/* Step content */}
          <div className="pb-4 min-w-0 flex-1">
            <p className="text-sm font-medium">{step.title}</p>
            {step.owner && (
              <p className="text-[10px] text-muted-foreground">
                Thực hiện bởi: {step.owner}
              </p>
            )}
            {step.finishedAt && (
              <p className="text-[10px] text-muted-foreground">
                {new Date(step.finishedAt).toLocaleString("vi-VN")}
              </p>
            )}
            {step.errorMessage && (
              <p className="text-xs text-red-500 mt-1 bg-red-500/10 px-2 py-1 rounded">
                ❌ {step.errorMessage}
                {step.errorCode && (
                  <span className="text-[10px] ml-1 opacity-70">
                    ({step.errorCode})
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
