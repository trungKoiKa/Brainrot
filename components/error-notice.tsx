import { CircleAlertIcon, XIcon } from "lucide-react";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Button } from "@/components/ui/button";

/** Hộp báo lỗi khi lưu (dùng chung mọi màn), có nút đóng. */
export function ErrorNotice({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <Alert variant="destructive" className="mb-4">
      <CircleAlertIcon aria-hidden="true" />
      <AlertTitle>Lỗi khi lưu</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
      <AlertAction>
        <Button variant="ghost" size="icon-xs" onClick={onDismiss} aria-label="Đóng thông báo">
          <XIcon />
        </Button>
      </AlertAction>
    </Alert>
  );
}
