# Decisions

Decision records preserve lasting product, architecture, data ownership,
security, compatibility, and validation choices that future work must inherit.

Use `docs/templates/decision.md`. Task-local implementation choices remain in
the active execution plan and do not require a separate decision.

An installed consumer begins with no fabricated decisions. Add local decision
documents here as real choices are accepted, then index them in this file.

## Index

- [0001](0001-notion-query-via-data-source.md): Gọi Notion API theo data source, chỉ qua `lib/notion/`.
- [0002](0002-cache-with-use-cache-and-tags.md): Cache Notion bằng `"use cache"` 5 phút + tag; trang render lúc request.
