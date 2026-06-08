import type { Metadata } from "next";
import Settings from "@/components/settings";

export const metadata: Metadata = { title: "Ayarlar - ISG Takip" };

export default function Page() {
  return <Settings />;
}