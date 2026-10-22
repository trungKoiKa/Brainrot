import { PageHeader } from "@/components/page-header";
import { PlannerView } from "@/components/planner-view";

// SPEC-v0.2 mục 3: planner tích hợp từ trungKoiKa/planner, dữ liệu ở localStorage của trình duyệt.
// Giao diện bên trong planner giữ tiếng Anh (Trung chốt 22/10/2026).
export default function PlannerPage() {
  return (
    // Khung tràn hết padding của <main> để nền chấm bi (planner.css) phủ cả vùng nội dung như bản gốc
    <div className="planner-page -mx-4 -my-6 min-h-screen px-4 py-6 md:-mx-10 md:-my-10 md:px-10 md:py-10">
      <div className="mx-auto max-w-6xl">
        <PageHeader title="Planner" subtitle="Kế hoạch tuần — lưu trên trình duyệt này." />
        <PlannerView />
      </div>
    </div>
  );
}
