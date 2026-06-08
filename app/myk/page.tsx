import type { Metadata } from "next";
import MykBelgeleri from "@/components/myk-belgeleri";

export const metadata: Metadata = {
  title: "MYK Belgeleri - ISG Takip",
};

export default function Page() {
  return <MykBelgeleri />;
}