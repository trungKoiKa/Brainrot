import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Đăng nhập · Second Brain" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-8">
        <h1 className="mb-6 font-serif text-2xl font-semibold">Second Brain</h1>
        <LoginForm />
      </div>
    </main>
  );
}
