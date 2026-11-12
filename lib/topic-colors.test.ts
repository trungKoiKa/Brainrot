import { describe, expect, it } from "vitest";
import { colorVarByOrder } from "./topic-colors";

describe("colorVarByOrder", () => {
  const projects = ["Đồ án", "Học AI", "Thực tập", "Sức khỏe", "Linh tinh"];

  it("gán 4 màu theo thứ tự dự án của người dùng", () => {
    expect(colorVarByOrder("Đồ án", projects)).toBe("--field-1");
    expect(colorVarByOrder("Sức khỏe", projects)).toBe("--field-4");
  });

  it("dự án thứ 5 trở đi, không có dự án hoặc không tìm thấy → xám", () => {
    expect(colorVarByOrder("Linh tinh", projects)).toBe("--field-neutral");
    expect(colorVarByOrder(null, projects)).toBe("--field-neutral");
    expect(colorVarByOrder("Đã xoá", projects)).toBe("--field-neutral");
  });
});
