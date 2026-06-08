import type { Metadata } from "next";
import AcilDurum from "@/components/acil-durum";

export const metadata: Metadata = { title: "Acil Durum - ISG Takip" };

export default function Page() {
  return <AcilDurum />;
}
