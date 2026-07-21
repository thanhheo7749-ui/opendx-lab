<!--
OpenDX-Lab - Deployment Guide
Copyright (C) 2026 OpenDX-Lab Contributors
SPDX-License-Identifier: GPL-3.0-or-later
-->

# 🐳 OpenDX-Lab — Deployment Guide

Tài liệu này hướng dẫn cách triển khai hệ sinh thái **OpenDX-Lab** trên các môi trường khác nhau.

---

## 🛠 Prerequisites (Yêu cầu)

| Yêu cầu             | Phiên bản tối thiểu | Ghi chú                                    |
|----------------------|---------------------|---------------------------------------------|
| Docker Engine        | v20.10+             | [Install Docker](https://docs.docker.com)   |
| Docker Compose       | v2.20+              | Included with Docker Desktop                |
| RAM                  | 8GB (16GB khuyến nghị) | Ollama LLM cần ~2GB cho model qwen2.5:3b |
| Dung lượng đĩa      | 15GB                | Images + volumes + model weights            |
| Git                  | v2.0+               | Để clone repository                         |
| Port khả dụng       | 3000, 3100, 3200, 3300, 5432, 5678, 8080, 11434 |                        |

---

## 🚀 Quick Start (Triển khai Nhanh)

### Cách 1: Tự động (Khuyến nghị)

```bash
# 1. Clone repository
git clone https://github.com/your-org/opendx-lab.git
cd opendx-lab

# 2. Chạy script tự động
bash scripts/setup.sh
```

Script `setup.sh` sẽ tự động:
- Tạo file `.env` từ `.env.example`
- Khởi động tất cả containers
- Đợi PostgreSQL healthy
- Pull model AI (qwen2.5:3b, ~2GB)
- Đợi Dashboard sẵn sàng

### Cách 2: Thủ công

```bash
# 1. Clone và cấu hình
git clone https://github.com/your-org/opendx-lab.git
cd opendx-lab
cp .env.example .env

# 2. Khởi động
docker compose up -d

# 3. Pull model AI
docker exec opendx-ollama ollama pull qwen2.5:3b

# 4. Kiểm tra
docker compose ps
```

---

## 🌐 Truy cập Dịch vụ

| Dịch vụ       | URL                          | Mô tả                   |
|---------------|------------------------------|--------------------------|
| Dashboard     | http://localhost:3000         | Portal quản trị chính    |
| Keycloak SSO  | http://localhost:8080         | Identity & Access Mgmt   |
| Mattermost    | http://localhost:3100         | Chat nội bộ              |
| Wiki.js       | http://localhost:3200         | Quản lý tài liệu        |
| n8n           | http://localhost:5678         | Workflow Automation      |
| Metabase      | http://localhost:3300         | BI & Reports             |
| Ollama        | http://localhost:11434        | LLM API                  |
| PostgreSQL    | localhost:5432                | Database (internal)      |

---

## 🔐 Tài khoản Mặc định

| Dịch vụ    | Username        | Password                       |
|------------|-----------------|-------------------------------|
| Keycloak   | `admin`         | `admin123`                    |
| Dashboard  | *(SSO qua Keycloak)* | *(Tạo user trong Keycloak)* |
| n8n        | `admin@opendx.local` | `opendx-admin-pass`      |

---

## 🔄 Reset (Làm sạch dữ liệu)

```bash
# Dừng tất cả, xóa volumes, khởi động lại
bash scripts/reset.sh
```

> ⚠️ **Cảnh báo**: Lệnh này sẽ xóa TOÀN BỘ dữ liệu (database, volumes, config).

---

## 🔒 Production Deployment

Khi triển khai trên VPS/Cloud:

1. **Thay đổi mật khẩu** trong `.env`:
   - `NEXTAUTH_SECRET` → chuỗi ngẫu nhiên 32+ ký tự
   - `KEYCLOAK_ADMIN_PASSWORD` → mật khẩu mạnh
   - `POSTGRES_PASSWORD` → mật khẩu mạnh
   - Tất cả client secrets

2. **Cấu hình Reverse Proxy** (Nginx/Traefik):
   - SSL/TLS certificates
   - Domain mapping cho từng dịch vụ

3. **Cấu hình DNS**:
   - `app.company.com` → Dashboard
   - `sso.company.com` → Keycloak
   - `chat.company.com` → Mattermost
   - `wiki.company.com` → Wiki.js

4. **Keycloak Production Mode**: `kc.sh start` thay vì `start-dev`

5. **Resource limits**: Thêm `deploy.resources.limits` trong docker-compose

---

## 🐛 Troubleshooting

| Vấn đề | Giải pháp |
|--------|-----------|
| Container restart loop | `docker logs <container-name>` để xem lỗi |
| PostgreSQL connection refused | Đợi healthcheck: `docker inspect opendx-postgres` |
| Keycloak 500 error | Kiểm tra DB connection: `KC_DB_URL` trong `.env` |
| Ollama model not found | `docker exec opendx-ollama ollama pull qwen2.5:3b` |
| Dashboard build error | `docker exec opendx-dashboard npm install` |
| Port đã bị chiếm | Thay đổi port trong `.env` (e.g., `MATTERMOST_PORT=3101`) |
