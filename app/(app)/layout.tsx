import { AppShell } from "@/components/app-shell";

// Layout cho các trang sau đăng nhập (route group "(app)" không đổi URL)
export default function AppLayout({ children }: LayoutProps<"/">) {
  return <AppShell thesisDeadline={process.env.THESIS_DEADLINE}>{children}</AppShell>;
}
