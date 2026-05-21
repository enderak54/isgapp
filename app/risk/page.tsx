import Sidebar from "@/components/sidebar";
import RiskDegerlendirme from "@/components/risk-degerlendirme";

export default function Page() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <RiskDegerlendirme />
    </div>
  );
}
