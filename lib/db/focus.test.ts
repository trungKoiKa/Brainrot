// "3 việc hôm nay" và chia mục tiêu tháng xuống tuần (SPEC.md mục 12), chạy trên PGlite.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "./client";
import { createTask, listTasks, setTaskPlannedOn, setTaskTop, TOP_FULL } from "./tasks";
import { DEFAULT_USER_ID, users } from "./schema";
import { createTestDb } from "./test-db";

let db: Db;
let close: () => Promise<void>;
let other: string;
const ME = DEFAULT_USER_ID;
const input = (title: string, plannedOn: string | null = null) => ({ title, project: null, priority: null, deadline: null, plannedOn });

beforeAll(async () => {
  ({ db, close } = await createTestDb());
  [{ id: other }] = await db.insert(users).values({ name: "Bạn", email: "ban2@example.com" }).returning({ id: users.id });
}, 30_000);
afterAll(() => close());

const idOf = async (userId: string, title: string) => (await listTasks(db, userId)).find((t) => t.title === title)!.id;

describe("3 việc hôm nay (SPEC.md mục 12.1)", () => {
  it("gắn sao kéo Ngày làm về ngày đó; bỏ sao giữ Ngày làm", async () => {
    await createTask(db, ME, input("Việc trễ", "2026-11-10"));
    const id = await idOf(ME, "Việc trễ");
    await setTaskTop(db, ME, id, "2026-11-19");
    expect((await listTasks(db, ME)).find((t) => t.id === id)).toMatchObject({ topOn: "2026-11-19", plannedOn: "2026-11-19" });
    await setTaskTop(db, ME, id, null);
    expect((await listTasks(db, ME)).find((t) => t.id === id)).toMatchObject({ topOn: null, plannedOn: "2026-11-19" });
  });

  it("tối đa 3 việc mỗi ngày; gắn lại việc đã có sao không bị tính trùng", async () => {
    for (const t of ["A", "B", "C", "D"]) await createTask(db, ME, input(t));
    for (const t of ["A", "B", "C"]) await setTaskTop(db, ME, await idOf(ME, t), "2026-11-20");
    await expect(setTaskTop(db, ME, await idOf(ME, "D"), "2026-11-20")).rejects.toThrow(TOP_FULL);
    await setTaskTop(db, ME, await idOf(ME, "A"), "2026-11-20");
    await setTaskTop(db, ME, await idOf(ME, "D"), "2026-11-21"); // ngày khác vẫn được
  });

  it("dời Ngày làm sang ngày khác thì mất sao (ngày tới); dời đúng ngày đó thì giữ", async () => {
    await createTask(db, ME, input("Dời"));
    const id = await idOf(ME, "Dời");
    await setTaskTop(db, ME, id, "2099-01-02");
    await setTaskPlannedOn(db, ME, id, "2099-01-02");
    expect((await listTasks(db, ME)).find((t) => t.id === id)!.topOn).toBe("2099-01-02");
    await setTaskPlannedOn(db, ME, id, "2099-01-03");
    expect((await listTasks(db, ME)).find((t) => t.id === id)!.topOn).toBeNull();
    await setTaskTop(db, ME, id, "2099-01-03");
    await setTaskPlannedOn(db, ME, id, null);
    expect((await listTasks(db, ME)).find((t) => t.id === id)!.topOn).toBeNull();
  });

  it("3 việc của người khác không chiếm chỗ; không gắn sao được việc của người khác", async () => {
    for (const t of ["X", "Y", "Z"]) await createTask(db, other, input(t));
    for (const t of ["X", "Y", "Z"]) await setTaskTop(db, other, await idOf(other, t), "2026-11-22");
    await createTask(db, ME, input("Của tôi"));
    await setTaskTop(db, ME, await idOf(ME, "Của tôi"), "2026-11-22");
    await expect(setTaskTop(db, ME, await idOf(other, "X"), "2026-11-23")).rejects.toThrow();
    expect((await listTasks(db, other)).find((t) => t.title === "X")!.topOn).toBe("2026-11-22");
  });
});
