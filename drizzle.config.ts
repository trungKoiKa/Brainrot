import { defineConfig } from "drizzle-kit";

// Sinh migration: `npm run db:generate`. Áp vào Neon: `npm run db:migrate` (đọc DATABASE_URL từ .env.local).
export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
