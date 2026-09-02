# Feature Bootstrap — xử lý khi input chưa khớp feature nào

> Rule chung cho MỌI skill có input dạng `<feature>` hoặc mô tả nghiệp vụ.

## Nhóm A — Điểm vào: derive slug + phỏng vấn đúng phạm vi + tạo feature

Khi arg KHÔNG khớp folder `docs/{arg}/` nào tồn tại:

1. **Nhận diện loại input.** Arg là mô tả nghiệp vụ (prose, nhiều từ, có động từ/tân ngữ) hay slug gõ sai (1 từ kebab-case)?
   - Prose → coi là mô tả, sang bước 2.
   - Slug-lạ 1 từ → hỏi "Chưa có feature `{arg}`. Đây là feature mới hay gõ nhầm? Feature hiện có: {list}." Đợi trả lời.
2. **Derive feature slug** từ nội dung mô tả: main domain noun phrase, kebab-case, ASCII (transliterate tiếng Việt), ≤50 ký tự (theo `naming-conventions.md`). Vd "khách đặt hàng, shipper giao, admin duyệt hoàn tiền" → `order-fulfillment` hoặc `ecommerce-order`. Không suy được slug rõ → hỏi user tên feature slug mong muốn.
3. **Phỏng vấn ĐÚNG PHẠM VI skill đó cần** theo IT-BA framing (`ba-conventions.md` Mục 3) — business language, KHÔNG hỏi DB/SDK/endpoint.
4. **Confirm ở L1** — preview prose BA-friendly gồm cả feature slug đề xuất (user override được) + tóm tắt nội dung.
5. **Tạo folder `docs/{feature}/`** (+ subfolder cần thiết) khi Write, sau khi user Y ở L1.
6. **Gợi ý bước tiếp** ở Output report.
