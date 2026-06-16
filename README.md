<div align="center">

# 🏢 OpenDX-Lab

### Hệ sinh thái Chuyển đổi số Doanh nghiệp từ 100% Phần mềm Nguồn mở

*An open-source Digital Transformation ecosystem for enterprises — one command, full DX-Lab*

[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](docker-compose.yml)
[![OLP 2026](https://img.shields.io/badge/OLP-PMNM%202026-orange)](https://vfossa.vn)
[![Open Source](https://img.shields.io/badge/Open%20Source-100%25-brightgreen)]()

[Hướng dẫn cài đặt](#-quick-start) | [Kiến trúc](#-architecture) | [Demo](#-demo) | [Tài liệu](docs/) | [Đóng góp](CONTRIBUTING.md)

</div>

---

## 📖 OpenDX-Lab là gì?

**OpenDX-Lab** là một bản phân phối (distribution) tích hợp các phần mềm nguồn mở thành hệ sinh thái chuyển đổi số hoàn chỉnh cho doanh nghiệp, theo mô hình **DX-OS** và kiến trúc phân bổ quyền điều khiển **H-P-D-I**.

### Vấn đề

> Doanh nghiệp mua 4-5 phần mềm khác nhau nhưng chúng **không kết nối** được với nhau. Nhân viên phải dùng **Zalo + trí nhớ** làm "dây nối" giữa các hệ thống. Quên = lỗi. Bận = chậm.

### Giải pháp

> **1 lệnh `docker compose up`** → Khởi động ngay hệ sinh thái CĐS hoàn chỉnh: SSO, Chat, Wiki, Workflow Automation, BI Dashboard, AI Assistant — tất cả **đã kết nối sẵn**, **đăng nhập chung**, **dữ liệu chảy tự động**.

---

## ✨ Highlights

- 🔐 **Đăng nhập 1 lần (SSO)** — Keycloak quản lý xác thực tập trung cho tất cả công cụ
- 💬 **Chat nội bộ** — Rocket.Chat thay thế Zalo trong công việc  
- 📚 **Wiki tri thức** — Wiki.js quản lý tài liệu, quy trình nội bộ
- 🔄 **Tự động hóa** — n8n workflow: tạo NV → tự cấp tài khoản, gửi thông báo
- 📊 **BI Dashboard** — Metabase trực quan hóa dữ liệu từ tất cả hệ thống
- 🤖 **AI trợ lý** — Ollama LLM trả lời câu hỏi bằng dữ liệu thật của công ty
- 🐳 **1 lệnh cài đặt** — Docker Compose khởi động toàn bộ hệ sinh thái
- 🆓 **100% miễn phí** — Tất cả phần mềm đều mã nguồn mở

---

## 📋 Mục lục

- [OpenDX-Lab là gì?](#-opendx-lab-là-gì)
- [Kiến trúc H-P-D-I](#-architecture)
- [Quick Start](#-quick-start)
- [Demo Credentials](#-demo-credentials)
- [Technology Stack](#%EF%B8%8F-technology-stack)
- [Cấu trúc dự án](#-project-structure)
- [Tài liệu](#-documentation)
- [Tiến độ dự án](#-project-status)
- [Đóng góp](#-contributing)
- [Giấy phép](#-license)
- [Đội ngũ](#-team)

---

## 🏗 Architecture

### Mô hình DX-OS — Kiến trúc H-P-D-I

```
┌──────────────────────────────────────────────────────────────────┐
│                      OpenDX-Lab (Docker Compose)                 │
│                                                                  │
│  ┌─ [H] Human ──────────────────────────────────────────────┐   │
│  │  Keycloak (SSO)  │  Rocket.Chat (Chat)  │  Wiki.js (Wiki)│   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ [P] Process ────────────────────────────────────────────┐   │
│  │  n8n (Workflow Automation)  │  Dashboard (Next.js)       │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ [D] Data ───────────────────────────────────────────────┐   │
│  │  PostgreSQL (Database)  │  Metabase (BI Dashboard)       │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ [I] Intelligence ───────────────────────────────────────┐   │
│  │  Ollama (Local LLM)  │  AI Chat (RAG)                    │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Demo Scenario: Onboarding nhân viên mới

```
Admin tạo NV "Trần Minh Đức"
    │
    ├──→ [H] Keycloak tự tạo tài khoản SSO
    ├──→ [H] Rocket.Chat tự gửi tin nhắn chào mừng
    ├──→ [H] Wiki.js tự gửi link tài liệu onboarding
    ├──→ [P] n8n workflow chạy tự động 3 bước trên
    ├──→ [D] Metabase dashboard tự cập nhật số liệu
    └──→ [I] AI Chat trả lời được "NV mới nhất là ai?"

1 hành động → 6 hệ thống phản ứng → 0 tin nhắn Zalo
```

---

## 🚀 Quick Start

### Yêu cầu hệ thống

```
✅ Docker Desktop          # https://www.docker.com/
✅ Docker Compose v2+      # Đi kèm Docker Desktop
✅ 16GB RAM tối thiểu      # Cần cho Ollama LLM
✅ 20GB ổ cứng trống       # Cho Docker images
```

### Cài đặt

```bash
# 1. Clone repository
git clone https://github.com/YOUR_USERNAME/opendx-lab.git
cd opendx-lab

# 2. Copy file cấu hình
cp .env.example .env

# 3. Khởi động toàn bộ hệ sinh thái (1 lệnh!)
docker compose up -d

# 4. Chờ tất cả services healthy (~2-3 phút lần đầu)
docker compose ps
```

Done! 🎉

| Service | URL | Mô tả |
|---------|-----|--------|
| **Dashboard** | http://localhost:3000 | Cổng chính |
| **Keycloak** | http://localhost:8080 | SSO Admin |
| **Rocket.Chat** | http://localhost:3100 | Chat nội bộ |
| **Wiki.js** | http://localhost:3200 | Wiki tri thức |
| **n8n** | http://localhost:5678 | Workflow editor |
| **Metabase** | http://localhost:3300 | BI Dashboard |
| **Ollama** | http://localhost:11434 | LLM API |

---

## 🔑 Demo Credentials

| Tài khoản | Username | Password | Vai trò |
|-----------|----------|----------|---------|
| Admin | `admin` | `admin123` | Quản trị viên |
| HR Manager | `hr.mai` | `demo123` | Trưởng phòng HR |
| IT Staff | `it.hung` | `demo123` | Nhân viên IT |
| Employee | `nv.duc` | `demo123` | Nhân viên |

---

## 🛠️ Technology Stack

| Không gian | Công cụ | Phiên bản | License | Vai trò |
|-----------|--------|-----------|---------|---------|
| **[H]** SSO | Keycloak | 25.x | Apache-2.0 | Xác thực tập trung |
| **[H]** Chat | Rocket.Chat | 7.x | MIT | Nhắn tin nội bộ |
| **[H]** Wiki | Wiki.js | 2.x | AGPL-3.0 | Quản lý tri thức |
| **[P]** Workflow | n8n | 1.x | Sustainable Use | Tự động hóa |
| **[P]** Dashboard | Next.js | 15.x | MIT | Web UI chính |
| **[D]** Database | PostgreSQL | 16 | PostgreSQL License | CSDL quan hệ |
| **[D]** BI | Metabase | 0.50 | AGPL-3.0 | Trực quan hóa |
| **[I]** LLM | Ollama | latest | MIT | AI local |
| **Deploy** | Docker Compose | v2 | Apache-2.0 | Container orchestration |

---

## 📁 Project Structure

```
opendx-lab/
├── .github/                    # GitHub workflows, issue templates
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.yml
│   │   └── feature_request.yml
│   └── workflows/
│       └── ci.yml
├── configs/                    # Cấu hình cho từng service
│   ├── keycloak/               # Keycloak realm import
│   ├── n8n/                    # Workflow templates
│   ├── metabase/               # Dashboard templates
│   └── postgres/               # Init scripts, seed data
├── dashboard/                  # Next.js web app (code chính)
│   ├── app/                    # App Router pages
│   ├── components/             # React components
│   ├── lib/                    # API clients, utilities
│   └── public/                 # Static assets
├── docs/                       # Tài liệu dự án
│   ├── architecture.md         # Kiến trúc chi tiết
│   ├── deployment.md           # Hướng dẫn triển khai
│   ├── user-guide.md           # Hướng dẫn sử dụng
│   └── api.md                  # API documentation
├── scripts/                    # Scripts tiện ích
│   ├── setup.sh                # Cài đặt tự động
│   └── seed-data.sh            # Tạo dữ liệu mẫu
├── .env.example                # Biến môi trường mẫu
├── .gitignore
├── .dockerignore
├── CHANGELOG.md                # Lịch sử thay đổi
├── CODE_OF_CONDUCT.md          # Quy tắc ứng xử
├── CONTRIBUTING.md             # Hướng dẫn đóng góp
├── docker-compose.yml          # ★ File chính — 1 lệnh chạy tất cả
├── LICENSE                     # GPL-3.0
├── README.md                   # File này
└── SECURITY.md                 # Chính sách bảo mật
```

---

## 📚 Documentation

| Tài liệu | Mô tả |
|-----------|--------|
| [Kiến trúc](docs/architecture.md) | Sơ đồ kiến trúc H-P-D-I chi tiết |
| [Triển khai](docs/deployment.md) | Hướng dẫn deploy production |
| [Sử dụng](docs/user-guide.md) | Hướng dẫn cho người dùng cuối |
| [API](docs/api.md) | API endpoints documentation |
| [Đóng góp](CONTRIBUTING.md) | Cách đóng góp vào dự án |

---

## 📈 Project Status

### Roadmap

- [x] Thiết kế kiến trúc H-P-D-I
- [ ] Docker Compose cho 8 services
- [ ] Keycloak SSO tích hợp tất cả tools
- [ ] n8n workflow templates (onboarding, offboarding)
- [ ] Dashboard web app (Next.js)
- [ ] Metabase BI dashboard
- [ ] AI Chat tích hợp Ollama
- [ ] Tài liệu hoàn chỉnh
- [ ] Demo video

---

## 🤝 Contributing

Chúng tôi hoan nghênh mọi đóng góp! Xem [CONTRIBUTING.md](CONTRIBUTING.md) để biết cách tham gia.

```bash
# Fork & clone
git clone https://github.com/YOUR_USERNAME/opendx-lab.git

# Tạo branch
git checkout -b feature/your-feature

# Commit & push
git commit -m "feat: add your feature"
git push origin feature/your-feature

# Tạo Pull Request
```

---

## 🏆 Cuộc thi OLP PMNM 2026

Dự án này được phát triển trong khuôn khổ **Khối thi Phần mềm Nguồn mở** tại **Olympic Tin học Sinh viên Việt Nam 2026**, do [VFOSSA](https://vfossa.vn) tổ chức.

**Chủ đề:** Mô hình DX-OS — Digital Transformation Operating System

---

## 👥 Team

| Thành viên | Vai trò | GitHub |
|-----------|---------|--------|
| [Tên 1] | Infrastructure + SSO | [@github1] |
| [Tên 2] | Dashboard + BI | [@github2] |
| [Tên 3] | AI Chat + Docs | [@github3] |

---

## 📄 License

Dự án này được phân phối dưới giấy phép **GNU General Public License v3.0**. Xem file [LICENSE](LICENSE) để biết chi tiết.

---

<div align="center">

**⭐ Star repo này nếu bạn thấy hữu ích!**

Made with ❤️ for OLP PMNM 2026

</div>
