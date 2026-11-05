import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  async redirects() {
    return [
      { source: "/brain", destination: "/today", permanent: false },
      // v1.0 đợt 1: chưa có Knowledge nên Brain tạm ẩn (SPEC-v1.0 mục 7); trang chủ → Today. BrainView còn nguyên cho v1.1
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
