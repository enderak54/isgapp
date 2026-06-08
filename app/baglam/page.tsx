import type { Metadata } from "next";
import BaglamAnalizi from "@/components/baglam-analizi";

export const metadata: Metadata = { title: "Bağlam Analizi - ISG Takip" };

export default function Page() {
  return <BaglamAnalizi />;
}
