import { describe, expect, it } from "vitest";
import { isDay, isId } from "./ids";

describe("isId / isDay", () => {
  it("nhận UUID, từ chối chuỗi khác và kiểu khác", () => {
    expect(isId("0b6f1c2e-8a3d-4f5e-9b1a-2c3d4e5f6a7b")).toBe(true);
    expect(isId("0B6F1C2E-8A3D-4F5E-9B1A-2C3D4E5F6A7B")).toBe(true);
    expect(isId("abc")).toBe(false);
    expect(isId(null)).toBe(false);
    expect(isId(42)).toBe(false);
  });
  it("nhận YYYY-MM-DD", () => {
    expect(isDay("2026-11-15")).toBe(true);
    expect(isDay("2026-1-5")).toBe(false);
    expect(isDay(undefined)).toBe(false);
  });
});
