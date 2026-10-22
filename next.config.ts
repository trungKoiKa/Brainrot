import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // v0.2: Brain thành trang chủ → giữ link/bookmark cũ /brain còn dùng được (307, chưa cache vĩnh viễn)
  async redirects() {
    return [{ source: "/brain", destination: "/", permanent: false }];
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
