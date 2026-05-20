import Sidebar from "@/components/sidebar";
import Settings from "@/components/settings";

export default function Page() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <Settings />
    </div>
  );
}