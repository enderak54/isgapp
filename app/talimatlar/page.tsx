import Sidebar from "@/components/sidebar";
import Talimatlar from "@/components/talimatlar";

export default function Page() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <Talimatlar />
    </div>
  );
}