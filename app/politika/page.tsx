import Sidebar from "@/components/sidebar";
import PolitikaYonetimi from "@/components/politika-yonetimi";

export default function Page() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <PolitikaYonetimi />
    </div>
  );
}
