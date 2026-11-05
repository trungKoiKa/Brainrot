import { TriangleAlertIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";

/** SPEC mục 9: đọc dữ liệu lỗi nhưng còn bản cũ → hiển thị bản cũ kèm banner này. */
export function StaleBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <Alert variant="warning" role="status" className="mb-6">
      <TriangleAlertIcon aria-hidden="true" />
      <AlertTitle>Không lấy được dữ liệu mới</AlertTitle>
      <AlertDescription>Đang hiển thị bản gần nhất. Web sẽ tự thử lại sau ít giây.</AlertDescription>
    </Alert>
  );
}
