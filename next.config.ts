import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // v0.2: Brain thành trang chủ → giữ link/bookmark cũ /brain còn dùng được (307, chưa cache vĩnh viễn)
  async redirects() {
    return [
      { source: "/brain", destination: "/", permanent: false },
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
