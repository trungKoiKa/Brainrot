import { PageHeader } from "@/components/page-header";
import { PlannerView } from "@/components/planner-view";

// SPEC-v0.2 mục 3: planner tích hợp từ trungKoiKa/planner, dữ liệu ở localStorage của trình duyệt.
// Giao diện bên trong planner giữ tiếng Anh (Trung chốt 22/10/2026).
export default function PlannerPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Planner" subtitle="Kế hoạch tuần — lưu trên trình duyệt này." />
      <PlannerView />
    </div>
  );
}
