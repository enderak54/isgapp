import Sidebar from "@/components/sidebar";
import Santiyeler from "@/components/santiyeler";

export default function Page() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <Santiyeler />
    </div>
  );
}