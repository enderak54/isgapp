import type { Metadata } from "next";
import DuzelticiFaaliyet from "@/components/duzeltici-faaliyet";

export const metadata: Metadata = { title: "Düzeltici Faaliyet - ISG Takip" };

export default function Page() {
  return <DuzelticiFaaliyet />;
}
