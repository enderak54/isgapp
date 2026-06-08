import type { Metadata } from "next";
import AuditLogViewer from "@/components/audit-log-viewer";

export const metadata: Metadata = { title: "Denetim Günlüğü - ISG Takip" };

export default function Page() {
  return <AuditLogViewer />;
}
