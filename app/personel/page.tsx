import Sidebar from "@/components/sidebar";
import PersonnelList from "@/components/personnel-list";

export default function Page() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <PersonnelList />
    </div>
  );
}