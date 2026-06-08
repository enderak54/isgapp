import type { Metadata } from "next";
import Egitimler from "@/components/egitimler";

export const metadata: Metadata = { title: "Eğitimler - ISG Takip" };

export default function Page() {
  return <Egitimler />;
}