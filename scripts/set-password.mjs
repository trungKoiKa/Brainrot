// Đặt / đổi mật khẩu cho tài khoản (SPEC-v1.0, giai đoạn A). Chạy trong terminal của bạn, mật khẩu gõ ẩn:
//   npm run user:password -- ban@example.com "Tên hiển thị"
// - Email đã có → đổi mật khẩu.
// - Chưa có và user mặc định (chủ dữ liệu hiện tại) chưa gắn email → gắn email + mật khẩu vào user mặc định.
// - Ngược lại → tạo người dùng mới (không có dữ liệu).
// Đọc DATABASE_URL từ .env.local (npm run đã nạp). Mật khẩu không bao giờ được in ra.
import { createInterface } from "node:readline";
import { neon } from "@neondatabase/serverless";
import { MIN_PASSWORD_LENGTH, hashPassword } from "../lib/password.ts";

const DEFAULT_USER_ID = "00000000-0000-4000-8000-000000000001";
const [emailArg, nameArg] = process.argv.slice(2);
const email = (emailArg ?? "").trim().toLowerCase();

if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error('Cách dùng: npm run user:password -- <email> ["Tên hiển thị"]');
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("Thiếu DATABASE_URL trong .env.local.");
  process.exit(1);
}

/** Hỏi một dòng, không hiện ký tự gõ. */
function askHidden(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const write = rl._writeToOutput;
    rl._writeToOutput = (s) => (s.includes(question) ? write.call(rl, s) : write.call(rl, ""));
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

const password = await askHidden("Mật khẩu mới: ");
if (password.length < MIN_PASSWORD_LENGTH) {
  console.error(`Mật khẩu cần ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`);
  process.exit(1);
}
if (password !== (await askHidden("Nhập lại mật khẩu: "))) {
  console.error("Hai lần nhập không khớp.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const hash = await hashPassword(password);
const name = (nameArg ?? "").trim();

const [existing] = await sql`select id from users where email = ${email}`;
if (existing) {
  await sql`update users set password_hash = ${hash}, name = coalesce(nullif(${name}, ''), name) where id = ${existing.id}`;
  console.log(`Đã đổi mật khẩu cho ${email}.`);
} else {
  const [claimed] = await sql`
    update users set email = ${email}, password_hash = ${hash}, name = coalesce(nullif(${name}, ''), name)
    where id = ${DEFAULT_USER_ID} and email is null returning id`;
  if (claimed) {
    console.log(`Đã gắn ${email} vào tài khoản mặc định (chủ dữ liệu hiện tại) và đặt mật khẩu.`);
  } else {
    await sql`insert into users (email, name, password_hash) values (${email}, ${name || email}, ${hash})`;
    console.log(`Đã tạo người dùng mới ${email}.`);
  }
}
