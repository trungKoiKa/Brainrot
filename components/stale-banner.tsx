/** SPEC mục 9: Notion lỗi nhưng còn bản cũ → hiển thị bản cũ kèm banner này. */
export function StaleBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <p role="status" className="mb-6 rounded-lg border border-line bg-surface-muted px-4 py-3 text-sm text-muted-foreground">
      ⚠ Không lấy được dữ liệu mới từ Notion — đang hiển thị bản gần nhất. Web sẽ tự thử lại sau ít giây.
    </p>
  );
}
