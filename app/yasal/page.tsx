import Sidebar from "@/components/sidebar";
import YasalUygunluk from "@/components/yasal-uygunluk";

export default function Page() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <YasalUygunluk />
    </div>
  );
}
