// ==============================================================================
// BizScan — Analyst + Advisor Agents (Ollama-powered)
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Analyst: Cross-references anomalies → finds root cause
// Advisor: Proposes specific actions with estimated ROI
// ==============================================================================

import { chat } from "@/lib/ai/ollama";
import { prisma } from "@/lib/prisma";
import {
  ANALYST_SYSTEM_PROMPT,
  ADVISOR_SYSTEM_PROMPT,
  buildAnalystPrompt,
  buildAdvisorPrompt,
} from "./prompts";
import { ScanCheckResult } from "./scanner";
import { compareWithMarket } from "./market-intel";

// ── Types ──────────────────────────────────────────────────────────────────────

interface AnalysisResult {
  findings: {
    id: string;
    rootCause: string;
    relatedFindings: string[];
    confidence: string;
  }[];
  crossAnalysis: string;
}

interface AdvisorResult {
  recommendations: {
    findingId: string;
    action: string;
    priority: string;
    estimatedImpact: string;
    timeToAction: string;
    executable: boolean;
  }[];
  summary: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function tryParseJSON<T>(text: string): T | null {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }
    // Try direct parse
    return JSON.parse(text);
  } catch {
    // Try to find JSON object in text
    const objMatch = text.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try {
        return JSON.parse(objMatch[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

// ── Analyst Agent ──────────────────────────────────────────────────────────────

export async function analyzeAnomalies(
  anomalies: ScanCheckResult[]
): Promise<AnalysisResult> {
  if (anomalies.length === 0) {
    return { findings: [], crossAnalysis: "Không có bất thường để phân tích." };
  }

  // Get market data for cross-reference
  let marketData: { comparisons: unknown[] } | undefined;
  try {
    const comparisons = await compareWithMarket();
    if (comparisons.length > 0) {
      marketData = { comparisons };
    }
  } catch {
    console.log("[Analyst] Market data unavailable, proceeding without.");
  }

  const prompt = buildAnalystPrompt(
    anomalies.map((a) => ({
      id: a.id,
      category: a.category,
      message: a.message,
      data: a.data,
    })),
    marketData
  );

  console.log("[Analyst] Analyzing anomalies with Ollama...");
  const response = await chat(
    [
      { role: "system", content: ANALYST_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    process.env.OLLAMA_DEFAULT_MODEL || "qwen2.5:7b"
  );

  const parsed = tryParseJSON<AnalysisResult>(response);
  if (parsed) return parsed;

  // Fallback: create structured result from raw text
  return {
    findings: anomalies.map((a) => ({
      id: a.id,
      rootCause: response.slice(0, 500),
      relatedFindings: [],
      confidence: "MEDIUM",
    })),
    crossAnalysis: response,
  };
}

// ── Advisor Agent ──────────────────────────────────────────────────────────────

export async function generateRecommendations(
  anomalies: ScanCheckResult[],
  analysis: AnalysisResult
): Promise<AdvisorResult> {
  if (anomalies.length === 0) {
    return {
      recommendations: [],
      summary: "Không có vấn đề cần giải quyết. Mọi thứ hoạt động tốt!",
    };
  }

  const prompt = buildAdvisorPrompt(
    JSON.stringify(analysis, null, 2),
    anomalies.map((a) => ({ id: a.id, message: a.message }))
  );

  console.log("[Advisor] Generating recommendations with Ollama...");
  const response = await chat(
    [
      { role: "system", content: ADVISOR_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    process.env.OLLAMA_DEFAULT_MODEL || "qwen2.5:7b"
  );

  const parsed = tryParseJSON<AdvisorResult>(response);
  if (parsed) return parsed;

  // Fallback
  return {
    recommendations: anomalies.map((a) => ({
      findingId: a.id,
      action: "Xem xét và xử lý vấn đề này",
      priority: a.severity === "CRITICAL" ? "HIGH" : "MEDIUM",
      estimatedImpact: "Cần đánh giá thêm",
      timeToAction: "Trong ngày",
      executable: false,
    })),
    summary: response.slice(0, 300),
  };
}

// ── Full Pipeline: Scanner → Analyst → Advisor → Save ──────────────────────────

export async function runAnalysisPipeline(
  scanId: string,
  anomalies: ScanCheckResult[]
): Promise<{ analysis: AnalysisResult; advice: AdvisorResult }> {
  const startTime = Date.now();

  // Step 1: Analyst
  const analysis = await analyzeAnomalies(anomalies);
  console.log(`[Pipeline] Analysis done (${Date.now() - startTime}ms)`);

  // Step 2: Advisor
  const advice = await generateRecommendations(anomalies, analysis);
  console.log(`[Pipeline] Recommendations done (${Date.now() - startTime}ms)`);

  // Step 3: Update findings in DB with root cause + recommendations
  const findings = await prisma.sbScanFinding.findMany({
    where: { scanId },
  });

  for (const finding of findings) {
    const matchedAnalysis = analysis.findings.find((f) =>
      finding.description.includes(f.id) || f.id === finding.category.toLowerCase()
    );
    const matchedAdvice = advice.recommendations.find((r) =>
      r.findingId === finding.category.toLowerCase() ||
      finding.description.includes(r.findingId)
    );

    if (matchedAnalysis || matchedAdvice) {
      await prisma.sbScanFinding.update({
        where: { id: finding.id },
        data: {
          rootCause: matchedAnalysis?.rootCause ?? null,
          recommendation: matchedAdvice?.action ?? null,
          estimatedImpact: matchedAdvice?.estimatedImpact ?? null,
        },
      });
    }
  }

  // Update scan summary
  await prisma.sbScanResult.update({
    where: { id: scanId },
    data: {
      summary: advice.summary,
      tokensUsed: Math.round((Date.now() - startTime) / 100), // Approximate
    },
  });

  return { analysis, advice };
}
