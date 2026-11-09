"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tự tắt dải "Hoàn tác" sau `ms` mili-giây, nhưng tạm dừng khi rê chuột hoặc có focus trên dải
 * (SPEC-v1.0, Goal đợt 10; cùng hành vi với Tasks). Trả về các handler gắn vào phần tử dải.
 * `dismiss` được giữ trong ref nên đổi hàm giữa các lần vẽ không làm đếm lại từ đầu.
 */
export function useAutoDismiss(active: unknown, dismiss: () => void, ms = 8000) {
  const [hold, setHold] = useState(false);
  const dismissRef = useRef(dismiss);
  useEffect(() => {
    dismissRef.current = dismiss;
  });
  useEffect(() => {
    if (!active || hold) return;
    const timer = setTimeout(() => dismissRef.current(), ms);
    return () => clearTimeout(timer);
  }, [active, hold, ms]);
  return {
    onMouseEnter: () => setHold(true),
    onMouseLeave: () => setHold(false),
    onFocus: () => setHold(true),
    onBlur: () => setHold(false),
  };
}
