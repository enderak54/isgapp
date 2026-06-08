import type { Metadata } from "next";
import IsciKatilimi from "@/components/isci-katilimi";

export const metadata: Metadata = { title: "İşçi Katılımı - ISG Takip" };

export default function Page() {
  return <IsciKatilimi />;
}
