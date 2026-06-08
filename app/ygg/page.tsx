import type { Metadata } from "next";
import YonetimGozdenGecirme from "@/components/yonetim-gozden-gecirme";

export const metadata: Metadata = { title: "Yönetim Gözden Geçirme - ISG Takip" };

export default function Page() {
  return <YonetimGozdenGecirme />;
}
