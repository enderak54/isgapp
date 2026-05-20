import Sidebar from "@/components/sidebar";
import PersonelDosyasi from "@/components/personel-dosyasi";

export default function Page() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <PersonelDosyasi />
    </div>
  );
}