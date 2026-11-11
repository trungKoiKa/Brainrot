import type { Metadata } from "next";
import { Be_Vietnam_Pro, IBM_Plex_Mono } from "next/font/google";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

// Be Vietnam Pro cho chữ đọc (Trung đổi 11/11/2026: Plex Sans trông cứng), Plex Mono chỉ cho số và nhãn IN HOA ngắn.
const sans = Be_Vietnam_Pro({
  variable: "--font-sans-main",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin", "vietnamese"],
  weight: ["400"],
  preload: false,
});

export const metadata: Metadata = {
  title: "Second Brain",
  description: "Hôm nay làm gì, deadline nào sắp tới, đã học được gì.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${sans.variable} ${plexMono.variable} h-full antialiased`}
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
