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

const USER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Token dạng `<userId>.<hạn (ms)>.<chữ ký>`; chữ ký phủ cả userId nên không đổi sang user khác được. */
export async function createSessionToken(userId: string, now = Date.now()): Promise<string> {
  const payload = `${userId}.${now + SESSION_MAX_AGE * 1000}`;
  return `${payload}.${await hmac(payload)}`;
}

/** Trả userId nếu token hợp lệ và chưa hết hạn, ngược lại null. */
export async function readSessionToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  const [userId, expires, signature] = token.split(".");
  if (!userId || !expires || !signature || !USER_ID.test(userId) || !/^\d+$/.test(expires)) return null;
  if (Number(expires) < Date.now()) return null;
  try {
    return safeEqual(signature, await hmac(`${userId}.${expires}`)) ? userId : null;
  } catch {
    return null; // thiếu AUTH_SECRET → coi như chưa đăng nhập
  }
}

export const verifySessionToken = async (token: string | undefined) => (await readSessionToken(token)) !== null;
