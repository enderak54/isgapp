import Sidebar from "@/components/sidebar";
import Taseronlar from "@/components/taseronlar";

export default function Page() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <Taseronlar />
    </div>
  );
}