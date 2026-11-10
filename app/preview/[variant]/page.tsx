// Route TẠM (redesign giai đoạn 2): /preview/a, /preview/b, /preview/c — 3 phương án Today trên dữ liệu thật của người
// đang đăng nhập, chỉ để xem và chọn hướng. Không có nút nào hoạt động. Xoá ở giai đoạn 5.
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Be_Vietnam_Pro, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { loadToday } from "./data";
import { VariantA } from "./variant-a";
import { VariantB } from "./variant-b";
import { VariantC } from "./variant-c";

const bvp = Be_Vietnam_Pro({ variable: "--font-bvp", subsets: ["latin", "vietnamese"], weight: ["400", "500", "600", "700"] });
const plexSans = IBM_Plex_Sans({ variable: "--font-plex-sans", subsets: ["latin", "vietnamese"], weight: ["400", "500", "600"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin", "vietnamese"], weight: ["400", "500"] });

const VARIANTS = { a: VariantA, b: VariantB, c: VariantC } as const;

export default function PreviewPage({ params }: { params: Promise<{ variant: string }> }) {
  return (
    <div className={`${bvp.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <Suspense fallback={null}>
        <Content params={params} />
      </Suspense>
    </div>
  );
}

async function Content({ params }: { params: Promise<{ variant: string }> }) {
  const { variant } = await params;
  const View = VARIANTS[variant as keyof typeof VARIANTS];
  if (!View) notFound();
  const d = await loadToday();
  return <View d={d} />;
}
