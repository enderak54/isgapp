import PsikososyalRisk from "@/components/psikososyal-risk";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Psikososyal Risk Degerlendirme",
  description: "Psikososyal risk faktorlerini degerlendirin ve yonetin",
};

export default function PsikososyalRiskPage() {
  return (
    
        <PsikososyalRisk />
  );
}

