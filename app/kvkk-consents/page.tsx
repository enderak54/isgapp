import type { Metadata } from "next";
import KVKKConsents from "@/components/kvkk-consents";

export const metadata: Metadata = { title: "KVKK Onayları - ISG Takip" };

export default function KVKKConsentsPage() {
  return (
    
        <KVKKConsents />
  );
}
