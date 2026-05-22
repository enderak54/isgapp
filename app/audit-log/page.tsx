import Sidebar from "@/components/sidebar";
import AuditLogViewer from "@/components/audit-log-viewer";

export default function Page() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <AuditLogViewer />
    </div>
  );
}
