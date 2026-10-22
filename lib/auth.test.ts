import { beforeEach, describe, expect, it } from "vitest";
import { checkPassword, createSessionToken, verifySessionToken } from "./auth";

// Giá trị chỉ dùng cho test, không phải bí mật thật
beforeEach(() => {
  process.env.AUTH_SECRET = "test-secret-for-unit-tests-only-0123456789";
  process.env.APP_PASSWORD = "mat-khau-test";
});

describe("cookie phiên ký HMAC", () => {
  it("token hợp lệ được chấp nhận, hạn 30 ngày", async () => {
    const t = await createSessionToken();
    expect(await verifySessionToken(t)).toBe(true);
    const days = (Number(t.split(".")[0]) - Date.now()) / 864e5;
    expect(Math.round(days)).toBe(30);
  });

  it("từ chối: sửa chữ ký, sửa hạn, hết hạn, rác, rỗng", async () => {
    const t = await createSessionToken();
    const [exp, sig] = t.split(".");
    const flipped = sig.slice(0, -1) + (sig.endsWith("A") ? "B" : "A");
    expect(await verifySessionToken(`${exp}.${flipped}`)).toBe(false);
    expect(await verifySessionToken(`${Number(exp) + 1000}.${sig}`)).toBe(false);
    expect(await verifySessionToken(await createSessionToken(Date.now() - 31 * 864e5))).toBe(false);
    expect(await verifySessionToken("abc")).toBe(false);
    expect(await verifySessionToken(undefined)).toBe(false);
  });

  it("đổi AUTH_SECRET → token cũ hết hiệu lực", async () => {
    const t = await createSessionToken();
    process.env.AUTH_SECRET = "another-secret-for-unit-tests-only-987654321";
    expect(await verifySessionToken(t)).toBe(false);
  });

  it("thiếu / ngắn AUTH_SECRET → coi như chưa đăng nhập, không ném lỗi", async () => {
    const t = await createSessionToken();
    process.env.AUTH_SECRET = "short";
    expect(await verifySessionToken(t)).toBe(false);
  });
});

describe("kiểm tra mật khẩu", () => {
  it("đúng / sai", async () => {
    expect(await checkPassword("mat-khau-test")).toBe(true);
    expect(await checkPassword("sai")).toBe(false);
    expect(await checkPassword("")).toBe(false);
  });

  it("thiếu APP_PASSWORD → ném lỗi (Server Action báo 'chưa cấu hình')", async () => {
    delete process.env.APP_PASSWORD;
    await expect(checkPassword("x")).rejects.toThrow("APP_PASSWORD");
  });
});
