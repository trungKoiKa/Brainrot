import { Suspense } from "react";
import { connection } from "next/server";
import { Card } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { PasswordForm, ProfileForm } from "@/components/settings/settings-forms";
import { getProfile } from "@/lib/db/data";

// SPEC-v1.0 bước 5: tên hiển thị, hạn + nhãn thẻ đếm ngược, đổi mật khẩu (dự án, xoá tài khoản thêm ở các đợt sau).
export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Cài đặt" subtitle="Thông tin của riêng bạn trên Second Brain." />
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl border border-line bg-surface" />}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}

async function SettingsContent() {
  await connection();
  const profile = await getProfile();
  return (
    <div className="space-y-5">
      <Card title="Hồ sơ">
        <ProfileForm
          email={profile.email}
          name={profile.name}
          targetDate={profile.target.date ?? ""}
          targetLabel={profile.targetLabel || (profile.targetDate === null && profile.target.date ? profile.target.label : "")}
        />
      </Card>
      <Card title="Đổi mật khẩu">
        <PasswordForm />
      </Card>
    </div>
  );
}
