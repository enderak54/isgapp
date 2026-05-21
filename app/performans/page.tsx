import Sidebar from "@/components/sidebar";
import PerformansIzleme from "@/components/performans-izleme";

export default function Page() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <PerformansIzleme />
    </div>
  );
}
