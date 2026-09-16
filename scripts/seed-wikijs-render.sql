-- Update render column for all new pages (Wiki.js displays from render, not content)
-- Also update the toc (table of contents) column

-- Page 1: Home (already has render from original save, just update content display)
UPDATE pages SET render = '<h1>🛍️ Chào mừng đến với ShopWise Wiki</h1>
<h2>Giới thiệu</h2>
<p><strong>ShopWise</strong> là nền tảng trí tuệ hỗ trợ quyết định kinh doanh cho cửa hàng bán lẻ thời trang. Wiki này là nơi lưu trữ kiến thức nội bộ, quy trình vận hành và chính sách của cửa hàng.</p>
<h2>📚 Danh mục tài liệu</h2>
<h3>Vận hành</h3>
<ul>
<li><a href="/van-hanh/quy-trinh-kho">Quy trình kho hàng</a> — Nhập hàng, xuất kho, kiểm kê, đổi trả</li>
<li><a href="/van-hanh/quy-trinh-ban-hang">Quy trình bán hàng</a> — Xử lý đơn hàng, chăm sóc KH</li>
</ul>
<h3>Chính sách</h3>
<ul>
<li><a href="/chinh-sach/gia-va-khuyen-mai">Chính sách giá</a> — Markup, flash sale, loyalty, voucher</li>
<li><a href="/chinh-sach/nhan-su">Chính sách nhân sự</a> — Quy định nội bộ, phúc lợi</li>
</ul>
<h3>Chiến lược</h3>
<ul>
<li><a href="/chien-luoc/marketing">Chiến lược Marketing</a> — Facebook Ads, TikTok, KOL</li>
<li><a href="/chien-luoc/phan-tich-khach-hang">Phân tích khách hàng</a> — Phân khúc RFM, CLV</li>
</ul>
<h3>Hệ thống</h3>
<ul>
<li><a href="/he-thong/kien-truc">Kiến trúc hệ thống</a> — Docker, services, database</li>
<li><a href="/he-thong/huong-dan-dashboard">Hướng dẫn Dashboard</a> — Các tính năng chính</li>
</ul>
<hr>
<p><em>Cập nhật lần cuối: Tháng 9/2026</em></p>',
"updatedAt" = NOW(),
toc = '[{"title":"Giới thiệu","anchor":"gioi-thieu","children":[]},{"title":"Danh mục tài liệu","anchor":"danh-muc-tai-lieu","children":[{"title":"Vận hành","anchor":"van-hanh","children":[]},{"title":"Chính sách","anchor":"chinh-sach","children":[]},{"title":"Chiến lược","anchor":"chien-luoc","children":[]},{"title":"Hệ thống","anchor":"he-thong","children":[]}]}]'
WHERE id = 1;

-- Page 10: Quy trình kho
UPDATE pages SET render = '<h1>📦 Quy trình vận hành kho hàng</h1>
<h2>1. Nhập hàng</h2>
<ul>
<li>Kiểm tra tồn kho mỗi tuần vào thứ 2</li>
<li>SP có tồn kho &lt; 10 và bán &gt; 5/tuần thì nhập gấp</li>
<li>SP trend score &gt; 70 thì ưu tiên nhập</li>
<li>Batch nhập: 2 tuần/lần, đặt NCC trước 3 ngày</li>
</ul>
<h3>NCC ưu tiên</h3>
<ul>
<li><strong>Xưởng Tân Bình</strong> (TP.HCM): Giao 1 ngày, rating 4.8/5</li>
<li><strong>Công ty May Bình Dương</strong>: Giá tốt hơn 10-15%, giao 2 ngày</li>
<li><strong>Xưởng Hà Nội Textile</strong>: Chất lượng cao, giao 5 ngày</li>
</ul>
<h2>2. Xuất kho</h2>
<ol>
<li>Đơn mới → Kiểm tồn → Pick and Pack</li>
<li>Chụp ảnh SP trước đóng gói</li>
<li>Dán label → Giao shipper</li>
<li>Update trạng thái đơn</li>
</ol>
<ul>
<li>Đơn trước <strong>14h</strong> → giao trong ngày</li>
<li>Đơn sau <strong>14h</strong> → giao sáng hôm sau</li>
</ul>
<h2>3. Kiểm kê</h2>
<ul>
<li><strong>Toàn bộ</strong>: Cuối mỗi tháng</li>
<li><strong>Spot check</strong>: Mỗi thứ 5 (random 20% SKU)</li>
<li>Chênh lệch &gt; 3% → báo cáo quản lý</li>
</ul>
<h2>4. Hàng tồn chậm</h2>
<table>
<tr><th>Thời gian tồn</th><th>Trạng thái</th><th>Hành động</th></tr>
<tr><td>15-30 ngày</td><td>🟢 Bình thường</td><td>Giữ nguyên</td></tr>
<tr><td>30-45 ngày</td><td>🟡 Cảnh báo</td><td>Giảm 10-15%</td></tr>
<tr><td>45-60 ngày</td><td>🟠 Nguy hiểm</td><td>Giảm 20-30%</td></tr>
<tr><td>&gt; 60 ngày</td><td>🔴 Nghiêm trọng</td><td>Giảm 40-50% hoặc thanh lý</td></tr>
</table>
<h2>5. Đổi trả</h2>
<ul>
<li>Đổi trong <strong>7 ngày</strong> (còn tag, chưa giặt)</li>
<li>Trả trong <strong>3 ngày</strong> nếu hàng lỗi</li>
<li>Hàng sale &gt; 30% <strong>không đổi trả</strong></li>
</ul>' WHERE id = 10;

-- Page 11: Giá
UPDATE pages SET render = '<h1>💰 Chính sách giá và khuyến mãi</h1>
<h2>1. Markup chuẩn</h2>
<table>
<tr><th>Danh mục</th><th>Markup</th><th>Margin</th></tr>
<tr><td>Áo, Quần</td><td>2.5x giá gốc</td><td>~60%</td></tr>
<tr><td>Váy, Đầm</td><td>2.7x giá gốc</td><td>~63%</td></tr>
<tr><td>Set đồ</td><td>2.5x giá gốc</td><td>~60%</td></tr>
<tr><td>Phụ kiện</td><td>3.0x giá gốc</td><td>~67%</td></tr>
</table>
<h2>2. Giá theo kênh</h2>
<ul>
<li><strong>Facebook, Zalo</strong>: Giá gốc (linh hoạt 5-10%)</li>
<li><strong>Shopee</strong>: Giá gốc + 5% phí sàn</li>
<li><strong>Lazada</strong>: Giá gốc + 4% phí sàn</li>
<li><strong>TikTok Shop</strong>: Giá gốc + 3% platform</li>
</ul>
<h2>3. Flash Sale hàng tuần</h2>
<ul>
<li>🕐 Thứ 6, 20h-22h</li>
<li>📉 Giảm tối đa 15%</li>
<li>📦 Giới hạn 30 cái/SP</li>
</ul>
<h2>4. Loyalty Program</h2>
<table>
<tr><th>Mốc</th><th>Ưu đãi</th></tr>
<tr><td>Đơn thứ 2</td><td>Giảm 5%</td></tr>
<tr><td>Đơn thứ 5</td><td>Giảm 10% + free ship</td></tr>
<tr><td>Đơn thứ 10</td><td>VIP giảm 10% cố định</td></tr>
<tr><td>Chi tiêu &gt; 5 triệu</td><td>Super VIP giảm 15%</td></tr>
</table>
<h2>5. Mã giảm giá</h2>
<table>
<tr><th>Mã</th><th>Ưu đãi</th><th>Điều kiện</th></tr>
<tr><td>WELCOME10</td><td>Giảm 10% (max 100k)</td><td>Đơn đầu tiên</td></tr>
<tr><td>FREESHIP</td><td>Free ship</td><td>Đơn &gt; 300k</td></tr>
<tr><td>COMBO5</td><td>Giảm 5%</td><td>Mua ≥ 2 SP</td></tr>
<tr><td>VIP15</td><td>Giảm 15%</td><td>Khách VIP</td></tr>
</table>' WHERE id = 11;

-- Page 12: Marketing
UPDATE pages SET render = '<h1>🎯 Chiến lược Marketing</h1>
<h2>Budget: 15-20 triệu/tháng</h2>
<table>
<tr><th>Kênh</th><th>Tỷ lệ</th><th>Budget</th></tr>
<tr><td>Facebook Ads</td><td>40%</td><td>6-8 triệu</td></tr>
<tr><td>TikTok Ads</td><td>35%</td><td>5-7 triệu</td></tr>
<tr><td>Google Ads</td><td>15%</td><td>2-3 triệu</td></tr>
<tr><td>KOL</td><td>10%</td><td>1.5-2 triệu</td></tr>
</table>
<h2>Quy tắc ROAS</h2>
<ul>
<li>ROAS &lt; 1.0 sau 3 ngày → <strong>Dừng ngay</strong></li>
<li>ROAS 1.0-1.5 → Giảm budget 50%</li>
<li>ROAS 1.5-3.0 → Duy trì, A/B test</li>
<li>ROAS &gt; 3.0 → <strong>Scale gấp đôi</strong></li>
</ul>
<h2>Facebook Ads</h2>
<ul>
<li>Target: Nữ 22-35 tuổi, TP.HCM + HN</li>
<li>Format: Carousel + Video 15s Reels</li>
<li>A/B Test: 3 creatives/campaign</li>
</ul>
<h2>TikTok</h2>
<ul>
<li>Đăng 1-2 video/ngày</li>
<li>Livestream: T3, T5, CN tối 20h</li>
<li>Spark Ads từ video organic</li>
</ul>
<h2>KOL</h2>
<table>
<tr><th>Tier</th><th>Followers</th><th>Chi phí</th></tr>
<tr><td>Nano</td><td>&lt; 10k</td><td>Barter (gửi SP)</td></tr>
<tr><td>Micro</td><td>10-30k</td><td>200-500k/video</td></tr>
<tr><td>Mid</td><td>30-100k</td><td>500k-2tr/video</td></tr>
<tr><td>Affiliate</td><td>Bất kỳ</td><td>Commission 10-15%</td></tr>
</table>' WHERE id = 12;

-- Page 13: Khách hàng
UPDATE pages SET render = '<h1>👥 Phân tích khách hàng</h1>
<h2>Phân khúc RFM</h2>
<table>
<tr><th>Phân khúc</th><th>% KH</th><th>% Doanh thu</th><th>AOV</th></tr>
<tr><td>👑 Super VIP</td><td>5%</td><td>25%</td><td>1.2 triệu</td></tr>
<tr><td>⭐ VIP</td><td>15%</td><td>35%</td><td>650k</td></tr>
<tr><td>👤 Thường</td><td>80%</td><td>40%</td><td>350k</td></tr>
</table>
<h2>Chiến lược chăm sóc</h2>
<h3>Super VIP (chi tiêu &gt; 5 triệu)</h3>
<ul>
<li>✅ Inbox riêng, phản hồi &lt; 15 phút</li>
<li>✅ Gửi hàng mới trước shop 1-2 ngày</li>
<li>✅ Giảm 15% cố định + free ship mọi đơn</li>
<li>✅ Tặng quà sinh nhật (200-300k)</li>
</ul>
<h3>VIP (chi tiêu 2-5 triệu)</h3>
<ul>
<li>✅ Giảm 10% cố định</li>
<li>✅ Free ship đơn &gt; 300k</li>
<li>✅ Voucher sinh nhật 15%</li>
</ul>
<h3>Khách thường</h3>
<ul>
<li>✅ Welcome voucher 10%</li>
<li>✅ Remarketing 7 ngày sau đơn cuối</li>
</ul>
<h2>KPI hàng tháng</h2>
<table>
<tr><th>Chỉ số</th><th>Target</th></tr>
<tr><td>Khách mới</td><td>&gt; 200/tháng</td></tr>
<tr><td>Tỷ lệ mua lại</td><td>&gt; 30%</td></tr>
<tr><td>AOV</td><td>&gt; 400k</td></tr>
<tr><td>CLV 6 tháng</td><td>&gt; 1.5 triệu</td></tr>
<tr><td>Churn rate</td><td>&lt; 20%</td></tr>
</table>' WHERE id = 13;

-- Page 14: Kiến trúc
UPDATE pages SET render = '<h1>🏗️ Kiến trúc hệ thống ShopWise</h1>
<h2>Docker Services (8 containers)</h2>
<table>
<tr><th>Service</th><th>Port</th><th>Vai trò</th></tr>
<tr><td>Dashboard (Next.js 15)</td><td>:3000</td><td>UI chính</td></tr>
<tr><td>Keycloak (SSO)</td><td>:8080</td><td>Quản lý tài khoản</td></tr>
<tr><td>PostgreSQL + pgvector</td><td>:5432</td><td>Database</td></tr>
<tr><td>Ollama (AI)</td><td>:11434</td><td>LLM server</td></tr>
<tr><td>Metabase (BI)</td><td>:3300</td><td>Báo cáo</td></tr>
<tr><td>Mattermost</td><td>:3100</td><td>Chat</td></tr>
<tr><td>Wiki.js</td><td>:3200</td><td>Tài liệu</td></tr>
<tr><td>Activepieces</td><td>:5678</td><td>Automation</td></tr>
</table>
<h2>Database: 23 bảng Prisma</h2>
<ul>
<li><strong>sb_*</strong>: Sản phẩm, đơn hàng, KH, NCC, kho, quảng cáo</li>
<li><strong>kg_*</strong>: Knowledge Graph (Node, Edge, Chunk)</li>
<li><strong>dx_*</strong>: Nhân sự, phòng ban, ticket, workflow</li>
</ul>
<h2>AI Pipeline</h2>
<ol>
<li><strong>BizScan</strong>: Quét vấn đề tự động</li>
<li><strong>Decision Advisor</strong>: Tư vấn quyết định</li>
<li><strong>Simulator</strong>: Mô phỏng What-If</li>
<li><strong>RAG Chat</strong>: Trả lời từ Knowledge Graph</li>
</ol>
<h2>Phân quyền (4 roles)</h2>
<table>
<tr><th>Role</th><th>Quyền</th></tr>
<tr><td>Admin 👑</td><td>Toàn quyền</td></tr>
<tr><td>Manager 📊</td><td>CRUD SP/kho, import, AI</td></tr>
<tr><td>Staff 🛒</td><td>Sửa SP, cập nhật kho</td></tr>
<tr><td>Viewer 👁️</td><td>Chỉ xem</td></tr>
</table>' WHERE id = 14;

-- Page 15: Hướng dẫn
UPDATE pages SET render = '<h1>📱 Hướng dẫn sử dụng Dashboard</h1>
<h2>Đăng nhập</h2>
<ol>
<li>Mở <a href="http://localhost:3000">http://localhost:3000</a></li>
<li>Click <strong>Đăng nhập với SSO</strong></li>
<li>Nhập tài khoản Keycloak</li>
<li>Redirect về Dashboard</li>
</ol>
<h2>Tài khoản demo</h2>
<table>
<tr><th>Username</th><th>Password</th><th>Role</th></tr>
<tr><td>admin</td><td>admin123</td><td>Admin</td></tr>
<tr><td>demo.manager</td><td>demo1234</td><td>Manager</td></tr>
<tr><td>demo.staff</td><td>demo1234</td><td>Staff</td></tr>
<tr><td>demo.viewer</td><td>demo1234</td><td>Viewer</td></tr>
</table>
<h2>Các trang chính</h2>
<h3>Tổng quan (/)</h3>
<p>KPI: Doanh thu, lợi nhuận, đơn hàng. Biểu đồ 7 ngày. Top SP bán chạy. Decision Feed.</p>
<h3>Sản phẩm (/products)</h3>
<p>Danh sách SP, tìm kiếm, lọc. Thêm/sửa/xóa sản phẩm.</p>
<h3>Kho hàng (/inventory)</h3>
<p>Tồn kho real-time. Cảnh báo hết hàng.</p>
<h3>Nhập dữ liệu (/data-sources)</h3>
<p>Upload CSV, kiểm tra trùng lặp. Bảng so sánh Old vs New.</p>
<h3>BizScan (/bizscan)</h3>
<p>AI quét vấn đề tự động. Phát hiện tồn kho, doanh thu bất thường.</p>
<h3>Knowledge Graph (/knowledge-graph)</h3>
<p>Bản đồ quan hệ SP-NCC-Kênh-KH. Upload tài liệu vào RAG.</p>
<h3>Chat AI (/ai-chat)</h3>
<p>Hỏi câu hỏi kinh doanh bằng ngôn ngữ tự nhiên.</p>' WHERE id = 15;

-- Page 16: Nhân sự
UPDATE pages SET render = '<h1>👩‍💼 Chính sách nhân sự</h1>
<h2>Ca làm việc</h2>
<table>
<tr><th>Ca</th><th>Giờ</th><th>Ghi chú</th></tr>
<tr><td>Sáng</td><td>8h00 - 12h00</td><td>Ca chính</td></tr>
<tr><td>Chiều</td><td>13h00 - 17h30</td><td>Ca chính</td></tr>
<tr><td>Tối (Livestream)</td><td>19h30 - 22h00</td><td>T3, T5, CN — phụ cấp 150k/buổi</td></tr>
</table>
<h2>Vai trò</h2>
<h3>Quản lý cửa hàng</h3>
<ul>
<li>Quyết định nhập hàng, định giá</li>
<li>Duyệt đơn &gt; 1 triệu</li>
<li>Quản lý nhân viên, phân ca</li>
</ul>
<h3>Nhân viên bán hàng</h3>
<ul>
<li>Tiếp nhận và xử lý đơn hàng</li>
<li>Pick and Pack, giao shipper</li>
<li>Trả lời inbox KH (&lt; 15 phút)</li>
<li>Livestream theo lịch</li>
</ul>
<h3>Nhân viên kho</h3>
<ul>
<li>Nhập hàng, kiểm đếm</li>
<li>Sắp xếp kho theo danh mục</li>
<li>Kiểm kê hàng tuần</li>
</ul>
<h2>Phúc lợi</h2>
<ul>
<li>Lương cứng + hoa hồng 2%</li>
<li>Thưởng KPI: đạt 100% target → +1 triệu</li>
<li>Nghỉ phép: 12 ngày/năm</li>
<li>BHXH, BHYT theo quy định</li>
<li>Discount nhân viên: Giảm 30% mua SP shop</li>
</ul>
<h2>Quy định</h2>
<ul>
<li>Đi trễ &gt; 15 phút: Trừ 50k/lần</li>
<li>Nghỉ không phép: Trừ 1 ngày lương</li>
<li>Làm mất hàng: Bồi thường theo giá gốc</li>
</ul>' WHERE id = 16;

-- Page 17: Bán hàng
UPDATE pages SET render = '<h1>🛒 Quy trình bán hàng đa kênh</h1>
<h2>1. Tiếp nhận đơn hàng</h2>
<table>
<tr><th>Kênh</th><th>Cách tiếp nhận</th><th>Phản hồi</th></tr>
<tr><td>Facebook</td><td>Inbox Fanpage</td><td>&lt; 15 phút</td></tr>
<tr><td>TikTok Shop</td><td>Đơn tự động</td><td>&lt; 1 giờ</td></tr>
<tr><td>Shopee</td><td>Đơn tự động</td><td>&lt; 2 giờ</td></tr>
<tr><td>Lazada</td><td>Đơn tự động</td><td>&lt; 2 giờ</td></tr>
<tr><td>Zalo</td><td>Chat OA</td><td>&lt; 30 phút</td></tr>
</table>
<h3>Thông tin cần thu thập</h3>
<ul>
<li>Tên KH + SĐT</li>
<li>SP (mã SKU) + size/màu</li>
<li>Địa chỉ giao hàng</li>
<li>Thanh toán: COD hoặc chuyển khoản</li>
</ul>
<h2>2. Trạng thái đơn hàng</h2>
<ol>
<li><strong>Mới</strong> — Vừa tiếp nhận</li>
<li><strong>Đã xác nhận</strong> — KH confirm</li>
<li><strong>Đang đóng gói</strong> — Pick and Pack</li>
<li><strong>Đã giao vận</strong> — Chuyển shipper</li>
<li><strong>Hoàn thành</strong> — KH nhận hàng</li>
<li><strong>Đã hủy</strong> — KH hủy hoặc hoàn</li>
</ol>
<h2>3. Chăm sóc sau bán</h2>
<ul>
<li>Cảm ơn sau <strong>1 ngày</strong> nhận hàng</li>
<li>Hỏi feedback sau <strong>3 ngày</strong></li>
<li>Voucher mua lại sau <strong>7 ngày</strong></li>
<li>Remarketing sau <strong>30 ngày</strong></li>
</ul>
<h2>4. Xử lý complaint</h2>
<table>
<tr><th>Loại</th><th>Thời gian</th><th>Giải pháp</th></tr>
<tr><td>Sai size/màu</td><td>24h</td><td>Đổi miễn phí + free ship</td></tr>
<tr><td>Hàng lỗi</td><td>24h</td><td>Đổi mới + voucher 10%</td></tr>
<tr><td>Giao chậm</td><td>12h</td><td>Xin lỗi + voucher free ship</td></tr>
</table>' WHERE id = 17;
