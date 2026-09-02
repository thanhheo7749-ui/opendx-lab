# Keyword Detection Patterns

> Patterns để trích xuất thông tin cấu trúc từ văn bản thô (ghi chú, transcript, ý tưởng).

## Language detection

- **Tiếng Việt:** có chứa các ký tự có dấu `à á ả ã ạ ă ằ ắ ẳ ẵ ặ â ầ ấ ẩ ẫ ậ è é ẻ ẽ ẹ ê ề ế ể ễ ệ ì í ỉ ĩ ị ò ó ỏ õ ọ ô ồ ố ổ ỗ ộ ơ ờ ớ ở ỡ ợ ù ú ủ ũ ụ ư ừ ứ ử ữ ự ỳ ý ỷ ỹ ỵ đ Đ`.
- **Tiếng Anh:** không có dấu + từ tiếng Anh phổ biến.

## Decision patterns

- VN: "Chốt là...", "Quyết định...", "Thống nhất...", "Đồng ý...", "Sẽ làm...", "Chọn X thay vì Y"
- EN: "Decided to...", "Agreed to...", "We will...", "Choosing X over Y"

## Complexity signal detection (cho brainstorm)

- External redirect/OAuth/payment/webhook keywords → `has_external_redirect = true`
- "signup", "checkout", "subscribe", "verify", "callback" → `has_async_flow = true`
- "admin/user/guest", "P0/P1/free/paid", "≥2 roles" → `has_multi_role = true`
- "pending → active", "draft → published", entity status → `has_state_machine = true`
- "rate limit", "quota", "captcha", "lockout" → `has_throttle_rules = true`
