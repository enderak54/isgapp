import type { Metadata } from "next";
import YetkinlikMatrisi from "@/components/yetkinlik-matrisi";

export const metadata: Metadata = { title: "Yetkinlik Matrisi - ISG Takip" };

export default function Page() {
  return <YetkinlikMatrisi />;
}
