import type { Metadata } from "next";
import PersonnelList from "@/components/personnel-list";

export const metadata: Metadata = {
  title: "Personel - ISG Takip",
};

export default function Page() {
  return <PersonnelList />;
}