import Sidebar from "@/components/sidebar";
import AIDashboard from "@/components/ai-dashboard";

export const metadata = { title: "AI Dashboard" };

export default function Page() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main id="main-content" className="main-content">
        <AIDashboard />
      </main>
    </div>
  );
}

