// Màu cố định cho từng Lĩnh vực (SPEC mục 8) — dùng chung cho badge (Today) và node graph (Brain).
// Giá trị là tên CSS variable khai báo trong app/globals.css cho cả 2 theme.
const FIELD_VARS: Record<string, string> = {
  "Computer Vision": "--field-cv",
  "AI Agent": "--field-agent",
  "Embedded/Edge AI": "--field-edge",
  "Đồ án": "--field-thesis",
  "Kỹ năng sống": "--field-life",
  Khác: "--field-other",
};

export function fieldColorVar(field: string | null): string {
  return (field && FIELD_VARS[field]) || "--field-other";
}
