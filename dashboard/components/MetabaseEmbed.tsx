"use client";

// ==============================================================================
// OpenDX-Lab Dashboard - Metabase Embed Component
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { useEffect, useState } from "react";
import { BarChart3, RefreshCw, AlertCircle } from "lucide-react";

interface MetabaseEmbedProps {
  dashboardId: number;
  title?: string;
  height?: string;
}

export default function MetabaseEmbed({
  dashboardId,
  title = "Dashboard",
  height = "600px",
}: MetabaseEmbedProps) {
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUrl = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/metabase/embed?dashboard=${dashboardId}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setIframeUrl(data.iframeUrl);
      }
    } catch (err) {
      setError("Không thể kết nối đến Metabase. Kiểm tra lại cấu hình.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUrl();
  }, [dashboardId]);

  if (loading) {
    return (
      <div
        className="flex items-center justify-center bg-slate-800/30 rounded-xl border border-slate-800/50"
        style={{ height }}
      >
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Đang tải {title}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex items-center justify-center bg-slate-800/30 rounded-xl border border-slate-800/50"
        style={{ height }}
      >
        <div className="text-center max-w-md">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="text-sm text-slate-300 mb-1 font-medium">{title} — chưa sẵn sàng</p>
          <p className="text-xs text-slate-500 mb-4">{error}</p>
          <button
            onClick={fetchUrl}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-amber-400" />
          {title}
        </h3>
        <button
          onClick={fetchUrl}
          className="text-slate-600 hover:text-slate-400 transition-colors opacity-0 group-hover:opacity-100"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
      <iframe
        src={iframeUrl!}
        className="w-full rounded-xl border border-slate-800/50 bg-white"
        style={{ height }}
        allowTransparency
      />
    </div>
  );
}
