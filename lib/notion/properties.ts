import "server-only";
import type { PageObjectResponse } from "@notionhq/client";
import { toVNDate } from "@/lib/date";

// Đọc property theo tên; sai kiểu hoặc thiếu → giá trị rỗng thay vì crash,
// để đổi schema bên Notion chỉ làm thiếu dữ liệu chứ không sập trang.

type Props = PageObjectResponse["properties"];

export function text(props: Props, name: string): string {
  const p = props[name];
  if (p?.type === "title") return p.title.map((t) => t.plain_text).join("");
  if (p?.type === "rich_text") return p.rich_text.map((t) => t.plain_text).join("");
  return "";
}

export function select(props: Props, name: string): string | null {
  const p = props[name];
  if (p?.type === "select") return p.select?.name ?? null;
  if (p?.type === "status") return p.status?.name ?? null;
  return null;
}

export function date(props: Props, name: string): string | null {
  const p = props[name];
  return p?.type === "date" && p.date ? toVNDate(p.date.start) : null;
}

export function url(props: Props, name: string): string | null {
  const p = props[name];
  return p?.type === "url" ? p.url : null;
}

export function checkbox(props: Props, name: string): boolean {
  const p = props[name];
  return p?.type === "checkbox" ? p.checkbox : false;
}

export function multiSelect(props: Props, name: string): string[] {
  const p = props[name];
  return p?.type === "multi_select" ? p.multi_select.map((o) => o.name) : [];
}

export function number(props: Props, name: string): number | null {
  const p = props[name];
  return p?.type === "number" ? p.number : null;
}
