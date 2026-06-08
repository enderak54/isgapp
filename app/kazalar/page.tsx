import type { Metadata } from "next";
import IsKazalari from "@/components/is-kazalari";

export const metadata: Metadata = { title: "İş Kazaları - ISG Takip" };

export default function Page() {
  return <IsKazalari />;
}