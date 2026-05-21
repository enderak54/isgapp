import Sidebar from "@/components/sidebar";
import AcilDurum from "@/components/acil-durum";

export default function Page() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <AcilDurum />
    </div>
  );
}
