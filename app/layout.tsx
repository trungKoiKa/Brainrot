import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

// Manrope cho mọi chữ (Trung chọn 12/11/2026 sau khi so 6 font trên màn Today; thay Plus Jakarta Sans). Không dùng chữ mono.
const sans = Manrope({
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
