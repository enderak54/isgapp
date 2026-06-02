import Sidebar from "@/components/sidebar";
import SkipLink from "@/components/skip-link";
import HibritCalismaErgonomi from "@/components/hibrit-calisma-ergonomi";

export const metadata = { title: "Hibrit Calisma Ergonomi" };

export default function Page() {
  return (
    <div className="flex min-h-screen">
      <SkipLink />
      <Sidebar />
      <main id="main-content" className="flex-1">
        <HibritCalismaErgonomi />
      </main>
    </div>
  );
}