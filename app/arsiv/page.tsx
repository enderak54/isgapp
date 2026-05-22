import Sidebar from "@/components/sidebar";
import Arsiv from "@/components/arsiv";

export default function Page() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <Arsiv />
    </div>
  );
}
