# BA Conventions

> Common rules cho mọi BA skills (`/brainstorm`, `/urd`, `/brd`, `/prd-epic`, `/srs`, `/usecase`, `/userstory`, `/ac`). Mỗi skill MUST reference file này trong Constraints + References.

## 0. Doc sạch — không meta-text trong template/doc

- Template chỉ chứa **cấu trúc** (heading, khung bảng, placeholder). Doc sinh ra chỉ chứa **nội dung nghiệp vụ thật**.
- KHÔNG chèn vào template/doc: blockquote giải thích section là gì, công thức viết (vd công thức pitch), format ID, khối "Cách điền", pointer "chạy `/skill-x` để fill", quy tắc format cell. Mọi hướng dẫn cho người viết sống ở SKILL.md (Constraints/Gotchas) hoặc `rules/`.
- ĐƯỢC giữ: placeholder dữ liệu render dạng blockquote (`> Scope: {{scope}}`, `> Decided: {{date}} | By: ...`), chú giải mà **người đọc** cần để hiểu nội dung (thang nhãn ✅/🔵/🟡 của reverse-doc, định nghĩa horizon Now/Next/Later của roadmap), marker file auto-gen.
- Update mode gặp doc cũ còn meta-text → đề xuất dọn qua L2 diff, user quyết.

## 1. Author resolution (cho activity log)

- Resolve @author từ thông tin người dùng hoặc git user name.
- Ghi nhận per-event ở cột @author của `docs/_shared/activity.log`.

## 2. No-re-ask rule

- KHÔNG hỏi lại câu user đã trả lời (cùng session HOẶC trong file đã tồn tại).
- Trước mỗi vòng câu hỏi: scan idea seed + previous answers + existing doc (continuation/update mode) → loại câu đã có answer.
- Answer partial → follow-up chỉ phần thiếu, KHÔNG hỏi lại từ đầu.
- Continuation/update mode: MUST Read full file trước khi phỏng vấn, đối chiếu mỗi planned question với content có sẵn.

## 3. IT-BA framing (no coding/architect questions)

Skill phục vụ IT Business Analyst, KHÔNG phải developer.

**CẤM hỏi:** tên column DB, schema table, function/service name, API endpoint, JWT vs session, framework choice, refresh-token rotation, hashing algorithm, payload structure, SDK name.

**ĐƯỢC hỏi (business language):**
- "system làm gì" (validate, lưu thông tin, gửi email, gọi dịch vụ ngoài)
- "cần lưu loại thông tin nghiệp vụ gì" (vd email, status, ngày tạo — KHÔNG hỏi column type)
- "có gọi dịch vụ bên ngoài nào" (Google, SendGrid, Stripe — chỉ tên + mục đích, KHÔNG hỏi endpoint/SDK)
- "ai trigger action", "khi nào trigger", "kết quả nghiệp vụ user thấy"

Quyết định kỹ thuật (DB schema, auth strategy, framework choice) là việc của `/srs` + dev/architect, KHÔNG phải BA skills khác.

## 4. Vietnamese-friendly typography

- KHÔNG dùng ký hiệu ngoại lai khó đọc trong prose tiếng Việt: `Mục N` thay vì `§N`, `đoạn N` thay vì `¶N`.
- `→` chỉ dùng trong flow/diagram/table cell, narration tiếng Việt nên dùng "sang/đến/dẫn tới".
- Bold (`**...**`) dùng bình thường — phục vụ emphasis số liệu, key term, câu chốt.
- Tránh làm doc trông như legal/spec Tây.

## 5. L1 plan preview cho BA, không cho dev

L1 plan preview phải dùng **prose tự nhiên với từ nghiệp vụ**, KHÔNG bảng dày tag/flag/checklist.

**Format đề xuất:**

> Em sẽ {tạo mới | viết lại} file `docs/{feature}/{name}.md` với:
>
> **Thêm/cập nhật nội dung:**
> - {liệt kê 4-8 bullet bằng từ nghiệp vụ: "luồng / bảng / hình minh họa / số liệu cụ thể / wording mẫu"}
> - {các số liệu nghiệp vụ cụ thể nếu có}
>
> **Câu hỏi mở:** {N} câu đã chốt trong session này; còn {M} câu để dành cho `/urd` hoặc `/prd-epic`: {liệt kê ngắn}.
>
> **Ghi nhận:** activity log "{note}".
>
> Apply? (Y / sửa / override-feature `<slug>` / override-idea `<slug>`)
