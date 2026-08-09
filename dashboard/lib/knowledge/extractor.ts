// ==============================================================================
// OpenDX-Lab Dashboard - Knowledge: Text Extraction from Documents
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Extracts plain text from uploaded documents (PDF, DOCX, TXT, MD).
// Used by the ingestion pipeline to prepare content for chunking & embedding.
// ==============================================================================

/**
 * Detect file type and extract text content.
 *
 * @param buffer - Raw file buffer
 * @param filename - Original filename (used for type detection)
 * @returns Extracted plain text
 */
export async function extractText(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const ext = filename.toLowerCase().split(".").pop() || "";

  switch (ext) {
    case "pdf":
      return extractFromPDF(buffer);
    case "docx":
    case "doc":
      return extractFromDOCX(buffer);
    case "md":
    case "markdown":
      return extractFromMarkdown(buffer.toString("utf-8"));
    case "txt":
    case "text":
      return buffer.toString("utf-8");
    default:
      throw new Error(`Unsupported file type: .${ext}. Supported: .pdf, .docx, .md, .txt`);
  }
}

/**
 * Extract text from PDF using pdf-parse.
 * Falls back to empty string if extraction fails.
 */
async function extractFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import - cast to any due to ESM/CJS module interop
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParseModule = await import("pdf-parse") as any;
    const pdfParse = pdfParseModule.default ?? pdfParseModule;
    const data = await pdfParse(buffer);
    return cleanText(data.text);
  } catch (err) {
    console.error("[extractor] PDF extraction failed:", err);
    throw new Error("Không thể đọc file PDF. File có thể bị hỏng hoặc được bảo vệ.");
  }
}

/**
 * Extract text from DOCX using mammoth.
 */
async function extractFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return cleanText(result.value);
  } catch (err) {
    console.error("[extractor] DOCX extraction failed:", err);
    throw new Error("Không thể đọc file DOCX. File có thể bị hỏng.");
  }
}

/**
 * Extract text from Markdown by stripping syntax.
 */
function extractFromMarkdown(text: string): string {
  let clean = text;

  // Remove YAML frontmatter
  clean = clean.replace(/^---[\s\S]*?---\n?/m, "");

  // Remove HTML tags
  clean = clean.replace(/<[^>]+>/g, "");

  // Remove markdown images ![alt](url)
  clean = clean.replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1");

  // Remove markdown links but keep text [text](url)
  clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Remove heading markers
  clean = clean.replace(/^#{1,6}\s+/gm, "");

  // Remove bold/italic markers
  clean = clean.replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1");

  // Remove code fences
  clean = clean.replace(/```[\s\S]*?```/g, "");
  clean = clean.replace(/`([^`]+)`/g, "$1");

  // Remove horizontal rules
  clean = clean.replace(/^[-*_]{3,}\s*$/gm, "");

  // Remove blockquote markers
  clean = clean.replace(/^>\s*/gm, "");

  // Remove list markers
  clean = clean.replace(/^[\s]*[-*+]\s+/gm, "");
  clean = clean.replace(/^[\s]*\d+\.\s+/gm, "");

  return cleanText(clean);
}

/**
 * Clean extracted text: normalize whitespace, remove control characters.
 */
function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")        // Normalize line endings
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "") // Remove control chars
    .replace(/\n{3,}/g, "\n\n")    // Collapse multiple blank lines
    .replace(/[ \t]+/g, " ")       // Collapse horizontal whitespace
    .trim();
}

/**
 * Supported file extensions for upload validation.
 */
export const SUPPORTED_EXTENSIONS = ["pdf", "docx", "doc", "md", "markdown", "txt", "text"];

/**
 * Maximum file size in bytes (10MB).
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Validate uploaded file.
 */
export function validateFile(
  filename: string,
  size: number
): { valid: boolean; error?: string } {
  const ext = filename.toLowerCase().split(".").pop() || "";

  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `File type .${ext} không được hỗ trợ. Hỗ trợ: ${SUPPORTED_EXTENSIONS.join(", ")}`,
    };
  }

  if (size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File quá lớn (${(size / 1024 / 1024).toFixed(1)}MB). Giới hạn: 10MB`,
    };
  }

  return { valid: true };
}
