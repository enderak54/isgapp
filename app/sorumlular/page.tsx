import Sidebar from "@/components/sidebar";
import SahaSorumlulari from "@/components/saha-sorumlulari";

export default function Page() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <SahaSorumlulari />
    </div>
  );
}