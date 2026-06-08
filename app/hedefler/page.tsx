import type { Metadata } from "next";
import OhsHedefleri from "@/components/ohs-hedefleri";

export const metadata: Metadata = { title: "OHS Hedefleri - ISG Takip" };

export default function Page() {
  return <OhsHedefleri />;
}
