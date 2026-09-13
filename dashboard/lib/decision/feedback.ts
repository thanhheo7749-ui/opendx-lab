// ==============================================================================
// ShopWise — Decision Feedback Engine
// Compare predicted vs actual outcomes after tracking period
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { prisma } from "@/lib/prisma";

export interface FeedbackResult {
  decisionId: string;
  type: string;
  title: string;
  predictedImpact: string | null;
  actualImpact: string | null;
  deviation: number | null; // percentage
  status: string;
  verdict: "accurate" | "over" | "under" | "pending";
}

export async function checkDecisionOutcome(decisionId: string): Promise<FeedbackResult> {
  const decision = await prisma.sbDecision.findUnique({ where: { id: decisionId } });
  if (!decision) throw new Error(`Decision ${decisionId} not found`);

  // If no feedbackDue or still pending
  const now = new Date();
  if (!decision.feedbackDue || now < decision.feedbackDue) {
    return {
      decisionId: decision.id,
      type: decision.type,
      title: decision.title,
      predictedImpact: decision.predictedImpact,
      actualImpact: null,
      deviation: null,
      status: decision.status,
      verdict: "pending",
    };
  }

  // Simulate actual impact (in production, this would query real metrics)
  // For demo, we generate a plausible actual vs predicted comparison
  const predicted = decision.predictedImpact || "";
  const predictedNum = extractNumber(predicted);
  
  let actualNum: number | null = null;
  let deviation: number | null = null;
  let verdict: FeedbackResult["verdict"] = "pending";

  if (predictedNum !== null) {
    // Simulate: actual is within ±30% of predicted
    const varianceFactor = 0.7 + Math.random() * 0.6; // 0.7 - 1.3
    actualNum = Math.round(predictedNum * varianceFactor);
    deviation = Math.round(((actualNum - predictedNum) / predictedNum) * 100);
    
    if (Math.abs(deviation) <= 15) verdict = "accurate";
    else if (deviation > 0) verdict = "over";
    else verdict = "under";
  }

  const actualImpact = actualNum !== null ? formatImpact(actualNum, predicted) : "Chưa có dữ liệu";

  // Update the decision record
  await prisma.sbDecision.update({
    where: { id: decision.id },
    data: {
      actualImpact,
      status: "DONE",
    },
  });

  return {
    decisionId: decision.id,
    type: decision.type,
    title: decision.title,
    predictedImpact: decision.predictedImpact,
    actualImpact,
    deviation,
    status: "DONE",
    verdict,
  };
}

export async function getDecisionStats() {
  const decisions = await prisma.sbDecision.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const total = decisions.length;
  const done = decisions.filter(d => d.status === "DONE").length;
  const pending = decisions.filter(d => d.status === "PENDING").length;

  // Calculate accuracy from decisions that have both predicted and actual
  const withFeedback = decisions.filter(d => d.predictedImpact && d.actualImpact);
  let accurateCount = 0;
  for (const d of withFeedback) {
    const predicted = extractNumber(d.predictedImpact || "");
    const actual = extractNumber(d.actualImpact || "");
    if (predicted !== null && actual !== null) {
      const deviation = Math.abs((actual - predicted) / predicted) * 100;
      if (deviation <= 20) accurateCount++;
    }
  }

  const accuracy = withFeedback.length > 0 ? Math.round((accurateCount / withFeedback.length) * 100) : null;

  return { total, done, pending, accuracy, decisions };
}

// Helpers
function extractNumber(text: string): number | null {
  // Extract number from Vietnamese-format impact strings like "17.9tr", "+300k", "Tăng 15%"
  const match = text.match(/([\d.]+)\s*(tr|tỷ|k|%|triệu)?/i);
  if (!match) return null;
  let num = parseFloat(match[1]);
  const unit = match[2]?.toLowerCase();
  if (unit === "tr" || unit === "triệu") num *= 1_000_000;
  else if (unit === "tỷ") num *= 1_000_000_000;
  else if (unit === "k") num *= 1_000;
  return num;
}

function formatImpact(num: number, template: string): string {
  const hasPrefix = template.startsWith("+") || template.startsWith("-") || template.toLowerCase().includes("tăng") || template.toLowerCase().includes("giảm");
  if (num >= 1_000_000) return `${hasPrefix ? "+" : ""}${(num / 1_000_000).toFixed(1)}tr`;
  if (num >= 1_000) return `${hasPrefix ? "+" : ""}${(num / 1_000).toFixed(0)}k`;
  return num.toString();
}
