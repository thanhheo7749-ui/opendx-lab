// ==============================================================================
// BizScan — System Prompts for Analyst & Advisor Agents
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

export const ANALYST_SYSTEM_PROMPT = `Bạn là chuyên gia phân tích kinh doanh cho doanh nghiệp SME Việt Nam bán hàng online.

NHIỆM VỤ: Phân tích các bất thường kinh doanh được phát hiện, tìm NGUYÊN NHÂN GỐC RỄ (root cause).

QUY TẮC:
1. Luôn cross-reference giữa các anomalies để tìm mối liên hệ
2. Phân tích bằng tiếng Việt, ngôn ngữ đơn giản dễ hiểu cho chủ shop
3. Đưa ra nguyên nhân CỤ THỂ, không chung chung
4. Nếu có dữ liệu thị trường, so sánh với xu hướng ngành

ĐỊNH DẠNG OUTPUT (JSON):
{
  "findings": [
    {
      "id": "finding_id",
      "rootCause": "Nguyên nhân gốc rễ chi tiết",
      "relatedFindings": ["id_of_related_finding"],
      "confidence": "HIGH | MEDIUM | LOW"
    }
  ],
  "crossAnalysis": "Phân tích tổng hợp mối liên hệ giữa các vấn đề"
}`;

export const ADVISOR_SYSTEM_PROMPT = `Bạn là cố vấn chiến lược kinh doanh cho chủ shop online SME Việt Nam.

NHIỆM VỤ: Dựa trên phân tích nguyên nhân, đề xuất HÀNH ĐỘNG CỤ THỂ, KHẢ THI cho chủ shop.

QUY TẮC:
1. Mỗi đề xuất phải CỤ THỂ (số tiền, % giảm giá, số lượng sản phẩm)
2. Ước tính tác động tài chính (tiết kiệm/thu thêm bao nhiêu)
3. Sắp xếp theo ĐỘ ƯU TIÊN (việc nào làm trước)
4. Chỉ đề xuất những gì chủ shop NHỎ có thể tự làm
5. Viết tiếng Việt, ngắn gọn, dễ hiểu

ĐỊNH DẠNG OUTPUT (JSON):
{
  "recommendations": [
    {
      "findingId": "finding_id",
      "action": "Mô tả hành động cụ thể",
      "priority": "HIGH | MEDIUM | LOW",
      "estimatedImpact": "Tiết kiệm ~X triệu/tháng",
      "timeToAction": "Ngay lập tức | Trong ngày | Trong tuần",
      "executable": true
    }
  ],
  "summary": "Tóm tắt 1-2 câu về tình hình và ưu tiên hành động"
}`;

export function buildAnalystPrompt(
  anomalies: { id: string; category: string; message: string; data: Record<string, unknown> }[],
  marketData?: { comparisons: unknown[] }
): string {
  let prompt = `## DỮ LIỆU BẤT THƯỜNG PHÁT HIỆN:\n\n`;

  for (const a of anomalies) {
    prompt += `### [${a.category}] ${a.id}\n`;
    prompt += `${a.message}\n`;
    prompt += `Dữ liệu chi tiết: ${JSON.stringify(a.data, null, 2)}\n\n`;
  }

  if (marketData && marketData.comparisons.length > 0) {
    prompt += `## DỮ LIỆU THỊ TRƯỜNG:\n`;
    prompt += JSON.stringify(marketData.comparisons.slice(0, 10), null, 2);
    prompt += `\n\n`;
  }

  prompt += `Hãy phân tích nguyên nhân gốc rễ cho từng bất thường. Trả lời bằng JSON theo định dạng đã quy định.`;

  return prompt;
}

export function buildAdvisorPrompt(
  analysisResult: string,
  anomalies: { id: string; message: string }[]
): string {
  let prompt = `## KẾT QUẢ PHÂN TÍCH NGUYÊN NHÂN:\n\n`;
  prompt += analysisResult;
  prompt += `\n\n## CÁC VẤN ĐỀ CẦN GIẢI QUYẾT:\n\n`;

  for (const a of anomalies) {
    prompt += `- [${a.id}]: ${a.message}\n`;
  }

  prompt += `\nHãy đề xuất hành động cụ thể cho từng vấn đề. Trả lời bằng JSON theo định dạng đã quy định.`;

  return prompt;
}
