import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("băm mật khẩu scrypt", () => {
  it("đúng / sai; mỗi lần băm ra chuỗi khác nhau (salt riêng)", async () => {
    const a = await hashPassword("mat-khau-test-123");
    const b = await hashPassword("mat-khau-test-123");
    expect(a).not.toBe(b);
    expect(a.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("mat-khau-test-123", a)).toBe(true);
    expect(await verifyPassword("sai", a)).toBe(false);
    expect(await verifyPassword("", a)).toBe(false);
  });

  it("hash rỗng / hỏng → false, không ném lỗi", async () => {
    expect(await verifyPassword("x", null)).toBe(false);
    expect(await verifyPassword("x", "")).toBe(false);
    expect(await verifyPassword("x", "plain-text")).toBe(false);
    expect(await verifyPassword("x", "scrypt$abc$def")).toBe(false);
  });

  it("hash giả dùng ở màn đăng nhập vẫn đi qua phép băm (cùng thời gian) và trả false", async () => {
    const dummy = "scrypt$AAAAAAAAAAAAAAAAAAAAAA==$" + "A".repeat(86) + "==";
    expect(await verifyPassword("x", dummy)).toBe(false);
  });
});
