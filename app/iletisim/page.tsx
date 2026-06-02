import Sidebar from "@/components/sidebar";
import IletisimKaydi from "@/components/iletisim-kaydi";

export default function Page() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <IletisimKaydi />
    </div>
  );
}
