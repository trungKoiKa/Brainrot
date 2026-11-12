import { describe, expect, it } from "vitest";
import { parsePeriod } from "./period";
import { MAX_TEXT } from "./quick-capture";
import { parseReflection, previousFocus, reflectionQuestions, type Reflection } from "./reflections";

const r = (level: Reflection["level"], start: string, nextFocus: string): Reflection => ({
  id: start, level, start, wentWell: "", lesson: "", grateful: "", nextFocus, motto: "",
});

describe("Nhìn lại (SPEC.md mục 5.3)", () => {
  it("câu 4 đổi chữ theo cấp", () => {
    expect(reflectionQuestions("week")[3].label).toBe("Ba mục tiêu tôi cần tập trung trong tuần tiếp theo là?");
    expect(reflectionQuestions("month")[3].label).toContain("trong tháng tiếp theo");
    expect(reflectionQuestions("quarter")[3].label).toContain("trong quý tiếp theo");
    expect(reflectionQuestions("year")[3].label).toContain("trong năm tiếp theo");
  });

  it("previousFocus lấy câu 4 của kỳ liền trước, đúng cấp", () => {
    const list = [r("month", "2026-09-01", "Chương 3"), r("week", "2026-10-19", "Demo ESP32"), r("month", "2026-10-01", "  ")];
    expect(previousFocus(list, parsePeriod("month", "2026-10")!)).toBe("Chương 3");
    expect(previousFocus(list, parsePeriod("week", "2026-W44")!)).toBe("Demo ESP32");
    expect(previousFocus(list, parsePeriod("month", "2026-11")!)).toBeNull(); // kỳ trước chỉ có khoảng trắng
    expect(previousFocus(list, parsePeriod("quarter", "2026-Q4")!)).toBeNull();
  });

  it("parseReflection: chuẩn hóa xuống dòng, châm ngôn chỉ cấp Năm, giới hạn độ dài", () => {
    expect(parseReflection({ wentWell: "a\r\nb ", motto: "Sống kỷ luật" }, "month")).toEqual({
      ok: true,
      data: { wentWell: "a\nb", lesson: "", grateful: "", nextFocus: "", motto: "" },
    });
    expect(parseReflection({ motto: "Sống\nkỷ luật" }, "year")).toMatchObject({ ok: true, data: { motto: "Sống kỷ luật" } });
    expect(parseReflection({ lesson: "x".repeat(MAX_TEXT + 1) }, "week").ok).toBe(false);
    expect(parseReflection({ motto: "x".repeat(301) }, "year").ok).toBe(false);
  });
});
