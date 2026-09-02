---
type: brainstorm
feature: payment
status: draft
updated: 2026-05-12
links:
  - docs/meetings/2026-05-12-client-payment-kickoff.md
---

# Payment Checkout Flow — Brainstorm

## 1. Idea Seed

> "Thêm thanh toán online cho ứng dụng e-commerce. Hiện chỉ có COD, mất 35% cart abandon. Client muốn launch v1 Q3, ưu tiên Momo + VNPay + Card. Guest checkout không bắt đăng ký. Returning customer có saved card."

## 2. Context

- Hiện tại: chỉ COD, 35% cart abandon ở checkout step.
- Market: Shopee/Lazada đã có 1-tap checkout, ta chậm 2-3 năm.
- Regulatory: SBV cho phép tokenize card on-merchant từ 2025.
- Internal: AWS infra hiện tại, no PCI compliance yet.

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| Khách mới (guest) | Sợ đăng ký + form thẻ dài | Checkout nhanh, không tài khoản |
| Khách thân thiết | Nhập lại thẻ mỗi lần | Saved card 1-tap |
| Admin shop | Manual reconcile COD | Auto reconcile + refund flow |

## 4. Capabilities Breakdown

### P0 — must have
- Guest checkout với Momo + VNPay + Card.
- Pre-confirm screen show tổng + phí.
- Email confirmation sau success.
- Error handling: timeout, declined, insufficient fund.
- Admin transaction dashboard.
- Full refund flow.

## 5. Edge Cases / Scenarios

- **Gateway timeout** (>30s no webhook) — show "Thử lại" page, polling status fallback.
- **User abandon mid-payment** — webhook arrive sau khi tab closed.

## 6. Assumptions

- AWS RDS có encryption at-rest support.
- Momo + VNPay accept webhook receiver IP allowlist.

## 7. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| PCI audit fail chặn launch | thỉnh thoảng | Không launch được, mất Q4 revenue | Thuê consultant tháng đầu |
| Đối tác Momo đổi API/phí | hiếm | Phí vượt budget hoặc downtime | Hợp đồng SLA |

## 8. Success Criteria (preliminary)

- Conversion checkout step >= 85% (p75).
- Time-to-success p75 <= 90s.

## 9. Open Questions

- [ ] OQ-1: Fraud detection bên thứ 3 hay basic rule tự build?
- [ ] OQ-2: Saved card OTP confirm mỗi lần dùng (UX vs security)?

## 10. Next Steps

- `/urd payment`
- `/brd payment`
- `/prd-epic payment`
