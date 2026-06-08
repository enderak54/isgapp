import type { Metadata } from "next";
import IhtarTutanagi from "@/components/ihtar-tutanagi";

export const metadata: Metadata = { title: "İhtar Tutanağı - ISG Takip" };

export default function Page() {
  return <IhtarTutanagi />;
}
