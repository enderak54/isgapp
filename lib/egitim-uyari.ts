export const EGITIM_FIELDS = [
  { label: "İSG Eğitim", tarihField: "isg_egitim_tarihi", sureField: "isg_egitim_gecerlilik_suresi", ayarKey: "uyari_isg_egitim" },
  { label: "Yüksekte Çalışma", tarihField: "yuksekte_calisma_tarihi", sureField: "yuksekte_calisma_gecerlilik_suresi", ayarKey: "uyari_yuksekte_calisma" },
  { label: "MYK", tarihField: "myk_tarihi", sureField: "myk_gecerlilik_suresi", ayarKey: "uyari_myk" },
  { label: "Sertifika", tarihField: "sertifika_tarihi", sureField: "sertifika_gecerlilik_suresi", ayarKey: "uyari_sertifika" },
  { label: "Operatör Belgesi", tarihField: "operator_belgesi_tarihi", sureField: "operator_belgesi_gecerlilik_suresi", ayarKey: "uyari_operator_belgesi" },
  { label: "KKD", tarihField: "kkd_tarihi", sureField: "kkd_gecerlilik_suresi", ayarKey: "uyari_kkd" },
  { label: "Oryantasyon", tarihField: "oryantasyon_tarihi", sureField: "oryantasyon_gecerlilik_suresi", ayarKey: "uyari_oryantasyon" },
  { label: "Sağlık Raporu", tarihField: "saglik_raporu_tarihi", sureField: "saglik_raporu_gecerlilik_suresi", ayarKey: "uyari_saglik_raporu" },
];

export function calculateExpiryDate(tarih: string, sureYil: number): Date | null {
  if (!tarih || !sureYil) return null;
  const d = new Date(tarih);
  if (isNaN(d.getTime())) return null;
  d.setFullYear(d.getFullYear() + sureYil);
  return d;
}

export function daysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / 86400000);
}

export function isExpired(tarih: string, sureYil: number): boolean {
  const expiry = calculateExpiryDate(tarih, sureYil);
  if (!expiry) return false;
  return daysUntil(expiry) <= 0;
}

export function isWarningNeeded(tarih: string, sureYil: number, thresholdDays: number): boolean {
  const expiry = calculateExpiryDate(tarih, sureYil);
  if (!expiry) return false;
  const remaining = daysUntil(expiry);
  return remaining > 0 && remaining <= thresholdDays;
}

export function getWarningMessage(label: string, remainingDays: number): string {
  if (remainingDays <= 0) return `${label} süresi doldu!`;
  if (remainingDays === 1) return `${label} 1 gün içinde sona eriyor!`;
  return `${label} ${remainingDays} gün içinde sona eriyor`;
}
