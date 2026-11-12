import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

// Plus Jakarta Sans cho mọi chữ (Trung chọn 11/11/2026 sau khi so 6 font). Bản mềm 12/11/2026 bỏ IBM Plex Mono.
const sans = Plus_Jakarta_Sans({
  variable: "--font-sans-main",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Second Brain",
  description: "Hôm nay làm gì, deadline nào sắp tới, đã học được gì.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${sans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Đặt data-theme trước khi trình duyệt vẽ trang → không nháy sai theme */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
