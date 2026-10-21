// Ký/kiểm tra cookie đăng nhập bằng HMAC-SHA256 (Web Crypto có sẵn, không cần thư viện).
// Dùng được cả trong proxy.ts lẫn Server Action.

export const SESSION_COOKIE = "sb_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 ngày (giây)

const encoder = new TextEncoder();

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET chưa đặt hoặc ngắn hơn 32 ký tự");
  }
  return secret;
}

function toBase64Url(bytes: ArrayBuffer): string {
  let s = "";
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toBase64Url(await crypto.subtle.sign("HMAC", key, encoder.encode(data)));
}

/** So sánh không phụ thuộc thời gian, tránh đoán dần từng ký tự. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Token dạng `<hạn (ms)>.<chữ ký>`. */
export async function createSessionToken(now = Date.now()): Promise<string> {
  const expires = String(now + SESSION_MAX_AGE * 1000);
  return `${expires}.${await hmac(expires)}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature || !/^\d+$/.test(expires)) return false;
  if (Number(expires) < Date.now()) return false;
  try {
    return safeEqual(signature, await hmac(expires));
  } catch {
    return false; // thiếu AUTH_SECRET → coi như chưa đăng nhập
  }
}

/** Băm cả hai rồi so sánh để độ dài mật khẩu không lộ qua thời gian phản hồi. */
export async function checkPassword(input: string): Promise<boolean> {
  const expected = process.env.APP_PASSWORD;
  if (!expected) throw new Error("APP_PASSWORD chưa đặt");
  const [a, b] = await Promise.all([hmac(input), hmac(expected)]);
  return safeEqual(a, b);
}
