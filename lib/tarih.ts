export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  const parts = iso.split("T")[0].split("-");
  if (parts.length !== 3) return iso;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

export function displayDate(iso: string | null | undefined): string {
  return iso ? formatDate(iso) : "-";
}
