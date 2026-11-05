import "server-only";
import { revalidatePath } from "next/cache";

/** Sau mỗi lần ghi: bỏ cache router phía client để trang đọc lại dữ liệu mới (không còn cache dữ liệu theo tag như thời Notion). */
export const refreshData = () => revalidatePath("/", "layout");
