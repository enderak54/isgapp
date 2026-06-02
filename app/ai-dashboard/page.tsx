import Sidebar from "@/components/sidebar";
import SkipLink from "@/components/skip-link";
import AIDashboard from "@/components/ai-dashboard";

export const metadata = { title: "AI Dashboard" };

export default function Page() {
  return (
    <div className="flex min-h-screen">
      <SkipLink />
      <Sidebar />
      <main id="main-content" className="flex-1">
        <AIDashboard />
      </main>
    </div>
  );
}