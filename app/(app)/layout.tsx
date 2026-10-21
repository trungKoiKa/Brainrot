import { Sidebar } from "@/components/sidebar";

// Layout cho các trang sau đăng nhập (route group "(app)" không đổi URL)
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <main className="flex-1 px-4 py-6 md:px-10 md:py-10">{children}</main>
    </div>
  );
}
