import Sidebar from "@/components/sidebar";
import KVKKConsents from "@/components/kvkk-consents";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "KVKK Onay Yönetimi",
  description: "KVKK uyumluluğu için kişisel veri onaylarını yönetin",
};

export default function KVKKConsentsPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main id="main-content" className="flex-1">
        <KVKKConsents />
      </main>
    </div>
  );
}
