import type { Metadata } from "next";
import PersonelDosyasi from "@/components/personel-dosyasi";

export const metadata: Metadata = { title: "Dosya Yönetimi - ISG Takip" };

export default function Page() {
  return <PersonelDosyasi />;
}