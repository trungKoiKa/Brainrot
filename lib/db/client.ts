import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

// Kết nối Neon qua HTTP (mỗi truy vấn một request, hợp với serverless trên Vercel). SPEC.md mục 3.
// Mọi hàm trong lib/db/ nhận `db` kiểu `Db` để test chạy được trên PGlite (Postgres trong bộ nhớ).

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

let instance: Db | null = null;

export const isDbConfigured = () => Boolean(process.env.DATABASE_URL);

export function getDb(): Db {
  if (!instance) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL chưa đặt");
    instance = drizzle({ client: neon(url), schema });
  }
  return instance;
}
