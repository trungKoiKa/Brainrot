import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

// Proxy (Next 16 đổi tên từ middleware): chạy trước mỗi request để kiểm tra đăng nhập.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const loggedIn = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/login") {
    return loggedIn ? NextResponse.redirect(new URL("/today", request.url)) : NextResponse.next();
  }

  if (!loggedIn) {
    // Giữ trang định mở để đăng nhập xong quay lại (rà soát A2 lỗi 4); login/actions.ts kiểm tra lại bằng safeNextPath
    const url = new URL("/login", request.url);
    const target = pathname + request.nextUrl.search;
    if (pathname !== "/") url.searchParams.set("next", target);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Bỏ qua file tĩnh và tối ưu ảnh, nếu không trang /login cũng không tải được CSS/JS
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
