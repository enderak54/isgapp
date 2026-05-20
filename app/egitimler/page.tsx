import Sidebar from "@/components/sidebar";
import Egitimler from "@/components/egitimler";

export default function Page() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <Egitimler />
    </div>
  );
}