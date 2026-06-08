import type { Metadata } from "next";
import IletisimKaydi from "@/components/iletisim-kaydi";

export const metadata: Metadata = { title: "İletişim Kaydı - ISG Takip" };

export default function Page() {
  return <IletisimKaydi />;
}
