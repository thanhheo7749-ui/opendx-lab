// ==============================================================================
// OpenDX-Lab Dashboard - API: Seed Knowledge Graph with Sample Data
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Creates realistic HR knowledge graph nodes and edges based on existing
// system context (departments, policies, processes).
// ==============================================================================

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── Sample Data ──────────────────────────────────────────────────────────────

const NODES = [
  // DEPARTMENT nodes (from real departments)
  { type: "DEPARTMENT", name: "Phòng Nhân sự (HR)", description: "Quản lý tuyển dụng, đào tạo, chấm công, lương thưởng và phúc lợi nhân viên.", source: "system" },
  { type: "DEPARTMENT", name: "Phòng Kỹ thuật (Engineering)", description: "Phát triển và bảo trì hệ thống phần mềm, hạ tầng kỹ thuật.", source: "system" },
  { type: "DEPARTMENT", name: "Phòng Kinh doanh (Sales)", description: "Quản lý bán hàng, chăm sóc khách hàng, phát triển thị trường.", source: "system" },
  { type: "DEPARTMENT", name: "Phòng Marketing", description: "Xây dựng chiến lược thương hiệu, quảng cáo, truyền thông.", source: "system" },
  { type: "DEPARTMENT", name: "Phòng Tài chính (Finance)", description: "Quản lý ngân sách, kế toán, báo cáo tài chính.", source: "system" },

  // PROCESS nodes
  { type: "PROCESS", name: "Quy trình Onboarding", description: "Quy trình tiếp nhận nhân viên mới: tạo tài khoản, cấp thiết bị, đào tạo ban đầu, giới thiệu team, ký hợp đồng. Thời gian hoàn thành: 5 ngày làm việc.", source: "system" },
  { type: "PROCESS", name: "Quy trình Offboarding", description: "Quy trình khi nhân viên nghỉ việc: thu hồi thiết bị, vô hiệu hóa tài khoản, thanh toán lương/phép còn lại, phỏng vấn exit interview.", source: "system" },
  { type: "PROCESS", name: "Quy trình Đánh giá hiệu suất", description: "Đánh giá KPI hàng quý: tự đánh giá → quản lý đánh giá → HR review → feedback 1-on-1. Deadline: ngày 15 mỗi quý.", source: "system" },
  { type: "PROCESS", name: "Quy trình Xin nghỉ phép", description: "Nhân viên gửi đơn → quản lý duyệt → HR cập nhật → thông báo team. Nghỉ phép < 3 ngày chỉ cần quản lý duyệt.", source: "system" },
  { type: "PROCESS", name: "Quy trình Tuyển dụng", description: "Yêu cầu tuyển dụng → HR đăng tin → sàng lọc CV → phỏng vấn vòng 1 (HR) → phỏng vấn vòng 2 (Tech) → offer → onboarding.", source: "system" },

  // POLICY nodes
  { type: "POLICY", name: "Chính sách Nghỉ phép", description: "Nhân viên chính thức: 12 ngày phép/năm. Thâm niên 3 năm: +2 ngày/năm. Nghỉ bệnh: 30 ngày/năm (có chứng nhận). Nghỉ không lương: tối đa 30 ngày/năm.", source: "system" },
  { type: "POLICY", name: "Chính sách Lương & Phúc lợi", description: "Lương gross 13 tháng + thưởng KPI. Bảo hiểm sức khỏe PVI. Hỗ trợ ăn trưa 30k/ngày. Thưởng sinh nhật, cưới hỏi, thai sản.", source: "system" },
  { type: "POLICY", name: "Chính sách Bảo mật Thông tin", description: "Mọi dữ liệu công ty phải bảo mật. Không chia sẻ mật khẩu, tài liệu nội bộ. VPN bắt buộc khi remote. 2FA cho tất cả hệ thống.", source: "system" },
  { type: "POLICY", name: "Chính sách Làm việc từ xa", description: "Hybrid: 3 ngày tại văn phòng + 2 ngày remote. Phải online 9h-17h. Báo cáo daily standup. Đánh giá qua output, không tracking giờ.", source: "system" },
  { type: "POLICY", name: "Nội quy Công ty", description: "Giờ làm việc: 8h30-17h30 (nghỉ trưa 12h-13h). Dress code: business casual. Không hút thuốc trong khuôn viên. Báo nghỉ trước 8h sáng.", source: "system" },

  // DOCUMENT nodes
  { type: "DOCUMENT", name: "Sổ tay Nhân viên 2024", description: "Tài liệu toàn diện về quy định, chính sách, quyền lợi của nhân viên. Cập nhật tháng 1/2024.", source: "upload" },
  { type: "DOCUMENT", name: "Hướng dẫn sử dụng OpenDX-Lab", description: "Tài liệu hướng dẫn sử dụng hệ thống dashboard quản lý nhân sự, AI chat, workflow automation.", source: "upload" },
  { type: "DOCUMENT", name: "Quy chế Đào tạo nội bộ", description: "Chương trình đào tạo: mentor 1-1, workshop hàng tháng, budget học online 5 triệu/năm, chứng chỉ IT được hỗ trợ 100%.", source: "upload" },

  // SERVICE nodes (from existing services)
  { type: "SERVICE", name: "Wiki.js", description: "Hệ thống quản lý tài liệu nội bộ. Lưu trữ SOP, chính sách, hướng dẫn kỹ thuật.", source: "system" },
  { type: "SERVICE", name: "Mattermost", description: "Nền tảng nhắn tin nội bộ, thay thế Slack. Channels theo team/project.", source: "system" },
  { type: "SERVICE", name: "Activepieces", description: "Workflow automation platform. Tự động hóa onboarding, offboarding, thông báo.", source: "system" },
  { type: "SERVICE", name: "Metabase", description: "Business Intelligence dashboard. Báo cáo nhân sự, thống kê, biểu đồ.", source: "system" },
  { type: "SERVICE", name: "Keycloak", description: "Identity & Access Management. Single Sign-On (SSO), quản lý user, phân quyền.", source: "system" },

  // ROLE nodes
  { type: "ROLE", name: "HR Manager", description: "Quản lý phòng nhân sự. Phê duyệt tuyển dụng, chính sách, đánh giá.", source: "system" },
  { type: "ROLE", name: "Team Lead", description: "Trưởng nhóm kỹ thuật. Quản lý sprint, code review, mentoring.", source: "system" },
  { type: "ROLE", name: "Nhân viên mới", description: "Nhân viên trong giai đoạn thử việc (2 tháng). Cần hoàn thành onboarding checklist.", source: "system" },

  // TOPIC nodes
  { type: "TOPIC", name: "An toàn Lao động", description: "Quy định về an toàn lao động, phòng cháy chữa cháy, sơ cứu y tế tại nơi làm việc.", source: "system" },
  { type: "TOPIC", name: "Văn hóa Công ty", description: "Giá trị cốt lõi: Minh bạch - Hợp tác - Đổi mới - Trách nhiệm. Team building hàng quý.", source: "system" },
];

// Edge definitions: [sourceName, targetName, relation, weight]
const EDGES: [string, string, string, number][] = [
  // Department relationships
  ["Quy trình Onboarding", "Phòng Nhân sự (HR)", "OWNED_BY", 1.0],
  ["Quy trình Offboarding", "Phòng Nhân sự (HR)", "OWNED_BY", 1.0],
  ["Quy trình Tuyển dụng", "Phòng Nhân sự (HR)", "OWNED_BY", 1.0],
  ["Quy trình Đánh giá hiệu suất", "Phòng Nhân sự (HR)", "OWNED_BY", 1.0],
  ["Quy trình Xin nghỉ phép", "Phòng Nhân sự (HR)", "OWNED_BY", 1.0],

  // Policy → Department
  ["Chính sách Nghỉ phép", "Phòng Nhân sự (HR)", "GOVERNS", 0.9],
  ["Chính sách Lương & Phúc lợi", "Phòng Tài chính (Finance)", "RELATES_TO", 0.8],
  ["Chính sách Bảo mật Thông tin", "Phòng Kỹ thuật (Engineering)", "GOVERNS", 0.9],
  ["Chính sách Làm việc từ xa", "Phòng Nhân sự (HR)", "GOVERNS", 0.8],
  ["Nội quy Công ty", "Phòng Nhân sự (HR)", "OWNED_BY", 1.0],

  // Process → Policy
  ["Quy trình Xin nghỉ phép", "Chính sách Nghỉ phép", "RELATES_TO", 0.9],
  ["Quy trình Onboarding", "Nội quy Công ty", "MENTIONS", 0.7],
  ["Quy trình Onboarding", "Chính sách Bảo mật Thông tin", "MENTIONS", 0.6],
  ["Quy trình Offboarding", "Chính sách Bảo mật Thông tin", "MENTIONS", 0.8],

  // Document relationships
  ["Sổ tay Nhân viên 2024", "Chính sách Nghỉ phép", "MENTIONS", 0.9],
  ["Sổ tay Nhân viên 2024", "Chính sách Lương & Phúc lợi", "MENTIONS", 0.9],
  ["Sổ tay Nhân viên 2024", "Nội quy Công ty", "MENTIONS", 0.9],
  ["Sổ tay Nhân viên 2024", "Quy trình Onboarding", "MENTIONS", 0.7],
  ["Hướng dẫn sử dụng OpenDX-Lab", "Wiki.js", "MENTIONS", 0.8],
  ["Hướng dẫn sử dụng OpenDX-Lab", "Metabase", "MENTIONS", 0.7],
  ["Hướng dẫn sử dụng OpenDX-Lab", "Activepieces", "MENTIONS", 0.7],
  ["Quy chế Đào tạo nội bộ", "Phòng Nhân sự (HR)", "OWNED_BY", 0.9],

  // Service dependencies
  ["Wiki.js", "Keycloak", "DEPENDS_ON", 1.0],
  ["Mattermost", "Keycloak", "DEPENDS_ON", 1.0],
  ["Metabase", "Keycloak", "DEPENDS_ON", 0.8],
  ["Activepieces", "Mattermost", "RELATES_TO", 0.6],

  // Role → Process
  ["HR Manager", "Quy trình Tuyển dụng", "RELATES_TO", 0.9],
  ["HR Manager", "Quy trình Đánh giá hiệu suất", "RELATES_TO", 0.8],
  ["Team Lead", "Quy trình Đánh giá hiệu suất", "RELATES_TO", 0.7],
  ["Nhân viên mới", "Quy trình Onboarding", "RELATES_TO", 1.0],

  // Role → Department
  ["HR Manager", "Phòng Nhân sự (HR)", "BELONGS_TO", 1.0],
  ["Team Lead", "Phòng Kỹ thuật (Engineering)", "BELONGS_TO", 1.0],

  // Topic relationships
  ["An toàn Lao động", "Nội quy Công ty", "PART_OF", 0.7],
  ["Văn hóa Công ty", "Phòng Nhân sự (HR)", "RELATES_TO", 0.6],
  ["Văn hóa Công ty", "Sổ tay Nhân viên 2024", "MENTIONS", 0.5],

  // Cross-department
  ["Chính sách Làm việc từ xa", "Phòng Kỹ thuật (Engineering)", "RELATES_TO", 0.7],
  ["Quy trình Tuyển dụng", "Phòng Kỹ thuật (Engineering)", "RELATES_TO", 0.6],
  ["Quy trình Tuyển dụng", "Phòng Kinh doanh (Sales)", "RELATES_TO", 0.5],

  // Service → Onboarding
  ["Quy trình Onboarding", "Keycloak", "MENTIONS", 0.8],
  ["Quy trình Onboarding", "Mattermost", "MENTIONS", 0.7],
  ["Quy trình Onboarding", "Wiki.js", "MENTIONS", 0.6],
  ["Quy trình Offboarding", "Keycloak", "MENTIONS", 0.9],
];

// Sample chunks (content snippets for RAG)
const CHUNKS: Record<string, string[]> = {
  "Quy trình Onboarding": [
    "Bước 1: HR gửi email chào mừng kèm checklist onboarding cho nhân viên mới. Bao gồm: danh sách tài liệu cần đọc, thông tin liên hệ mentor, lịch đào tạo tuần đầu tiên.",
    "Bước 2: IT tạo tài khoản trên Keycloak (SSO), cấp quyền truy cập Mattermost, Wiki.js, Email. Thời gian: trong vòng 2 giờ sau khi nhận yêu cầu từ HR.",
    "Bước 3: Đào tạo an toàn thông tin, giới thiệu chính sách bảo mật, ký cam kết bảo mật. Mentor hướng dẫn sử dụng các công cụ nội bộ.",
    "Bước 4: Team lead giới thiệu với team, phân công buddy, hướng dẫn quy trình làm việc và code review. Sprint đầu tiên: tasks nhỏ để làm quen.",
    "Bước 5: Sau 1 tuần: HR check-in. Sau 1 tháng: đánh giá tiến độ. Sau 2 tháng: kết thúc thử việc và đánh giá chính thức.",
  ],
  "Chính sách Nghỉ phép": [
    "Nhân viên chính thức được hưởng 12 ngày phép năm có lương. Phép tích lũy tối đa 5 ngày sang năm sau. Phép không sử dụng sẽ được thanh toán khi nghỉ việc.",
    "Nhân viên thâm niên 3 năm trở lên được cộng thêm 2 ngày phép/năm. Tối đa: 20 ngày phép/năm. Áp dụng từ ngày đủ 3 năm thâm niên.",
    "Nghỉ bệnh: 30 ngày/năm có chứng nhận y tế. Nghỉ quá 3 ngày liên tục cần giấy nghỉ bệnh. Nghỉ thai sản: 6 tháng cho nữ, 5 ngày cho nam.",
  ],
  "Chính sách Bảo mật Thông tin": [
    "Tất cả nhân viên phải sử dụng xác thực 2 bước (2FA) cho mọi hệ thống nội bộ. Mật khẩu tối thiểu 12 ký tự, đổi mỗi 90 ngày.",
    "Khi làm việc từ xa, bắt buộc sử dụng VPN công ty. Không truy cập hệ thống qua mạng WiFi công cộng không có VPN.",
    "Dữ liệu nhân sự, tài chính được phân loại CONFIDENTIAL. Chỉ người có quyền mới được truy cập. Vi phạm sẽ bị xử lý kỷ luật.",
  ],
  "Nội quy Công ty": [
    "Giờ làm việc chính thức: 8h30 - 17h30 (nghỉ trưa 12h00 - 13h00). Tổng: 8 giờ/ngày. Đi muộn quá 15 phút phải thông báo cho quản lý.",
    "Dress code: business casual các ngày trong tuần. Thứ 6: casual Friday. Họp với khách hàng: formal.",
  ],
};

// ── Handler ──────────────────────────────────────────────────────────────────

export async function POST() {
  try {
    // Check if data already exists
    const existing = await prisma.kgNode.count();
    if (existing > 5) {
      return NextResponse.json({
        message: `Knowledge Graph đã có ${existing} nodes. Xóa dữ liệu cũ trước khi seed lại.`,
        skipped: true,
      });
    }

    // Clear existing data
    await prisma.kgChunk.deleteMany();
    await prisma.kgEdge.deleteMany();
    await prisma.kgNode.deleteMany();

    // Create nodes
    const nodeMap = new Map<string, string>(); // name → id

    for (const node of NODES) {
      const created = await prisma.kgNode.create({
        data: {
          type: node.type,
          name: node.name,
          description: node.description,
          source: node.source,
          metadata: {},
        },
      });
      nodeMap.set(node.name, created.id);
    }

    // Create edges
    let edgeCount = 0;
    for (const [sourceName, targetName, relation, weight] of EDGES) {
      const sourceId = nodeMap.get(sourceName);
      const targetId = nodeMap.get(targetName);
      if (sourceId && targetId) {
        await prisma.kgEdge.create({
          data: { sourceId, targetId, relation, weight, metadata: {} },
        });
        edgeCount++;
      }
    }

    // Create chunks (without embeddings for now)
    let chunkCount = 0;
    for (const [nodeName, chunks] of Object.entries(CHUNKS)) {
      const nodeId = nodeMap.get(nodeName);
      if (!nodeId) continue;

      for (let i = 0; i < chunks.length; i++) {
        await prisma.kgChunk.create({
          data: {
            nodeId,
            content: chunks[i],
            chunkIndex: i,
            tokenCount: Math.ceil(chunks[i].length / 4), // Rough estimate
          },
        });
        chunkCount++;
      }
    }

    return NextResponse.json({
      message: `Đã tạo ${nodeMap.size} nodes, ${edgeCount} edges, ${chunkCount} chunks thành công!`,
      stats: {
        nodes: nodeMap.size,
        edges: edgeCount,
        chunks: chunkCount,
      },
    });
  } catch (err) {
    console.error("[knowledge/seed] Error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
