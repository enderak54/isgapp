import Sidebar from "@/components/sidebar";
import OperatorBelgeleri from "@/components/operator-belgeleri";

export default function Page() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <OperatorBelgeleri />
    </div>
  );
}