-- Fix: use locale 'en' (the only available locale)
-- Insert pages for ShopWise Wiki.js

INSERT INTO pages (path, hash, title, description, "isPublished", "isPrivate", "privateNS", content, render, "contentType", "createdAt", "updatedAt", "editorKey", "localeCode", "authorId", "creatorId")
VALUES
('van-hanh/quy-trinh-kho', md5('van-hanh/quy-trinh-kho'), 'Quy trình vận hành kho hàng', 'SOP nhập hàng, xuất kho, kiểm kê, đổi trả', true, false, '',
'# Quy trình vận hành kho hàng

## 1. Nhập hàng
- Kiểm tra tồn kho mỗi tuần vào thứ 2
- SP có tồn kho < 10 và bán > 5/tuần thì nhập gấp
- SP trend score > 70 thì ưu tiên nhập
- Batch nhập: 2 tuần/lần, đặt NCC trước 3 ngày

### NCC ưu tiên
- Xưởng Tân Bình (TP.HCM): Giao 1 ngày, rating 4.8/5
- Công ty May Bình Dương: Giá tốt hơn 10-15%, giao 2 ngày
- Xưởng Hà Nội Textile: Chất lượng cao, giao 5 ngày

## 2. Xuất kho
1. Đơn mới → Kiểm tồn → Pick and Pack
2. Chụp ảnh SP trước đóng gói
3. Dán label → Giao shipper
4. Update trạng thái đơn

- Đơn trước 14h → giao trong ngày
- Đơn sau 14h → giao sáng hôm sau

## 3. Kiểm kê
- Toàn bộ: Cuối mỗi tháng
- Spot check: Mỗi thứ 5 (random 20% SKU)
- Chênh lệch > 3% → báo cáo quản lý

## 4. Hàng tồn chậm
- 15-30 ngày: Bình thường
- 30-45 ngày: Giảm 10-15%
- 45-60 ngày: Giảm 20-30%
- Trên 60 ngày: Giảm 40-50% hoặc thanh lý

## 5. Đổi trả
- Đổi trong 7 ngày (còn tag, chưa giặt)
- Trả trong 3 ngày nếu hàng lỗi
- Hàng sale > 30% không đổi trả', '', 'markdown', NOW(), NOW(), 'markdown', 'en', 1, 1),

('chinh-sach/gia-va-khuyen-mai', md5('chinh-sach/gia-va-khuyen-mai'), 'Chính sách giá và khuyến mãi', 'Markup, flash sale, loyalty, voucher', true, false, '',
'# Chính sách giá và khuyến mãi

## 1. Markup chuẩn
- Áo, Quần: 2.5x giá gốc (margin 60%)
- Váy, Đầm: 2.7x giá gốc (margin 63%)
- Set đồ: 2.5x giá gốc (margin 60%)
- Phụ kiện: 3.0x giá gốc (margin 67%)

## 2. Giá theo kênh
- Facebook, Zalo: Giá gốc (linh hoạt 5-10%)
- Shopee: Giá gốc + 5% phí sàn
- Lazada: Giá gốc + 4% phí sàn
- TikTok Shop: Giá gốc + 3% platform

## 3. Flash Sale hàng tuần
- Thứ 6, 20h-22h
- Giảm tối đa 15%
- Giới hạn 30 cái/SP

## 4. Loyalty Program
- Đơn thứ 2: Giảm 5%
- Đơn thứ 5: Giảm 10% + free ship
- Đơn thứ 10: VIP giảm 10% cố định
- Chi tiêu > 5 triệu: Super VIP giảm 15%

## 5. Mã giảm giá
- WELCOME10: Giảm 10% đơn đầu (max 100k)
- FREESHIP: Free ship đơn > 300k
- COMBO5: Giảm 5% mua 2 SP trở lên
- VIP15: Giảm 15% cho VIP (private)', '', 'markdown', NOW(), NOW(), 'markdown', 'en', 1, 1),

('chien-luoc/marketing', md5('chien-luoc/marketing'), 'Chiến lược Marketing', 'Facebook Ads, TikTok, Google, KOL', true, false, '',
'# Chiến lược Marketing

## Budget: 15-20 triệu/tháng
- Facebook Ads: 40% (6-8 triệu)
- TikTok Ads: 35% (5-7 triệu)
- Google Ads: 15% (2-3 triệu)
- KOL: 10% (1.5-2 triệu)

## Quy tắc ROAS
- ROAS < 1.0 sau 3 ngày: Dừng ngay
- ROAS 1.0-1.5: Giảm budget 50%
- ROAS 1.5-3.0: Duy trì, A/B test
- ROAS > 3.0: Scale gấp đôi

## Facebook Ads
- Target: Nữ 22-35 tuổi, TP.HCM + HN
- Format: Carousel + Video 15s Reels
- A/B Test: 3 creatives/campaign

## TikTok
- Đăng 1-2 video/ngày
- Livestream: T3, T5, CN tối 20h
- Spark Ads từ video organic

## KOL
- Nano (<10k): Barter gửi SP miễn phí
- Micro (10-30k): 200-500k/video
- Mid (30-100k): 500k-2 triệu/video
- Affiliate: Commission 10-15%', '', 'markdown', NOW(), NOW(), 'markdown', 'en', 1, 1),

('chien-luoc/phan-tich-khach-hang', md5('chien-luoc/phan-tich-khach-hang'), 'Phân tích khách hàng', 'Phân khúc RFM, CLV, chăm sóc KH', true, false, '',
'# Phân tích khách hàng

## Phân khúc RFM

### Super VIP (5% KH, 25% doanh thu)
- Chi tiêu > 5 triệu
- Mua 2-3 lần/tháng, AOV 1.2 triệu
- Kênh: Facebook + Zalo
- Chăm sóc: Inbox riêng, giảm 15%, free ship, quà sinh nhật

### VIP (15% KH, 35% doanh thu)
- Chi tiêu 2-5 triệu
- Mua 1-2 lần/tháng, AOV 650k
- Kênh: Facebook + Shopee
- Chăm sóc: Giảm 10%, free ship > 300k

### Khách thường (80% KH, 40% doanh thu)
- Chi tiêu < 2 triệu
- AOV 350k
- Kênh: Shopee + TikTok
- Chăm sóc: Welcome 10%, remarketing 7 ngày

## KPI hàng tháng
- Khách mới: > 200/tháng
- Tỷ lệ mua lại: > 30%
- AOV: > 400k
- CLV 6 tháng: > 1.5 triệu
- Churn rate: < 20%', '', 'markdown', NOW(), NOW(), 'markdown', 'en', 1, 1),

('he-thong/kien-truc', md5('he-thong/kien-truc'), 'Kiến trúc hệ thống', 'Docker, database, AI pipeline', true, false, '',
'# Kiến trúc hệ thống ShopWise

## Docker Services (8 containers)
- Dashboard (Next.js 15): Port 3000
- Keycloak (SSO): Port 8080
- PostgreSQL + pgvector: Port 5432
- Ollama (AI): Port 11434
- Metabase (BI): Port 3300
- Mattermost (Chat): Port 3100
- Wiki.js (Docs): Port 3200
- Activepieces (Automation): Port 5678

## Database: 23 bảng Prisma
- sb_* : Sản phẩm, đơn hàng, KH, NCC, kho, quảng cáo
- kg_* : Knowledge Graph (Node, Edge, Chunk)
- dx_* : Nhân sự, phòng ban, ticket, workflow

## AI Pipeline
1. BizScan: Quét vấn đề tự động
2. Decision Advisor: Tư vấn quyết định
3. Simulator: Mô phỏng What-If
4. RAG Chat: Trả lời từ Knowledge Graph

## Phân quyền (4 roles)
- Admin: Toàn quyền
- Manager: CRUD SP/kho, import, AI
- Staff: Sửa SP, cập nhật kho
- Viewer: Chỉ xem', '', 'markdown', NOW(), NOW(), 'markdown', 'en', 1, 1),

('he-thong/huong-dan-dashboard', md5('he-thong/huong-dan-dashboard'), 'Hướng dẫn sử dụng Dashboard', 'Cách dùng các tính năng chính', true, false, '',
'# Hướng dẫn sử dụng Dashboard

## Đăng nhập
1. Mở http://localhost:3000
2. Click Đăng nhập với SSO
3. Nhập tài khoản Keycloak
4. Redirect về Dashboard

## Tài khoản demo
- admin / admin123 (Admin)
- demo.manager / demo1234 (Manager)
- demo.staff / demo1234 (Staff)
- demo.viewer / demo1234 (Viewer)

## Các trang chính

### Tổng quan (/)
- KPI: Doanh thu, lợi nhuận, đơn hàng
- Biểu đồ 7 ngày, Top SP bán chạy
- Decision Feed: Gợi ý hành động

### Sản phẩm (/products)
- Danh sách SP, tìm kiếm, lọc
- Thêm/sửa/xóa sản phẩm (soft-delete)

### Kho hàng (/inventory)
- Tồn kho real-time
- Cảnh báo hết hàng

### Nhập dữ liệu (/data-sources)
- Upload CSV, kiểm tra trùng lặp
- Bảng so sánh Old vs New

### BizScan (/bizscan)
- AI quét vấn đề tự động
- Phát hiện tồn kho, doanh thu bất thường

### Knowledge Graph (/knowledge-graph)
- Bản đồ quan hệ SP-NCC-Kênh-KH
- Upload tài liệu vào RAG
- Đồng bộ từ DB

### Chat AI (/ai-chat)
- Hỏi câu hỏi kinh doanh bằng ngôn ngữ tự nhiên', '', 'markdown', NOW(), NOW(), 'markdown', 'en', 1, 1),

('chinh-sach/nhan-su', md5('chinh-sach/nhan-su'), 'Chính sách nhân sự', 'Ca làm việc, vai trò, phúc lợi', true, false, '',
'# Chính sách nhân sự

## Ca làm việc
- Sáng: 8h00 - 12h00
- Chiều: 13h00 - 17h30
- Tối (Livestream): 19h30 - 22h00 (T3, T5, CN) phụ cấp 150k/buổi

## Vai trò

### Quản lý cửa hàng
- Quyết định nhập hàng, định giá
- Duyệt đơn > 1 triệu
- Quản lý nhân viên, phân ca

### Nhân viên bán hàng
- Tiếp nhận và xử lý đơn hàng
- Pick and Pack, giao shipper
- Trả lời inbox KH (< 15 phút)
- Livestream theo lịch

### Nhân viên kho
- Nhập hàng, kiểm đếm
- Sắp xếp kho theo danh mục
- Kiểm kê hàng tuần

## Phúc lợi
- Lương cứng + hoa hồng 2%
- Thưởng KPI: đạt 100% target thì +1 triệu
- Nghỉ phép: 12 ngày/năm
- BHXH, BHYT theo quy định
- Discount nhân viên: Giảm 30% mua SP shop

## Quy định
- Đi trễ > 15 phút: Trừ 50k/lần
- Nghỉ không phép: Trừ 1 ngày lương
- Làm mất hàng: Bồi thường theo giá gốc', '', 'markdown', NOW(), NOW(), 'markdown', 'en', 1, 1),

('van-hanh/quy-trinh-ban-hang', md5('van-hanh/quy-trinh-ban-hang'), 'Quy trình bán hàng đa kênh', 'Xử lý đơn hàng Facebook, Shopee, TikTok, Lazada, Zalo', true, false, '',
'# Quy trình bán hàng đa kênh

## 1. Tiếp nhận đơn hàng

### Theo kênh
- Facebook: Inbox Fanpage, phản hồi < 15 phút
- TikTok Shop: Đơn tự động, xử lý < 1 giờ
- Shopee: Đơn tự động, xử lý < 2 giờ
- Lazada: Đơn tự động, xử lý < 2 giờ
- Zalo: Chat OA, phản hồi < 30 phút

### Thông tin cần thu thập
- Tên KH + SĐT
- SP (mã SKU) + size/màu
- Địa chỉ giao hàng
- Thanh toán: COD hoặc chuyển khoản

## 2. Trạng thái đơn hàng
1. Mới — Vừa tiếp nhận
2. Đã xác nhận — KH confirm
3. Đang đóng gói — Pick and Pack
4. Đã giao vận — Chuyển shipper
5. Hoàn thành — KH nhận hàng
6. Đã hủy — KH hủy hoặc hoàn

## 3. Chăm sóc sau bán
- Cảm ơn sau 1 ngày nhận hàng
- Hỏi feedback sau 3 ngày
- Voucher mua lại sau 7 ngày
- Remarketing sau 30 ngày

## 4. Xử lý complaint
- Sai size/màu: Đổi miễn phí + free ship (24h)
- Hàng lỗi: Đổi mới + voucher 10% (24h)
- Giao chậm: Xin lỗi + voucher free ship (12h)', '', 'markdown', NOW(), NOW(), 'markdown', 'en', 1, 1);
