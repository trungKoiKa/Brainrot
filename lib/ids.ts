// Kiểm tra dạng dữ liệu dùng chung cho Server Action, phiên đăng nhập và các hàm parse (client + server đều dùng được).

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** id dạng UUID (mọi bảng dùng uuid làm khoá chính). */
export const isId = (v: unknown): v is string => typeof v === "string" && UUID.test(v);

/** Ngày dạng YYYY-MM-DD (chỉ kiểm tra dạng, không kiểm tra ngày có thật). */
export const isDay = (v: unknown): v is string => typeof v === "string" && DAY.test(v);
