export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  const parts = iso.split("T")[0].split("-");
  if (parts.length !== 3) return iso;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

export function displayDate(iso: string | null | undefined): string {
  return iso ? formatDate(iso) : "-";
}

export function kalanSureText(hedefISO: string | null): string {
  if (!hedefISO) return "-";
  const hedef = new Date(hedefISO.split("T")[0]);
  const bugun = new Date();
  bugun.setHours(0, 0, 0, 0);
  const farkMs = hedef.getTime() - bugun.getTime();
  if (farkMs <= 0) return "Süre doldu";
  const toplamGun = Math.floor(farkMs / (1000 * 60 * 60 * 24));
  if (toplamGun < 30) return `${toplamGun} gün kaldı`;
  let yil = hedef.getFullYear() - bugun.getFullYear();
  let ay = hedef.getMonth() - bugun.getMonth();
  let gun = hedef.getDate() - bugun.getDate();
  if (gun < 0) { ay--; const oncekiAy = new Date(hedef.getFullYear(), hedef.getMonth(), 0); gun += oncekiAy.getDate(); }
  if (ay < 0) { yil--; ay += 12; }
  if (yil < 0) return "Süre doldu";
  const parts: string[] = [];
  if (yil > 0) parts.push(`${yil} yıl`);
  if (ay > 0) parts.push(`${ay} ay`);
  if (gun > 0) parts.push(`${gun} gün`);
  return parts.join(" ") + " kaldı";
}
