# Quy trình vận hành kho hàng — ShopWise
> **Phân loại P.A.R.A (DX-OS):** `[A] Area` — Lĩnh vực vận hành kho cốt lõi

## 1. Nhập hàng

### Quy tắc nhập hàng
- Kiểm tra tồn kho mỗi tuần vào thứ 2
- Sản phẩm có tồn kho < 10 cái VÀ bán > 5 cái/tuần → đặt nhập gấp
- Sản phẩm có trend score > 70 → ưu tiên nhập
- Batch nhập: 2 tuần/lần, đặt hàng NCC trước 3 ngày

### Kiểm tra chất lượng
- Kiểm tra mẫu trước khi nhập sỉ (≥50 cái)
- Đối chiếu số lượng nhận với PO
- Ghi nhận chênh lệch (nếu có) vào hệ thống
- Chụp ảnh hàng nhận để lưu hồ sơ

### NCC ưu tiên
- Xưởng Tân Bình (TP.HCM): Giao nhanh 1 ngày, rating 4.8/5 — cho đơn gấp
- Công ty May Bình Dương: Giá tốt hơn 10-15%, giao 2 ngày — cho đơn số lượng lớn
- Xưởng Hà Nội Textile: Chất lượng cao nhất, giao 5 ngày — cho set đồ linen cao cấp

## 2. Xuất kho

### Quy trình xuất
1. Đơn hàng mới → Kiểm tra tồn kho → Pick & Pack
2. Chụp ảnh SP trước khi đóng gói (để giải quyết dispute)
3. Dán label vận chuyển → Giao cho shipper
4. Update trạng thái đơn hàng trên hệ thống

### Thời gian xử lý
- Đơn trước 14h → giao trong ngày
- Đơn sau 14h → giao sáng hôm sau
- Đơn từ sàn (Shopee/Lazada) → giao trong 24h

## 3. Kiểm kê

### Kiểm kê định kỳ
- Kiểm kê toàn bộ: Cuối mỗi tháng
- Kiểm kê spot check: Mỗi thứ 5 (random 20% SKU)
- Chênh lệch > 3% → báo cáo quản lý

### Xử lý chênh lệch
- Chênh lệch < 3%: Điều chỉnh số liệu
- Chênh lệch 3-5%: Điều tra nguyên nhân + điều chỉnh
- Chênh lệch > 5%: Kiểm kê lại toàn bộ + báo cáo ban giám đốc

## 4. Hàng tồn kho chậm

### Phân loại hàng tồn
- Tồn 15-30 ngày: Bình thường
- Tồn 30-45 ngày: Cảnh báo vàng → giảm giá 10-15%
- Tồn 45-60 ngày: Cảnh báo cam → giảm giá 20-30%
- Tồn > 60 ngày: Cảnh báo đỏ → giảm giá 40-50% hoặc thanh lý

## 5. Đổi trả

### Chính sách đổi trả
- Đổi trong 7 ngày (còn tag, chưa giặt)
- Trả trong 3 ngày nếu hàng lỗi (rách, sai size, sai màu)
- Hàng sale off > 30% không đổi trả
- Đổi size miễn phí, đổi mẫu khác tính phí ship
