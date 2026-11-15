// Giữ con trỏ bàn phím ở chỗ hợp lý sau khi React vẽ lại (không để rơi về đầu trang, WCAG 2.4.3).

/** Focus phần tử đầu tiên khớp `selector` ở khung hình kế tiếp. */
export const focusSoon = (selector: string) => requestAnimationFrame(() => document.querySelector<HTMLElement>(selector)?.focus());

/** Focus nút "Hoàn tác" của toast mới nhất (sau khi dòng vừa thao tác biến mất). */
export const focusUndo = () =>
  requestAnimationFrame(() => requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-sonner-toast] [data-button]")?.focus()));
