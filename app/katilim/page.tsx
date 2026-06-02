import Sidebar from "@/components/sidebar";
import IsciKatilimi from "@/components/isci-katilimi";

export default function Page() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <IsciKatilimi />
    </div>
  );
}
