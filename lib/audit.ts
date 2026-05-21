import { supabase } from "./supabase";

export async function logAudit(
  tableName: string,
  action: "INSERT" | "UPDATE" | "DELETE",
  recordId: string | null,
  oldValues: Record<string, any> | null = null,
  newValues: Record<string, any> | null = null
) {
  try {
    const ip = typeof window !== "undefined" ? "" : ""; // Server-side would get from headers
    const userAgent = typeof window !== "undefined" ? navigator.userAgent : "";

    await supabase.from("audit_log").insert({
      table_name: tableName,
      record_id: recordId,
      action,
      old_values: oldValues,
      new_values: newValues,
      ip_address: ip || null,
      user_agent: userAgent,
    });
  } catch (err) {
    console.error("Audit log failed:", err);
    // Don't throw - audit logging shouldn't break the main operation
  }
}
