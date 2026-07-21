<!--
OpenDX-Lab - User Guide
Copyright (C) 2026 OpenDX-Lab Contributors
SPDX-License-Identifier: GPL-3.0-or-later
-->

# 📖 OpenDX-Lab — Hướng dẫn Sử dụng

Tài liệu này hướng dẫn người dùng sử dụng các tính năng chính của hệ sinh thái **OpenDX-Lab**.

---

## 1. Đăng nhập (SSO)

1. Truy cập **Dashboard** tại `http://localhost:3000`
2. Hệ thống tự động chuyển hướng sang **Keycloak** để đăng nhập
3. Nhập tài khoản Keycloak (hoặc tạo mới tại Admin Console `http://localhost:8080`)
4. Sau khi đăng nhập thành công, bạn sẽ được chuyển về Dashboard

> **Tip**: Cùng một tài khoản có thể đăng nhập vào Mattermost, Wiki.js mà không cần nhập lại mật khẩu (SSO).

---

## 2. Trang Chủ Dashboard

Trang chủ hiển thị tổng quan hệ thống:

- **Lời chào** với tên người dùng (theo thời gian trong ngày)
- **Biểu đồ phân bổ nhân sự** (donut chart: Hoạt động / Nghỉ phép / Đã nghỉ)
- **Thẻ KPI** với số liệu animated:
  - Tổng nhân viên
  - Đang hoạt động
  - Nghỉ phép
  - Số phòng ban
- **Nhân sự theo phòng ban** (bar chart)
- **Nhân viên gần đây** (5 người mới nhất)
- **Truy cập nhanh** đến các dịch vụ
- **Hoạt động gần đây** (activity feed)

---

## 3. Quản lý Nhân viên

### Xem danh sách
- Vào menu **Nhân viên** trên sidebar
- Tìm kiếm theo tên, email
- Lọc theo phòng ban hoặc trạng thái

### Thêm nhân viên mới
1. Nhấn nút **"Thêm nhân viên"**
2. Điền thông tin: Họ, Tên, Email, Vị trí, Phòng ban
3. Nhấn **"Tạo"**
4. Hệ thống tự động:
   - Lưu vào database
   - Tạo tài khoản Keycloak (SSO)
   - Gửi thông báo chào mừng trên Mattermost
   - Ghi log hoạt động

### Chỉnh sửa thông tin
- Nhấn vào nhân viên → Sửa thông tin → Lưu

### Cho nhân viên nghỉ việc
- Chuyển trạng thái sang **"Đã nghỉ"** (TERMINATED)
- Hệ thống tự động:
  - Vô hiệu hóa tài khoản Keycloak
  - Gửi thông báo trên Mattermost

---

## 4. AI Chat (Hỏi đáp thông minh)

1. Vào menu **AI Chat** trên sidebar
2. Nhập câu hỏi bằng tiếng Việt, ví dụ:
   - *"Có bao nhiêu nhân viên đang hoạt động?"*
   - *"Ai mới gia nhập gần đây?"*
   - *"Nhân sự theo từng phòng ban?"*
   - *"Phòng ban nào có nhiều nhân viên nhất?"*
3. AI sẽ tự động:
   - Tạo SQL query từ câu hỏi
   - Truy vấn database
   - Trả lời bằng ngôn ngữ tự nhiên (tiếng Việt)
4. Nhấn biểu tượng **SQL Query** để xem câu truy vấn AI đã tạo

> **Bảo mật**: AI chỉ có thể **đọc** dữ liệu, không thể thay đổi hay xóa.

---

## 5. Giám sát Dịch vụ

1. Vào menu **Dịch vụ** trên sidebar
2. Xem trạng thái UP/DOWN của tất cả 7 dịch vụ
3. Nhấn vào dịch vụ để truy cập giao diện quản trị

---

## 6. Phân tích (Analytics)

1. Vào menu **Analytics** trên sidebar
2. Xem các biểu đồ Metabase được nhúng trực tiếp:
   - Nhân sự theo phòng ban (bar chart)
   - Nhân viên mới gần đây (bảng)
   - Phân bổ trạng thái (pie chart)
   - Tổng nhân viên (number card)

---

## 7. Dịch vụ Khác

### Mattermost (Chat nội bộ)
- Truy cập: `http://localhost:3100`
- Đăng nhập bằng **OpenDX SSO**
- Nhận thông báo tự động khi có nhân viên mới hoặc nghỉ việc

### Wiki.js (Tài liệu)
- Truy cập: `http://localhost:3200`
- Đăng nhập bằng **OpenDX SSO**
- Tạo và quản lý tài liệu nội bộ

### n8n (Workflow Automation)
- Truy cập: `http://localhost:5678`
- Xem và chỉnh sửa các workflow tự động

### Metabase (BI Reports)
- Truy cập: `http://localhost:3300`
- Tạo báo cáo tùy chỉnh từ dữ liệu PostgreSQL

---

## 8. FAQ

**Q: Quên mật khẩu?**
A: Liên hệ admin để reset qua Keycloak Admin Console.

**Q: AI trả lời sai?**
A: Thử diễn đạt câu hỏi rõ ràng hơn. AI hoạt động tốt nhất với câu hỏi cụ thể về dữ liệu nhân sự.

**Q: Dịch vụ bị DOWN?**
A: Kiểm tra container: `docker ps` và restart nếu cần: `docker restart <container-name>`.
