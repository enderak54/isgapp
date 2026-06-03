import Sidebar from "@/components/sidebar";
import HibritCalismaErgonomi from "@/components/hibrit-calisma-ergonomi";

export const metadata = { title: "Hibrit Calisma Ergonomi" };

export default function Page() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main id="main-content" className="main-content">
        <HibritCalismaErgonomi />
      </main>
    </div>
  );
}

