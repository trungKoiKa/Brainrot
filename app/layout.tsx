import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import { Sidebar } from "@/components/sidebar";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "Second Brain",
  description: "Hôm nay làm gì, deadline nào sắp tới, đã học được gì.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} ${lora.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Đặt data-theme trước khi trình duyệt vẽ trang → không nháy sai theme */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full font-sans md:flex">
        <Sidebar />
        <main className="flex-1 px-4 py-6 md:px-10 md:py-10">{children}</main>
      </body>
    </html>
  );
}
