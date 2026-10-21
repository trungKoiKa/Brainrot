import "server-only";
import { Client } from "@notionhq/client";

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Thiếu biến môi trường ${name}`);
  return value;
}

let client: Client | undefined;

/**
 * SDK tự retry khi Notion trả 429/5xx: dùng header Retry-After nếu có,
 * không thì back-off tăng dần — đúng yêu cầu mục 9 SPEC, không cần tự viết.
 */
export function notion(): Client {
  client ??= new Client({ auth: requireEnv("NOTION_TOKEN") });
  return client;
}
