import type { Metadata } from "next";
import ICDenetim from "@/components/ic-denetim";

export const metadata: Metadata = { title: "İç Denetim - ISG Takip" };

export default function Page() {
  return <ICDenetim />;
}
