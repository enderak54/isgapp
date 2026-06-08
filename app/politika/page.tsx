import type { Metadata } from "next";
import PolitikaYonetimi from "@/components/politika-yonetimi";

export const metadata: Metadata = {
  title: "Politika Yönetimi - ISG Takip",
};

export default function Page() {
  return <PolitikaYonetimi />;
}
