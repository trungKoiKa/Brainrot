import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "./client";
import { clearFailures, isLocked, MAX_FAILURES, recentFailures, recordFailure } from "./login-throttle";
import { loginAttempts } from "./schema";
import { createTestDb } from "./test-db";

let db: Db;
let close: () => Promise<void>;

beforeAll(async () => {
  ({ db, close } = await createTestDb());
}, 30_000);
afterAll(async () => {
  await close();
});

describe("chống dò mật khẩu", () => {
  it("khoá sau đủ số lần sai; email khác không bị ảnh hưởng; đăng nhập đúng xoá lịch sử", async () => {
    for (let i = 0; i < MAX_FAILURES - 1; i++) await recordFailure(db, "a@example.com");
    expect(isLocked(await recentFailures(db, "a@example.com"))).toBe(false);
    await recordFailure(db, "a@example.com");
    expect(isLocked(await recentFailures(db, "a@example.com"))).toBe(true);
    expect(isLocked(await recentFailures(db, "b@example.com"))).toBe(false);
    await clearFailures(db, "a@example.com");
    expect(await recentFailures(db, "a@example.com")).toBe(0);
  });

  it("lần sai cũ hơn cửa sổ không tính; bản ghi quá 1 ngày bị dọn", async () => {
    await db.insert(loginAttempts).values([
      { email: "c@example.com", createdAt: new Date(Date.now() - 20 * 60_000) },
      { email: "c@example.com", createdAt: new Date(Date.now() - 3 * 24 * 60 * 60_000) },
    ]);
    expect(await recentFailures(db, "c@example.com")).toBe(0);
    await recordFailure(db, "d@example.com"); // kéo theo việc dọn
    const rows = await db.select().from(loginAttempts);
    expect(rows.some((r) => r.email === "c@example.com" && Date.now() - r.createdAt.getTime() > 24 * 60 * 60_000)).toBe(false);
  });
});
