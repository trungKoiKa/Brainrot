import { Suspense } from "react";
import { connection } from "next/server";
import { Card } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteAccountForm, FieldManager, PasswordForm, ProfileForm, ProjectManager } from "@/components/settings/settings-forms";
import { getFieldsWithCounts, getProfile, getProjectsWithCounts } from "@/lib/db/data";

// SPEC-v1.0 bước 5: tên hiển thị, hạn + nhãn thẻ đếm ngược, dự án, đổi mật khẩu xoá tài khoản.
export default function SettingsPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader kicker="TÀI KHOẢN" title="Cài đặt" subtitle="Thông tin của riêng bạn trên Brainrot." />
      <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}

async function SettingsContent() {
  await connection();
  const [profile, projects, fields] = await Promise.all([getProfile(), getProjectsWithCounts(), getFieldsWithCounts()]);
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
      <Card title="Dự án">
        <ProjectManager projects={projects} />
      </Card>
      <Card title="Lĩnh vực">
        <FieldManager fields={fields} />
      </Card>
      <Card title="Đổi mật khẩu">
        <PasswordForm />
      </Card>
      <Card title="Tài khoản">
        <DeleteAccountForm />
      </Card>
    </div>
  );
}
