"use client";

import { useEffect, useState, useCallback } from "react";
import { onToast, type ToastType } from "@/lib/toast";

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

let nextId = 0;

const TOAST_COLORS: Record<ToastType, string> = {
  success: "bg-green-600 text-white",
  error: "bg-red-600 text-white",
  info: "bg-blue-600 text-white",
};

const TOAST_ICONS: Record<ToastType, string> = {
  success: "✅",
  error: "❌",
  info: "ℹ️",
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    return onToast(({ type, message, duration = 5000 }) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => removeToast(id), duration);
    });
  }, [removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${TOAST_COLORS[t.type]} px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-right-5 duration-200`}
          role="alert"
        >
          <span>{TOAST_ICONS[t.type]}</span>
          <span className="text-sm font-medium">{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            className="ml-auto text-white/80 hover:text-white"
            aria-label="Đóng"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
