import { describe, expect, it, vi } from "vitest";

// data.ts kéo theo queries.ts (next/cache, server-only) — test chỉ cần hàm load()
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ cacheLife: () => {}, cacheTag: () => {} }));

const { load, NotionUnavailableError } = await import("./data");

describe("load(): bản tốt gần nhất khi Notion lỗi (SPEC mục 9)", () => {
  it("mới → lỗi có bản cũ → hồi phục", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await load("k", async () => ({ ok: true, data: [1, 2] }))).toEqual({ data: [1, 2], stale: false });
    expect(await load("k", async () => ({ ok: false, error: "503" }))).toEqual({ data: [1, 2], stale: true });
    expect(await load("k", async () => ({ ok: true, data: [9] }))).toEqual({ data: [9], stale: false });
  });

  it("lỗi khi chưa có bản cũ → NotionUnavailableError", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(load("chua-co", async () => ({ ok: false, error: "timeout" }))).rejects.toBeInstanceOf(NotionUnavailableError);
  });
});
