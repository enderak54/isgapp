import Sidebar from "@/components/sidebar";
import YonetimGozdenGecirme from "@/components/yonetim-gozden-gecirme";

export default function Page() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <YonetimGozdenGecirme />
    </div>
  );
}
