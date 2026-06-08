import type { Metadata } from "next";
import Taseronlar from "@/components/taseronlar";

export const metadata: Metadata = { title: "Taşeronlar - ISG Takip" };

export default function Page() {
  return <Taseronlar />;
}