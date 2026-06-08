import type { Metadata } from "next";
import AIDashboard from "@/components/ai-dashboard";

export const metadata: Metadata = { title: "AI Dashboard - ISG Takip" };

export default function Page() {
  return (
    
        <AIDashboard />
  );
}

