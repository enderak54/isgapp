import Sidebar from "@/components/sidebar";
import Dashboard from "@/components/dashboard";

export default function Home() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <Dashboard />
    </div>
  );
}