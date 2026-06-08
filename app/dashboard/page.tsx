import type { Metadata } from "next";
import Dashboard from "@/components/dashboard";

export const metadata: Metadata = { title: "Dashboard - ISG Takip" };

export default function Page() {
  return <Dashboard />;
}