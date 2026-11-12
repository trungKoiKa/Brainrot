import { describe, expect, it } from "vitest";
import { fold } from "./text";

describe("fold", () => {
  it("bỏ dấu, đ → d, chữ thường, gộp khoảng trắng", () => {
    expect(fold("  Đồ   Án ")).toBe("do an");
    expect(fold("Sức khỏe")).toBe("suc khoe");
  });
});
