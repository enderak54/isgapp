import type { Metadata } from "next";
import SahaSorumlulari from "@/components/saha-sorumlulari";

export const metadata: Metadata = {
  title: "Saha Sorumluları - ISG Takip",
};

export default function Page() {
  return <SahaSorumlulari />;
}