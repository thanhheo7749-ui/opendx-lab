// ==============================================================================
// OpenDX-Lab Dashboard - AI: Read-only SQL Executor
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { prisma } from "@/lib/prisma";

const MAX_ROWS = 100;
const QUERY_TIMEOUT_MS = 5000;

/** Dangerous SQL keywords that should be blocked */
const BLOCKED_KEYWORDS = [
  "INSERT",
  "UPDATE",
  "DELETE",
  "DROP",
  "ALTER",
  "CREATE",
  "TRUNCATE",
  "GRANT",
  "REVOKE",
  "EXEC",
  "EXECUTE",
  "INTO",     // covers SELECT INTO and INSERT INTO
];

/**
 * Validate that the SQL is read-only (SELECT only, no mutation keywords).
 */
export function validateReadOnly(sql: string): { valid: boolean; error?: string } {
  const normalized = sql.toUpperCase().replace(/--.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");

  for (const keyword of BLOCKED_KEYWORDS) {
    // Match as whole word to avoid false positives like "UPDATED" in column names
    const regex = new RegExp(`\\b${keyword}\\b`, "i");
    if (regex.test(normalized)) {
      return {
        valid: false,
        error: `Từ khóa không được phép: ${keyword}. Chỉ có thể thực hiện truy vấn đọc (SELECT).`,
      };
    }
  }

  // Must start with SELECT or WITH (for CTEs)
  const trimmed = normalized.trim();
  if (!trimmed.startsWith("SELECT") && !trimmed.startsWith("WITH")) {
    return {
      valid: false,
      error: "Truy vấn phải bắt đầu bằng SELECT hoặc WITH.",
    };
  }

  return { valid: true };
}

/**
 * Execute a read-only SQL query on the dashboard database.
 * Returns the result rows or an error message.
 */
export async function executeReadOnlySQL(
  sql: string
): Promise<{ data: Record<string, unknown>[]; error?: string }> {
  // Validate before execution
  const validation = validateReadOnly(sql);
  if (!validation.valid) {
    return { data: [], error: validation.error };
  }

  // Add LIMIT if not already present
  const normalizedUpper = sql.toUpperCase();
  let limitedSql = sql;
  if (!normalizedUpper.includes("LIMIT")) {
    limitedSql = `${sql.replace(/;?\s*$/, "")} LIMIT ${MAX_ROWS}`;
  }

  try {
    // Use Prisma's $queryRawUnsafe with timeout
    const result = await Promise.race([
      prisma.$queryRawUnsafe<Record<string, unknown>[]>(limitedSql),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Query timeout")), QUERY_TIMEOUT_MS)
      ),
    ]);

    // Sanitize BigInt values (Prisma may return these)
    const sanitized = (result as Record<string, unknown>[]).map((row) => {
      const clean: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(row)) {
        clean[key] = typeof value === "bigint" ? Number(value) : value;
      }
      return clean;
    });

    return { data: sanitized };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown database error";
    if (message.includes("timeout")) {
      return { data: [], error: "Truy vấn quá thời gian (>5 giây). Thử câu hỏi đơn giản hơn." };
    }
    return { data: [], error: `Lỗi SQL: ${message}` };
  }
}

/**
 * Clean up raw LLM output to extract just the SQL query.
 * Strips markdown fences, explanations, etc.
 */
export function extractSQL(llmOutput: string): string {
  let sql = llmOutput.trim();

  // Remove markdown code fences
  sql = sql.replace(/```sql\s*/gi, "").replace(/```\s*/g, "");

  // If there's a newline, take only the first SQL statement
  const lines = sql.split("\n").filter((l) => l.trim());
  
  // Find lines that look like SQL (start with SELECT, WITH, etc.)
  const sqlLines: string[] = [];
  let inSql = false;
  for (const line of lines) {
    const upper = line.trim().toUpperCase();
    if (upper.startsWith("SELECT") || upper.startsWith("WITH")) {
      inSql = true;
    }
    if (inSql) {
      sqlLines.push(line);
      if (line.trim().endsWith(";")) break;
    }
  }

  if (sqlLines.length > 0) {
    sql = sqlLines.join("\n");
  }

  // Remove trailing semicolons (Prisma handles this)
  sql = sql.replace(/;\s*$/, "");

  return sql.trim();
}
