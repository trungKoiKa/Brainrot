import { Card, Empty } from "@/components/card";
import { PageHeader } from "@/components/page-header";

export default function TasksPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Tasks" subtitle="Việc chưa xong, nhóm theo dự án." />
      <Card>
        <Empty>Danh sách task sẽ có ở Bước 5.</Empty>
      </Card>
    </div>
  );
}
