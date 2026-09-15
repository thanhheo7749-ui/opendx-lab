// ==============================================================================
// OpenDX-Lab Dashboard - Toast Notification Utility
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

export type ToastType = "success" | "error" | "info";

interface ToastEvent {
  type: ToastType;
  message: string;
  duration?: number;
}

type ToastListener = (event: ToastEvent) => void;

const listeners: Set<ToastListener> = new Set();

export function toast(type: ToastType, message: string, duration = 5000) {
  listeners.forEach((fn) => fn({ type, message, duration }));
}

export function onToast(fn: ToastListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
