---
name: brainstorm
description: Ghi lại ý tưởng BA thô và phỏng vấn từng nhóm để làm rõ luồng, quyết định, số liệu và wording trước khi viết URD hoặc PRD; dùng ngôn ngữ nghiệp vụ và yêu cầu xem trước kế hoạch trước khi ghi tài liệu. Kích hoạt khi người dùng muốn brainstorm ý tưởng, phỏng vấn làm rõ nghiệp vụ, hoặc gõ /brainstorm.
---

# /brainstorm — Deep Interview + Clarify

## Goal

Expand raw idea thành structured brainstorm board qua **structured 7-section interview** (one section at a time). Output 12 sections theo `templates/brainstorm.md`: user types, capabilities P0/P1/P2, **Core Flows (Happy Path)** với numbered steps + ASCII diagram per flow, **System Behavior Deep Dive** (decision points, scenario matrix, state transitions, interrupted transaction handling, other edge cases), **Validation/Limits/Wording** (validation rules, exact limits, wording samples: error/success/info messages), assumptions, risks (IT-BA framing), success metrics, open questions. Dependencies tách sang `/prd-epic` hoặc `/srs` — không capture ở brainstorm. Checkpoint BẮT BUỘC trước URD/PRD cho idea raw.

## Constraints

- **L1 approval** trước Write — bao gồm confirm feature slug + idea slug do skill auto-derive.
- **L3 iterate** cho ASCII flow diagram + mermaid diagrams (max 3 vòng per `rules/approval-gate.md`).
- **Per-feature path** — `docs/{feature}/brainstorms/{idea-slug}.md`.
- **Auto-derive feature slug từ idea content** — KHÔNG bắt user nhập. Đề xuất trong L1, user override được.
- **Auto-derive idea slug** — semantic slug từ idea topic. Fallback `idea-{NNN}`. Collision → suffix `-v2`.
- **Idea input free-form** — text trực tiếp HOẶC `@<file-path>` tag.
- **Interview hỏi từng section một** — KHÔNG dồn batch 10 câu. Wait reply giữa các section. User có thể skip section bất kỳ → fill `<!-- TBD: ... -->`.
- **Mandatory artifacts theo complexity** (auto-detect):
  - **ASCII flow diagram** — bắt buộc nếu detect: external API/redirect (OAuth, payment, webhook), branching ≥2 paths, async/background job.
  - **Interrupted transaction matrix** — bắt buộc nếu detect external redirect/webhook (browser close mid-flow, link expired, callback fail).
  - **Scenario matrix** — bắt buộc nếu ≥2 input states / role combinations.
  - **State transitions table** — bắt buộc nếu có entity status (account, order, subscription, request).
- **Push for exact values** — KHÔNG chấp nhận "có rate limit" mà phải hỏi "bao nhiêu lần/phút". KHÔNG chấp nhận "show error" mà phải hỏi "exact wording". Vague answer → re-ask 1 lần. Vẫn vague → ghi TBD + flag open question.
- **No-re-ask rule — KHÔNG hỏi lại câu user đã trả lời**. Trước mỗi section, scan toàn bộ context (idea seed + previous answers + existing brainstorm doc nếu là continuation) → loại bỏ câu hỏi đã có answer. Nếu answer partial → hỏi follow-up cụ thể chỉ phần thiếu, KHÔNG hỏi lại từ đầu. Vd: user đã nói "default off remember-me" → KHÔNG hỏi lại "remember-me default ON hay OFF". Continuation mode (file brainstorm đã có) → đọc kỹ doc trước khi phỏng vấn, chỉ hỏi gap.
- **IT-BA framing — KHÔNG hỏi câu coding/architect-level**. Skill này phục vụ IT Business Analyst, KHÔNG phải developer. **CẤM hỏi**: tên column DB, schema table, function/service name, API endpoint cụ thể, JWT vs session, framework choice, refresh-token rotation, hashing algorithm, payload structure, SDK name. **ĐƯỢC hỏi (business language)**: "system làm gì" (validate, lưu thông tin, gửi email, gọi dịch vụ ngoài), "cần lưu loại thông tin nghiệp vụ gì" (vd email, status, ngày tạo — KHÔNG hỏi column type), "có gọi dịch vụ bên ngoài nào" (Google, SendGrid, Stripe — chỉ tên dịch vụ + mục đích, KHÔNG hỏi endpoint/SDK), "ai trigger action", "khi nào trigger", "kết quả nghiệp vụ user thấy". Quyết định kỹ thuật (DB schema, auth strategy, framework) là việc của `/srs` + dev/architect.
- **Quality checklist gate** trước L1 — nếu fail check → đề xuất hỏi thêm trước khi write.
- **Vietnamese-first** default, auto-detect từ idea content. Muốn tiếng Anh thì nói "viết bằng tiếng Anh".
- **KHÔNG nhảy thẳng URD/PRD** — brainstorm là checkpoint riêng.
- **Doc sạch — KHÔNG chèn meta-text vào doc sinh ra** (per ba-conventions Mục 0). CẤM cụ thể: câu nguồn seed ("*Seed lấy từ mini-brief...*"), vị trí roadmap/điểm RICE ("Feature này ở horizon Now..."), chỉ dẫn quy trình cho người viết ("*KHÔNG nhảy thẳng SRS — qua PRD trước*"). Mục 1/2 chỉ chứa nội dung nghiệp vụ thật; Mục 12 chỉ list lệnh next. Provenance sống ở frontmatter `links:`.
- **Shallow mode qua lời nói** — user nói "brainstorm nhanh gọn" / "làm nhanh thôi" (cho idea nhỏ, MVP, prototype scope) → skill bypass deep mode, chạy fast 1-batch version. Không cần gõ flag.

## Cách gọi & Inputs

```
/brainstorm                                      # interactive: ask idea
/brainstorm <mô tả ý tưởng>                      # idea text inline
/brainstorm @<file-path>                         # idea from tagged file
```

Hoặc kích hoạt bằng ngôn ngữ tự nhiên:
- "Brainstorm ý tưởng luồng thanh toán cho app e-commerce"
- "Phỏng vấn làm rõ nghiệp vụ cho tính năng đăng nhập SSO"
- "Brainstorm nhanh gọn tính năng dark mode"

Ví dụ:
```
/brainstorm thêm spaced repetition cho vocabulary trainer
/brainstorm @notes/idea-2026-05-13.md
/brainstorm đăng nhập email + Google OAuth      # complex → deep mode auto
/brainstorm dark mode toggle, brainstorm nhanh gọn thôi   # trivial → nói "nhanh gọn" là đủ
```

Tuỳ chọn qua lời nói:
- Viết bằng tiếng Anh → nói "viết bằng tiếng Anh".
- Chạy nhanh gọn, bỏ qua deep interview → nói "brainstorm nhanh gọn" / "shallow thôi".

## Context (dynamic)

- Ngày hiện tại: `date`
- Danh sách features hiện có: các thư mục trong `docs/*/`

## Approach

### Phase A — Resolve & Auto-derive (silent)

1. **Resolve idea source:**
   - Không có tham số → nếu có `docs/_product/roadmap.md`, đọc horizon **Now** (Mục 3) → gợi ý slug đầu Now làm điểm khởi đầu: "Roadmap đang ưu tiên `{slug đầu Now}` ở horizon Now — brainstorm cái này? (Y / gõ feature khác / paste ý tưởng)". Không có roadmap → ask "Bạn brainstorm gì? (paste text hoặc tag file `@path`)". Chờ phản hồi.
   - Tham số bắt đầu `@` → Đọc file.
   - Ngược lại → lấy tham số làm text ý tưởng.
2. **Auto-derive feature slug** — trích xuất cụm danh từ domain chính, kebab-case ASCII, tối đa 30 ký tự. Kiểm tra `docs/<slug>/` tồn tại → tái sử dụng hoặc đề xuất mới.
3. **Auto-derive idea slug** — semantic từ topic delta. Fallback `idea-{NNN}`. Trùng tên → thêm hậu tố `-v2`.
4. **Detect language** từ nội dung ý tưởng.
5. **Detect complexity signals** từ nội dung ý tưởng + quét keyword:
   - External redirect/OAuth/payment/webhook keywords → `has_external_redirect = true`
   - "signup", "checkout", "subscribe", "verify", "callback" → `has_async_flow = true`
   - "admin/user/guest", "P0/P1/free/paid", "≥2 roles" → `has_multi_role = true`
   - "pending → active", "draft → published", entity status → `has_state_machine = true`
   - "rate limit", "quota", "captcha", "lockout" → `has_throttle_rules = true`
   - Đánh dấu để sinh artifact tương ứng.

### Phase B — Interview (7 sections, one-at-a-time)

> Mỗi section: in 1 message, 2-5 câu hỏi tối đa, chờ phản hồi. Đòi hỏi số liệu/wording chính xác. User `skip` → TBD placeholder + open question.

**Section 1 — Overview**
1. Feature này làm gì (1-2 câu từ góc user)?
2. Vấn đề/pain cụ thể đang giải? Ai bị?
3. Why now? (request từ ai, deadline, signal market)

**Section 2 — Users & Access**
1. Roles nào dùng (admin, free, paid, guest, ...)?
2. Gating: cần subscription/verified/role gì để truy cập?
3. Entry point: user vào feature qua đâu (menu, button, deep link, notification)?
4. Số lượng user dự kiến (giúp size capacity + cost)?

**Section 3 — Core Flow (Happy Path)**
1. Walk-through từng bước: user làm gì → system làm gì → user thấy gì (success state)?
2. Có sub-flow khác không (signup vs login, new vs returning, upgrade vs downgrade)?
3. Output cuối user thấy gì? Có notification/email gửi đi không?

**Section 4 — Detailed Flow Deep Dive** (chỉ chạy nếu complexity signal trigger từ Phase A)

4a. **System actions (business level)** — mỗi bước nghiệp vụ system làm gì? Mô tả bằng action verb nghiệp vụ: "validate email format", "check email tồn tại", "tạo user record", "gửi verification email", "gọi Google OAuth", "ghi audit log". KHÔNG hỏi function name / service class / API endpoint. Loại thông tin nghiệp vụ nào cần lưu (liệt kê field nghiệp vụ vd email, status, created_at — KHÔNG hỏi column type / schema). Có gọi dịch vụ ngoài nào (chỉ tên dịch vụ + mục đích nghiệp vụ, vd "Google OAuth để xác thực", "SendGrid để gửi email" — KHÔNG hỏi endpoint/SDK).

4b. **Decision points** — if/else nghiệp vụ nào trong flow? Condition + path YES/NO? Có calculation/business rule gì?

4c. **State transitions** — entity nào có status? Liệt kê: `entity: stateA → stateB → stateC`. Trigger từng transition? Reversible không?

4d. **Interrupted transactions** (BẮT BUỘC nếu `has_external_redirect || has_async_flow`):
   - User đóng browser/app giữa flow → state gì còn lại, resume kiểu gì?
   - External service fail/timeout → retry? State?
   - User start flow mới trong khi cái cũ pending → behavior?
   - Link/token expired → flow?
   - Concurrent → 2 device cùng action → ai win?

4e. **ASCII flow diagram (L3 iterate)** (BẮT BUỘC nếu `has_external_redirect || has_async_flow || branching ≥2`):
   - Vẽ v1 từ câu trả lời section 3+4a+4b.
   - Hỏi user: "Diagram này đúng không? Cần sửa gì?"
   - Lặp tối đa 3 vòng.
   - Diagram phải show: user vs system action, decision với condition, external call, data change, error path.

4f. **Scenario matrix** (BẮT BUỘC nếu `has_multi_role || ≥2 input states`):
   - Liệt kê combo (from_state × to_state × rule) → action + result.
   - Soạn nháp từ flow + hỏi xác nhận/chỉnh sửa.

**Section 5 — Validation, Limits & Wording**
1. Required fields + format + min/max?
2. Limits/quotas (CHÍNH XÁC số liệu): rate limit X/min, max Y items, retry Z, lockout sau N fail?
3. Business rules: conditions, calculations, state-transition rules?
4. **Exact error messages** cho từng error case (string đúng wording, tiếng Việt natural)?
5. **Exact success messages** cho từng confirmation state?
6. **Exact info/neutral messages** (vd "Đã gửi email xác nhận tới {email}…")?

> Đòi hỏi: "Rate limit bao nhiêu/phút?" → "Lockout sau bao nhiêu fail?" → "Câu error chính xác là gì?". Vẫn mơ hồ → ghi TBD + đánh dấu câu hỏi mở (OQ).
> Wording chia 3 nhóm khi tổng hợp: error / success / info — KHÔNG dồn 1 bảng chung.

**Section 6 — System Context (chỉ mức nghiệp vụ, KHÔNG kỹ thuật)**
1. Cần lưu thêm loại thông tin nghiệp vụ nào (vd "device list", "login history", "subscription status") — chỉ liệt kê **thông tin gì**, KHÔNG hỏi DB schema / table name?
2. Có cần dịch vụ bên ngoài nào (email service, OAuth provider, payment, SMS, captcha) — **tên dịch vụ + mục đích nghiệp vụ**, KHÔNG hỏi SDK/endpoint?
3. Notification gửi cho user qua kênh nào (email / push / in-app / SMS) + khi nào trigger (sau action gì)?
4. Có xử lý nền / scheduled không (vd cleanup token expired hằng ngày, send digest tuần) — chỉ **nhu cầu nghiệp vụ**, KHÔNG hỏi cron syntax / queue system?
5. Có cần real-time không (vd thông báo ngay khi event xảy ra) — chỉ **nhu cầu nghiệp vụ**, KHÔNG hỏi websocket/SSE/polling?

**Section 7 — Edge Cases, Risks, Open Questions**
1. Mất kết nối giữa chừng?
2. Dịch vụ bên ngoài gặp sự cố/down?
3. Đồng thời nhiều người thao tác (2 user cùng sửa cùng resource)?
4. Giao dịch dở dang/bỏ dở — thời hạn sống, dọn dẹp, khôi phục?
5. Top 3 rủi ro nghiệp vụ (tiếp nhận / đối tác / tuân thủ / quy trình / tiến độ / dữ liệu) — khả năng (thường/thỉnh thoảng/hiếm), hậu quả nghiệp vụ, cách phòng ngừa?
6. Những điểm chưa rõ → liệt kê thành câu hỏi mở (Open Questions)?

### Phase C — Synthesize + Quality Gate

1. **Tổng hợp** tất cả câu trả lời → xây dựng nội dung từng phần.
2. **Điền theo mẫu** `templates/brainstorm.md` (13 sections):
   - Mục 5 Core Flows — numbered steps + ASCII diagram embedded per flow.
   - Mục 6.1 Decision Points — table `ID | Flow | Khi nào | YES | NO`.
   - Mục 6.2 Scenario matrix (nếu trigger) — table `From | To | Rule | Action | Result`.
   - Mục 6.3 State transitions (nếu trigger) — table `Entity | Từ | Sang | Trigger | Quay lại?`.
   - Mục 6.4 Interrupted-tx matrix (nếu trigger) — table 4 cột.
   - Mục 6.5 Other edge cases — gom chung, KHÔNG tách section riêng.
   - Mục 7.3 Wording samples — 3 nhóm tables: error / success / info.
   - Mục 9 Risks — IT-BA format (Khả năng / Hậu quả nghiệp vụ / Cách phòng).
3. **Quality checklist** — tự kiểm tra trước L1:
   - [ ] Mỗi flow ở Mục 5 có numbered steps user + system actions.
   - [ ] Flow phức tạp có ASCII diagram đi kèm trong Mục 5.
   - [ ] Mục 6.1 Decision Points có tối thiểu các nhánh chính của flow.
   - [ ] Interrupted flow handling documented (nếu external redirect).
   - [ ] Scenario matrix cover all combo (nếu multi-state).
   - [ ] State transitions mapped (nếu có entity status).
   - [ ] Mục 7.2 limits/quotas có exact numbers (không "phù hợp").
   - [ ] Mục 7.3 error/success/info messages là exact strings.
   - [ ] Risks dùng IT-BA framing (adoption/vendor/compliance/process/timeline/data), không phải bug/infra.
   - [ ] Open questions có ID `OQ-1, OQ-2, ...`.
   - Nếu chưa đạt → in danh sách thiếu + đề xuất hỏi thêm trước khi ghi. User có thể chọn tiếp tục với TBD.

### Phase D — Approval + Write

1. **L1 plan preview** — viết bằng **ngôn ngữ tự nhiên cho BA**, KHÔNG bảng dày tag/flag/checklist. Format:

   > Em sẽ {tạo mới | viết lại} file `docs/{feature}/brainstorms/{slug}.md` với:
   >
   > **Thêm/cập nhật nội dung:**
   > - {liệt kê 4-8 bullet bằng từ nghiệp vụ: "luồng / bảng / diagram/ hình minh họa / số liệu cụ thể / wording mẫu"}
   > - {các số liệu nghiệp vụ cụ thể nếu có: lockout sau X lần, link expire Y giờ, ...}
   >
   > **Câu hỏi mở:** {N resolved} đã chốt trong session này; còn {M} câu để dành cho `/urd` hoặc `/prd-epic`: {liệt kê ngắn}.
   >
   > **Ghi nhận:** activity log "{note}".
   >
   > Apply? (Y / sửa / override-feature `<slug>` / override-idea `<slug>`)

   **CẤM** trong L1 BA-facing:
   - Bảng `# | path | action | summary` (kiểu log dev)
   - Tag flag: `has_external_redirect=Y`, `Quality checklist: 9/11`, `Mandatory artifacts ✓`
   - Từ technical: matrix, diagram, flag, scaffold, schema

   **GIỮ:** số liệu nghiệp vụ cụ thể (lockout 5 lần, link 24h) — đó là content nghiệp vụ.
2. **Ghi file** `docs/{feature}/brainstorms/{idea-slug}.md` từ mẫu `templates/brainstorm.md`.
3. **Cập nhật activity log** vào `docs/_shared/activity.log`.
4. **Báo cáo kết quả ban đầu**:
   ```
   ✅ Brainstorm captured: docs/{feature}/brainstorms/{slug}.md
      Mode: deep | Sections: 13 | OQs: {N} | Quality gate: {pass|partial}
   ```

### Phase E — Resolve Open Questions (PRIORITY gate)

Thực hiện theo `rules/resolve-oqs.md`. Brainstorm là gốc → chỉ có own OQs (Mục 12), không inherit. Thu thập → hỏi Y/skip/ids → hỏi từng câu một → cập nhật tài liệu tương ứng nếu câu trả lời thay đổi giả định/rủi ro/tính năng.

### Phase E2 — Đánh dấu "đã chi tiết hóa" ngược lên PRD sản phẩm

Sau khi brainstorm hoàn tất:
- Kiểm tra `docs/_product/prd.md` tồn tại. Không có → bỏ qua bước này.
- Đọc brief, tìm row trong Mục 7 Feature Map có slug khớp `{feature}` của brainstorm vừa tạo.
- **Không tìm thấy row** → in gợi ý "Feature `{feature}` chưa có trong PRD sản phẩm — chạy `/prd` để thêm?".
- **Tìm thấy row** + cột Chi tiết hóa chưa phải `✅` → đếm `docs/{feature}/brainstorms/*.md` (N file) → đề xuất L2 diff đổi cột Chi tiết hóa sang `✅ đã chi tiết (N brainstorm)`. User xác nhận → cập nhật.
- **Đã là `✅`** → cập nhật số N trong ngoặc qua L2 diff.

### Báo cáo kết quả cuối cùng:
```
✅ Brainstorm finalized: docs/{feature}/brainstorms/{slug}.md
   Resolved OQs trong session: {R}/{N}
   Còn hold: {M} (sẽ inherit downstream)

BA approval gate: review trước khi proceed downstream.

Recommended next:
  - /urd {feature}        — capture user perspective (inherit {M} OQ còn hold)
  - /brd {feature}        — business case
  - /prd-epic {feature}   — product scope
  
Hoặc:
  - /brainstorm <ý tưởng khác>  — capture idea khác
```

## Shallow mode (nói "brainstorm nhanh gọn")

Khi người dùng nói "nhanh gọn" / "shallow thôi" / "làm nhanh":
Bỏ qua Phase B (multi-section). Hỏi nhanh 6 câu hỏi gộp trong 1 lượt. Bỏ qua các artifact phức tạp. Khuyến nghị trong báo cáo: "Chế độ nhanh gọn — nên chạy lại deep mode nếu tính năng vượt quá phạm vi prototype".

## Gotchas

- **Auto-derived feature slug có thể sai** — LUÔN hiển thị ở L1 để user có thể override.
- **Idea content generic** (vd `/brainstorm thêm feature mới`) — không suy được slug → hỏi làm rõ trước Phase A.
- **User trả lời mơ hồ** ("show error", "có rate limit") — hỏi lại 1 lần với câu hỏi cụ thể hơn. Vẫn mơ hồ → ghi TBD + open question.
- **ASCII diagram render trong markdown** — dùng box-drawing `┌ ─ ┐ │ ▼` và code block; KHÔNG dùng mermaid.
- **Vietnamese-friendly typography** — KHÔNG dùng ký hiệu lạ khó đọc trong văn bản tiếng Việt (`Mục N` thay vì `§N`, `đoạn N` thay vì `¶N`).
- **L1 cho BA, không cho dev** — L1 plan preview dùng câu văn tự nhiên với từ nghiệp vụ ("luồng", "bảng", "hình minh họa").
- **No re-ask** — không bao giờ hỏi lại những gì người dùng đã trả lời.
- **Skill phục vụ IT-BA** — ngôn ngữ nghiệp vụ là trên hết, tránh thuật ngữ thuần lập trình (DB schema, API endpoint, JWT token...).

## References

- ../../rules/feature-bootstrap.md
- ../../rules/ba-conventions.md
- ../../rules/approval-gate.md
- ../../rules/naming-conventions.md
- ../../rules/keyword-detection.md
- ../../rules/resolve-oqs.md
- ../../rules/changelog.md
- templates/brainstorm.md
- references/example-brainstorm.md
