import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  async redirects() {
    return [
      // Trang chủ → Today (Brain có trang riêng /brain từ v1.1, SPEC.md mục 5.7)
      { source: "/", destination: "/today", permanent: false },
      // v0.5 bỏ Planner (SPEC-v0.5 4.5): link cũ → chế độ Tuần của Goal
      { source: "/planner", destination: "/goals?level=week", permanent: false },
    ];
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
