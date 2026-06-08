import type { Metadata } from "next";
import Santiyeler from "@/components/santiyeler";

export const metadata: Metadata = {
  title: "Şantiyeler - ISG Takip",
};

export default function Page() {
  return <Santiyeler />;
}