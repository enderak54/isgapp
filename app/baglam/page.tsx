import Sidebar from "@/components/sidebar";
import BaglamAnalizi from "@/components/baglam-analizi";

export default function Page() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <BaglamAnalizi />
    </div>
  );
}
