import Sidebar from "@/components/sidebar";
import IsKazalari from "@/components/is-kazalari";

export default function Page() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <IsKazalari />
    </div>
  );
}