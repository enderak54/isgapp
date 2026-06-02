import Sidebar from "@/components/sidebar";
import SkipLink from "@/components/skip-link";
import PsikososyalRisk from "@/components/psikososyal-risk";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Psikososyal Risk Degerlendirme",
  description: "Psikososyal risk faktorlerini degerlendirin ve yonetin",
};

export default function PsikososyalRiskPage() {
  return (
    <div className="flex min-h-screen">
      <SkipLink />
      <Sidebar />
      <main id="main-content" className="flex-1">
        <PsikososyalRisk />
      </main>
    </div>
  );
}