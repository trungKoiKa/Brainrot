import { redirect } from "next/navigation";

// v1.0 đợt 1: chưa có Knowledge nên Brain tạm ẩn (SPEC-v1.0 mục 7); quay lại ở v1.1. Component BrainView còn nguyên.
export default function HomePage() {
  redirect("/today");
}
