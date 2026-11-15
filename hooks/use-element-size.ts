"use client";

import { useEffect, useRef, useState } from "react";

/** Đo kích thước thật của một phần tử và cập nhật khi nó đổi cỡ (biểu đồ Dashboard, canvas Brain). */
export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, size] as const;
}
