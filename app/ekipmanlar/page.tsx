import type { Metadata } from "next";
import IsEkipmanlari from "@/components/is-ekipmanlari";

export const metadata: Metadata = { title: "İş Ekipmanları - ISG Takip" };

export default function Page() {
  return <IsEkipmanlari />;
}