// ==============================================================================
// OpenDX-Lab Dashboard - Wiki: Onboarding Page Builder
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

/**
 * Build markdown content for an employee's onboarding knowledge page.
 */
export function buildOnboardingPage(input: {
  fullName: string;
  department: string;
  position: string;
}) {
  const content = `# 🎉 Chào mừng ${input.fullName}!

## Thông tin

| Mục | Chi tiết |
|-----|---------|
| **Họ tên** | ${input.fullName} |
| **Phòng ban** | ${input.department} |
| **Vị trí** | ${input.position} |
| **Ngày bắt đầu** | ${new Date().toLocaleDateString("vi-VN")} |

## Checklist Onboarding

- [ ] Đăng nhập hệ thống bằng SSO (Keycloak)
- [ ] Tham gia kênh chat phòng ban (Mattermost)
- [ ] Đọc tài liệu quy trình nội bộ (Wiki.js)
- [ ] Xác nhận với quản lý về nhiệm vụ tuần đầu
- [ ] Cập nhật thông tin cá nhân trong hệ thống

## Liên kết hữu ích

- [Dashboard](http://localhost:3000) — Trang quản trị chính
- [Wiki.js](http://localhost:3200) — Tài liệu nội bộ
- [Mattermost](http://localhost:3100) — Chat nhóm
- [Keycloak](http://localhost:8080) — Quản lý tài khoản

## SOP liên quan

- Quy trình onboarding nhân viên mới
- Hướng dẫn sử dụng hệ thống nội bộ
- Chính sách bảo mật thông tin

---
*Trang này được tạo tự động bởi OpenDX-Lab.*
`;

  return {
    title: `Onboarding - ${input.fullName}`,
    content,
  };
}
