import Sidebar from "@/components/sidebar";
import OhsHedefleri from "@/components/ohs-hedefleri";

export default function Page() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <OhsHedefleri />
    </div>
  );
}
