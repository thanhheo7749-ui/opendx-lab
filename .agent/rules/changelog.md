# Activity Log Convention

> Lịch sử thay đổi của TOÀN BỘ vault sống ở **một file duy nhất**: `docs/_shared/activity.log` (append-only). Doc KHÔNG mang `changelog:` trong frontmatter.

## Format

```
{date} | {skill} | {@author} | {file-path} | {note}
```

- 1 dòng = 1 sự kiện. Append cuối file.
- **date**: ISO `YYYY-MM-DD`.
- **skill**: `/brainstorm`, `/urd`, `/srs`, ... hoặc `manual`.
- **@author**: @handle người chạy hoặc git user name.
- **file-path**: project-relative path của file vừa Write/Edit.
- **note**: what changed — ≤80 chars, tiếng Việt hoặc Anh.

## Ví dụ

```
2026-08-21 | /brainstorm | @user | docs/payment/brainstorms/payment-checkout.md | initial brainstorm scaffold
```
