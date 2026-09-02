// ==============================================================================
// BizScan — Reporter Agent: Mattermost Notifications
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Formats scan results → sends rich Mattermost alert with action buttons.
// ==============================================================================

const MATTERMOST_WEBHOOK_URL =
  process.env.MATTERMOST_WEBHOOK_URL ??
  "http://mattermost:8065/hooks/1tweywjun7dk9kph3qyyq4odjh";

const DASHBOARD_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

// ── Types ──────────────────────────────────────────────────────────────────────

interface ReportFinding {
  id: string;
  severity: string;
  category: string;
  title: string;
  description: string;
  rootCause: string | null;
  recommendation: string | null;
  estimatedImpact: string | null;
}

interface MarketHighlight {
  keyword: string;
  trendScore: number;
  changePercent: number | null;
  category: string; // HOT, DECLINING
  recommendation: string;
}

// ── Formatting ─────────────────────────────────────────────────────────────────

function severityEmoji(severity: string): string {
  switch (severity) {
    case "CRITICAL": return "🔴";
    case "WARNING": return "🟡";
    case "INFO": return "🟢";
    default: return "⚪";
  }
}

function categoryIcon(category: string): string {
  switch (category) {
    case "REVENUE": return "💰";
    case "COST": return "💸";
    case "INVENTORY": return "📦";
    case "CUSTOMER": return "👤";
    case "ADS": return "📊";
    case "MARKET": return "🌐";
    default: return "📋";
  }
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(Math.round(amount));
}

// ── Build Report Message ───────────────────────────────────────────────────────

export function buildReportMessage(
  scanId: string,
  scanNumber: number,
  durationMs: number,
  findings: ReportFinding[],
  marketHighlights?: MarketHighlight[]
): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  let message = `## 🔍 BizScan — Báo cáo Scan #${scanNumber}\n`;
  message += `📅 ${dateStr}, ${timeStr} | ⏱️ Scan mất ${(durationMs / 1000).toFixed(1)} giây\n\n`;

  // ── Internal Findings ──
  if (findings.length > 0) {
    const criticalCount = findings.filter((f) => f.severity === "CRITICAL").length;
    const warningCount = findings.filter((f) => f.severity === "WARNING").length;

    message += `### ⚠️ Phát hiện ${findings.length} vấn đề`;
    if (criticalCount > 0) message += ` (${criticalCount} nghiêm trọng)`;
    message += `:\n\n`;

    for (const f of findings) {
      message += `${severityEmoji(f.severity)} **[${f.severity}] ${categoryIcon(f.category)} ${f.title}**\n`;
      if (f.rootCause) message += `- 🔎 Nguyên nhân: ${f.rootCause}\n`;
      if (f.recommendation) message += `- 💡 Đề xuất: ${f.recommendation}\n`;
      if (f.estimatedImpact) message += `- 📈 Tác động: ${f.estimatedImpact}\n`;
      message += `\n`;
    }
  } else {
    message += `### ✅ Mọi thứ ổn! Không phát hiện bất thường.\n\n`;
  }

  // ── Market Highlights ──
  if (marketHighlights && marketHighlights.length > 0) {
    message += `---\n\n### 🌐 Xu hướng Thị trường:\n\n`;

    for (const m of marketHighlights) {
      const trendEmoji = m.category === "HOT" ? "📈" : m.category === "DECLINING" ? "📉" : "➡️";
      const changeStr = m.changePercent
        ? `(${m.changePercent > 0 ? "+" : ""}${m.changePercent}% search)`
        : "";

      message += `${trendEmoji} **"${m.keyword}"** — Trend: ${m.trendScore}/100 ${changeStr}\n`;
      message += `   → ${m.recommendation}\n\n`;
    }
  }

  // ── Footer ──
  message += `---\n`;
  message += `🔗 [Xem chi tiết trên Dashboard](${DASHBOARD_URL}/bizscan)\n`;

  return message;
}

// ── Send to Mattermost ─────────────────────────────────────────────────────────

export async function sendMattermostReport(
  scanId: string,
  scanNumber: number,
  durationMs: number,
  findings: ReportFinding[],
  marketHighlights?: MarketHighlight[]
): Promise<boolean> {
  const message = buildReportMessage(
    scanId,
    scanNumber,
    durationMs,
    findings,
    marketHighlights
  );

  try {
    const res = await fetch(MATTERMOST_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "BizScan Agent",
        icon_emoji: ":mag:",
        text: message,
      }),
    });

    if (!res.ok) {
      console.error(`[Reporter] Mattermost webhook error: ${res.status}`);
      return false;
    }

    console.log(`[Reporter] Sent scan report #${scanNumber} to Mattermost`);
    return true;
  } catch (error) {
    console.error("[Reporter] Failed to send to Mattermost:", error);
    return false;
  }
}
