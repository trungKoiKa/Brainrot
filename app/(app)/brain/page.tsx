import { Card, Empty } from "@/components/card";
import { PageHeader } from "@/components/page-header";

export default function BrainPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Brain" subtitle="Bản đồ kiến thức và dự án." />
      <Card>
        <Empty>Graph 3D sẽ có ở Bước 6.</Empty>
      </Card>
    </div>
  );
}
