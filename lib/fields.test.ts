import { describe, expect, it } from "vitest";
import { projectColorByOrder } from "./fields";

describe("projectColorByOrder", () => {
  const projects = ["Đồ án", "Học AI", "Thực tập", "Sức khỏe", "Linh tinh"];

  it("gán 4 màu theo thứ tự dự án của người dùng", () => {
    expect(projectColorByOrder("Đồ án", projects)).toBe("--field-1");
    expect(projectColorByOrder("Sức khỏe", projects)).toBe("--field-4");
  });

  it("dự án thứ 5 trở đi, không có dự án hoặc không tìm thấy → xám", () => {
    expect(projectColorByOrder("Linh tinh", projects)).toBe("--field-neutral");
    expect(projectColorByOrder(null, projects)).toBe("--field-neutral");
    expect(projectColorByOrder("Đã xoá", projects)).toBe("--field-neutral");
  });
});
