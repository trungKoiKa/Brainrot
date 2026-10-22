import { Card, Empty } from "@/components/card";
import { PageHeader } from "@/components/page-header";

// TẠM (v0.2 Bước 1): planner thật được đưa vào ở Bước 2–4 (SPEC-v0.2 mục 3)
export default function PlannerPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Planner" subtitle="Kế hoạch tuần: dự án → task → từng ngày." />
      <Card>
        <Empty>Planner đang được tích hợp — sẽ có ở bước tiếp theo.</Empty>
      </Card>
    </div>
  );
}
