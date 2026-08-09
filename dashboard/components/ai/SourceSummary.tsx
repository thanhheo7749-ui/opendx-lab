"use client";

// ==============================================================================
// OpenDX-Lab Dashboard - AI: Source Summary Badges
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { Database, Workflow, BookOpen, Activity } from "lucide-react";

interface Source {
  type: string;
  label: string;
  ref?: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  sql: <Database className="h-3 w-3" />,
  workflow: <Workflow className="h-3 w-3" />,
  knowledge: <BookOpen className="h-3 w-3" />,
  health: <Activity className="h-3 w-3" />,
};

const typeColors: Record<string, string> = {
  sql: "border-blue-400/30 text-blue-600 bg-blue-500/10",
  workflow: "border-amber-400/30 text-amber-600 bg-amber-500/10",
  knowledge: "border-emerald-400/30 text-emerald-600 bg-emerald-500/10",
  health: "border-purple-400/30 text-purple-600 bg-purple-500/10",
};

export function SourceSummary({ sources }: { sources: Source[] }) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      <span className="text-[10px] text-muted-foreground mr-1">Nguồn:</span>
      {sources.map((source, i) => (
        <span
          key={`${source.type}-${i}`}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${typeColors[source.type] ?? "border-border text-muted-foreground"}`}
        >
          {typeIcons[source.type]}
          {source.label}
        </span>
      ))}
    </div>
  );
}
