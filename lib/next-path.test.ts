import { describe, expect, it } from "vitest";
import { HOME_PATH, safeNextPath } from "./next-path";

describe("safeNextPath", () => {
  it("giữ đường dẫn trong app kèm query", () => {
    expect(safeNextPath("/goals?level=week")).toBe("/goals?level=week");
    expect(safeNextPath("/tasks")).toBe("/tasks");
  });

  it("chặn chuyển hướng ra ngoài và giá trị lạ", () => {
    for (const bad of [
      "https://evil.example",
      "//evil.example",
      "/\\evil.example",
      "/\t/evil.example",
      "/\n/evil.example",
      "/ /evil.example",
      "/%09/evil.example".replace("%09", "\t"),
      "tasks",
      "",
      null,
      undefined,
      42,
    ]) {
      expect(safeNextPath(bad)).toBe(HOME_PATH);
    }
  });

  it("/ và /login về trang mặc định", () => {
    expect(safeNextPath("/")).toBe(HOME_PATH);
    expect(safeNextPath("/login?next=/x")).toBe(HOME_PATH);
  });
});
