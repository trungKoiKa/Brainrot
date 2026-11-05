import { beforeEach, describe, expect, it } from "vitest";
import { createSessionToken, readSessionToken, verifySessionToken } from "./auth";

// Giá trị chỉ dùng cho test, không phải bí mật thật
const USER = "00000000-0000-4000-8000-000000000001";
const OTHER = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  process.env.AUTH_SECRET = "test-secret-for-unit-tests-only-0123456789";
});

describe("cookie phiên ký HMAC", () => {
  it("token hợp lệ trả đúng userId, hạn 30 ngày", async () => {
    const t = await createSessionToken(USER);
    expect(await readSessionToken(t)).toBe(USER);
    expect(await verifySessionToken(t)).toBe(true);
    const days = (Number(t.split(".")[1]) - Date.now()) / 864e5;
    expect(Math.round(days)).toBe(30);
  });

  it("không đổi sang user khác bằng cách sửa userId trong token", async () => {
    const [, exp, sig] = (await createSessionToken(USER)).split(".");
    expect(await readSessionToken(`${OTHER}.${exp}.${sig}`)).toBeNull();
  });

  it("từ chối: sửa chữ ký, sửa hạn, hết hạn, rác, rỗng, token kiểu cũ", async () => {
    const t = await createSessionToken(USER);
    const [id, exp, sig] = t.split(".");
    const flipped = sig.slice(0, -1) + (sig.endsWith("A") ? "B" : "A");
    expect(await readSessionToken(`${id}.${exp}.${flipped}`)).toBeNull();
    expect(await readSessionToken(`${id}.${Number(exp) + 1000}.${sig}`)).toBeNull();
    expect(await readSessionToken(await createSessionToken(USER, Date.now() - 31 * 864e5))).toBeNull();
    expect(await readSessionToken("abc")).toBeNull();
    expect(await readSessionToken(`${exp}.${sig}`)).toBeNull(); // dạng cũ <hạn>.<chữ ký> của bản Notion
    expect(await readSessionToken(undefined)).toBeNull();
    expect(await verifySessionToken("abc")).toBe(false);
  });

  it("đổi AUTH_SECRET → token cũ hết hiệu lực", async () => {
    const t = await createSessionToken(USER);
    process.env.AUTH_SECRET = "another-secret-for-unit-tests-only-987654321";
    expect(await readSessionToken(t)).toBeNull();
  });

  it("thiếu / ngắn AUTH_SECRET → coi như chưa đăng nhập, không ném lỗi", async () => {
    const t = await createSessionToken(USER);
    process.env.AUTH_SECRET = "short";
    expect(await readSessionToken(t)).toBeNull();
  });
});
