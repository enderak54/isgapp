import Sidebar from "@/components/sidebar";
import IhtarTutanagi from "@/components/ihtar-tutanagi";

export default function Page() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <IhtarTutanagi />
    </div>
  );
}
