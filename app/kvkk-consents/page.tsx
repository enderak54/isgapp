import KVKKConsents from "@/components/kvkk-consents";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "KVKK Onay Yönetimi",
  description: "KVKK uyumluluğu için kişisel veri onaylarını yönetin",
};

export default function KVKKConsentsPage() {
  return (
    
        <KVKKConsents />
  );
}
