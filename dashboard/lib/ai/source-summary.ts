// ==============================================================================
// OpenDX-Lab Dashboard - AI: Source Summary Types
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

export interface AnswerSourceSummary {
  type: "sql" | "workflow" | "knowledge" | "health";
  label: string;
  ref?: string;
}

export function serializeSourceSummaries(
  sources: AnswerSourceSummary[]
): string {
  return JSON.stringify(sources);
}
