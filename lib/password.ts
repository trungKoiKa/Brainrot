// Băm mật khẩu bằng scrypt của Node (không thêm thư viện). Dùng cả ở Server Action đăng nhập lẫn
// scripts/set-password.mjs, nên file này chỉ dùng cú pháp Node chạy thẳng được (không import có alias "@/").
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;
export const MIN_PASSWORD_LENGTH = 8;

function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // N=16384 (mặc định của Node): đủ chậm với kẻ đoán mật khẩu, vẫn nhanh trên Vercel
    scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

/** `scrypt$<salt base64>$<hash base64>` */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

/** Dạng hash sai / rỗng → false (không ném lỗi). */
export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  const [scheme, saltB64, hashB64] = (stored ?? "").split("$");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  if (expected.length !== KEY_LENGTH) return false;
  const actual = await derive(password, Buffer.from(saltB64, "base64"));
  return timingSafeEqual(actual, expected);
}
