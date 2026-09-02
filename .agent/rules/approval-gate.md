# Approval Gate Convention

> Mọi skill phải tuân thủ rule này khi write/edit file. Mục đích: human-in-the-loop (HITL) thống nhất — không skill nào tự ý ghi file mà không qua approval.

## 3 levels

| Level | Bắt buộc khi | Cơ chế |
|-------|--------------|--------|
| **L1 Plan** | Trước mọi tool `Write` / `Edit` / batch tạo ≥1 file | In bảng plan; user confirm Y/n/select |
| **L2 Diff** | Khi `Edit` 1 file đã tồn tại (kể cả khi skill tự vào update mode do file đã có, không cần flag) | Hiển thị unified diff; user confirm Y/n/edit-prompt |
| **L3 Iterate** | Output sáng tạo: ASCII wireframe, mermaid diagram, prose draft | Render trong chat → loop refine; max 3 vòng |

## L1 — Plan preview

**Format chuẩn** (skill in ra trước khi ghi):

```
[/skill-name] Sẽ thực hiện:
  # | path                              | action  | summary
  1 | docs/payment/payment-urd.md               | create  | URD draft, 3 user types, 5 needs
  2 | docs/payment/payment-brd.md               | create  | BRD draft, 4 objectives, 3 risks
  3 | docs/payment/srs/payment-spec.md          | update  | thêm 2 FR, sửa NFR perf

Apply? (Y/n/select):
```

**User response:**
- `Y` / `<enter>` / `yes` / `ok` → proceed tất cả.
- `n` / `no` / `abort` → huỷ toàn bộ, không ghi gì.
- `select skip 2,3` → chạy item 1, bỏ 2 và 3.
- `select only 1` → chỉ chạy item 1.
- Bất kỳ free text khác → treat như request thay đổi plan, skill phải re-plan.

**Rules:**
- L1 **bắt buộc** ngay cả khi chỉ tạo 1 file.
- Bảng plan tối đa 1 dòng/file. Summary ngắn (≤50 ký tự).
- Skill KHÔNG được skip L1 với cớ "user đã confirm trong skill khác".

## L2 — Diff confirm

**Khi nào:** edit file đã tồn tại (cả khi skill tự vào update mode vì file đã có, hoặc apply patch trong /cr).

**Format:**

```
[/skill-name] Diff cho docs/payment/payment-urd.md:

--- a/docs/payment/payment-urd.md
+++ b/docs/payment/payment-urd.md
@@ -12,7 +12,8 @@
 ## 3. User Needs
 
-1. Khách thanh toán < 30s
+1. Khách thanh toán < 30s qua Momo/VNPay
+2. Có save card cho lần sau
 
Apply? (Y/n/edit-prompt):
```

**User response:**
- `Y` → apply diff.
- `n` → huỷ edit này (giữ file cũ).
- `edit-prompt: <text>` → quay lại bước synthesize với feedback `<text>`, tạo diff mới.

**Rules:**
- Diff phải là unified format với ≥3 dòng context.
- Nếu diff > 50 dòng: skill cảnh báo "diff lớn, có muốn xem full hay summary?" trước khi in.
- L2 chạy SAU L1 (L1 list path + action `update`, L2 mới show diff khi user đã Y ở L1).

## L3 — Iterate refine

**Khi nào:** output sáng tạo **render được trong chat** cần feedback nhiều vòng. Tiêu biểu:
- ASCII wireframe (`/wireframe-ascii`) — monospace render OK
- ASCII flow diagram trong brainstorm — monospace render OK
- Prose draft dài (vd executive summary BRD)

**Format:**

```
[/skill-name] Phiên bản 1:

<output render trong chat>

Đồng ý / Sửa: <mô tả thay đổi> / Hủy:
```

**User response:**
- `Đồng ý` / `ok` / `approve` / `Y` → tiếp đến L1 (plan write).
- `Sửa: ...` / free text → skill regenerate v2 với feedback.
- `Hủy` / `cancel` / `n` → abort.

**Rules:**
- Max 3 vòng iterate. Vòng 3 (v3) là vòng ép chốt — nếu user vẫn `Sửa:`, skill thông báo "đã đạt max 3 vòng, em chốt v3 và đi tiếp L1; anh edit file manually sau nếu cần."
- Mỗi vòng số hiệu rõ ràng: `Phiên bản 1`, `Phiên bản 2`, `Phiên bản 3`.
- L3 chạy TRƯỚC L1.

## Tóm tắt 1 dòng

> **L3 (iterate nếu sáng tạo) → L1 (plan + Y/n) → L2 (diff nếu update) → Write.**
