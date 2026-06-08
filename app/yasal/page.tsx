import type { Metadata } from "next";
import YasalUygunluk from "@/components/yasal-uygunluk";

export const metadata: Metadata = { title: "Yasal Uygunluk - ISG Takip" };

export default function Page() {
  return <YasalUygunluk />;
}
