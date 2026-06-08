import type { Metadata } from "next";
import PerformansIzleme from "@/components/performans-izleme";

export const metadata: Metadata = {
  title: "Performans İzleme - ISG Takip",
};

export default function Page() {
  return <PerformansIzleme />;
}
