"use client";

// ==============================================================================
// OpenDX-Lab Dashboard - AI: Next Action Chips
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { ArrowRight } from "lucide-react";

export function NextActionChips({
  actions,
  onSelect,
}: {
  actions: string[];
  onSelect: (value: string) => void;
}) {
  if (!actions || actions.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {actions.map((action) => (
        <button
          key={action}
          type="button"
          onClick={() => onSelect(action)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
        >
          <ArrowRight className="h-3 w-3" />
          {action}
        </button>
      ))}
    </div>
  );
}
