import "server-only";
import { isFullPage } from "@notionhq/client";
import { notion, requireEnv } from "./client";

const normalizeId = (id: string) => id.replace(/-/g, "").toLowerCase();

/**
 * Hành động ghi duy nhất của v0.1 (SPEC 7.2): đặt Trạng thái = Xong.
 * Chỉ cho phép trang nằm trong database Tasks, để không ghi nhầm trang khác.
 */
export async function markTaskDone(pageId: string): Promise<void> {
  const page = await notion().pages.retrieve({ page_id: pageId });
  const parentDb =
    isFullPage(page) && page.parent.type === "data_source_id" ? page.parent.database_id : null;
  if (!parentDb || normalizeId(parentDb) !== normalizeId(requireEnv("NOTION_TASKS_DB"))) {
    throw new Error("Trang này không thuộc database Tasks");
  }
  await notion().pages.update({
    page_id: pageId,
    properties: { "Trạng thái": { status: { name: "Xong" } } },
  });
}
