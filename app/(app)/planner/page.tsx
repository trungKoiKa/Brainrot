import { PlannerView } from "@/components/planner-view";

// SPEC-v0.2 mục 3: planner tích hợp từ trungKoiKa/planner, dữ liệu ở localStorage của trình duyệt
export default function PlannerPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PlannerView />
    </div>
  );
}
