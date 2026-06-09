"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeForm } from "@/lib/security";
import { logAudit } from "@/lib/audit";
import { fetchWithCsrf } from "@/lib/csrf-client";
import { Settings, Save, CheckCircle, AlertCircle, AlertTriangle, Sun, Moon, Palette, ChevronDown, ChevronRight, GitBranch, Plus, X, Tag, Calendar, User, Clock, Menu, GripVertical, Cpu, ExternalLink, Code, Brain, Download, HardDrive, Database, FileArchive, Loader } from "lucide-react";
import { EGITIM_FIELDS } from "@/lib/egitim-uyari";
import { useTheme } from "@/components/theme-provider";

const colorOptions = [
  { key: "", label: "Gri", class: "", bg: "#6b7280" },
  { key: "blue", label: "Mavi", class: "theme-blue", bg: "#3b82f6" },
  { key: "green", label: "Yesil", class: "theme-green", bg: "#10b981" },
  { key: "purple", label: "Mor", class: "theme-purple", bg: "#8b5cf6" },
  { key: "orange", label: "Turuncu", class: "theme-orange", bg: "#f59e0b" },
  { key: "teal", label: "Teal", class: "theme-teal", bg: "#14b8a6" },
  { key: "pink", label: "Pembe", class: "theme-pink", bg: "#ec4899" },
  { key: "red", label: "Kirmizi", class: "theme-red", bg: "#ef4444" },
];

const fontOptions = [
  { key: "", label: "Varsayilan", class: "" },
  { key: "serif", label: "Serif", class: "font-serif" },
  { key: "mono", label: "Monospace", class: "font-mono" },
  { key: "arial", label: "Arial", class: "font-arial" },
  { key: "tahoma", label: "Tahoma", class: "font-tahoma" },
  { key: "verdana", label: "Verdana", class: "font-verdana" },
  { key: "georgia", label: "Georgia", class: "font-georgia" },
  { key: "trebuchet", label: "Trebuchet MS", class: "font-trebuchet" },
];

const sizeOptions = [
  { key: "small", label: "Kucuk" },
  { key: "normal", label: "Normal" },
  { key: "large", label: "Buyuk" },
  { key: "xlarge", label: "Cok Buyuk" },
];

interface ModuleSettings {
  id: string;
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

const PERSONEL_ZORUNLU_ALANLAR = [
  { key: "kimlikNo", label: "TC Kimlik No" },
  { key: "ad", label: "Ad" },
  { key: "soyad", label: "Soyad" },
  { key: "isgEgitimTarihi", label: "İSG Eğitim Tarihi (tarih + süre)" },
  { key: "yuksekteCalisma", label: "Yüksekte Çalışma (tarih + süre)" },
  { key: "myk", label: "MYK (en az bir eğitim kaydı)" },
  { key: "sertifika", label: "Sertifika (tarih + süre)" },
  { key: "operatorBelgesi", label: "Operatör Belgesi (tarih + süre)" },
  { key: "kkd", label: "KKD (tarih + süre)" },
  { key: "oryantasyon", label: "Oryantasyon (tarih + süre)" },
  { key: "saglikRaporuTarihi", label: "Sağlık Raporu (tarih + süre)" },
  { key: "adliSicil", label: "Adli Sicil (belge)" },
  { key: "gorevlendirme", label: "Görevlendirme (belge)" },
];

const TUM_ZORUNLU_ALANLAR = [
  { key: "kimlikNo", label: "TC Kimlik No" },
  { key: "ad", label: "Ad" },
  { key: "soyad", label: "Soyad" },
  { key: "sgkTarihi", label: "SGK Tarihi" },
  { key: "isgEgitimTarihi", label: "İSG Eğitim" },
  { key: "yuksekteCalisma", label: "Yüksekte Çalışma" },
  { key: "myk", label: "MYK" },
  { key: "sertifika", label: "Sertifika" },
  { key: "operatorBelgesi", label: "Operatör Belgesi" },
  { key: "kkd", label: "KKD" },
  { key: "oryantasyon", label: "Oryantasyon" },
  { key: "saglikRaporuTarihi", label: "Sağlık Raporu" },
];

const defaultModules = [
  { key: "dashboard", label: "İSG Takip", description: "Ana sayfa ve istatistikler" },
  { key: "personel", label: "Personel", description: "Personel kayıt ve listeleme" },
  { key: "myk", label: "MYK Belgeleri", description: "Mesleki yeterlilik belgeleri" },
  { key: "operator", label: "Operatör Belgeleri", description: "Operatör sertifikaları" },
  { key: "dosya", label: "Personel Dosyası", description: "Personel belgeleri" },
  { key: "talimatlar", label: "Talimat Takibi", description: "İş talimatları" },
  { key: "santiyeler", label: "Şantiyeler", description: "Şantiye yönetimi" },
  { key: "taseronlar", label: "Taşeronlar", description: "Taşeron firma takibi" },
  { key: "sorumlular", label: "Saha Sorumluları", description: "Sorumlu yönetimi" },
  { key: "ekipmanlar", label: "İş Ekipmanları", description: "Ekipman takibi" },
  { key: "kazalar", label: "İş Kazaları", description: "Kaza kaydı ve istatistik" },
  { key: "egitimler", label: "Eğitimler", description: "Eğitim takibi" },
  { key: "ihtar", label: "İhtar Tutanağı", description: "Personel ihtar ve uyarı kayıtları" },
  { key: "risk", label: "Risk Değerlendirme", description: "Tehlike tanımlama ve risk analizi" },
  { key: "yasal", label: "Yasal Uygunluk", description: "Yasal gereklilikler ve uyum takibi" },
  { key: "denetim", label: "İç Denetim", description: "Denetim planlama ve bulgu takibi" },
  { key: "acil", label: "Acil Durum", description: "Acil durum senaryoları ve tatbikat" },
  { key: "duzeltici", label: "Düzeltici Faaliyet", description: "Kök neden analizi ve CAPA" },
  { key: "ygg", label: "Yönetim Gözden Geçirme", description: "Üst yönetim değerlendirme" },
  { key: "dokuman", label: "Doküman Kontrol", description: "Doküman versiyon ve onay takibi" },
  { key: "yetkinlik", label: "Yetkinlik Matrisi", description: "Personel yetkinlik ve sertifika" },
  { key: "performans", label: "Performans İzleme", description: "İSG performans göstergeleri" },
  { key: "baglam", label: "Bağlam Analizi", description: "Kuruluş bağlamı ve ilgili taraflar (4.1/4.2)" },
  { key: "katilim", label: "İşçi Katılımı", description: "Çalışan katılımı ve danışma (5.4)" },
  { key: "hedefler", label: "OHS Hedefleri", description: "İSG hedefleri ve planlama (6.2)" },
  { key: "iletisim", label: "İletişim Kaydı", description: "İç ve dış iletişim kayıtları (7.4)" },
  { key: "politika", label: "Politika Yönetimi", description: "İSG politikası ve taahhüt belgeleri (5.1)" },
];

async function setupDatabase() {
  try {
    const { error } = await supabase.from("ayarlar").select("id").limit(1);
    if (error?.message?.includes("relation") || error?.message?.includes("does not exist")) {
      const { error: insertError } = await supabase.from("ayarlar").insert(sanitizeForm({
        key: "setup_check",
        value: "true",
        type: "system",
        description: "Database setup"
      }));
      if (insertError && !insertError.message.includes("duplicate")) {
        console.log("Database setup needed - please run SQL in Supabase");
      } else if (!insertError) {
        await logAudit("ayarlar", "INSERT", "setup_check", null, { key: "setup_check", value: "true" });
      }
    }
  } catch (e) {
    console.log("Setup check skipped");
  }
}

export default function SettingsPage() {
  const { theme, setTheme, saveTheme: saveThemeCtx } = useTheme();
  const [modules, setModules] = useState<ModuleSettings[]>([]);
  const [showModules, setShowModules] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeSaving, setThemeSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [showVersion, setShowVersion] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiEntries, setAiEntries] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [commits, setCommits] = useState<any[]>([]);
  const [commitsLoading, setCommitsLoading] = useState(false);
  const [menuItems, setMenuItems] = useState<{ key: string; label: string; grup: "main" | "ek" }[]>([]);
  const [menuSaving, setMenuSaving] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [showAddVersion, setShowAddVersion] = useState(false);
  const [newVersion, setNewVersion] = useState({ versiyon: "", tip: "minor" as string, aciklama: "", detaylar: "", yazar: "" });
  const [showUyari, setShowUyari] = useState(false);
  const [uyariAyarlari, setUyariAyarlari] = useState<Record<string, string>>({});
  const [uyariSaving, setUyariSaving] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [showEncryption, setShowEncryption] = useState(false);
  const [encryptionEnabled, setEncryptionEnabled] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupMode, setBackupMode] = useState<"full" | "partial">("full");
  const [backupTables, setBackupTables] = useState<Record<string, boolean>>({});
  const [backupIncludeFiles, setBackupIncludeFiles] = useState(true);
  const [showMykZorunlu, setShowMykZorunlu] = useState(false);
  const [mykEgitimListesi, setMykEgitimListesi] = useState<any[]>([]);
  const [mykZorunluIds, setMykZorunluIds] = useState<string[]>([]);
  const [mykZorunluSaving, setMykZorunluSaving] = useState(false);
  const [showZorunluAlanlar, setShowZorunluAlanlar] = useState(false);
  const [zorunluAlanlar, setZorunluAlanlar] = useState<string[]>(["kimlikNo", "ad", "soyad", "myk"]);
  const [zorunluAlanlarSaving, setZorunluAlanlarSaving] = useState(false);
  const [sadeceZorunlu, setSadeceZorunlu] = useState(false);
  const [taseronPersonelZorunlu, setTaseronPersonelZorunlu] = useState<string[]>([]);
  const [notModu, setNotModu] = useState<"per_personnel" | "sabit">("per_personnel");
  const [sabitNot, setSabitNot] = useState("");
  const [showNotAyarlari, setShowNotAyarlari] = useState(false);
  const [notSaving, setNotSaving] = useState(false);

  const [showTaseronZorunlu, setShowTaseronZorunlu] = useState(false);
  const [taseronZorunluSaving, setTaseronZorunluSaving] = useState(false);

  const [showHatList, setShowHatList] = useState(false);
  const [hatList, setHatList] = useState<string[]>([]);
  const [hatListSaving, setHatListSaving] = useState(false);
  const [hatNew, setHatNew] = useState("");

  const ALL_TABLES: { key: string; label: string; grup: "kritik" | "modul" | "diger" }[] = [
    { key: "personel", label: "Personel", grup: "kritik" },
    { key: "personel_belgeleri", label: "Personel Belgeleri", grup: "kritik" },
    { key: "personel_myk_egitimleri", label: "MYK Eğitim Kayıtları", grup: "kritik" },
    { key: "myk_egitim_listesi", label: "MYK Eğitim Listesi", grup: "kritik" },
    { key: "ayarlar", label: "Ayarlar", grup: "kritik" },
    { key: "audit_log", label: "Denetim Günlüğü", grup: "kritik" },
    { key: "versiyonlar", label: "Sürümler", grup: "kritik" },
    { key: "kvkk_consents", label: "KVKK Onayları", grup: "kritik" },
    { key: "operator_belgeri", label: "Operatör Belgeleri", grup: "kritik" },
    { key: "is_kazalari", label: "İş Kazaları", grup: "kritik" },
    { key: "ihtar_tutanagi", label: "İhtar Tutanakları", grup: "kritik" },
    { key: "ihtar_dosyalari", label: "İhtar Dosyaları", grup: "kritik" },
    { key: "santiyeler", label: "Şantiyeler", grup: "diger" },
    { key: "taseronlar", label: "Taşeronlar", grup: "diger" },
    { key: "saha_sorumlulari", label: "Saha Sorumluları", grup: "diger" },
    { key: "is_ekipmanlari", label: "İş Ekipmanları", grup: "diger" },
    { key: "egitimler", label: "Eğitimler", grup: "diger" },
    { key: "talimatlar", label: "Talimatlar", grup: "diger" },
    { key: "personel_dosyasi", label: "Personel Dosyası", grup: "diger" },
    { key: "notlar", label: "Notlar", grup: "diger" },
    { key: "myk_belgeri", label: "MYK Belgeleri (Legacy)", grup: "diger" },
    { key: "risk_degerlendirme", label: "Risk Değerlendirme", grup: "modul" },
    { key: "yasal_uygunluk", label: "Yasal Uygunluk", grup: "modul" },
    { key: "ic_denetim", label: "İç Denetim", grup: "modul" },
    { key: "denetim_bulgulari", label: "Denetim Bulguları", grup: "modul" },
    { key: "acil_durum", label: "Acil Durum", grup: "modul" },
    { key: "duzeltici_faaliyet", label: "Düzeltici Faaliyet", grup: "modul" },
    { key: "yonetim_gozden_gecirme", label: "YGG", grup: "modul" },
    { key: "dokuman_kontrol", label: "Doküman Kontrol", grup: "modul" },
    { key: "yetkinlik_matrisi", label: "Yetkinlik Matrisi", grup: "modul" },
    { key: "performans_izleme", label: "Performans İzleme", grup: "modul" },
    { key: "baglam_analizi", label: "Bağlam Analizi", grup: "modul" },
    { key: "isci_katilimi", label: "İşçi Katılımı", grup: "modul" },
    { key: "ohs_hedefleri", label: "OHS Hedefleri", grup: "modul" },
    { key: "iletisim_kaydi", label: "İletişim Kaydı", grup: "modul" },
    { key: "politika_yonetimi", label: "Politika Yönetimi", grup: "modul" },
  ];

  useEffect(() => {
    setupDatabase();
    fetchSettings();
    fetchVersions();
    fetchCommits();
    fetchMenuOrder();
    fetchAIEntries();
    fetchUyariAyarlari();
      fetchMykZorunlu();
      fetchZorunluAlanlar();
      fetchTaseronData();
      fetchNotAyarlari();
  }, []);

  const fetchUyariAyarlari = async () => {
    const { data } = await supabase.from("ayarlar").select("*").eq("type", "egitim_uyari");
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((d: any) => { map[d.key] = d.value; });
      setUyariAyarlari(map);
    }
  };

  const fetchVersions = async () => {
    const { data } = await supabase.from("versiyonlar").select("*").order("tarih", { ascending: false });
    if (data) setVersions(data);
  };

  const fetchCommits = async () => {
    setCommitsLoading(true);
    try {
      const res = await fetch("/api/commits");
      const data = await res.json();
      if (Array.isArray(data)) setCommits(data);
    } catch (err) {
      console.error("Failed to fetch commits:", err);
    }
    setCommitsLoading(false);
  };

  const allMenuLabels: Record<string, string> = {
    dashboard: "ISG Takip", personel: "Personel", myk: "MYK", operator: "Operator",
    dosya: "Dosya", talimatlar: "Talimat Takibi", santiyeler: "Santiyeler",
    taseronlar: "Taseronlar", sorumlular: "Sorumlular", ekipmanlar: "Ekipmanlar",
    kazalar: "Is Kazalari", egitimler: "Egitimler", ihtar: "Ihtar Tutanagi",
    risk: "Risk Degerlendirme", yasal: "Yasal Uygunluk", denetim: "Ic Denetim",
    acil: "Acil Durum", duzeltici: "Duzeltici Faaliyet", ygg: "Yonetim Gozden Gecirme",
    dokuman: "Dokuman Kontrol", yetkinlik: "Yetkinlik Matrisi", performans: "Performans Izleme",
    baglam: "Baglam Analizi", katilim: "Isci Katilimi", hedefler: "OHS Hedefleri", iletisim: "Iletisim Kaydi", politika: "Politika Yonetimi",
  };

  const fetchMenuOrder = async () => {
    const { data } = await supabase.from("ayarlar").select("key, value").in("key", ["menu_order_main", "menu_order_ek"]);
    if (!data) return;
    const allItems: { key: string; label: string; grup: "main" | "ek" }[] = [];
    for (const d of data) {
      try {
        const keys = JSON.parse(d.value);
        const grup = d.key === "menu_order_main" ? "main" : "ek";
        keys.forEach((k: string) => {
          if (allMenuLabels[k]) allItems.push({ key: k, label: allMenuLabels[k], grup });
        });
      } catch {}
    }
    setMenuItems(allItems);
  };

  const saveMenuOrder = async () => {
    setMenuSaving(true);
    setStatus(null);
    try {
      const mainKeys = menuItems.filter(i => i.grup === "main").map(i => i.key);
      const ekKeys = menuItems.filter(i => i.grup === "ek").map(i => i.key);
      await supabase.from("ayarlar").upsert({ key: "menu_order_main", value: JSON.stringify(mainKeys), type: "menu_order" }, { onConflict: "key" });
      await supabase.from("ayarlar").upsert({ key: "menu_order_ek", value: JSON.stringify(ekKeys), type: "menu_order" }, { onConflict: "key" });
      await logAudit("ayarlar", "INSERT", "menu_order", null, { main: mainKeys, ek: ekKeys });
      setStatus({ type: "success", message: "Menü sırası kaydedildi!" });
    } catch (e: any) {
      setStatus({ type: "error", message: e.message || "Menü sırası kaydedilemedi" });
    } finally {
      setMenuSaving(false);
    }
  };

  const fetchMykZorunlu = async () => {
    const [egitimRes, ayarRes] = await Promise.all([
      supabase.from("myk_egitim_listesi").select("id, ad").eq("aktif", true).order("ad", { ascending: true }),
      supabase.from("ayarlar").select("value").eq("key", "myk_zorunlu_ids").single(),
    ]);
    if (egitimRes.data) setMykEgitimListesi(egitimRes.data);
    if (ayarRes.data?.value) {
      try { setMykZorunluIds(JSON.parse(ayarRes.data.value)); } catch { setMykZorunluIds([]); }
    }
  };

  const fetchZorunluAlanlar = async () => {
    const { data } = await supabase.from("ayarlar").select("value").eq("key", "personel_zorunlu_alanalar").single();
    if (data?.value) {
      try { setZorunluAlanlar(JSON.parse(data.value)); } catch { setZorunluAlanlar(["kimlikNo", "ad", "soyad", "myk"]); }
    }
    const { data: sadeceData } = await supabase.from("ayarlar").select("value").eq("key", "personel_sadece_zorunlu").single();
    if (sadeceData?.value) {
      try { setSadeceZorunlu(JSON.parse(sadeceData.value) === true); } catch {}
    }
  };

  const fetchTaseronData = async () => {
    const { data } = await supabase.from("ayarlar").select("value").eq("key", "taseron_personel_zorunlu_alanlar").single();
    if (data?.value) {
      try { const v = JSON.parse(data.value); if (Array.isArray(v)) setTaseronPersonelZorunlu(v); } catch {}
    }
  };

  const toggleTaseronPersonelZorunlu = (alanKey: string) => {
    setTaseronPersonelZorunlu(prev => prev.includes(alanKey) ? prev.filter(k => k !== alanKey) : [...prev, alanKey]);
  };

  const fetchNotAyarlari = async () => {
    const { data: moduData } = await supabase.from("ayarlar").select("value").eq("key", "personel_not_modu").single();
    if (moduData?.value) {
      try { const v = JSON.parse(moduData.value); if (v === "per_personnel" || v === "sabit") setNotModu(v); } catch {}
    }
    const { data: sabitData } = await supabase.from("ayarlar").select("value").eq("key", "personel_sabit_not").single();
    if (sabitData?.value) {
      try { setSabitNot(JSON.parse(sabitData.value)); } catch {}
    }
  };

  const saveNotAyarlari = async () => {
    setNotSaving(true);
    setStatus(null);
    try {
      await supabase.from("ayarlar").upsert({ key: "personel_not_modu", value: JSON.stringify(notModu), type: "personel", description: "Personel not modu (per_personnel/sabit)" }, { onConflict: "key" });
      await supabase.from("ayarlar").upsert({ key: "personel_sabit_not", value: JSON.stringify(sabitNot), type: "personel", description: "Personel sabit not içeriği" }, { onConflict: "key" });
      await logAudit("ayarlar", "INSERT", "personel_not_ayarlari", null, { mod: notModu, sabitNot });
      setStatus({ type: "success", message: "Not ayarları kaydedildi!" });
    } catch (e: any) {
      setStatus({ type: "error", message: e.message || "Not ayarları kaydedilemedi" });
    } finally {
      setNotSaving(false);
    }
    setTimeout(() => setStatus(null), 2000);
  };

  const toggleMykZorunlu = (id: string) => {
    setMykZorunluIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleZorunluAlan = (key: string) => {
    setZorunluAlanlar(prev => prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]);
  };

  const saveZorunluAlanlar = async () => {
    setZorunluAlanlarSaving(true);
    setStatus(null);
    try {
      await supabase.from("ayarlar").upsert({ key: "personel_zorunlu_alanalar", value: JSON.stringify(zorunluAlanlar), type: "personel", description: "Personel kaydında zorunlu alanlar" }, { onConflict: "key" });
      await logAudit("ayarlar", "INSERT", "personel_zorunlu_alanalar", null, zorunluAlanlar);
      setStatus({ type: "success", message: "Zorunlu alanlar kaydedildi!" });
    } catch (e: any) {
      setStatus({ type: "error", message: e.message || "Zorunlu alanlar kaydedilemedi" });
    } finally {
      setZorunluAlanlarSaving(false);
    }
  };

  const saveSadeceZorunlu = async () => {
    setStatus(null);
    try {
      await supabase.from("ayarlar").upsert({ key: "personel_sadece_zorunlu", value: JSON.stringify(sadeceZorunlu), type: "personel", description: "Personel kaydında sadece zorunlu alanları göster" }, { onConflict: "key" });
      await logAudit("ayarlar", "UPDATE", "personel_sadece_zorunlu", null, { deger: sadeceZorunlu });
      setStatus({ type: "success", message: "Görünüm ayarı kaydedildi!" });
    } catch (e: any) {
      setStatus({ type: "error", message: e.message || "Görünüm ayarı kaydedilemedi" });
    }
    setTimeout(() => setStatus(null), 2000);
  };

  const saveTaseronPersonelZorunlu = async () => {
    setTaseronZorunluSaving(true);
    setStatus(null);
    try {
      await supabase.from("ayarlar").upsert({ key: "taseron_personel_zorunlu_alanlar", value: JSON.stringify(taseronPersonelZorunlu), type: "personel", description: "Taşeron personeli için zorunlu alanlar" }, { onConflict: "key" });
      await logAudit("ayarlar", "INSERT", "taseron_personel_zorunlu_alanlar", null, taseronPersonelZorunlu);
      setStatus({ type: "success", message: "Taşeron personel zorunlu alanlar kaydedildi!" });
    } catch (e: any) {
      setStatus({ type: "error", message: e.message || "Taşeron zorunlu alanlar kaydedilemedi" });
    } finally {
      setTaseronZorunluSaving(false);
    }
  };

  const saveHatList = async () => {
    setHatListSaving(true);
    setStatus(null);
    try {
      const valid = hatList.filter(h => h.trim());
      await supabase.from("ayarlar").upsert({ key: "hat_listesi", value: JSON.stringify(valid), type: "system", description: "Telefon hat operatörleri listesi" }, { onConflict: "key" });
      await logAudit("ayarlar", "INSERT", "hat_listesi", null, valid);
      setStatus({ type: "success", message: "Hat listesi kaydedildi!" });
    } catch (e: any) {
      setStatus({ type: "error", message: e.message || "Hat listesi kaydedilemedi" });
    } finally {
      setHatListSaving(false);
    }
  };

  const saveMykZorunlu = async () => {
    setMykZorunluSaving(true);
    setStatus(null);
    try {
      await supabase.from("ayarlar").upsert({ key: "myk_zorunlu_ids", value: JSON.stringify(mykZorunluIds), type: "myk_zorunlu", description: "Zorunlu MYK meslekleri" }, { onConflict: "key" });
      await logAudit("ayarlar", "INSERT", "myk_zorunlu_ids", null, mykZorunluIds);
      setStatus({ type: "success", message: "Zorunlu meslekler kaydedildi!" });
    } catch (e: any) {
      setStatus({ type: "error", message: e.message || "Zorunlu meslekler kaydedilemedi" });
    } finally {
      setMykZorunluSaving(false);
    }
  };

  const fetchAIEntries = async () => {
    const { data } = await supabase.from("ayarlar").select("value").eq("key", "ai_entries").single();
    if (data?.value) {
      try { setAiEntries(JSON.parse(data.value)); } catch { setAiEntries([]); }
    }
  };

  const startBackup = async () => {
    setBackupLoading(true);
    setStatus(null);
    try {
      const tables = backupMode === "full"
        ? ALL_TABLES.map(t => t.key)
        : Object.entries(backupTables).filter(([, v]) => v).map(([k]) => k);
      if (tables.length === 0) { setStatus({ type: "error", message: "En az bir tablo seçin" }); setBackupLoading(false); return; }
      const res = await fetchWithCsrf("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tables, includeFiles: backupIncludeFiles, mod: backupMode }),
      });
      if (!res.ok) { setStatus({ type: "error", message: "Yedekleme başarısız" }); setBackupLoading(false); return; }
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `isgapp_yedek_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus({ type: "success", message: `Yedekleme tamam: ${data.metadata.tablo_sayisi} tablo, ${data.metadata.toplam_kayit} kayıt` });
    } catch { setStatus({ type: "error", message: "Yedekleme sırasında hata oluştu" }); }
    setBackupLoading(false);
  };

  const fetchSettings = async () => {
    try {
      const { data } = await supabase.from("ayarlar").select("*").eq("type", "module");
      
      if (data && data.length > 0) {
        const savedModules = defaultModules.map(def => {
          const saved = data.find((d: any) => d.key === def.key);
          return {
            id: saved?.id || "",
            key: def.key,
            label: def.label,
            description: def.description,
            enabled: saved?.value === "true",
          };
        });
        setModules(savedModules);
      } else {
        const newModules = defaultModules.map(def => ({
          id: "",
          key: def.key,
          label: def.label,
          description: def.description,
          enabled: true,
        }));
        setModules(newModules);
        
        for (const mod of newModules) {
          await supabase.from("ayarlar").insert(sanitizeForm({
            key: mod.key,
            value: "true",
            type: "module",
            description: mod.description,
          }));
        }
      }
    } catch (e: any) {
      setStatus({ type: "info", message: "Ayarlar tablosu henüz yok. Lütfen Supabase SQL'de ayarları oluşturun." });
    }
    setLoading(false);
  };

  const toggleModule = (key: string) => {
    setModules(prev => prev.map(m => 
      m.key === key ? { ...m, enabled: !m.enabled } : m
    ));
  };

  const saveSettings = async () => {
    setSaving(true);
    setStatus(null);

    try {
      for (const mod of modules) {
        if (mod.id) {
          await supabase.from("ayarlar").update(sanitizeForm({ value: mod.enabled.toString() })).eq("id", mod.id);
        } else {
          await supabase.from("ayarlar").insert(sanitizeForm({
            key: mod.key,
            value: mod.enabled.toString(),
            type: "module",
            description: mod.description,
          }));
        }
      }
      
      localStorage.setItem("isg_modules", JSON.stringify(
        modules.reduce((acc, m) => ({ ...acc, [m.key]: m.enabled }), {})
      ));
      
      await logAudit("ayarlar", "UPDATE", "modules", null, modules.map(m => ({ key: m.key, enabled: m.enabled })));
      setStatus({ type: "success", message: "Ayarlar kaydedildi!" });
    } catch (err: any) {
      setStatus({ type: "error", message: "Hata: " + err.message });
    } finally {
      setSaving(false);
    }
  };

  const saveTheme = async () => {
    setThemeSaving(true);
    setStatus(null);
    try {
      await saveThemeCtx(theme);
      await logAudit("ayarlar", "UPDATE", "theme", null, theme);
      setStatus({ type: "success", message: "Tema kaydedildi!" });
    } catch (e: any) {
      setStatus({ type: "error", message: e.message || "Tema kaydedilemedi" });
    } finally {
      setThemeSaving(false);
    }
  };

  const saveUyari = async () => {
    setUyariSaving(true);
    setStatus(null);
    try {
      for (const field of EGITIM_FIELDS) {
        const val = uyariAyarlari[field.ayarKey];
        if (val) {
          await supabase.from("ayarlar").upsert(sanitizeForm({ key: field.ayarKey, value: val, type: "egitim_uyari", description: field.label + " - bitiş uyarı günü" }), { onConflict: "key" });
        }
      }
      await logAudit("ayarlar", "INSERT", "egitim_uyari", null, uyariAyarlari);
      setStatus({ type: "success", message: "Uyarı süreleri kaydedildi!" });
    } catch (e: any) {
      setStatus({ type: "error", message: e.message || "Uyarı süreleri kaydedilemedi" });
    } finally {
      setUyariSaving(false);
    }
  };

  const saveVersion = async () => {
    if (!newVersion.versiyon || !newVersion.aciklama) return;
    setStatus(null);
    try {
      const payload = sanitizeForm({
        ...newVersion,
        tarih: new Date().toISOString().split("T")[0],
        detaylar: newVersion.detaylar ? newVersion.detaylar.split("\n").filter((d: string) => d.trim()) : [],
      });
      await supabase.from("versiyonlar").insert(payload);
      await logAudit("versiyonlar", "INSERT", payload.versiyon, null, payload);
      setShowAddVersion(false);
      setNewVersion({ versiyon: "", tip: "minor", aciklama: "", detaylar: "", yazar: "" });
      fetchVersions();
      setStatus({ type: "success", message: "Yeni sürüm kaydedildi!" });
    } catch (e: any) {
      setStatus({ type: "error", message: e.message || "Sürüm kaydedilemedi" });
    }
  };

  if (loading) return <div className="flex-1 p-8 flex items-center justify-center text-gray-400">Yükleniyor...</div>;

  return (
    <div className="flex-1 p-8 app-bg min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
            <Settings className="w-6 h-6 text-gray-600" />
          </div>
          <div>
              <h2 className="text-2xl font-semibold text-gray-800">Ayarlar</h2>
          </div>
        </div>

        {status && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            status.type === "success" ? "bg-green-50 text-green-700 border border-green-100" : 
            status.type === "info" ? "bg-blue-50 text-blue-700 border border-blue-100" :
            "bg-red-50 text-red-700 border border-red-100"
          }`}>
            {status.type === "success" ? <CheckCircle className="w-5 h-5" /> : 
             status.type === "info" ? <AlertTriangle className="w-5 h-5" /> :
             <AlertCircle className="w-5 h-5" />}
            <span>{status.message}</span>
          </div>
        )}

        <div className="card p-6">
          <button
            onClick={() => setShowModules(!showModules)}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-800">Modül Ayarları</h3>
              <p className="text-sm text-gray-500">Hangi modüller aktif olsun</p>
            </div>
            <div className="flex items-center gap-3">
              {showModules && (
                <button onClick={(e) => { e.stopPropagation(); saveSettings(); }} disabled={saving} className="btn btn-primary text-sm">
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              )}
              {showModules ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
            </div>
          </button>

          {showModules && (
            <div className="space-y-3">
              {modules.map((mod) => (
                <div key={mod.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{mod.label}</p>
                    <p className="text-sm text-gray-500">{mod.description}</p>
                  </div>
                  <button
                    onClick={() => toggleModule(mod.key)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${mod.enabled ? "bg-green-500" : "bg-gray-300"}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${mod.enabled ? "left-7" : "left-1"}`} />
                  </button>
                </div>
              ))}
              <div className="flex justify-end pt-2">
                <button onClick={saveSettings} disabled={saving} className="btn btn-primary text-sm">
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="card p-6 mt-6">
          <button
            onClick={() => setShowTheme(!showTheme)}
            className="w-full flex items-center justify-between"
          >
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-800">Tema</h3>
              <p className="text-sm text-gray-500">Görünüm ve renk ayarları</p>
            </div>
            <div className="flex items-center gap-3">
              {showTheme && (
                <button onClick={(e) => { e.stopPropagation(); saveTheme(); }} disabled={themeSaving} className="btn btn-primary text-sm">
                  {themeSaving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              )}
              {showTheme ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
            </div>
          </button>

          {showTheme && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {theme.mode === "dark" ? <Moon className="w-5 h-5 text-gray-600" /> : <Sun className="w-5 h-5 text-gray-600" />}
                  <div>
                    <p className="font-medium text-gray-800">Tema Modu</p>
                    <p className="text-sm text-gray-500">{theme.mode === "dark" ? "Koyu tema" : "Acik tema"}</p>
                  </div>
                </div>
                <button
                  onClick={() => setTheme({ ...theme, mode: theme.mode === "dark" ? "light" : "dark" })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${theme.mode === "dark" ? "bg-gray-700" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${theme.mode === "dark" ? "left-7" : "left-1"}`} />
                </button>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Palette className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-800">Renk</p>
                    <p className="text-sm text-gray-500">Vurgu rengini seç</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map((c) => (
                    <button
                      key={c.key || "default"}
                      onClick={() => setTheme({ ...theme, color: c.key })}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${theme.color === c.key ? "border-gray-800 scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c.bg }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-800 mb-2">Yazi Tipi</p>
                <select
                  value={theme.font}
                  onChange={(e) => setTheme({ ...theme, font: e.target.value })}
                  className="input"
                >
                  {fontOptions.map((f) => (
                    <option key={f.key || "default"} value={f.key}>{f.label}</option>
                  ))}
                </select>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-800 mb-2">Yazi Boyutu</p>
                <div className="flex gap-2">
                  {sizeOptions.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setTheme({ ...theme, size: s.key })}
                      className={`px-4 py-2 rounded-lg text-sm transition-all ${
                        theme.size === s.key
                          ? "bg-gray-800 text-white"
                          : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="card p-6 mt-6">
          <button
            onClick={() => setShowUyari(!showUyari)}
            className="w-full flex items-center justify-between"
          >
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-800">Uyarı Süreleri</h3>
              <p className="text-sm text-gray-500">Her ISG eğitimi için bitiş uyarı süresi (gün)</p>
            </div>
            <div className="flex items-center gap-3">
              {showUyari && (
                <button onClick={(e) => { e.stopPropagation(); saveUyari(); }} disabled={uyariSaving} className="btn btn-primary text-sm">
                  {uyariSaving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              )}
              {showUyari ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
            </div>
          </button>

          {showUyari && (
            <div className="space-y-3 mt-4">
              {EGITIM_FIELDS.map((field) => (
                <div key={field.ayarKey} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-800">{field.label}</p>
                      <p className="text-xs text-gray-400">{field.ayarKey}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" min={1} max={365} value={uyariAyarlari[field.ayarKey] || "7"} onChange={(e) => setUyariAyarlari((prev) => ({ ...prev, [field.ayarKey]: e.target.value }))} className="input text-xs text-center" style={{ width: "4rem" }} />
                    <span className="text-xs text-gray-500">gün</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6 mt-6">
          <button onClick={() => setShowMenu(!showMenu)} className="w-full flex items-center justify-between">
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-800">Menü Düzenle</h3>
              <p className="text-sm text-gray-500">Sol menü öğelerini sürükleyip sıralayın</p>
            </div>
            {showMenu ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
          </button>
          {showMenu && (
            <div className="mt-4">
              <div className="space-y-1">
                {menuItems.map((item, idx) => (
                  <div key={item.key}
                    draggable
                    onDragStart={() => setDragIdx(idx)}
                    onDragOver={(e) => { e.preventDefault(); if (dragIdx === null || dragIdx === idx) return; const items = [...menuItems]; const [moved] = items.splice(dragIdx, 1); items.splice(idx, 0, moved); setMenuItems(items); setDragIdx(idx); }}
                    onDragEnd={() => setDragIdx(null)}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-grab active:cursor-grabbing transition-colors ${item.grup === "main" ? "bg-white border-gray-200" : "bg-gray-50 border-gray-100"} ${dragIdx === idx ? "opacity-50" : ""}`}
                  >
                    <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    <span className="text-xs px-1.5 py-0.5 rounded font-medium uppercase tracking-wider text-gray-400 flex-shrink-0">{item.grup === "main" ? "Ana" : "Ek"}</span>
                    <span className="text-sm text-gray-700 flex-1">{item.label}</span>
                    <span className="text-[10px] text-gray-300 font-mono">{item.key}</span>
                  </div>
                ))}
              </div>
              {menuItems.length === 0 && <p className="text-center py-6 text-gray-400">Menü bilgisi yüklenmedi</p>}
              <div className="flex justify-end mt-4">
                <button onClick={saveMenuOrder} disabled={menuSaving} className="btn btn-primary text-sm flex items-center gap-2">
                  <Save className="w-4 h-4" /> {menuSaving ? "Kaydediliyor..." : "Sırayı Kaydet"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="card p-6 mt-6">
          <button onClick={() => setShowAI(!showAI)} className="w-full flex items-center justify-between">
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-800">Yapay Zeka Entegrasyonları</h3>
              <p className="text-sm text-gray-500">Projeye katkı sağlayan YZ sistemleri</p>
            </div>
            {showAI ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
          </button>
          {showAI && (
            <div className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {aiEntries.map((ai: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 bg-white">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center flex-shrink-0 border border-blue-100">
                      {idx % 2 === 0 ? <Brain className="w-5 h-5 text-indigo-500" /> : <Cpu className="w-5 h-5 text-blue-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-800 text-sm">{ai.name}</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-mono">{ai.model}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{ai.role}</p>
                      {ai.url && (
                        <a href={ai.url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 mt-1.5">
                          <ExternalLink className="w-3 h-3" /> {new URL(ai.url).hostname}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {aiEntries.length === 0 && <p className="text-center py-6 text-gray-400">AI kaydı bulunamadı</p>}
            </div>
          )}
        </div>

        <div className="card p-6 mt-6">
          <button onClick={() => setShowEncryption(!showEncryption)} className="w-full flex items-center justify-between">
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-800">Alan Bazinda Sifreleme</h3>
              <p className="text-sm text-gray-500">Hassas veri alanlari icin AES-256-GCM sifreleme</p>
            </div>
            {showEncryption ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
          </button>
          {showEncryption && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-800">Alan Bazinda Sifreleme</p>
                  <p className="text-xs text-gray-500 mt-0.5">Aktif edildiginde TC Kimlik No, telefon gibi hassas alanlar sifrelenir</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={encryptionEnabled} onChange={(e) => setEncryptionEnabled(e.target.checked)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600 peer-focus:ring-2 peer-focus:ring-indigo-300 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>
              {encryptionEnabled && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-xs text-amber-700">
                    <strong>Uyari:</strong> Sifreleme aktif edildiginde, sifrelenmis alanlarda arama ve siralama fonksiyonlari calismaz.
                    Anahtar kaybi durumunda veriler kurtarilamaz. Uretim ortamina gecmeden once yedekleme yapin.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card p-6 mt-6">
          <button onClick={() => setShowBackup(!showBackup)} className="w-full flex items-center justify-between">
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-800">Yedekleme</h3>
              <p className="text-sm text-gray-500">Veritabani ve dosya yedekleme</p>
            </div>
            {showBackup ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
          </button>
          {showBackup && (
            <div className="mt-4">
              <div className="flex gap-3 mb-4">
                <button onClick={() => { setBackupMode("full"); setBackupTables({}); }}
                  className={`flex-1 p-4 rounded-xl border-2 text-left transition-colors ${backupMode === "full" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <HardDrive className="w-5 h-5 text-blue-500 mb-1" />
                  <p className="font-medium text-gray-800 text-sm">Tam Yedekleme</p>
                  <p className="text-xs text-gray-500 mt-0.5">Tüm tablolar + dosyalar</p>
                </button>
                <button onClick={() => setBackupMode("partial")}
                  className={`flex-1 p-4 rounded-xl border-2 text-left transition-colors ${backupMode === "partial" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <Database className="w-5 h-5 text-green-500 mb-1" />
                  <p className="font-medium text-gray-800 text-sm">Kısmi Yedekleme</p>
                  <p className="text-xs text-gray-500 mt-0.5">Seçili tablo ve alanlar</p>
                </button>
              </div>

              {backupMode === "partial" && (
                <div className="mb-4 space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-xl p-3">
                  {(["kritik", "modul", "diger"] as const).map(grup => (
                    <div key={grup}>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1 mt-2 first:mt-0">
                        {grup === "kritik" ? "Ana Tablolar" : grup === "modul" ? "ISO 45001 Modülleri" : "Diğer"}
                      </p>
                      {ALL_TABLES.filter(t => t.grup === grup).map(t => (
                        <label key={t.key} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-50 cursor-pointer">
                          <input type="checkbox" checked={backupTables[t.key] ?? true} onChange={e => setBackupTables(p => ({ ...p, [t.key]: e.target.checked }))} className="rounded border-gray-300" />
                          <span className="text-sm text-gray-700">{t.label}</span>
                          <span className="text-[10px] text-gray-300 font-mono ml-auto">{t.key}</span>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {backupMode === "full" && (
                <label className="flex items-center gap-2 mb-4 px-1">
                  <input type="checkbox" checked={backupIncludeFiles} onChange={e => setBackupIncludeFiles(e.target.checked)} className="rounded border-gray-300" />
                  <span className="text-sm text-gray-700">Dosya referanslarını (imzalı URL'ler) dahil et</span>
                </label>
              )}

              <div className="flex items-center gap-3">
                <button onClick={startBackup} disabled={backupLoading} className="btn btn-primary text-sm flex items-center gap-2">
                  {backupLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {backupLoading ? "Yedekleniyor..." : backupMode === "full" ? "Tam Yedekleme Al" : "Seçili Tabloları Yedekle"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="card p-6 mt-6">
          <button
            onClick={() => setShowMykZorunlu(!showMykZorunlu)}
            className="w-full flex items-center justify-between"
          >
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-800">MYK Zorunlu Meslekler</h3>
              <p className="text-sm text-gray-500">Personel kaydında üstte gösterilecek zorunlu MYK mesleklerini seçin</p>
            </div>
            <div className="flex items-center gap-3">
              {showMykZorunlu && (
                <button onClick={(e) => { e.stopPropagation(); saveMykZorunlu(); }} disabled={mykZorunluSaving} className="btn btn-primary text-sm">
                  {mykZorunluSaving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              )}
              {showMykZorunlu ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
            </div>
          </button>

          {showMykZorunlu && (
            <div className="mt-4 space-y-1 max-h-72 overflow-y-auto">
              {mykEgitimListesi.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">MYK eğitim listesi yüklenmedi</p>
              ) : (
                mykEgitimListesi.map((eg) => (
                  <label key={eg.id} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={mykZorunluIds.includes(eg.id)} onChange={() => toggleMykZorunlu(eg.id)} className="rounded border-gray-300" />
                    <span className="text-sm text-gray-700">{eg.ad}</span>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        <div className="card p-6 mt-6">
          <button
            onClick={() => setShowZorunluAlanlar(!showZorunluAlanlar)}
            className="w-full flex items-center justify-between"
          >
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-800">Personel Kayıt Zorunlu Alanlar</h3>
              <p className="text-sm text-gray-500">Personel kayıt formunda hangi alanların zorunlu olduğunu seçin</p>
            </div>
            <div className="flex items-center gap-3">
              {showZorunluAlanlar && (
                <button onClick={(e) => { e.stopPropagation(); saveZorunluAlanlar(); }} disabled={zorunluAlanlarSaving} className="btn btn-primary text-sm">
                  {zorunluAlanlarSaving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              )}
              {showZorunluAlanlar ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
            </div>
          </button>

          {showZorunluAlanlar && (
            <div className="mt-4 space-y-1">
              <div className="flex items-center justify-between py-2 px-2 mb-2 bg-gray-50 rounded">
                <div>
                  <p className="text-sm font-medium text-gray-700">Sadece zorunlu alanları göster</p>
                  <p className="text-xs text-gray-400">Personel kayıt formunda zorunlu olmayan alanlar gizlenir</p>
                </div>
                <button
                  onClick={async () => {
                    const val = !sadeceZorunlu;
                    setSadeceZorunlu(val);
                    await supabase.from("ayarlar").upsert({ key: "personel_sadece_zorunlu", value: JSON.stringify(val), type: "personel", description: "Personel kaydında sadece zorunlu alanları göster" }, { onConflict: "key" });
                    await logAudit("ayarlar", "UPDATE", "personel_sadece_zorunlu", null, { deger: val });
                  }}
                  className={`relative w-10 h-5 rounded-full transition-colors ${sadeceZorunlu ? "bg-blue-600" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${sadeceZorunlu ? "translate-x-5" : ""}`} />
                </button>
              </div>
              {PERSONEL_ZORUNLU_ALANLAR.map((alan) => (
                <label key={alan.key} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" checked={zorunluAlanlar.includes(alan.key)} onChange={() => toggleZorunluAlan(alan.key)} className="rounded border-gray-300" />
                  <span className="text-sm text-gray-700">{alan.label}</span>
                </label>
              ))}
              <div className="flex justify-end pt-2">
                <button onClick={saveZorunluAlanlar} disabled={zorunluAlanlarSaving} className="btn btn-primary text-sm">
                  {zorunluAlanlarSaving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Taşeron Personeli Zorunlu Alanlar */}
        <div className="card p-6 mt-6">
          <button
            onClick={() => setShowTaseronZorunlu(!showTaseronZorunlu)}
            className="w-full flex items-center justify-between"
          >
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-800">Taşeron Personeli Zorunlu Alanlar</h3>
              <p className="text-sm text-gray-500">Taşerona bağlı personel için geçerli zorunlu alanlar</p>
            </div>
            <div className="flex items-center gap-3">
              {showTaseronZorunlu && (
                <button onClick={(e) => { e.stopPropagation(); saveTaseronPersonelZorunlu(); }} disabled={taseronZorunluSaving} className="btn btn-primary text-sm">
                  {taseronZorunluSaving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              )}
              {showTaseronZorunlu ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
            </div>
          </button>

          {showTaseronZorunlu && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-3">Taşeron seçili personelde bu alanlar zorunlu olur. Boş bırakılırsa genel ayarlar kullanılır.</p>
              <div className="space-y-1">
                {PERSONEL_ZORUNLU_ALANLAR.map((alan) => (
                  <label key={alan.key} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={taseronPersonelZorunlu.includes(alan.key)} onChange={() => toggleTaseronPersonelZorunlu(alan.key)} className="rounded border-gray-300" />
                    <span className="text-sm text-gray-700">{alan.label}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-end pt-2">
                <button onClick={saveTaseronPersonelZorunlu} disabled={taseronZorunluSaving} className="btn btn-primary text-sm">
                  {taseronZorunluSaving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Personel Not Ayarları */}
        <div className="card p-6 mt-6">
          <button onClick={() => setShowNotAyarlari(!showNotAyarlari)} className="w-full flex items-center justify-between">
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-800">Personel Not Ayarları</h3>
              <p className="text-sm text-gray-500">Personel formundaki not alanının davranışını belirleyin</p>
            </div>
            <div className="flex items-center gap-3">
              {showNotAyarlari && (
                <button onClick={(e) => { e.stopPropagation(); saveNotAyarlari(); }} disabled={notSaving} className="btn btn-primary text-sm">
                  {notSaving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              )}
              {showNotAyarlari ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
            </div>
          </button>

          {showNotAyarlari && (
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-3 py-2 px-3 rounded border cursor-pointer">
                  <input type="radio" name="notModu" checked={notModu === "per_personnel"} onChange={() => setNotModu("per_personnel")} className="accent-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Personele Özel</p>
                    <p className="text-xs text-gray-400">Her personel için ayrı not girilebilir (mevcut davranış)</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 py-2 px-3 rounded border cursor-pointer">
                  <input type="radio" name="notModu" checked={notModu === "sabit"} onChange={() => setNotModu("sabit")} className="accent-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Sabit Not</p>
                    <p className="text-xs text-gray-400">Tüm personel kayıtlarında aynı not içeriği kullanılır</p>
                  </div>
                </label>
              </div>

              {notModu === "sabit" && (
                <div>
                  <label className="text-sm text-gray-600 mb-1.5 block">Sabit Not İçeriği</label>
                  <textarea value={sabitNot} onChange={(e) => setSabitNot(e.target.value)} className="input h-24 resize-none" placeholder="Tüm personel kayıtlarında gösterilecek not içeriği..." />
                  <p className="text-xs text-gray-400 mt-1">Personel eklerken bu not otomatik doldurulur, istenirse değiştirilebilir.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hat Listesi */}
        <div className="card p-6 mt-6">
          <button onClick={() => setShowHatList(!showHatList)} className="w-full flex items-center justify-between">
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-800">Hat Listesi</h3>
              <p className="text-sm text-gray-500">Telefon operatörleri (personel formunda seçim listesi)</p>
            </div>
            <div className="flex items-center gap-3">
              {showHatList && (
                <button onClick={(e) => { e.stopPropagation(); saveHatList(); }} disabled={hatListSaving} className="btn btn-primary text-sm">
                  {hatListSaving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              )}
              {showHatList ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
            </div>
          </button>

          {showHatList && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-3">Yeni operatör eklemek için aşağıya yazıp "Ekle" butonuna tıklayın.</p>
              <div className="space-y-2">
                {hatList.map((h, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-sm text-gray-700 flex-1">{h}</span>
                    <button onClick={() => setHatList(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 p-1"><X className="w-4 h-4" /></button>
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <input value={hatNew} onChange={e => setHatNew(e.target.value)} className="input flex-1 text-sm" placeholder="Yeni operatör adı" onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (hatNew.trim() && !hatList.includes(hatNew.trim())) { setHatList(prev => [...prev, hatNew.trim()]); setHatNew(""); } } }} />
                  <button onClick={() => { if (hatNew.trim() && !hatList.includes(hatNew.trim())) { setHatList(prev => [...prev, hatNew.trim()]); setHatNew(""); } }} disabled={!hatNew.trim()} className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"><Plus className="w-4 h-4" /> Ekle</button>
                </div>
              </div>
              <div className="flex justify-end pt-3">
                <button onClick={saveHatList} disabled={hatListSaving} className="btn btn-primary text-sm">
                  {hatListSaving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="card p-6 mt-6">
            <button onClick={() => setShowVersion(!showVersion)} className="w-full flex items-center justify-between">
              <div className="text-left">
                <h3 className="text-lg font-semibold text-gray-800">Sürüm Takip</h3>
                <p className="text-sm text-gray-500">GitHub commit geçmişi</p>
              </div>
              {showVersion ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
            </button>
            {showVersion && (
              <div className="space-y-1 max-h-80 overflow-y-auto mt-4">
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-2 px-2">
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>enderak54/isgapp — son {commits.length} commit</span>
                </div>
                {commitsLoading ? (
                  <p className="text-xs text-gray-400 text-center py-6">Yükleniyor...</p>
                ) : commits.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">Commit bilgisi alınamadı</p>
                ) : (
                  commits.map((c: any) => (
                    <div key={c.sha} className="flex items-start gap-2 py-2 px-2 rounded hover:bg-gray-50 text-xs">
                      <span className="font-mono text-gray-400 flex-shrink-0 w-16">{c.sha.substring(0, 7)}</span>
                      <span className="text-gray-700 flex-1 min-w-0">{c.commit.message.split("\n")[0]}</span>
                      <span className="text-gray-400 flex-shrink-0 whitespace-nowrap">{new Date(c.commit.author.date).toLocaleDateString("tr-TR")}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

        {showAddVersion && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowAddVersion(false)}>
            <div className="bg-white rounded-2xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Yeni Sürüm Ekle</h3>
                <button onClick={() => setShowAddVersion(false)}><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600 mb-1.5 block">Versiyon *</label>
                    <input type="text" value={newVersion.versiyon} onChange={e => setNewVersion({ ...newVersion, versiyon: e.target.value })} placeholder="Örn: 0.2.0" className="input" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1.5 block">Tip</label>
                    <select value={newVersion.tip} onChange={e => setNewVersion({ ...newVersion, tip: e.target.value })} className="input">
                      <option value="major">Major</option>
                      <option value="minor">Minor</option>
                      <option value="patch">Patch</option>
                      <option value="hotfix">Hotfix</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1.5 block">Açıklama *</label>
                  <input type="text" value={newVersion.aciklama} onChange={e => setNewVersion({ ...newVersion, aciklama: e.target.value })} placeholder="Bu sürümün kısa özeti" className="input" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1.5 block">Değişiklikler (her satıra bir madde)</label>
                  <textarea value={newVersion.detaylar} onChange={e => setNewVersion({ ...newVersion, detaylar: e.target.value })} className="input h-32 resize-none" placeholder="Yeni özellik: İhtar modülü&#10;Düzeltme: TC maskeleme&#10;İyileştirme: Performans artışı" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1.5 block">Yazar</label>
                  <input type="text" value={newVersion.yazar} onChange={e => setNewVersion({ ...newVersion, yazar: e.target.value })} placeholder="Kim tarafından yapıldı" className="input" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setShowAddVersion(false)} className="btn text-sm" style={{ background: "#f3f4f6", color: "#374151" }}>İptal</button>
                  <button onClick={saveVersion} className="btn btn-primary text-sm">Kaydet</button>
                </div>
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  );
}