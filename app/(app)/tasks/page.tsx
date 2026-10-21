import { PageHeader } from "@/components/page-header";

export default function TasksPage() {
  return (
    <PageHeader title="Tasks" subtitle="Việc chưa xong, nhóm theo dự án.">
      <p className="text-sm text-muted">Danh sách task sẽ có ở Bước 5.</p>
    </PageHeader>
  );
}
