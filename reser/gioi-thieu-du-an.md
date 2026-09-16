# 🛍️ ShopWise — Retail Decision Intelligence Platform

> **Nền tảng trí tuệ hỗ trợ quyết định kinh doanh cho cửa hàng bán lẻ thời trang**

---

## 📌 Giới thiệu tổng quan

**ShopWise** là một hệ thống toàn diện được thiết kế dành riêng cho các cửa hàng bán lẻ thời trang online (Shopee, TikTok Shop, Facebook, Lazada, Zalo). Hệ thống kết hợp **phân tích dữ liệu**, **trí tuệ nhân tạo (AI)** và **bản đồ tri thức (Knowledge Graph)** để giúp chủ shop đưa ra quyết định kinh doanh chính xác và kịp thời.

### 🎯 Pain Points giải quyết

| Vấn đề thực tế | Giải pháp ShopWise |
|:---------------|:--------------------|
| Bán nhiều kênh (Shopee/TikTok/FB) nhưng không biết kênh nào hiệu quả nhất | **Dashboard tổng quan** — So sánh doanh thu, đơn hàng, ROAS theo kênh |
| Hàng tồn kho nhiều nhưng không biết SP nào chậm, SP nào cần nhập thêm | **BizScan AI** — Tự động quét, cảnh báo tồn kho bất thường |
| Muốn giảm giá nhưng không biết mức nào tối ưu | **Simulator** — Mô phỏng kịch bản "What-If" trước khi ra quyết định |
| Dữ liệu nằm rải rác ở nhiều file Excel, sổ tay | **Data Import** — Tải CSV lên, hệ thống tự kiểm tra trùng lặp |
| Không nhớ quy trình vận hành, chính sách giá | **Knowledge Graph** — Bản đồ tri thức, AI trả lời dựa trên kiến thức nội bộ |
| Quản lý nhân sự, phân quyền thủ công | **RBAC + Keycloak SSO** — Đăng nhập tập trung, phân quyền theo vai trò |

---

## 🏗️ Kiến trúc hệ thống

### Mô hình DX-OS (Digital Operating System)

ShopWise được xây dựng trên kiến trúc **H-P-D-I** — 4 tầng chức năng:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       ShopWise Platform                                  │
│                                                                         │
│  [H] HUMAN        Keycloak SSO │ Mattermost Chat │ Wiki.js Docs        │
│  ─────────────────────────────────────────────────────────────────────  │
│  [P] PROCESS      Dashboard │ BizScan │ Decision │ Simulator │ Import  │
│  ─────────────────────────────────────────────────────────────────────  │
│  [D] DATA         PostgreSQL + pgvector │ Metabase BI                   │
│  ─────────────────────────────────────────────────────────────────────  │
│  [I] INTELLIGENCE Ollama (LLM local) │ RAG Engine │ Knowledge Graph    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Hệ thống gồm 8 services chạy trên Docker

| # | Service | Port | Vai trò |
|:--|:--------|:-----|:--------|
| 1 | **Next.js Dashboard** | `:3000` | Giao diện chính — 15 trang chức năng |
| 2 | **Keycloak** | `:8080` | Quản lý tài khoản & phân quyền (SSO) |
| 3 | **PostgreSQL + pgvector** | `:5432` | Database chính (23 bảng dữ liệu) |
| 4 | **Ollama** | `:11434` | AI server chạy local (Qwen2.5) |
| 5 | **Metabase** | `:3300` | BI Dashboard (báo cáo kéo thả) |
| 6 | **Mattermost** | `:3100` | Chat nội bộ |
| 7 | **Wiki.js** | `:3200` | Tài liệu & kiến thức nội bộ |
| 8 | **Activepieces** | `:5678` | Tự động hóa workflow |

---

## 📊 Các tính năng chính

### 1. 🏠 Tổng quan (Dashboard Home)

Trang chủ hiển thị **Decision Feed** — các gợi ý hành động dựa trên dữ liệu real-time:

- **Business Pulse**: Doanh thu, lợi nhuận, đơn hàng, số KH
- **Top sản phẩm bán chạy**: Xếp hạng theo doanh thu
- **Biểu đồ doanh thu 7 ngày**: Trend line với sparkline
- **Cảnh báo cần xử lý**: SP hết hàng, tồn kho chậm, kênh sụt giảm

---

### 2. 🔍 BizScan — Quét vấn đề bằng AI

AI tự động phân tích toàn bộ dữ liệu và phát hiện:

| Loại vấn đề | Ví dụ |
|:------------|:------|
| 🔴 Nghiêm trọng | "Áo blazer oversized tồn kho 45 ngày, nên giảm giá 20%" |
| 🟡 Cảnh báo | "Kênh Lazada giảm 15% doanh thu so với tháng trước" |
| 🟢 Cơ hội | "Váy vintage đang trend tăng +120%, nên nhập thêm" |

**Công nghệ**: Ollama (Qwen2.5:7b) phân tích SQL data → tạo findings → gắn mức độ ưu tiên.

---

### 3. 💡 Decision Advisor — Tư vấn quyết định

Đặt câu hỏi kinh doanh → AI phân tích dữ liệu → đưa ra khuyến nghị có số liệu:

```
Câu hỏi: "Nên giảm giá áo khoác denim 10% không?"

AI phân tích:
├── Margin hiện tại: 60% (450k/180k)
├── Sau giảm 10%: margin 56% (405k/180k)
├── Dự báo tăng sales: +25% (4 → 5 cái/ngày)
├── Tác động lợi nhuận: +12% tổng profit
└── ✅ Khuyến nghị: NÊN giảm giá, tập trung kênh TikTok
```

---

### 4. 🧪 Simulator — Mô phỏng What-If

Thay đổi tham số → xem tác động trước khi thực hiện:

- "Nếu tăng budget quảng cáo TikTok 50%?"
- "Nếu ngừng bán trên Lazada?"
- "Nếu nhập thêm 200 cái áo khoác?"

Hiển thị biểu đồ so sánh **Before/After** với dự báo doanh thu, lợi nhuận.

---

### 5. 📦 Quản lý sản phẩm (Products CRUD)

| Tính năng | Mô tả |
|:----------|:------|
| Danh sách SP | Lọc theo danh mục, tìm kiếm, phân trang |
| Thêm SP | Form đầy đủ: tên, SKU, giá, danh mục, NCC |
| Sửa SP | Inline edit hoặc modal |
| Xóa SP | Soft-delete (khôi phục được) |
| KPI Dashboard | 4 cards: Tổng SP, giá trị kho, margin TB, cảnh báo tồn |

---

### 6. 🏪 Quản lý kho hàng (Inventory)

- Bảng tồn kho real-time theo sản phẩm
- Cảnh báo màu: 🔴 Hết hàng | 🟡 Sắp hết (<10) | 🟢 Đủ
- Cập nhật số lượng nhanh (nhập/xuất)
- Lịch sử thay đổi tồn kho

---

### 7. 📥 Nhập dữ liệu (Data Import)

Hệ thống import dữ liệu 4 bước:

```
① Chọn loại        ② Upload/Paste CSV      ③ Preview         ④ Phê duyệt
   (SP/Đơn hàng/     (Drag-drop hoặc        (Xem trước        (So sánh với
    KH/NCC)           copy-paste)             dữ liệu)          DB hiện tại)
                                                                     │
                                                         ┌───────────┼──────────┐
                                                         ▼           ▼          ▼
                                                      ✅ Mới     ⚠️ Xung đột  ❌ Lỗi
                                                     (tự duyệt)  (user chọn)  (bỏ qua)
```

**Highlight**: Khi dữ liệu trùng (ví dụ SKU đã tồn tại), hệ thống hiển thị bảng so sánh **Old vs New** để user quyết định giữ cái nào.

---

### 8. 🧠 Knowledge Graph — Bản đồ tri thức

Đồ thị quan hệ giữa các entity trong doanh nghiệp:

| Node Type | Màu | Ví dụ |
|:----------|:-----|:------|
| CATEGORY | Cyan | Áo, Quần, Váy & Đầm |
| PRODUCT | Indigo | Áo khoác denim (AO-001) |
| SUPPLIER | Amber | Xưởng Tân Bình |
| CHANNEL | Green | Facebook, TikTok Shop, Shopee |
| SEGMENT | Pink | Khách Super VIP |
| STRATEGY | Orange | Chiến lược Nhập hàng |

**3 cách nhập kiến thức:**
1. **Upload file** (.pdf, .docx, .md, .txt) → auto chunk → embed → extract entities
2. **Đồng bộ từ DB** → tự tạo nodes từ dữ liệu sản phẩm/NCC/đơn hàng
3. **Seed data mẫu** → dữ liệu demo ShopWise

---

### 9. 💬 AI Chat

Chat bằng ngôn ngữ tự nhiên, AI trả lời dựa trên:
- **Dữ liệu giao dịch** (PostgreSQL): "Tổng doanh thu tháng này bao nhiêu?"
- **Kiến thức nội bộ** (Knowledge Graph): "Chính sách đổi trả của shop là gì?"

---

### 10. 👥 Quản lý nhân sự

- CRUD nhân viên (tên, SĐT, email, phòng ban, chức vụ)
- Liên kết với Keycloak (tạo nhân viên → tự tạo account SSO)
- Quản lý phòng ban

---

## 🔐 Phân quyền (RBAC)

Hệ thống sử dụng **Keycloak SSO** để quản lý tài khoản tập trung.

### 4 vai trò

| Vai trò | Icon | Quyền hạn |
|:--------|:-----|:----------|
| **Admin** | 👑 | Toàn quyền: CRUD tất cả, import, xóa, cấu hình hệ thống |
| **Manager** | 📊 | Quản lý: CRUD SP/kho, xem nhân sự, import, chạy AI scan |
| **Staff** | 🛒 | Nhân viên: Sửa SP, cập nhật kho, import CSV |
| **Viewer** | 👁️ | Chỉ xem: Dashboard, báo cáo, chat AI |

### Tài khoản demo

| Username | Password | Role |
|:---------|:---------|:-----|
| `admin` | `admin123` | Admin |
| `demo.manager` | `demo1234` | Manager |
| `demo.staff` | `demo1234` | Staff |
| `demo.viewer` | `demo1234` | Viewer |

### Luồng đăng nhập

```
Mở localhost:3000 → Tự redirect /login → Click "SSO Login"
→ Keycloak hiện form đăng nhập → Nhập username/password
→ Callback về Dashboard → Session JWT chứa roles → Hiển thị menu theo quyền
```

Người dùng mới có thể **tự đăng ký** trên trang Keycloak (nhấn "Register").

---

## 💾 Cơ sở dữ liệu

### 23 bảng dữ liệu (Prisma ORM)

```
Retail Data (sb_*)            Knowledge Graph (kg_*)      Operations (dx_*)
├── SbProduct                 ├── KgNode                  ├── Department
├── SbCustomer                ├── KgEdge                  ├── Employee
├── SbOrder                   └── KgChunk                 ├── ActivityLog
├── SbOrderItem                                           ├── DxTicket
├── SbInventory                                           ├── ApprovalRequest
├── SbSupplier                                            ├── WorkflowExecution
├── SbSupplierProduct                                     └── WorkflowStepExecution
├── SbAdCampaign
├── SbAdDailyStat
├── SbScanResult
├── SbScanFinding
├── SbMarketTrend
└── SbDecision
```

### Dữ liệu mẫu có sẵn

| Loại | Nội dung | File CSV mẫu |
|:-----|:---------|:-------------|
| Sản phẩm | 52 SKU thời trang nữ | `sample-products.csv` |
| Đơn hàng | 100+ đơn hàng đa kênh | `sample-orders.csv` |
| Khách hàng | 50+ KH với phân khúc | `sample-customers.csv` |
| NCC | 5 nhà cung cấp | `sample-suppliers.csv` |
| Quảng cáo | 10+ campaigns FB/TikTok | `sample-campaigns.csv` |

---

## 🛠️ Tech Stack

| Layer | Công nghệ | Phiên bản |
|:------|:----------|:----------|
| **Frontend** | Next.js + React | 15.x |
| **Styling** | Tailwind CSS + Shadcn/ui | 4.x |
| **Database** | PostgreSQL + pgvector | 16 |
| **ORM** | Prisma | 6.x |
| **Auth** | NextAuth.js + Keycloak | v5 / 25.0 |
| **AI/LLM** | Ollama (Qwen2.5) | Local |
| **Vector DB** | pgvector (embedding search) | — |
| **BI** | Metabase | v0.50.3 |
| **Chat** | Mattermost | 10.2 |
| **Wiki** | Wiki.js | 2.x |
| **Automation** | Activepieces | Latest |
| **Container** | Docker Compose | v2 |
| **Graph UI** | react-force-graph-2d | — |
| **i18n** | Custom (VI/EN) | — |
| **Charts** | Recharts | — |

---

## 📈 Thống kê codebase

| Chỉ số | Giá trị |
|:-------|:--------|
| Tổng file source (.ts/.tsx) | **~130 files** |
| Tổng dòng code | **~19,700 lines** |
| API Routes | **21 nhóm endpoints** |
| Dashboard Pages | **15 trang** |
| Prisma Models | **23 models** |
| Docker Services | **8 containers** |
| Keycloak Roles | **5 realm roles** |
| Ngôn ngữ hỗ trợ | **Tiếng Việt + English** |

---

## 🚀 Cách chạy dự án

### Yêu cầu
- Docker Desktop (Windows/Mac)
- 8GB RAM trở lên (cho Ollama LLM)

### Khởi chạy

```bash
# 1. Clone repo
git clone https://github.com/thanhheo7749-ui/opendx-lab.git
cd opendx-lab

# 2. Tạo file .env từ mẫu
cp .env.example .env

# 3. Chạy tất cả services
docker compose up -d

# 4. Chờ ~2 phút cho services khởi động
# 5. Truy cập http://localhost:3000
```

### Ports truy cập

| URL | Dịch vụ |
|:----|:--------|
| `http://localhost:3000` | Dashboard chính |
| `http://localhost:8080` | Keycloak Admin |
| `http://localhost:3300` | Metabase BI |
| `http://localhost:3100` | Mattermost Chat |
| `http://localhost:3200` | Wiki.js |
| `http://localhost:5678` | Activepieces |

---

## 📁 Cấu trúc thư mục dự án

```
opendx-lab/
├── dashboard/                  # Next.js 15 Application
│   ├── app/                    # App Router (pages + API)
│   ├── components/             # React components
│   ├── lib/                    # Business logic & utilities
│   ├── prisma/                 # Database schema
│   └── middleware.ts           # Auth guard
├── configs/                    # Service configurations
├── docs/                       # Documentation
│   ├── architecture.md         # System architecture
│   └── rag-samples/            # Sample docs for KG import
├── presentation/               # Slide presentations
├── scripts/                    # Setup & utility scripts
├── docker-compose.yml          # All 8 services
├── .env                        # Environment variables
└── README.md                   # Project overview
```

---

## 👨‍💻 Tác giả

**Dự án ShopWise** — Nền tảng Retail Decision Intelligence  
Phát triển trong khuôn khổ cuộc thi OLP — HUTECH 2026

---

*Tài liệu này được tạo tự động từ codebase hiện tại.*  
*Cập nhật lần cuối: 16/09/2026*
