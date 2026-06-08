import type { Metadata } from "next";
import Talimatlar from "@/components/talimatlar";

export const metadata: Metadata = {
  title: "Talimatlar - ISG Takip",
};

export default function Page() {
  return <Talimatlar />;
}