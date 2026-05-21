import Sidebar from "@/components/sidebar";
import YetkinlikMatrisi from "@/components/yetkinlik-matrisi";

export default function Page() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <YetkinlikMatrisi />
    </div>
  );
}
