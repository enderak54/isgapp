import Sidebar from "@/components/sidebar";
import ICDenetim from "@/components/ic-denetim";

export default function Page() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <ICDenetim />
    </div>
  );
}
