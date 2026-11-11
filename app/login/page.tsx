import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Đăng nhập · Brainrot" };

type Search = Promise<{ next?: string; out?: string }>;

export default function LoginPage({ searchParams }: { searchParams: Search }) {
  return (
    <main className="graph-paper flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <p className="font-mono text-xs text-muted-foreground">BRAINROT · ĐĂNG NHẬP</p>
        <h1 className="mt-1 mb-6 text-3xl font-semibold tracking-tight">Mở nhật ký của bạn</h1>
        <section className="border border-line bg-surface p-6">
          {/* Đọc ?next lúc request → bọc Suspense; vỏ trang vẫn dựng sẵn */}
          <Suspense fallback={<LoginForm next="" />}>
            <LoginWithNext searchParams={searchParams} />
          </Suspense>
        </section>
        <p className="mt-4 text-sm text-pretty text-muted-foreground">
          Chưa có tài khoản? Tài khoản do người quản lý tạo; nhờ họ gửi email và mật khẩu cho bạn.
        </p>
      </div>
    </main>
  );
}

async function LoginWithNext({ searchParams }: { searchParams: Search }) {
  const { next, out } = await searchParams;
  return (
    <>
      {out === "1" && (
        <p role="status" className="mb-4 text-sm text-muted-foreground">
          ✓ Đã đăng xuất.
        </p>
      )}
      <LoginForm next={next ?? ""} />
    </>
  );
}
