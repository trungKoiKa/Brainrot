"use client";

// Planner tích hợp từ trungKoiKa/planner (SPEC-v0.2 mục 3). Chỉ render phía client (dữ liệu ở localStorage).
// Đã bỏ: đăng nhập/đồng bộ Supabase, PWA, bộ chọn theme riêng (dùng theme chung của Brainrot).
import { useState } from "react";
import Header from "./components/Header";
import EndWeekModal from "./components/modals/EndWeekModal";
import PastePlanModal from "./components/modals/PastePlanModal";
import ProjectDeadlineModal from "./components/modals/ProjectDeadlineModal";
import TaskModal from "./components/modals/TaskModal";
import Toast from "./components/Toast";
import { useRoute } from "./lib/route";
import Archive from "./pages/Archive";
import Plan from "./pages/Plan";
import Stats from "./pages/Stats";
import { useUI } from "./store/useUI";
import "./styles/planner.css";

export default function PlannerApp() {
  const route = useRoute();
  const { editing, closeTask, projectDeadline, setProjectDeadline } = useUI();
  const [modal, setModal] = useState<"endWeek" | "paste" | null>(null);
  const close = () => setModal(null);

  return (
    <div className="planner">
      <div className="shell">
        <Header route={route} />
        {route === "plan" && <Plan onEndWeek={() => setModal("endWeek")} onPaste={() => setModal("paste")} />}
        {route === "archive" && <Archive />}
        {route === "stats" && <Stats />}

        {editing && <TaskModal key={editing.taskId} {...editing} onClose={closeTask} />}
        {projectDeadline && (
          <ProjectDeadlineModal projectId={projectDeadline} onClose={() => setProjectDeadline(null)} />
        )}
        {modal === "endWeek" && <EndWeekModal onClose={close} />}
        {modal === "paste" && <PastePlanModal onClose={close} />}
        <Toast />
      </div>
    </div>
  );
}
