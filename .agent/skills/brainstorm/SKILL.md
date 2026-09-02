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
- **No-re-ask rule — KHÔNG hỏi lại câu user đã trả lời**. Trước mỗi section, scan toàn bộ context (idea seed + previous answers + existing brainstorm doc nếu là continuation) → loại bỏ câu hỏi đã có answer. Nếu answer partial → hỏi follow-up cụ thể chỉ phần thiếu, KHÔNG hỏi lại từ đầu.
- **IT-BA framing — KHÔNG hỏi câu coding/architect-level**. Skill này phục vụ IT Business Analyst, KHÔNG phải developer. **CẤM hỏi**: tên column DB, schema table, function/service name, API endpoint cụ thể, JWT vs session, framework choice, refresh-token rotation, hashing algorithm, payload structure, SDK name. **ĐƯỢC hỏi (business language)**: "system làm gì" (validate, lưu thông tin, gửi email, gọi dịch vụ ngoài), "cần lưu loại thông tin nghiệp vụ gì", "có gọi dịch vụ bên ngoài nào", "ai trigger action", "khi nào trigger", "kết quả nghiệp vụ user thấy". Quyết định kỹ thuật là việc của `/srs` + dev/architect.
- **Quality checklist gate** trước L1 — nếu fail check → đề xuất hỏi thêm trước khi write.
- **Vietnamese-first** default, auto-detect từ idea content. Muốn tiếng Anh thì nói "viết bằng tiếng Anh".
- **KHÔNG nhảy thẳng URD/PRD** — brainstorm là checkpoint riêng.
- **Doc sạch — KHÔNG chèn meta-text vào doc sinh ra** (per ba-conventions Mục 0).
- **Shallow mode qua lời nói** — user nói "brainstorm nhanh gọn" / "làm nhanh thôi" → skill bypass deep mode, chạy fast 1-batch version.

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
