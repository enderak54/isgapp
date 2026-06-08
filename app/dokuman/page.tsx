import type { Metadata } from "next";
import DokumanKontrol from "@/components/dokuman-kontrol";

export const metadata: Metadata = { title: "Doküman Kontrol - ISG Takip" };

export default function Page() {
  return <DokumanKontrol />;
}
