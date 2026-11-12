// Thang đo trục Y cho biểu đồ Dashboard (components/dashboard/charts.tsx). Hàm thuần → test được.

/**
 * Đỉnh trục Y = 4 bước "tròn" (1/2/5/10/20…), chừa ~15% phía trên để đỉnh không bị cắt.
 * 4 bước đều nhau → 5 mốc 0, b, 2b, 3b, 4b luôn là số nguyên tròn.
 */
export function niceMax(max: number): number {
  const raw = Math.max(4, max * 1.15) / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? 10 * pow;
  return step * 4;
}
