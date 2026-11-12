import { describe, expect, it } from "vitest";
import { niceMax } from "./chart-scale";

describe("niceMax (đỉnh trục Y Dashboard)", () => {
  it("luôn là 4 bước tròn và cao hơn giá trị lớn nhất", () => {
    for (const max of [0, 1, 3, 6, 9, 13, 26, 47, 120]) {
      const top = niceMax(max);
      const step = top / 4;
      expect(top).toBeGreaterThan(max);
      expect([1, 2, 5, 10, 20, 50, 100]).toContain(step);
    }
  });
  it("ví dụ: 13 việc → trục 0–20, 26 → 0–40", () => {
    expect(niceMax(13)).toBe(20);
    expect(niceMax(26)).toBe(40);
  });
});
