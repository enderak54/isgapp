"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { maskTC } from "@/lib/security";
import { displayDate } from "@/lib/tarih";
import { logAudit } from "@/lib/audit";
import { validateFile, sanitizeFileName } from "@/lib/file-validation";
import { Search, FolderOpen, File, FileText, Eye, Download, User, Folder, Upload, Image as ImageIcon, FileText as FileDoc, Building2, HardHat, BookOpen, Wrench, AlertTriangle, FileWarning, ClipboardList } from "lucide-react";

const MODULE_TABS = [
  { key: "personel", label: "Personel", icon: User },
  { key: "santiye", label: "Şantiye", icon: Building2 },
  { key: "taseron", label: "Taşeron", icon: HardHat },
  { key: "egitim", label: "Eğitim", icon: BookOpen },
  { key: "ekipman", label: "Ekipman", icon: Wrench },
  { key: "is_kazasi", label: "İş Kazası", icon: AlertTriangle },
  { key: "ihtar", label: "İhtar", icon: FileWarning },
  { key: "dokuman", label: "Döküman", icon: ClipboardList },
];

const FOLDER_CATEGORIES = [
  { key: "isg_egitim", label: "İSG Eğitimleri", icon: FileText, color: "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100" },
  { key: "saglik", label: "Sağlık", icon: FolderOpen, color: "bg-green-50 text-green-600 border-green-200 hover:bg-green-100" },
  { key: "kimlik", label: "Kimlik", icon: File, color: "bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100" },
  { key: "ssk", label: "SSK Belgeleri", icon: FileDoc, color: "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100" },
  { key: "is_guvenligi", label: "İş Güvenliği", icon: Folder, color: "bg-red-50 text-red-600 border-red-200 hover:bg-red-100" },
  { key: "talimat", label: "Talimatlar", icon: FileText, color: "bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100" },
  { key: "diger", label: "Diğer", icon: Folder, color: "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100" },
];

const BELGE_TIPI_TO_FOLDER: Record<string, string> = {
  isg_egitim: "isg_egitim", yuksekte_calisma: "isg_egitim", myk: "isg_egitim",
  operator_belgesi: "isg_egitim", kkd: "isg_egitim", oryantasyon: "isg_egitim", sertifika: "isg_egitim",
  saglik_raporu: "saglik", yuksekte_calisamaz: "saglik", gece_calisamaz: "saglik", vardiyali_calisamaz: "saglik",
  gorevlendirme: "diger", adli_sicil: "diger",
};

const BELGE_TIPI_LABEL: Record<string, string> = {
  isg_egitim: "İSG Eğitimi", yuksekte_calisma: "Yüksekte Çalışma", myk: "MYK",
  operator_belgesi: "Operatör Belgesi", kkd: "KKD Zimmet", oryantasyon: "Oryantasyon", sertifika: "Sertifika",
  saglik_raporu: "Sağlık Raporu", yuksekte_calisamaz: "Yüksekte Çalışamaz",
  gece_calisamaz: "Gece Çalışamaz", vardiyali_calisamaz: "Vardiyalı Çalışamaz",
  gorevlendirme: "Görevlendirme", adli_sicil: "Adli Sicil",
};

const DOSYA_TURU_LABEL: Record<string, string> = {
  kimlik: "Kimlik Belgesi", sss_belgesi: "SSK Belgesi", is_guvenligi: "İş Güvenliği Belgesi", diger: "Diğer Belge",
};

const BELGE_TURU_TO_FOLDER: Record<string, string> = {
  saglik_raporu: "saglik", egitim_belgesi: "isg_egitim", kimlik: "kimlik",
  sss_belgesi: "ssk", is_guvenligi: "is_guvenligi", diger: "diger",
};

const SANIYE_DOSYA_ALANLARI: { column: string; label: string }[] = [
  { column: "yapi_ruhsati_dosyasi", label: "Yapı Ruhsatı" },
  { column: "is_sozlesme_dosyasi", label: "İş Sözleşmesi" },
  { column: "risk_analizi_dosyasi", label: "Risk Analizi" },
  { column: "calisan_temsilcisi_dosyasi", label: "Çalışan Temsilcisi" },
  { column: "destek_elemani_dosyasi", label: "Destek Elemanı" },
  { column: "yapilacak_isler_dosyasi", label: "Yapılacak İşler" },
  { column: "acil_durum_plani_dosyasi", label: "Acil Durum Planı" },
  { column: "acil_durum_ekipleri_dosyasi", label: "Acil Durum Ekipleri" },
  { column: "tatbikat_dosyasi", label: "Tatbikat" },
];

const KAZA_DOSYA_ALANLARI: { column: string; label: string }[] = [
  { column: "kaza_tutanagi_dosyasi", label: "Kaza Tutanağı" },
  { column: "kaza_bildirim_dosyasi", label: "Kaza Bildirimi" },
  { column: "ise_donus_egitimi_dosyasi", label: "İşe Dönüş Eğitimi" },
  { column: "rapor_dosyasi", label: "Rapor" },
];

const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
const getFileIcon = (url?: string | null) => {
  if (url && isImage(url)) return <ImageIcon className="w-4 h-4 text-blue-500" />;
  return <FileDoc className="w-4 h-4 text-amber-500" />;
};

interface FileItem {
  id: string;
  name: string;
  url: string | null;
  date?: string;
  extra?: string;
  _source?: "belge" | "dosya" | "talimat";
  _newTipi?: string;
}

interface PersonelRow { id: string; kimlik_no?: string | null; ad: string; soyad: string; }
interface BelgeRow { id: string; belge_tipi: string; dosya_url?: string | null; dosya_adi?: string | null; eklenme_tarihi?: string | null; }
interface DosyaRow { id: string; belge_turu?: string | null; belge_adi?: string | null; tarih?: string | null; dosya_url?: string | null; }
interface TalimatRow { id: string; talimat_adi?: string | null; tarih?: string | null; eklenme_tarihi?: string | null; dosya_url?: string | null; dosya_adi?: string | null; }
interface SantiyeRow { id: string; ad?: string | null; yapi_ruhsati_dosyasi?: string | null; is_sozlesme_dosyasi?: string | null; risk_analizi_dosyasi?: string | null; calisan_temsilcisi_dosyasi?: string | null; destek_elemani_dosyasi?: string | null; yapilacak_isler_dosyasi?: string | null; acil_durum_plani_dosyasi?: string | null; acil_durum_ekipleri_dosyasi?: string | null; tatbikat_dosyasi?: string | null; }
interface TaseronRow { id: string; firma_adi?: string | null; durum?: string | null; }
interface EgitimDosyaRow { id: string; dosya_url?: string | null; dosya_adi?: string | null; created_at?: string | null; egitimler?: { egitim_adi?: string | null; egitim_tarihi?: string | null } | null; }
interface EkipmanDosyaRow { id: string; dosya_url?: string | null; dosya_adi?: string | null; created_at?: string | null; ekipmanlar?: { adi?: string | null; turu?: string | null } | null; }
interface KazaRow { id: string; dosya_no?: string | null; personel?: { ad?: string | null; soyad?: string | null } | null; kaza_tutanagi_dosyasi?: string | null; kaza_bildirim_dosyasi?: string | null; ise_donus_egitimi_dosyasi?: string | null; rapor_dosyasi?: string | null; }
interface IhtarRow { id: string; tarih?: string | null; ihtar_nedeni?: string | null; personel?: { ad?: string | null; soyad?: string | null } | null; }
interface IhtarDosyaRow { id: string; dosya_url?: string | null; dosya_adi?: string | null; eklenme_tarihi?: string | null; neden?: string | null; }
interface DokumanRow { id: string; dokuman_adi?: string | null; dokuman_no?: string | null; dosya_url?: string | null; created_at?: string | null; }

export default function PersonelDosyasi() {
  const [activeModule, setActiveModule] = useState("personel");
  return (
    <div className="flex-1 min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-bold text-gray-800 tracking-tight">Dosya Yönetimi</h1>
      </div>
      <div className="px-6 pt-4">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
          {MODULE_TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => setActiveModule(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${activeModule === tab.key ? "bg-white text-green-700 shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-white/50"}`}>
                <Icon className="w-3.5 h-3.5" /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex-1 px-6 py-4">
        {activeModule === "personel" && <PersonelModule />}
        {activeModule === "santiye" && <SantiyeModule />}
        {activeModule === "taseron" && <TaseronModule />}
        {activeModule === "egitim" && <EgitimModule />}
        {activeModule === "ekipman" && <EkipmanModule />}
        {activeModule === "is_kazasi" && <KazaModule />}
        {activeModule === "ihtar" && <IhtarModule />}
        {activeModule === "dokuman" && <DokumanModule />}
      </div>
    </div>
  );
}

function FileCard({ item, onUpload }: { item: FileItem; onUpload?: (item: FileItem, file: File) => Promise<void> }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpload) return;
    const validation = validateFile(file);
    if (!validation.valid) { alert(validation.error); return; }
    setUploading(true);
    try {
      await onUpload(item, file);
    } catch (err: unknown) {
      alert("Dosya yüklenirken hata oluştu: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-sm transition-all">
      <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
        {getFileIcon(item.url)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-800 break-words">{item.name || "Adsız"}</p>
        <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
          {item.date && <span>{displayDate(item.date)}</span>}
          {item.extra && <span className="text-gray-300">|</span>}
          {item.extra && <span>{item.extra}</span>}
        </div>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        {item.url ? (
          <>
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded text-blue-600 hover:bg-blue-50 transition" title="Görüntüle">
              <Eye className="w-3.5 h-3.5" />
            </a>
            <a href={item.url} download className="p-1.5 rounded text-green-600 hover:bg-green-50 transition" title="İndir">
              <Download className="w-3.5 h-3.5" />
            </a>
          </>
        ) : (
          <span className="p-1.5 text-gray-300"><Eye className="w-3.5 h-3.5" /></span>
        )}
        {onUpload && (
          <>
            <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" onChange={handleUpload} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className={`p-1.5 rounded transition disabled:opacity-50 ${item.url ? "text-amber-600 hover:bg-amber-50" : "text-blue-600 hover:bg-blue-50"}`}
              title={item.url ? "Dosyayı Değiştir" : "Dosya Yükle"}>
              {uploading ? <span className="w-3.5 h-3.5 block animate-spin border-2 border-current border-t-transparent rounded-full" /> : <Upload className="w-3.5 h-3.5" />}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function FileGrid({ files, emptyText = "Henüz dosya bulunmamaktadır.", onUpload }: { files: FileItem[]; emptyText?: string; onUpload?: (item: FileItem, file: File) => Promise<void> }) {
  if (files.length === 0) return <div className="text-center py-10 text-gray-400 text-sm">{emptyText}</div>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {files.map((item, idx) => <FileCard key={idx} item={item} onUpload={onUpload} />)}
    </div>
  );
}

function TalimatCard({ item, onFileUploaded }: { item: FileItem; onFileUploaded: () => void }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateFile(file);
    if (!validation.valid) { alert(validation.error); return; }
    setUploading(true);
    try {
      const fileName = `talimat/${item.id}/${Date.now()}_${sanitizeFileName(file.name)}`;
      const { error: upErr } = await supabase.storage.from("personel-belgeleri").upload(fileName, file);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("personel-belgeleri").getPublicUrl(fileName);
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
      const { error: updateError } = await supabase.from("personel_talimat_matrisi").update({
        dosya_url: urlData.publicUrl,
        dosya_adi: file.name,
        dosya_uzantisi: fileExt,
        dosya_boyut: file.size,
      }).eq("id", item.id);
      if (updateError) throw updateError;
      await logAudit("personel_talimat_matrisi", "UPDATE", item.id, null, { dosya_adi: file.name, islem: "dosya_yukle" });
      onFileUploaded();
    } catch (err: unknown) {
      console.error("Talimat dosya yükleme hatası:", err);
      alert("Dosya yüklenirken hata oluştu: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-sm transition-all">
      <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
        {item.url ? <FileDoc className="w-5 h-5 text-amber-500" /> : <FileText className="w-5 h-5 text-gray-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-800 break-words">{item.name}</p>
        <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
          {item.date && <span>{displayDate(item.date)}</span>}
          {item.extra && <span className="text-gray-300">|</span>}
          {item.extra && <span className="truncate max-w-[120px]">{item.extra}</span>}
        </div>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        {item.url ? (
          <>
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded text-blue-600 hover:bg-blue-50 transition" title="Görüntüle">
              <Eye className="w-3.5 h-3.5" />
            </a>
            <a href={item.url} download className="p-1.5 rounded text-green-600 hover:bg-green-50 transition" title="İndir">
              <Download className="w-3.5 h-3.5" />
            </a>
          </>
        ) : (
          <>
            <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" onChange={handleUpload} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="p-1.5 rounded text-blue-600 hover:bg-blue-50 transition disabled:opacity-50" title="Dosya Yükle">
              {uploading ? <span className="w-3.5 h-3.5 block animate-spin border-2 border-blue-600 border-t-transparent rounded-full" /> : <Upload className="w-3.5 h-3.5" />}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input type="text" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} className="input pr-12" />
    </div>
  );
}

function PanelCard({ title, children, count }: { title: string; children: React.ReactNode; count?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-semibold text-gray-700">{title}</span>
        {count !== undefined && <span className="text-xs text-gray-400 ml-auto">{count} dosya</span>}
      </div>
      {children}
    </div>
  );
}

// ─── PERSONEL MODULE ───────────────────────────────────────────────
function PersonelModule() {
  const [personel, setPersonel] = useState<PersonelRow[]>([]);
  const [search, setSearch] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<PersonelRow | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [belgeler, setBelgeler] = useState<BelgeRow[]>([]);
  const [dosyalar, setDosyalar] = useState<DosyaRow[]>([]);
  const [talimatlar, setTalimatlar] = useState<TalimatRow[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    supabase.from("personel").select("id, kimlik_no, ad, soyad").eq("arsivde", false).order("ad", { ascending: true }).then(({ data }) => {
      if (data) setPersonel(data as PersonelRow[]);
    });
  }, []);

  useEffect(() => {
    if (!selectedPerson) return;
    Promise.all([
      supabase.from("personel_belgeleri").select("*").eq("personel_id", selectedPerson.id).is("silinme_tarihi", null),
      supabase.from("personel_dosyasi").select("*").eq("personel_id", selectedPerson.id),
      supabase.from("personel_talimat_matrisi").select("*").eq("personel_id", selectedPerson.id),
    ]).then(([belgelerRes, dosyalarRes, talimatRes]) => {
      if (belgelerRes.data) setBelgeler(belgelerRes.data as BelgeRow[]);
      if (dosyalarRes.data) setDosyalar(dosyalarRes.data as DosyaRow[]);
      if (talimatRes.data) setTalimatlar(talimatRes.data as TalimatRow[]);
      setFilesLoading(false);
    });
  }, [selectedPerson]);

  const filteredPersonel = personel.filter(p =>
    `${p.ad} ${p.soyad}`.toLowerCase().includes(search.toLowerCase()) || (p.kimlik_no || "").includes(search)
  );

  const getFolderFiles = (folderKey: string): FileItem[] => {
    if (folderKey === "talimat") return talimatlar.map(t => ({ id: t.id, name: t.talimat_adi || "Talimat", url: t.dosya_url || null, date: t.tarih || t.eklenme_tarihi || undefined, extra: t.dosya_adi || undefined, _source: "talimat" as const }));
    const fromBelgeler = belgeler.filter(b => BELGE_TIPI_TO_FOLDER[b.belge_tipi] === folderKey);
    const fromDosyalar = dosyalar.filter(d => d.belge_turu && BELGE_TURU_TO_FOLDER[d.belge_turu] === folderKey);
    const existingTipis = new Set(fromBelgeler.map(b => b.belge_tipi));
    const existingTurler = new Set(fromDosyalar.map(d => d.belge_turu || ""));
    const emptyBelgeSlots: FileItem[] = Object.keys(BELGE_TIPI_LABEL)
      .filter(tipi => BELGE_TIPI_TO_FOLDER[tipi] === folderKey && !existingTipis.has(tipi))
      .map(tipi => ({ id: `_new_${tipi}`, name: BELGE_TIPI_LABEL[tipi], url: null, _source: "belge" as const, _newTipi: tipi }));
    const emptyDosyaSlots: FileItem[] = Object.keys(DOSYA_TURU_LABEL)
      .filter(tur => BELGE_TURU_TO_FOLDER[tur] === folderKey && !existingTurler.has(tur))
      .map(tur => ({ id: `_new_dosya_${tur}`, name: DOSYA_TURU_LABEL[tur], url: null, _source: "dosya" as const, _newTipi: tur }));
    return [
      ...fromBelgeler.map(b => ({ id: b.id, name: b.dosya_adi || BELGE_TIPI_LABEL[b.belge_tipi] || b.belge_tipi, url: b.dosya_url || null, date: b.eklenme_tarihi || undefined, _source: "belge" as const })),
      ...fromDosyalar.map(d => ({ id: d.id, name: d.belge_adi || DOSYA_TURU_LABEL[d.belge_turu || ""] || "Dosya", url: d.dosya_url || null, date: d.tarih || undefined, _source: "dosya" as const })),
      ...emptyBelgeSlots,
      ...emptyDosyaSlots,
    ].sort((a, b) => {
      if (a.url && !b.url) return -1;
      if (!a.url && b.url) return 1;
      return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
    });
  };

  const getAllFiles = (): FileItem[] => {
    const all: FileItem[] = [];
    FOLDER_CATEGORIES.forEach(f => getFolderFiles(f.key).forEach(file => all.push(file)));
    return all.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  };

  const folderFileCount = (folderKey: string): number => {
    if (folderKey === "talimat") return talimatlar.length;
    const belgeCount = belgeler.filter(b => BELGE_TIPI_TO_FOLDER[b.belge_tipi] === folderKey).length;
    const dosyaCount = dosyalar.filter(d => d.belge_turu && BELGE_TURU_TO_FOLDER[d.belge_turu] === folderKey).length;
    const emptyBelgeCount = Object.keys(BELGE_TIPI_LABEL).filter(tipi => BELGE_TIPI_TO_FOLDER[tipi] === folderKey).length - belgeCount;
    const emptyDosyaCount = Object.keys(DOSYA_TURU_LABEL).filter(tur => BELGE_TURU_TO_FOLDER[tur] === folderKey).length - dosyaCount;
    return belgeCount + dosyaCount + Math.max(0, emptyBelgeCount) + Math.max(0, emptyDosyaCount);
  };

  const refreshTalimatlar = async () => {
    if (!selectedPerson) return;
    const { data } = await supabase.from("personel_talimat_matrisi").select("*").eq("personel_id", selectedPerson.id);
    if (data) setTalimatlar(data);
  };

  const refreshBelgeler = async () => {
    if (!selectedPerson) return;
    const { data } = await supabase.from("personel_belgeleri").select("*").eq("personel_id", selectedPerson.id).is("silinme_tarihi", null);
    if (data) setBelgeler(data);
  };

  const refreshDosyalar = async () => {
    if (!selectedPerson) return;
    const { data } = await supabase.from("personel_dosyasi").select("*").eq("personel_id", selectedPerson.id);
    if (data) setDosyalar(data);
  };

  const uploadBelge = async (item: FileItem, file: File) => {
    const fileName = `belgeler/${selectedPerson?.id}/${Date.now()}_${sanitizeFileName(file.name)}`;
    const { error: upErr } = await supabase.storage.from("personel-belgeleri").upload(fileName, file);
    if (upErr) throw upErr;
    const { data: urlData } = supabase.storage.from("personel-belgeleri").getPublicUrl(fileName);
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
    if (item.id.startsWith("_new_") && item._newTipi) {
      const { data: newRec } = await supabase.from("personel_belgeleri").insert({
        personel_id: selectedPerson!.id, belge_tipi: item._newTipi,
        dosya_url: urlData.publicUrl, dosya_adi: file.name, dosya_uzantisi: fileExt, dosya_boyut: file.size,
      }).select();
      if (newRec?.[0]) await logAudit("personel_belgeleri", "INSERT", newRec[0].id, null, { dosya_adi: file.name, belge_tipi: item._newTipi });
    } else {
      await supabase.from("personel_belgeleri").update({
        dosya_url: urlData.publicUrl, dosya_adi: file.name, dosya_uzantisi: fileExt, dosya_boyut: file.size,
      }).eq("id", item.id);
      await logAudit("personel_belgeleri", "UPDATE", item.id, null, { dosya_adi: file.name, islem: "dosya_yukle" });
    }
    await refreshBelgeler();
  };

  const uploadDosya = async (item: FileItem, file: File) => {
    const fileName = `personel-ek/${selectedPerson?.id}/${Date.now()}_${sanitizeFileName(file.name)}`;
    const { error: upErr } = await supabase.storage.from("personel-belgeleri").upload(fileName, file);
    if (upErr) throw upErr;
    const { data: urlData } = supabase.storage.from("personel-belgeleri").getPublicUrl(fileName);
    if (item.id.startsWith("_new_") && item._newTipi) {
      const { data: newRec } = await supabase.from("personel_dosyasi").insert({
        personel_id: selectedPerson!.id, belge_turu: item._newTipi, belge_adi: file.name,
        dosya_url: urlData.publicUrl,
      }).select();
      if (newRec?.[0]) await logAudit("personel_dosyasi", "INSERT", newRec[0].id, null, { dosya_adi: file.name, belge_turu: item._newTipi });
    } else {
      await supabase.from("personel_dosyasi").update({
        dosya_url: urlData.publicUrl, belge_adi: file.name,
      }).eq("id", item.id);
      await logAudit("personel_dosyasi", "UPDATE", item.id, null, { dosya_adi: file.name, islem: "dosya_yukle" });
    }
    await refreshDosyalar();
  };

  const handleItemUpload = async (item: FileItem, file: File) => {
    if (item._source === "belge") await uploadBelge(item, file);
    else if (item._source === "dosya") await uploadDosya(item, file);
    else throw new Error("Bu öğe için dosya yükleme desteklenmiyor");
  };

  const currentFiles = selectedFolder ? (selectedFolder === "_all" ? getAllFiles() : getFolderFiles(selectedFolder)) : [];
  const allFilesCount = FOLDER_CATEGORIES.reduce((sum, f) => sum + folderFileCount(f.key), 0);

  return (
    <>
      <PanelCard title="1. Personel Seçimi">
        <div className="relative">
          <SearchInput value={search} onChange={v => { setSearch(v); setShowDropdown(true); setSelectedPerson(null); setSelectedFolder(null); }} placeholder="Personel adı veya TC kimlik no ile ara..." />
          {showDropdown && search && filteredPersonel.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-30">
              {filteredPersonel.map(p => (
                <button key={p.id} onClick={() => { setSelectedPerson(p); setSearch(`${p.ad} ${p.soyad}`); setShowDropdown(false); setSelectedFolder(null); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 text-left border-b border-gray-50 last:border-0">
                  <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="font-medium text-gray-800">{p.ad} {p.soyad}</span>
                  <span className="text-xs text-gray-400 ml-auto">{maskTC(p.kimlik_no || "")}</span>
                </button>
              ))}
            </div>
          )}
          {showDropdown && search && filteredPersonel.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-sm text-gray-400 z-30">Personel bulunamadı</div>
          )}
        </div>
        {selectedPerson && (
          <div className="mt-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
            <User className="w-4 h-4" /> <span className="font-medium">{selectedPerson.ad} {selectedPerson.soyad}</span> <span className="text-green-500">|</span> <span className="text-green-600">{maskTC(selectedPerson.kimlik_no || "")}</span>
          </div>
        )}
      </PanelCard>

      {selectedPerson && (
        <div className="mt-4">
          <PanelCard title="2. Klasör Seçimi">
            {filesLoading ? (
              <div className="text-center py-6 text-gray-400 text-sm">Yükleniyor...</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                <button onClick={() => setSelectedFolder("_all")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${selectedFolder === "_all" ? "border-green-500 bg-green-50" : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:border-gray-300"}`}>
                  <Folder className="w-8 h-8 text-gray-500" />
                  <span className="text-xs font-medium text-gray-700 text-center">Tümünü Göster</span>
                  <span className="text-[10px] text-gray-400">{allFilesCount} dosya</span>
                </button>
                {FOLDER_CATEGORIES.map(folder => {
                  const count = folderFileCount(folder.key);
                  const Icon = folder.icon;
                  return (
                    <button key={folder.key} onClick={() => setSelectedFolder(folder.key)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${selectedFolder === folder.key ? "border-green-500 bg-green-50" : folder.color}`}>
                      <Icon className="w-8 h-8" />
                      <span className="text-xs font-medium text-gray-700 text-center">{folder.label}</span>
                      <span className="text-[10px] text-gray-400">{count} dosya</span>
                    </button>
                  );
                })}
              </div>
            )}
          </PanelCard>
        </div>
      )}

      {selectedPerson && selectedFolder && (
        <div className="mt-4">
          <PanelCard title={selectedFolder === "_all" ? "Tüm Dosyalar" : FOLDER_CATEGORIES.find(f => f.key === selectedFolder)?.label || selectedFolder} count={currentFiles.length}>
            {selectedFolder === "_all" ? (
              <div className="space-y-4">
                {FOLDER_CATEGORIES.map(folder => {
                  const folderFiles = getFolderFiles(folder.key);
                  if (folderFiles.length === 0) return null;
                  const Icon = folder.icon;
                  return (
                    <div key={folder.key}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{folder.label}</span>
                        <span className="text-[10px] text-gray-400">({folderFiles.length})</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {folderFiles.map((item, idx) => folder.key === "talimat" ? <TalimatCard key={idx} item={item} onFileUploaded={refreshTalimatlar} /> : <FileCard key={idx} item={item} onUpload={handleItemUpload} />)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : selectedFolder === "talimat" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentFiles.length === 0 ? <div className="text-center py-10 text-gray-400 text-sm">Henüz dosya bulunmamaktadır.</div> : currentFiles.map((item, idx) => <TalimatCard key={idx} item={item} onFileUploaded={refreshTalimatlar} />)}
              </div>
            ) : (
              <FileGrid files={currentFiles} onUpload={handleItemUpload} />
            )}
          </PanelCard>
        </div>
      )}
    </>
  );
}

// ─── ŞANTİYE MODULE ────────────────────────────────────────────────
function SantiyeModule() {
  const [santiyeler, setSantiyeler] = useState<SantiyeRow[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<SantiyeRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("santiyeler").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setSantiyeler(data as SantiyeRow[]);
      setLoading(false);
    });
  }, []);

  const filtered = santiyeler.filter(s => (s.ad || "").toLowerCase().includes(search.toLowerCase()));

  const getFiles = (santiye: SantiyeRow): FileItem[] => {
    return SANIYE_DOSYA_ALANLARI.map(a => ({
      id: a.column, name: a.label, url: santiye[a.column as keyof SantiyeRow] || null,
    }));
  };

  const uploadSantiyeDosyasi = async (item: FileItem, file: File) => {
    if (!selected) return;
    const fileName = `santiye/${selected.id}/${Date.now()}_${sanitizeFileName(file.name)}`;
    const { error: upErr } = await supabase.storage.from("santiye-dosyalari").upload(fileName, file);
    if (upErr) throw upErr;
    const { data: urlData } = supabase.storage.from("santiye-dosyalari").getPublicUrl(fileName);
    const { error: updateError } = await supabase.from("santiyeler").update({ [item.id]: urlData.publicUrl }).eq("id", selected.id);
    if (updateError) throw updateError;
    await logAudit("santiyeler", "UPDATE", selected.id, null, { [item.id]: urlData.publicUrl, islem: "dosya_yukle" });
    const { data: fresh } = await supabase.from("santiyeler").select("*").eq("id", selected.id).single();
    if (fresh) setSelected(fresh);
    setSantiyeler(prev => prev.map(s => s.id === selected.id ? fresh || s : s));
  };

  return (
    <>
      <PanelCard title="Şantiye Seçimi">
        <SearchInput value={search} onChange={setSearch} placeholder="Şantiye adı ile ara..." />
        <div className="mt-3 max-h-60 overflow-y-auto space-y-1">
          {filtered.map(s => (
            <button key={s.id} onClick={() => setSelected(s)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg text-left transition ${selected?.id === s.id ? "bg-green-50 text-green-700 border border-green-200" : "hover:bg-gray-50 text-gray-700"}`}>
              <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="font-medium">{s.ad}</span>
              <span className="text-xs text-gray-400 ml-auto">{SANIYE_DOSYA_ALANLARI.filter(a => s[a.column as keyof SantiyeRow]).length}/{SANIYE_DOSYA_ALANLARI.length} dosya</span>
            </button>
          ))}
          {filtered.length === 0 && !loading && <div className="text-center py-4 text-gray-400 text-sm">Şantiye bulunamadı</div>}
        </div>
      </PanelCard>
      {selected && (
        <div className="mt-4">
          <PanelCard title={`${selected.ad} — Dosyalar`} count={SANIYE_DOSYA_ALANLARI.length}>
            <FileGrid files={getFiles(selected)} emptyText="Bu şantiyeye ait dosya bulunmamaktadır." onUpload={uploadSantiyeDosyasi} />
          </PanelCard>
        </div>
      )}
    </>
  );
}

// ─── TAŞERON MODULE ────────────────────────────────────────────────
function TaseronModule() {
  const [taseronlar, setTaseronlar] = useState<TaseronRow[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<TaseronRow | null>(null);
  const [belgeler, setBelgeler] = useState<BelgeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filesLoading, setFilesLoading] = useState(false);

  useEffect(() => {
    supabase.from("taseronlar").select("id, firma_adi, durum").eq("durum", "aktif").order("firma_adi").then(({ data }) => {
      if (data) setTaseronlar(data as TaseronRow[]);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    supabase.from("personel").select("id").eq("taseron_id", selected.id).then(async ({ data: personelList }) => {
      if (!personelList || personelList.length === 0) { setBelgeler([]); setFilesLoading(false); return; }
      const pids = personelList.map(p => p.id);
      const { data } = await supabase.from("personel_belgeleri").select("*").in("personel_id", pids).is("silinme_tarihi", null);
      setBelgeler((data || []) as BelgeRow[]);
      setFilesLoading(false);
    });
  }, [selected]);

  const filtered = taseronlar.filter(t => (t.firma_adi || "").toLowerCase().includes(search.toLowerCase()));

  const getFiles = (): FileItem[] => {
    return belgeler
      .filter(b => b.dosya_url)
      .map(b => ({
        id: b.id,
        name: b.dosya_adi || b.belge_tipi,
        url: b.dosya_url || null,
        date: b.eklenme_tarihi || undefined,
        extra: b.belge_tipi?.replace(/_/g, " "),
      }));
  };

  return (
    <>
      <PanelCard title="Taşeron Seçimi">
        <SearchInput value={search} onChange={setSearch} placeholder="Taşeron firma adı ile ara..." />
        <div className="mt-3 max-h-60 overflow-y-auto space-y-1">
          {filtered.map(t => (
            <button key={t.id} onClick={() => { setSelected(t); setSearch(t.firma_adi || ""); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg text-left transition ${selected?.id === t.id ? "bg-green-50 text-green-700 border border-green-200" : "hover:bg-gray-50 text-gray-700"}`}>
              <HardHat className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="font-medium">{t.firma_adi}</span>
            </button>
          ))}
          {filtered.length === 0 && !loading && <div className="text-center py-4 text-gray-400 text-sm">Taşeron bulunamadı</div>}
        </div>
      </PanelCard>
      {selected && (
        <div className="mt-4">
          <PanelCard title={`${selected.firma_adi} — Belgeler`} count={getFiles().length}>
            {filesLoading ? (
              <div className="text-center py-6 text-gray-400 text-sm">Yükleniyor...</div>
            ) : (
              <FileGrid files={getFiles()} emptyText="Bu taşerona ait belge bulunmamaktadır." />
            )}
          </PanelCard>
        </div>
      )}
    </>
  );
}

// ─── EĞİTİM MODULE ─────────────────────────────────────────────────
function EgitimModule() {
  const [dosyalar, setDosyalar] = useState<EgitimDosyaRow[]>([]);

  useEffect(() => {
    supabase.from("egitim_dosyalari").select("*, egitimler:egitim_kaydi_id (egitim_adi, egitim_tarihi)").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setDosyalar(data as EgitimDosyaRow[]);
    });
  }, []);

  const files: FileItem[] = dosyalar.filter(d => d.dosya_url).map(d => ({
    id: d.id, name: d.dosya_adi || "Eğitim Dosyası", url: d.dosya_url || null, date: d.created_at || undefined,
    extra: d.egitimler?.egitim_adi || undefined,
  }));

  return (
    <PanelCard title="Eğitim Dosyaları" count={files.length}>
      <FileGrid files={files} emptyText="Henüz eğitim dosyası bulunmamaktadır." />
    </PanelCard>
  );
}

// ─── EKİPMAN MODULE ────────────────────────────────────────────────
function EkipmanModule() {
  const [dosyalar, setDosyalar] = useState<EkipmanDosyaRow[]>([]);

  useEffect(() => {
    supabase.from("ekipman_dosyalari").select("*, ekipmanlar:ekipman_id (adi, turu)").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setDosyalar(data as EkipmanDosyaRow[]);
    });
  }, []);

  const files: FileItem[] = dosyalar.filter(d => d.dosya_url).map(d => ({
    id: d.id, name: d.dosya_adi || "Ekipman Dosyası", url: d.dosya_url || null, date: d.created_at || undefined,
    extra: d.ekipmanlar?.adi || undefined,
  }));

  return (
    <PanelCard title="Ekipman Dosyaları" count={files.length}>
      <FileGrid files={files} emptyText="Henüz ekipman dosyası bulunmamaktadır." />
    </PanelCard>
  );
}

// ─── İŞ KAZASI MODULE ──────────────────────────────────────────────
function KazaModule() {
  const [kazalar, setKazalar] = useState<KazaRow[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<KazaRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("is_kazalari").select("*, personel:personel_id (ad, soyad)").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setKazalar(data as KazaRow[]);
      setLoading(false);
    });
  }, []);

  const filtered = kazalar.filter(k => {
    const ad = `${k.personel?.ad || ""} ${k.personel?.soyad || ""}`.toLowerCase();
    return ad.includes(search.toLowerCase()) || (k.dosya_no || "").toLowerCase().includes(search.toLowerCase());
  });

  const getFiles = (kaza: KazaRow): FileItem[] => {
    return KAZA_DOSYA_ALANLARI.map(a => ({
      id: a.column, name: a.label, url: (kaza[a.column as keyof KazaRow] as string | null) || null,
    }));
  };

  const uploadKazaDosyasi = async (item: FileItem, file: File) => {
    if (!selected) return;
    const fileName = `kaza/${selected.id}/${Date.now()}_${sanitizeFileName(file.name)}`;
    const { error: upErr } = await supabase.storage.from("kaza-dosyalari").upload(fileName, file);
    if (upErr) throw upErr;
    const { data: urlData } = supabase.storage.from("kaza-dosyalari").getPublicUrl(fileName);
    const { error: updateError } = await supabase.from("is_kazalari").update({ [item.id]: urlData.publicUrl }).eq("id", selected.id);
    if (updateError) throw updateError;
    await logAudit("is_kazalari", "UPDATE", selected.id, null, { [item.id]: urlData.publicUrl, islem: "dosya_yukle" });
    const { data: fresh } = await supabase.from("is_kazalari").select("*, personel:personel_id (ad, soyad)").eq("id", selected.id).single();
    if (fresh) setSelected(fresh);
    setKazalar(prev => prev.map(k => k.id === selected.id ? fresh || k : k));
  };

  return (
    <>
      <PanelCard title="İş Kazası Seçimi">
        <SearchInput value={search} onChange={setSearch} placeholder="Personel adı veya dosya no ile ara..." />
        <div className="mt-3 max-h-60 overflow-y-auto space-y-1">
          {filtered.map(k => (
            <button key={k.id} onClick={() => setSelected(k)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg text-left transition ${selected?.id === k.id ? "bg-green-50 text-green-700 border border-green-200" : "hover:bg-gray-50 text-gray-700"}`}>
              <AlertTriangle className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="font-medium">{k.personel?.ad} {k.personel?.soyad}</span>
              {k.dosya_no && <span className="text-xs text-gray-400 ml-auto">#{k.dosya_no}</span>}
              <span className="text-xs text-gray-400 ml-auto">{KAZA_DOSYA_ALANLARI.filter(a => k[a.column as keyof KazaRow]).length}/{KAZA_DOSYA_ALANLARI.length} dosya</span>
            </button>
          ))}
          {filtered.length === 0 && !loading && <div className="text-center py-4 text-gray-400 text-sm">Kaza bulunamadı</div>}
        </div>
      </PanelCard>
      {selected && (
        <div className="mt-4">
          <PanelCard title={`${selected.personel?.ad} ${selected.personel?.soyad} — Dosyalar`} count={KAZA_DOSYA_ALANLARI.length}>
            <FileGrid files={getFiles(selected)} emptyText="Bu kazaya ait dosya bulunmamaktadır." onUpload={uploadKazaDosyasi} />
          </PanelCard>
        </div>
      )}
    </>
  );
}

// ─── İHTAR MODULE ──────────────────────────────────────────────────
function IhtarModule() {
  const [ihtarlar, setIhtarlar] = useState<IhtarRow[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<IhtarRow | null>(null);
  const [dosyalar, setDosyalar] = useState<IhtarDosyaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filesLoading, setFilesLoading] = useState(false);

  useEffect(() => {
    supabase.from("ihtarlar").select("id, personel:personel_id (ad, soyad), tarih, ihtar_nedeni").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setIhtarlar(data as IhtarRow[]);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    supabase.from("ihtar_dosyalari").select("*").eq("ihtar_id", selected.id).is("silinme_tarihi", null).then(({ data }) => {
      setDosyalar((data || []) as IhtarDosyaRow[]);
      setFilesLoading(false);
    });
  }, [selected]);

  const filtered = ihtarlar.filter(i => {
    const ad = `${i.personel?.ad || ""} ${i.personel?.soyad || ""}`.toLowerCase();
    return ad.includes(search.toLowerCase()) || (i.ihtar_nedeni || "").toLowerCase().includes(search.toLowerCase());
  });

  const getFiles = (): FileItem[] => {
    return dosyalar.filter(d => d.dosya_url).map(d => ({
      id: d.id, name: d.dosya_adi || "İhtar Dosyası", url: d.dosya_url || null, date: d.eklenme_tarihi || undefined,
      extra: d.neden || undefined,
    }));
  };

  return (
    <>
      <PanelCard title="İhtar Seçimi">
        <SearchInput value={search} onChange={setSearch} placeholder="Personel adı veya ihtar nedeni ile ara..." />
        <div className="mt-3 max-h-60 overflow-y-auto space-y-1">
          {filtered.map(i => (
            <button key={i.id} onClick={() => { setSelected(i); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg text-left transition ${selected?.id === i.id ? "bg-green-50 text-green-700 border border-green-200" : "hover:bg-gray-50 text-gray-700"}`}>
              <FileWarning className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="font-medium">{i.personel?.ad} {i.personel?.soyad}</span>
              <span className="text-xs text-gray-400 ml-auto">{i.ihtar_nedeni || "-"}</span>
            </button>
          ))}
          {filtered.length === 0 && !loading && <div className="text-center py-4 text-gray-400 text-sm">İhtar bulunamadı</div>}
        </div>
      </PanelCard>
      {selected && (
        <div className="mt-4">
          <PanelCard title={`${selected.personel?.ad} ${selected.personel?.soyad} — İhtar Dosyaları`} count={getFiles().length}>
            {filesLoading ? (
              <div className="text-center py-6 text-gray-400 text-sm">Yükleniyor...</div>
            ) : (
              <FileGrid files={getFiles()} emptyText="Bu ihtara ait dosya bulunmamaktadır." />
            )}
          </PanelCard>
        </div>
      )}
    </>
  );
}

// ─── DÖKÜMAN MODULE ────────────────────────────────────────────────
function DokumanModule() {
  const [dokumanlar, setDokumanlar] = useState<DokumanRow[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase.from("dokuman_kontrol").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setDokumanlar(data as DokumanRow[]);
    });
  }, []);

  const filtered = dokumanlar.filter(d => (d.dokuman_adi || "").toLowerCase().includes(search.toLowerCase()));

  const files: FileItem[] = filtered.filter(d => d.dosya_url).map(d => ({
    id: d.id, name: d.dokuman_adi || "Döküman", url: d.dosya_url || null, date: d.created_at || undefined,
    extra: d.dokuman_no || undefined,
  }));

  return (
    <PanelCard title="Döküman Dosyaları" count={files.length}>
      <SearchInput value={search} onChange={setSearch} placeholder="Döküman adı ile ara..." />
      <div className="mt-4">
        <FileGrid files={files} emptyText="Henüz döküman dosyası bulunmamaktadır." />
      </div>
    </PanelCard>
  );
}
