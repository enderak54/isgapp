import Sidebar from "@/components/sidebar";
import IsEkipmanlari from "@/components/is-ekipmanlari";

export default function Page() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <IsEkipmanlari />
    </div>
  );
}