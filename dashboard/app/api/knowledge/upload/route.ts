// ==============================================================================
// OpenDX-Lab Dashboard - Knowledge: Document Upload API
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { extractText, validateFile } from "@/lib/knowledge/extractor";
import { ingestDocument } from "@/lib/knowledge/graph-builder";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Vui lòng chọn file để upload." },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateFile(file.name, file.size);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Extract text
    const buffer = Buffer.from(await file.arrayBuffer());
    const content = await extractText(buffer, file.name);

    if (content.trim().length < 20) {
      return NextResponse.json(
        { error: "File không chứa đủ nội dung để xử lý (tối thiểu 20 ký tự)." },
        { status: 400 }
      );
    }

    // Ingest into knowledge graph
    const customName = formData.get("name") as string | null;
    const result = await ingestDocument({
      name: customName || file.name.replace(/\.[^.]+$/, ""),
      content,
      source: "upload",
      metadata: {
        originalFilename: file.name,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      ...result,
      message: `Đã tạo ${result.chunksCreated} chunks, trích xuất ${result.entitiesExtracted} entities, và tạo ${result.edgesCreated} liên kết.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[knowledge/upload] Error:", message);
    return NextResponse.json(
      { error: `Upload thất bại: ${message}` },
      { status: 500 }
    );
  }
}
