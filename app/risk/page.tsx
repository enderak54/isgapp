import type { Metadata } from "next";
import RiskDegerlendirme from "@/components/risk-degerlendirme";

export const metadata: Metadata = {
  title: "Risk Değerlendirme - ISG Takip",
};

export default function Page() {
  return <RiskDegerlendirme />;
}
