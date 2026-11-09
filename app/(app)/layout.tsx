import { Suspense } from "react";
import { connection } from "next/server";
import { AppShell } from "@/components/app-shell";
import { SidebarAccount } from "@/components/sidebar-account";
import { getProfile } from "@/lib/db/data";

// Layout cho các trang sau đăng nhập (route group "(app)" không đổi URL). Chân sidebar đọc hồ sơ của từng người
// (tên, hạn đếm ngược) → nằm trong Suspense riêng để phần còn lại của khung vẫn prerender được.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <AppShell
      account={
        <Suspense fallback={null}>
          <Account />
        </Suspense>
      }
    >
      {children}
    </AppShell>
  );
}

async function Account() {
  await connection();
  const profile = await getProfile();
  return <SidebarAccount name={profile.name} target={profile.target.date ? { date: profile.target.date, label: profile.target.label } : null} />;
}
