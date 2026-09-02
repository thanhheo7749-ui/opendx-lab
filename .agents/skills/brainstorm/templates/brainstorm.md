---
type: brainstorm
feature: {{feature}}
status: draft
updated: {{date}}
links: {{links}}
---

# {{title}}

## 1. Idea Seed

{{seed}}

*Raw input từ user — câu/đoạn description gốc.*

## 2. Context

{{context}}

*Background, why now, related features, market signal.*

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| {{user_type}} | {{pain}} | {{need}} |

## 4. Capabilities Breakdown

### P0 — must have
{{p0_capabilities}}

### P1 — should have
{{p1_capabilities}}

### P2 — nice to have
{{p2_capabilities}}

## 5. Core Flows (Happy Path)

### 5.1 {{flow_1_name}}

1. {{step_1}}
2. {{step_2}}
3. {{step_3}}

```
{{ascii_flow_1}}
```

### 5.2 {{flow_2_name}}

1. ...

```
{{ascii_flow_2}}
```

*Liệt kê đủ flows chính (vd: signup, login, forgot password, logout, OAuth, ...). Mỗi flow độc lập, có ASCII riêng nếu phức tạp.*

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | {{flow_name}} | {{condition}} | {{yes_action}} | {{no_action}} |

*Mỗi decision point = 1 câu hỏi YES/NO trong flow. ID `D1, D2…` để cross-ref. Capture tất cả branching điểm chính (validate email tồn tại, captcha trigger, lockout, OAuth callback…).*

### 6.2 Scenario Matrix (nếu `has_multi_role` / ≥2 input states)

| From State | To State | Rule | Action | Result |
|------------|----------|------|--------|--------|
| {{scenario_row}} | | | | |

### 6.3 State Transitions (nếu `has_state_machine`)

```
{{entity}}: {{state_a}} → {{state_b}} → {{state_c}}
                      ↘ {{state_d}} (alternative)
```

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| {{entity}} | {{from}} | {{to}} | {{trigger}} | có/không |

### 6.4 Interrupted Transactions (nếu `has_external_redirect` / `has_async_flow`)

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| Browser/app đóng giữa flow | {{state}} | {{resume}} | {{cleanup}} |
| External service fail/timeout | {{state}} | {{resume}} | {{cleanup}} |
| Link/token hết hạn | {{state}} | {{resume}} | {{cleanup}} |
| 2 device cùng action | {{state}} | {{resume}} | {{cleanup}} |
| Flow mới khi flow cũ còn pending | {{state}} | {{resume}} | {{cleanup}} |

### 6.5 Other Edge Cases

*Các trường hợp biên khác: mất kết nối, concurrent access, boundary values…*

## 7. Validation, Limits & Wording

### 7.1 Validation Rules

| Field / Action | Rule | Khi vi phạm |
|---|---|---|
| {{field}} | {{rule}} | {{violation_action}} |

### 7.2 Limits & Quotas

| Loại limit | Giá trị | Phạm vi | Hành vi khi chạm |
|---|---|---|---|
| {{limit_type}} | {{value}} | {{scope}} | {{on_breach}} |

### 7.3 Wording Samples

#### Error Messages
| Tình huống | Message hiển thị | Gợi ý xử lý cho user |
|---|---|---|
| {{error_case}} | "{{error_message}}" | {{hint}} |

#### Success Messages
| Tình huống | Message hiển thị |
|---|---|
| {{success_case}} | "{{success_message}}" |

#### Info / Neutral Messages
| Tình huống | Message hiển thị |
|---|---|
| {{info_case}} | "{{info_message}}" |

## 8. Assumptions

- {{assumption_1}}
- {{assumption_2}}

## 9. Risks (IT-BA Framing)

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng ngừa |
|--------|----------|-------------------|-----------------|
| {{risk_title}} ({{category}}) | {{likelihood}} | {{consequence}} | {{mitigation}} |

*Category: adoption / vendor / compliance / process / timeline / data.*

## 10. Success Metrics (preliminary)

- {{metric_1}}
- {{metric_2}}

## 11. System Context (business-level only)

- **Thông tin nghiệp vụ cần lưu:** {{data_entities}}
- **Dịch vụ bên ngoài:** {{external_services}}
- **Kênh thông báo:** {{notification_channels}}
- **Xử lý định kỳ / nền:** {{background_jobs}}

## 12. Open Questions

- [ ] OQ-1: {{question_1}}
- [ ] OQ-2: {{question_2}}

## 13. Next Steps

Sau khi BA review + approve brainstorm này:
- `/urd {{feature}}` — capture user perspective + journeys
- `/brd {{feature}}` — business case + ROI
- `/prd-epic {{feature}}` — product scope + release plan
