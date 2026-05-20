import Sidebar from "@/components/sidebar";
import MykBelgeleri from "@/components/myk-belgeleri";

export default function Page() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <MykBelgeleri />
    </div>
  );
}