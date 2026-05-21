import Sidebar from "@/components/sidebar";
import DuzelticiFaaliyet from "@/components/duzeltici-faaliyet";

export default function Page() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <DuzelticiFaaliyet />
    </div>
  );
}
