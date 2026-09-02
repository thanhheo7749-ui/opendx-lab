# Resolve Open Questions (Phase E)

> Canonical pattern cho mọi BA skill chạy SAU Write doc, TRƯỚC khi suggest downstream skills. Mục đích: không để OQ debt tích tụ qua các giai đoạn.

## Trigger

Skill chạy Phase E ngay sau khi Write doc thành công (cả create + update mode).

## Step 1 — Collect OQs

Skill thu thập các câu hỏi mở (OQ) từ mục Open Questions của tài liệu.

## Step 2 — Prompt user

In danh sách OQs:

```
📋 Còn {N} câu hỏi mở cần xử lý:

Từ {current_doc_type}:
  - OQ-{id}: {text}
  - OQ-{id}: {text}

Resolve ngay bây giờ trước khi tiếp tục?
  Y       → hỏi từng OQ một
  skip    → giữ OQ cho downstream skill
  <ids>   → chỉ resolve OQ cụ thể (vd "OQ-1")
```

Nếu `N == 0` → bỏ qua Phase E, đi thẳng final report.

## Step 3 — Loop resolve

Hỏi từng OQ, ghi nhận câu trả lời và cập nhật lại tài liệu tương ứng.
