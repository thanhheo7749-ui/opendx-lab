// ==============================================================================
// OpenDX-Lab Dashboard - Workflow: Shared Types
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

export type WorkflowRecordType = "ONBOARDING" | "OFFBOARDING" | "ACTIVATION";

export type WorkflowRecordStatus =
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "WAITING_APPROVAL"
  | "NEEDS_RETRY";

export interface WorkflowSeedStep {
  stepKey: string;
  title: string;
  owner?: string;
  status?: WorkflowRecordStatus;
  details?: Record<string, unknown>;
}
