<!--
OpenDX-Lab - Demo Script for OLP 2026 Competition
Copyright (C) 2026 OpenDX-Lab Contributors
SPDX-License-Identifier: GPL-3.0-or-later
-->

# 🎬 Demo Script — OpenDX-Lab (OLP PMNM 2026)

**Thời lượng**: 5 phút
**Mục tiêu**: Trình diễn hệ sinh thái DX-OS hoàn chỉnh với 4 tầng H-P-D-I

---

## ⏱ Timeline

| Thời gian | Phần          | Nội dung                                     |
|-----------|---------------|----------------------------------------------|
| 0:00-0:45 | Giới thiệu    | Kiến trúc H-P-D-I, sơ đồ hệ thống           |
| 0:45-1:45 | Demo 1: SSO   | Đăng nhập → Dashboard → Mattermost → Wiki.js |
| 1:45-3:15 | Demo 2: Auto  | Tạo nhân viên → Keycloak + Mattermost update |
| 3:15-4:15 | Demo 3: AI    | Hỏi 3 câu hỏi AI về dữ liệu nhân sự         |
| 4:15-5:00 | Demo 4: Tổng  | Service status + Metabase + tổng kết          |

---

## 📋 Pre-Demo Checklist

- [ ] Tất cả 8 containers đang chạy: `docker compose ps`
- [ ] Ollama model sẵn sàng: `docker exec opendx-ollama ollama list`
- [ ] Dashboard accessible: `http://localhost:3000`
- [ ] Keycloak accessible: `http://localhost:8080`
- [ ] Mattermost accessible: `http://localhost:3100`
- [ ] Browser tabs đã mở sẵn (Dashboard, Mattermost, Keycloak)
- [ ] Đã đăng nhập sẵn vào Dashboard

---

## 🎤 Script Chi Tiết

### Phần 1: Giới thiệu (0:00 - 0:45)

**Nói:**
> "Xin chào, tôi xin giới thiệu OpenDX-Lab — một hệ sinh thái chuyển đổi số doanh nghiệp mã nguồn mở, được xây dựng trên mô hình DX-OS với kiến trúc phân bổ H-P-D-I."

**Hiển thị**: Sơ đồ kiến trúc (docs/architecture.md)

> "Hệ thống gồm 4 tầng:
> - **H - Human**: Keycloak SSO, Mattermost Chat, Wiki.js — nơi con người tương tác
> - **P - Process**: n8n Automation, Dashboard — tự động hóa quy trình
> - **D - Data**: PostgreSQL, Metabase — quản lý và phân tích dữ liệu  
> - **I - Intelligence**: Ollama AI, RAG Pipeline — trí tuệ nhân tạo cục bộ
>
> Tất cả đều chạy bằng Docker Compose, 100% offline, không phụ thuộc dịch vụ bên ngoài."

---

### Phần 2: Demo SSO (0:45 - 1:45)

**Thao tác:**
1. Mở `http://localhost:3000` → Hệ thống redirect sang Keycloak
2. Đăng nhập bằng tài khoản Keycloak
3. Dashboard hiển thị trang chủ với lời chào cá nhân

**Nói:**
> "Như các bạn thấy, Dashboard tự động redirect sang Keycloak để xác thực. Sau khi đăng nhập, tôi được chuyển về Dashboard với lời chào cá nhân."

4. Mở tab Mattermost `http://localhost:3100` → Đăng nhập bằng "OpenDX SSO"

**Nói:**
> "Cùng một tài khoản, tôi có thể đăng nhập vào Mattermost mà không cần nhập lại mật khẩu. Đây là tính năng Single Sign-On."

---

### Phần 3: Demo Automation (1:45 - 3:15)

**Thao tác:**
1. Trên Dashboard → Nhân viên → "Thêm nhân viên"
2. Nhập: Họ = "Nguyễn", Tên = "Demo", Email = "demo@opendx.local", Vị trí = "Developer", Phòng ban = "Kỹ thuật"
3. Nhấn "Tạo"

**Nói:**
> "Khi tôi tạo nhân viên mới, hệ thống tự động kích hoạt workflow n8n..."

4. Chuyển sang tab Mattermost → Thấy thông báo chào mừng nhân viên mới
5. Chuyển sang tab Keycloak → Users → Thấy tài khoản mới được tạo tự động

**Nói:**
> "Nhìn vào Mattermost — thông báo chào mừng đã xuất hiện tự động. Và trong Keycloak, tài khoản SSO cũng đã được tạo sẵn. Tất cả đều tự động qua n8n workflow."

6. Quay lại Dashboard → Trang chủ → Thấy activity log cập nhật

---

### Phần 4: Demo AI Chat (3:15 - 4:15)

**Thao tác:**
1. Dashboard → AI Chat
2. Hỏi: "Có bao nhiêu nhân viên đang hoạt động?"
3. Đợi streaming response

**Nói:**
> "AI Assistant sử dụng Ollama — chạy hoàn toàn cục bộ, không gửi dữ liệu ra internet. AI tự động tạo SQL query, truy vấn database, và trả lời bằng tiếng Việt."

4. Hỏi tiếp: "Phòng ban nào có nhiều nhân viên nhất?"
5. Hỏi tiếp: "Ai mới gia nhập gần đây?"

**Nói:**
> "Mọi câu hỏi về dữ liệu nhân sự đều được AI trả lời chính xác. Và hoàn toàn bảo mật vì AI chạy cục bộ."

---

### Phần 5: Tổng kết (4:15 - 5:00)

**Thao tác:**
1. Dashboard → Dịch vụ → Hiển thị 7 dịch vụ đều UP
2. Dashboard → Analytics → Hiển thị biểu đồ Metabase

**Nói:**
> "Tổng kết, OpenDX-Lab là một hệ sinh thái chuyển đổi số hoàn chỉnh:
> - 8 dịch vụ tích hợp qua Docker Compose
> - SSO qua Keycloak, Chat qua Mattermost, Wiki qua Wiki.js
> - Tự động hóa quy trình qua n8n
> - BI Analytics qua Metabase
> - AI Chat cục bộ qua Ollama
>
> Tất cả đều mã nguồn mở, dễ triển khai, và bảo mật. Cảm ơn BGK đã lắng nghe!"

---

## 💡 Tips cho Demo

- **Mở sẵn** tất cả tabs trước khi demo
- **Pre-warm** Ollama: hỏi 1 câu trước demo để model load vào RAM
- **Có backup plan**: Nếu AI chậm, chuyển nhanh sang phần Metabase
- **Giữ bình tĩnh**: Nếu lỗi, giải thích kiến trúc thay vì debug live
