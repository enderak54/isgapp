import type { Metadata } from "next";
import PersonnelForm from "@/components/personnel-form";

export const metadata: Metadata = { title: "Ana Sayfa - ISG Takip" };

export default function Home() {
  return <PersonnelForm />;
}