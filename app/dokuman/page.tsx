import Sidebar from "@/components/sidebar";
import DokumanKontrol from "@/components/dokuman-kontrol";

export default function Page() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <DokumanKontrol />
    </div>
  );
}
