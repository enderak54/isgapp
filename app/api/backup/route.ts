import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const TURKISH_LABELS: Record<string, string> = {
  personel: "Personel",
  personel_belgeleri: "Personel Belgeleri",
  personel_myk_egitimleri: "MYK Eğitim Kayıtları",
  myk_egitim_listesi: "MYK Eğitim Listesi",
  myk_belgeri: "MYK Belgeleri (Legacy)",
  ayarlar: "Ayarlar",
  audit_log: "Denetim Günlüğü",
  versiyonlar: "Sürümler",
  kvkk_consents: "KVKK Onayları",
  operator_belgeri: "Operatör Belgeleri",
  is_kazalari: "İş Kazaları",
  ihtar_tutanagi: "İhtar Tutanakları",
  ihtar_dosyalari: "İhtar Dosyaları",
  notlar: "Notlar",
  santiyeler: "Şantiyeler",
  taseronlar: "Taşeronlar",
  saha_sorumlulari: "Saha Sorumluları",
  is_ekipmanlari: "İş Ekipmanları",
  egitimler: "Eğitimler",
  talimatlar: "Talimatlar",
  personel_dosyasi: "Personel Dosyası",
  risk_degerlendirme: "Risk Değerlendirme",
  yasal_uygunluk: "Yasal Uygunluk",
  ic_denetim: "İç Denetim",
  denetim_bulgulari: "Denetim Bulguları",
  acil_durum: "Acil Durum",
  duzeltici_faaliyet: "Düzeltici Faaliyet",
  yonetim_gozden_gecirme: "Yönetim Gözden Geçirme",
  dokuman_kontrol: "Doküman Kontrol",
  yetkinlik_matrisi: "Yetkinlik Matrisi",
  performans_izleme: "Performans İzleme",
};

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const body = await request.json();
  const selectedTables: string[] = body.tables || [];
  const includeFiles = body.includeFiles !== false;
  const mod = body.mod === "full" ? "tam" : "kismi";

  if (selectedTables.length === 0) {
    return NextResponse.json({ error: "En az bir tablo seçin" }, { status: 400 });
  }

  const backup: Record<string, { label: string; rows: any[]; count: number }> = {};
  const errors: string[] = [];

  for (const table of selectedTables) {
    try {
      const { data, error } = await supabase.from(table).select("*");
      if (error) {
        errors.push(`${table}: ${error.message}`);
        continue;
      }
      backup[table] = {
        label: TURKISH_LABELS[table] || table,
        rows: data || [],
        count: data?.length || 0,
      };
    } catch (e: any) {
      errors.push(`${table}: ${e.message}`);
    }
  }

  const fileRefs: any[] = [];
  if (includeFiles) {
    if (backup["personel_belgeleri"]) {
      for (const row of backup["personel_belgeleri"].rows) {
        if (row.dosya_url) {
          try {
            const { data } = await supabase.storage.from("isg-files").createSignedUrl(row.dosya_url, 604800);
            fileRefs.push({ id: row.id, dosya_adi: row.dosya_adi, dosya_url: row.dosya_url, signed_url: data?.signedUrl || null, field: row.field, personel_id: row.personel_id });
          } catch { fileRefs.push({ id: row.id, dosya_adi: row.dosya_adi, dosya_url: row.dosya_url, signed_url: null, field: row.field, personel_id: row.personel_id }); }
        }
      }
    }
    if (backup["ihtar_dosyalari"]) {
      for (const row of backup["ihtar_dosyalari"].rows) {
        if (row.dosya_url) {
          try {
            const { data } = await supabase.storage.from("ihtar-dosyalari").createSignedUrl(row.dosya_url, 604800);
            fileRefs.push({ id: row.id, dosya_adi: row.dosya_adi, dosya_url: row.dosya_url, signed_url: data?.signedUrl || null, kaynak: "ihtar_dosyalari" });
          } catch { fileRefs.push({ id: row.id, dosya_adi: row.dosya_adi, dosya_url: row.dosya_url, signed_url: null, kaynak: "ihtar_dosyalari" }); }
        }
      }
    }
  }

  const result = {
    metadata: {
      olusturulma: new Date().toISOString(),
      versiyon: "1.0",
      tablo_sayisi: Object.keys(backup).length,
      toplam_kayit: Object.values(backup).reduce((s, t) => s + t.count, 0),
      dosya_referansi_sayisi: fileRefs.length,
      hatalar: errors.length > 0 ? errors : undefined,
    },
    tablolar: backup,
    dosyalar: fileRefs.length > 0 ? fileRefs : undefined,
  };

  const { error: logError } = await supabase.from("yedekleme_log").insert({
    mod,
    tablo_sayisi: Object.keys(backup).length,
    kayit_sayisi: result.metadata.toplam_kayit,
    dosya_sayisi: fileRefs.length,
    dosya_boyutu_bytes: new Blob([JSON.stringify(result)]).size,
    hata: errors.length > 0 ? errors.join("; ") : null,
  });
  if (logError) console.error("Backup log error:", logError);

  return NextResponse.json(result);
}
