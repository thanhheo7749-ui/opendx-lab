// ==============================================================================
// OpenDX-Lab Dashboard - AI Chat API Route (Agentic Pipeline)
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Pipeline:
//   Step 0: Input validation
//   Step 1: Intent Classification (chatFast → qwen2.5:0.5b, ~0.3s)
//   Step 2: Route by intent:
//     - GREETING      → Static response (0 LLM calls)
//     - OUT_OF_DOMAIN  → Static rejection (0 LLM calls)
//     - HEALTH_CHECK   → Call internal health API → LLM summary
//     - WORKFLOW        → Parse params → Activepieces webhook
//     - DB_QUERY        → SQL gen → Execute → LLM stream answer
// ==============================================================================

import { NextRequest } from "next/server";
import { chatFast, chat, chatStream } from "@/lib/ai/ollama";
import {
  INTENT_CLASSIFICATION_PROMPT,
  SQL_GENERATION_PROMPT,
  ANSWER_GENERATION_PROMPT,
  HEALTH_CHECK_SUMMARY_PROMPT,
  KNOWLEDGE_ANSWER_PROMPT,
  GREETING_RESPONSES,
  OUT_OF_DOMAIN_RESPONSE,
  WORKFLOW_RESPONSE_TEMPLATE,
  VALID_INTENTS,
  type IntentType,
} from "@/lib/ai/prompts";
import { executeReadOnlySQL, extractSQL, validateReadOnly } from "@/lib/ai/sql-executor";
import { queryKnowledge } from "@/lib/knowledge/rag-query";
import { prisma } from "@/lib/prisma";
import { ensureWarmup } from "@/lib/ai/warmup";
import { answerWorkflowQuestion } from "@/lib/ai/workflow-query";
import { serializeSourceSummaries, type AnswerSourceSummary } from "@/lib/ai/source-summary";

// ── Constants ────────────────────────────────────────────────────────────────

const MAX_QUESTION_LENGTH = 500;

// ── Keyword Pre-Classification (skip LLM for obvious intents) ────────────────

function classifyByKeywords(q: string): IntentType | null {
  // GREETING patterns
  if (/^(xin\s*chào|hello|hi|hey|chào|bạn là ai|bạn là gì|who are you)\b/i.test(q)) {
    return "GREETING";
  }

  // HEALTH_CHECK patterns
  if (/\b(health|status|uptime|dịch vụ.*chạy|hệ thống.*ổn|service.*down|service.*up|kiểm tra.*hệ thống|sức khỏe)\b/i.test(q)) {
    return "HEALTH_CHECK";
  }

  // WORKFLOW_STATUS patterns (asking about workflow state, NOT triggering actions)
  if (/\b(workflow.*lỗi|workflow.*fail|workflow.*pending|onboarding.*dang dở|offboarding.*dang dở|bước.*lỗi|bước.*fail|incomplete.*workflow|quy trình.*chưa xong|quy trình.*bị lỗi|phê duyệt.*chờ)\b/i.test(q)) {
    return "WORKFLOW";
  }

  // WORKFLOW patterns (explicit action commands — must have clear action verbs)
  if (/\b(onboard|offboard|thêm nhân viên mới|kích hoạt quy trình|tuyển.*mới|cho.*nghỉ việc|chạy quy trình|thực hiện.*onboarding|bắt đầu.*offboarding)\b/i.test(q)) {
    return "WORKFLOW";
  }

  // DB_QUERY patterns (data/number questions — check BEFORE knowledge to catch HR data queries)
  if (/\b(bao nhiêu|mấy|thống kê|danh sách|liệt kê|tổng số|số lượng|count|how many|list|tên.*nhân viên|phòng ban nào|ai.*mới.*gia nhập|nhân viên.*nào|nhân sự|theo từng|theo phòng|từng phòng|theo bộ phận|phân bổ|biểu đồ|báo cáo.*nhân|report)\b/i.test(q)) {
    return "DB_QUERY";
  }

  // KNOWLEDGE_QUERY patterns
  if (/\b(quy trình|chính sách|hướng dẫn|tài liệu|sop|policy|guideline|regulation|quy định|nội quy|cách.*làm)\b/i.test(q)) {
    return "KNOWLEDGE_QUERY";
  }

  // OUT_OF_DOMAIN quick check
  if (/\b(thời tiết|weather|nấu ăn|cook|recipe|toán|math|code|lập trình|programming|joke|truyện cười)\b/i.test(q)) {
    return "OUT_OF_DOMAIN";
  }

  // No confident match → fall through to LLM classification
  return null;
}

// ── Main Handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Trigger warm-up on first request (non-blocking)
  ensureWarmup();

  try {
    const { question } = await request.json();

    // ── Step 0: Input Validation ───────────────────────────────────
    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Vui lòng nhập câu hỏi." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const userQuestion = question.trim().slice(0, MAX_QUESTION_LENGTH);

    // ── Step 1: Intent Classification ──────────────────────────────
    let intent: IntentType = "DB_QUERY"; // Safe default

    // Fast path: keyword-based pre-classification (skips LLM call ~70% of time)
    const q = userQuestion.toLowerCase();
    const keywordIntent = classifyByKeywords(q);

    if (keywordIntent) {
      intent = keywordIntent;
    } else {
      // Slow path: use LLM (0.5b fast model) for ambiguous cases
      try {
        const raw = await chatFast([
          { role: "system", content: INTENT_CLASSIFICATION_PROMPT },
          { role: "user", content: userQuestion },
        ]);

        const normalized = raw.toUpperCase().trim();
        const found = VALID_INTENTS.find((i) => normalized.includes(i));
        if (found) intent = found;
      } catch (err) {
        console.warn("[ai/chat] Intent classification failed, defaulting to DB_QUERY:", err);
      }

      // Safety guard: WORKFLOW should ONLY trigger with explicit action keywords.
      // LLM sometimes misclassifies data questions as WORKFLOW — prevent accidental triggers.
      if (intent === "WORKFLOW") {
        const hasActionVerb = /\b(onboard|offboard|thêm.*mới|kích hoạt|tuyển.*mới|cho.*nghỉ|chạy quy trình|thực hiện|bắt đầu)\b/i.test(userQuestion);
        if (!hasActionVerb) {
          console.warn(`[ai/chat] WORKFLOW downgraded to DB_QUERY (no action verb): "${userQuestion}"`);
          intent = "DB_QUERY";
        }
      }
    }

    // ── Step 2: Route by Intent ────────────────────────────────────

    switch (intent) {
      case "GREETING":
        return handleGreeting(userQuestion, intent);

      case "OUT_OF_DOMAIN":
        return handleOutOfDomain(userQuestion, intent);

      case "HEALTH_CHECK":
        return handleHealthCheck(userQuestion, intent);

      case "WORKFLOW":
        // If question is about status (not an action command), use workflow query
        if (/\b(lỗi|fail|dang dở|chưa xong|pending|bị|trạng thái|status|incomplete|chờ duyệt|phê duyệt)\b/i.test(userQuestion)) {
          return handleWorkflowStatus(userQuestion, intent);
        }
        return handleWorkflow(userQuestion, intent);

      case "KNOWLEDGE_QUERY":
        return handleKnowledgeQuery(userQuestion, intent);

      case "DB_QUERY":
      default:
        return handleDbQuery(userQuestion, intent);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("AI Chat error:", message);
    return streamText(
      `❌ Đã xảy ra lỗi: ${message}\n\nHãy thử lại sau.`,
      "DB_QUERY"
    );
  }
}

// ── Intent Handlers ──────────────────────────────────────────────────────────

/**
 * WORKFLOW_STATUS: Answer questions about workflow state from database.
 * Zero LLM calls → fast structured response.
 */
async function handleWorkflowStatus(question: string, intent: IntentType): Promise<Response> {
  const result = await answerWorkflowQuestion(question);

  logActivity(question, intent, "workflow_status", {
    workflowCount: result.items.length,
    sources: result.sources,
  });

  const response = `${result.summary}\n\n💡 **Gợi ý hành động:**\n${result.nextActions.map((a) => `- ${a}`).join("\n")}`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode("[STEP:workflow]"));
      controller.enqueue(encoder.encode("[STEP:answering]"));
      controller.enqueue(encoder.encode(response));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-AI-Intent": "WORKFLOW_STATUS",
      "X-AI-Sources": serializeSourceSummaries(result.sources),
      "X-AI-NextActions": JSON.stringify(result.nextActions),
    },
  });
}



/**
 * GREETING: Return a random static greeting response.
 * Zero LLM calls → instant response.
 */
function handleGreeting(question: string, intent: IntentType): Response {
  const idx = Math.floor(Math.random() * GREETING_RESPONSES.length);
  const response = GREETING_RESPONSES[idx];

  logActivity(question, intent, "static_greeting");

  return streamTextWithSteps(
    ["[STEP:answering]", response],
    intent
  );
}

/**
 * OUT_OF_DOMAIN: Politely reject with static text.
 * Zero LLM calls → instant response.
 */
function handleOutOfDomain(question: string, intent: IntentType): Response {
  logActivity(question, intent, "out_of_domain_reject");

  return streamTextWithSteps(
    ["[STEP:answering]", OUT_OF_DOMAIN_RESPONSE],
    intent
  );
}

/**
 * HEALTH_CHECK: Call internal health API, then summarize via LLM stream.
 */
async function handleHealthCheck(question: string, intent: IntentType): Promise<Response> {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Progress: checking health
        controller.enqueue(encoder.encode("[STEP:health]"));

        // Call internal health API
        let healthData: unknown;
        try {
          const healthRes = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/services/health`,
            { cache: "no-store" }
          );
          healthData = await healthRes.json();
        } catch {
          // Fallback: try internal Docker URL
          try {
            const healthRes = await fetch("http://localhost:3000/api/services/health", {
              cache: "no-store",
            });
            healthData = await healthRes.json();
          } catch {
            controller.enqueue(
              encoder.encode(
                "[STEP:answering]❌ Không thể kiểm tra trạng thái hệ thống. Dịch vụ health check không phản hồi."
              )
            );
            controller.close();
            return;
          }
        }

        // Progress: generating answer
        controller.enqueue(encoder.encode("[STEP:answering]"));

        // Stream the LLM summary
        const summaryStream = chatStream([
          { role: "system", content: HEALTH_CHECK_SUMMARY_PROMPT },
          {
            role: "user",
            content: `Câu hỏi: ${question}\n\nDữ liệu health check:\n${JSON.stringify(healthData, null, 2)}`,
          },
        ]);

        const reader = summaryStream.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }

        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(encoder.encode(`\n\n❌ Lỗi health check: ${msg}`));
        controller.close();
      }
    },
  });

  logActivity(question, intent, "health_check");

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-AI-Intent": intent,
    },
  });
}

/**
 * WORKFLOW: Parse employee info and trigger Activepieces webhook.
 */
async function handleWorkflow(question: string, intent: IntentType): Promise<Response> {
  // Determine action type (onboard vs offboard)
  const lowerQ = question.toLowerCase();
  const isOffboard =
    lowerQ.includes("offboard") ||
    lowerQ.includes("nghỉ việc") ||
    lowerQ.includes("cho thôi việc") ||
    lowerQ.includes("sa thải");

  const action = isOffboard ? "Offboarding" : "Onboarding";

  // Try to extract employee info from the question using a quick LLM call
  let employeeInfo = { name: "", department: "", position: "" };
  try {
    const extractPrompt = `Extract employee information from this command. Output ONLY a JSON object with keys: name, department, position. If a field is not mentioned, use empty string "".

Command: "${question}"

Output JSON only:`;

    const raw = await chat([{ role: "user", content: extractPrompt }]);

    // Try to parse JSON from LLM response
    const jsonMatch = raw.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      employeeInfo = {
        name: parsed.name || "",
        department: parsed.department || "",
        position: parsed.position || "",
      };
    }
  } catch {
    // If extraction fails, send the raw question as context
  }

  // Trigger Activepieces webhook
  const webhookUrl = isOffboard
    ? process.env.ACTIVEPIECES_OFFBOARDING_WEBHOOK_URL
    : process.env.ACTIVEPIECES_ONBOARDING_WEBHOOK_URL;

  let success = false;
  let details = "";

  if (!webhookUrl) {
    details = `Webhook URL cho ${action} chưa được cấu hình trong biến môi trường.`;
  } else {
    try {
      const webhookRes = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: action.toLowerCase(),
          employee: employeeInfo,
          rawCommand: question,
          timestamp: new Date().toISOString(),
        }),
      });
      success = webhookRes.ok;
      details = [
        `**Hành động:** ${action}`,
        employeeInfo.name ? `**Nhân viên:** ${employeeInfo.name}` : null,
        employeeInfo.department ? `**Phòng ban:** ${employeeInfo.department}` : null,
        employeeInfo.position ? `**Vị trí:** ${employeeInfo.position}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      if (!success) {
        const errText = await webhookRes.text();
        details += `\n\nLỗi webhook: ${errText}`;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      details = `Không thể kết nối đến Activepieces.\n\nLỗi: ${msg}`;
    }
  }

  const response = WORKFLOW_RESPONSE_TEMPLATE(action, details, success);

  logActivity(question, intent, `workflow_${action.toLowerCase()}`, {
    employee: employeeInfo,
    success,
  });

  return streamTextWithSteps(
    ["[STEP:workflow]", "[STEP:answering]", response],
    intent
  );
}

/**
 * KNOWLEDGE_QUERY: Graph RAG — vector search + graph traversal + LLM stream.
 */
async function handleKnowledgeQuery(question: string, intent: IntentType): Promise<Response> {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Step: Searching knowledge base
        controller.enqueue(encoder.encode("[STEP:searching]"));

        const ragResult = await queryKnowledge(question);

        if (ragResult.chunks.length === 0) {
          controller.enqueue(
            encoder.encode(
              "[STEP:answering]📭 Chưa tìm thấy thông tin liên quan trong Knowledge Graph.\n\nHãy thử:\n- Upload tài liệu vào hệ thống\n- Đồng bộ từ Wiki.js\n- Diễn đạt câu hỏi khác"
            )
          );
          controller.close();
          return;
        }

        // Step: Traversing graph
        controller.enqueue(encoder.encode("[STEP:traversing]"));

        // Build context from chunks
        const contextParts = ragResult.chunks.map((chunk, i) => {
          const sourceLabel = chunk.source === "graph" ? " (liên kết)" : "";
          return `[${i + 1}] Từ "${chunk.nodeName}" (${chunk.nodeType})${sourceLabel}:\n${chunk.content}`;
        });
        const context = contextParts.join("\n\n---\n\n");

        // Source nodes for header
        const sourceNames = [...new Set(ragResult.chunks.map((c) => c.nodeName))];

        // Step: Streaming answer
        controller.enqueue(encoder.encode("[STEP:answering]"));

        const answerStream = chatStream([
          { role: "system", content: KNOWLEDGE_ANSWER_PROMPT },
          {
            role: "user",
            content: `Câu hỏi: ${question}\n\nNguồn tri thức (${ragResult.chunks.length} đoạn từ ${sourceNames.length} tài liệu):\n\n${context}`,
          },
        ]);

        const reader = answerStream.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }

        // Append source references
        const sourcesFooter =
          "\n\n---\n📚 **Nguồn:** " +
          sourceNames.map((n) => `_${n}_`).join(", ");
        controller.enqueue(encoder.encode(sourcesFooter));

        // Log activity
        logActivity(question, intent, "knowledge_query", {
          chunksUsed: ragResult.chunks.length,
          sourceNodes: ragResult.sourceNodes.map((n) => n.name),
        });

        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(encoder.encode(`\n\n❌ Lỗi Knowledge RAG: ${msg}`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-AI-Intent": intent,
    },
  });
}

/**
 * DB_QUERY: SQL generation → Execute → LLM stream answer.
 * This is the existing RAG pipeline, now wrapped with progress markers.
 */
async function handleDbQuery(question: string, intent: IntentType): Promise<Response> {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Step 2a: Generate SQL
        controller.enqueue(encoder.encode("[STEP:querying]"));

        let sqlRaw: string;
        try {
          sqlRaw = await chat([
            { role: "system", content: SQL_GENERATION_PROMPT },
            { role: "user", content: question },
          ]);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          controller.enqueue(
            encoder.encode(
              `[STEP:answering]❌ Không thể kết nối với AI (Ollama). Hãy kiểm tra dịch vụ Ollama có đang chạy không.\n\nLỗi: ${msg}`
            )
          );
          controller.close();
          return;
        }

        const sql = extractSQL(sqlRaw);

        // Step 2b: Validate safety
        const validation = validateReadOnly(sql);
        if (!validation.valid) {
          controller.enqueue(
            encoder.encode(
              `[STEP:answering]⚠️ ${validation.error}\n\nTôi chỉ có thể truy vấn dữ liệu, không thể thay đổi dữ liệu.`
            )
          );
          controller.close();
          return;
        }

        // Step 2c: Execute SQL
        const { data, error } = await executeReadOnlySQL(sql);

        if (error) {
          controller.enqueue(
            encoder.encode(
              `[STEP:answering]Tôi không thể trả lời câu hỏi này. ${error}\n\nHãy thử diễn đạt câu hỏi khác nhé!`
            )
          );
          controller.close();
          return;
        }

        // Step 2d: Stream answer from LLM
        controller.enqueue(encoder.encode("[STEP:answering]"));

        const dataPreview = JSON.stringify(data.slice(0, 30), null, 2);
        const answerStream = chatStream([
          { role: "system", content: ANSWER_GENERATION_PROMPT },
          {
            role: "user",
            content: `Câu hỏi: ${question}\n\nKết quả truy vấn (${data.length} dòng):\n${dataPreview}`,
          },
        ]);

        const reader = answerStream.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }

        // Log activity (fire and forget)
        logActivity(question, intent, "db_query", {
          sql,
          rowCount: data.length,
        });

        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(encoder.encode(`\n\n❌ Lỗi: ${msg}`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-AI-Intent": intent,
    },
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Stream an array of text chunks as a response.
 * Used for static responses that include [STEP:...] markers.
 */
function streamTextWithSteps(chunks: string[], intent: IntentType): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-AI-Intent": intent,
    },
  });
}

/**
 * Helper: return a simple ReadableStream of text (for error/fallback messages).
 */
function streamText(text: string, intent: IntentType = "DB_QUERY"): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-AI-Intent": intent,
    },
  });
}

/**
 * Fire-and-forget activity logging.
 */
function logActivity(
  question: string,
  intent: IntentType,
  action: string,
  metadata?: Record<string, unknown>
): void {
  prisma.activityLog
    .create({
      data: {
        type: "AI_QUERY",
        message: `AI [${intent}]: "${question.substring(0, 80)}"`,
        metadata: { question, intent, action, ...metadata },
      },
    })
    .catch(() => {
      /* ignore logging failures */
    });
}
