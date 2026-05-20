import Sidebar from "@/components/sidebar";
import PersonnelForm from "@/components/personnel-form";

export default function Home() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <PersonnelForm />
    </div>
  );
}
