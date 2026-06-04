"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Search, Edit, Trash2, UserPlus, Eye, X, Phone, Mail, Building2, Calendar, FileText as FileDoc, Image as ImageIcon, Paperclip, ExternalLink, Upload, Save, CheckCircle, AlertCircle, Lock, Unlock, ArrowUp, ArrowDown, Archive } from "lucide-react";
import { maskTC, sanitizeForm } from "@/lib/security";
import { logAudit } from "@/lib/audit";
import Link from "next/link";
import { EGITIM_FIELDS, isExpired, isWarningNeeded } from "@/lib/egitim-uyari";
import { displayDate } from "@/lib/tarih";

const toDisplay = (d: string) => d ? d.split("-").reverse().join(".") : "";
const toDb = (d: string) => d ? d.split(".").reverse().join("-") : "";

const BELGE_TIPLERI: Record<string, string> = {
  isgEgitimTarihi: "isg_egitim",
  isg_egitim_tarihi: "isg_egitim",
  yuksekteCalisma: "yuksekte_calisma",
  yuksekte_calisma_tarihi: "yuksekte_calisma",
  myk: "myk",
  myk_tarihi: "myk",
  operatorBelgesi: "operator_belgesi",
  operator_belgesi_tarihi: "operator_belgesi",
  kkd: "kkd",
  kkd_tarihi: "kkd",
  oryantasyon: "oryantasyon",
  oryantasyon_tarihi: "oryantasyon",
  saglikRaporuTarihi: "saglik_raporu",
  saglik_raporu_tarihi: "saglik_raporu",
  sertifika: "sertifika",
  sertifika_tarihi: "sertifika",
  yuksekteCalisamaz: "yuksekte_calisamaz",
  yuksekte_calisamaz: "yuksekte_calisamaz",
  geceCalisamaz: "gece_calisamaz",
  gece_calisamaz: "gece_calisamaz",
  vardiyaliCalisamaz: "vardiyali_calisamaz",
  vardiyali_calisamaz: "vardiyali_calisamaz",
};

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];

function getFileExt(name: string) { return name.split(".").pop()?.toLowerCase() || ""; }
function formatBytes(bytes: number) {
  if (!bytes) return "";
  const k = 1024; const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url);

interface PendingFile {
  field: string;
  file: File;
  preview?: string;
}

export default function PersonnelList() {
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Read ?search= from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("search");
    if (q) setSearch(q);
  }, []);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [belgeler, setBelgeler] = useState<any[]>([]);
  const [editingPerson, setEditingPerson] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [editLoading, setEditLoading] = useState(false);
  const [editStatus, setEditStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [editBelgeler, setEditBelgeler] = useState<any[]>([]);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploadModalField, setUploadModalField] = useState<string | null>(null);
  const [uploadDragOver, setUploadDragOver] = useState(false);
  const [lockedFiles, setLockedFiles] = useState<Set<string>>(new Set());
  const [lockedPersons, setLockedPersons] = useState<Set<string>>(new Set());
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string }>({ open: false, id: "" });
  const [sortCol, setSortCol] = useState<string>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [arsivGoster, setArsivGoster] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mykEgitimListesi, setMykEgitimListesi] = useState<any[]>([]);
  const [mykZorunluIds, setMykZorunluIds] = useState<string[]>([]);
  const [mykKayitlar, setMykKayitlar] = useState<{ myk_egitim_id: string; alis_tarihi: string; gecerlilik_suresi: string }[]>([]);
  const [mykSecim, setMykSecim] = useState("");
  const [mykSecimTarih, setMykSecimTarih] = useState("");
  const [mykSecimSure, setMykSecimSure] = useState("");
  const [mykShowAll, setMykShowAll] = useState(false);

  useEffect(() => {
    fetchPersonnel();
    Promise.all([
      supabase.from("myk_egitim_listesi").select("id, ad").eq("aktif", true),
      supabase.from("ayarlar").select("value").eq("key", "myk_zorunlu_ids").single(),
    ]).then(([egitimRes, ayarRes]) => {
      if (egitimRes.data) setMykEgitimListesi(egitimRes.data);
      if (ayarRes.data?.value) {
        try { setMykZorunluIds(JSON.parse(ayarRes.data.value)); } catch {}
      }
    });
  }, []);

  const mykEkle = () => {
    if (!mykSecim || !mykSecimTarih || !mykSecimSure) return;
    setMykKayitlar(prev => [...prev, { myk_egitim_id: mykSecim, alis_tarihi: mykSecimTarih, gecerlilik_suresi: mykSecimSure }]);
    setMykSecim(""); setMykSecimTarih(""); setMykSecimSure("");
  };

  const mykKaldir = (idx: number) => {
    setMykKayitlar(prev => prev.filter((_, i) => i !== idx));
  };

  const fetchPersonnel = async () => {
    try {
      const { data, error } = await supabase
        .from("personel").select("*")
        .eq("arsivde", arsivGoster)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (data) setPersonnel(data);
    } catch (err) {
      console.error("Personel listesi hatası:", err);
    } finally {
      setLoading(false);
    }
  };

  const deletePerson = async (id: string, tur: "istirak_ayrilis" | "hatali_kayit") => {
    const person = personnel.find(p => p.id === id);
    if (tur === "hatali_kayit") {
      await supabase.from("personel").delete().eq("id", id);
      await logAudit("personel", "DELETE", id, person, null);
    } else {
      await supabase.from("personel").update({ arsivde: true, ayrilis_tarihi: new Date().toISOString().split("T")[0], ayrilis_nedeni: "istirak_ayrilis" }).eq("id", id);
      await logAudit("personel", "ARCHIVE", id, person, null);
    }
    setDeleteModal({ open: false, id: "" });
    fetchPersonnel();
  };

  const fetchBelgeler = async (personelId: string) => {
    const { data } = await supabase.from("personel_belgeleri").select("*").eq("personel_id", personelId).is("silinme_tarihi", null).order("eklenme_tarihi", { ascending: false });
    if (data) setBelgeler(data);
  };

  const openDetail = (p: any) => {
    setSelectedPerson(p);
    setBelgeler([]);
    fetchBelgeler(p.id);
  };

  const sureOptions = [1, 2, 3, 4, 5];

  const openEdit = (p: any) => {
    setEditingPerson(p);
    setEditForm({
      ad: p.ad || "",
      soyad: p.soyad || "",
      telefon: p.telefon || "",
      email: p.email || "",
      ogrenim_durumu: p.ogrenim_durumu || "",
      santiye_adi: p.santiye_adi || "",
      ekip_adi: p.ekip_adi || "",
      meslek_kodu: p.meslek_kodu || "",
      sgk_tarihi: p.sgk_tarihi || "",
      ise_giris_tarihi: p.ise_giris_tarihi || "",
      isg_egitim_tarihi: p.isg_egitim_tarihi || "",
      yuksekte_calisma_tarihi: p.yuksekte_calisma_tarihi || "",
      myk_tarihi: p.myk_tarihi || "",
      operator_belgesi_tarihi: p.operator_belgesi_tarihi || "",
      kkd_tarihi: p.kkd_tarihi || "",
      oryantasyon_tarihi: p.oryantasyon_tarihi || "",
      sertifika_tarihi: p.sertifika_tarihi || "",
      saglik_raporu_tarihi: p.saglik_raporu_tarihi || "",
      isg_egitim_gecerlilik_suresi: p.isg_egitim_gecerlilik_suresi || "",
      yuksekte_calisma_gecerlilik_suresi: p.yuksekte_calisma_gecerlilik_suresi || "",
      myk_gecerlilik_suresi: p.myk_gecerlilik_suresi || "",
      sertifika_gecerlilik_suresi: p.sertifika_gecerlilik_suresi || "",
      operator_belgesi_gecerlilik_suresi: p.operator_belgesi_gecerlilik_suresi || "",
      kkd_gecerlilik_suresi: p.kkd_gecerlilik_suresi || "",
      oryantasyon_gecerlilik_suresi: p.oryantasyon_gecerlilik_suresi || "",
      saglik_raporu_gecerlilik_suresi: p.saglik_raporu_gecerlilik_suresi || "",
      kan_grubu: p.kan_grubu || "",
      kronik_rahatlik: p.kronik_rahatlik || "",
      yuksekte_calisir: p.yuksekte_calisir || false,
      yuksekte_calisamaz: p.yuksekte_calisamaz || false,
      gece_calisir: p.gece_calisir || false,
      gece_calisamaz: p.gece_calisamaz || false,
      vardiyali_calisir: p.vardiyali_calisir || false,
      vardiyali_calisamaz: p.vardiyali_calisamaz || false,
      notlar: p.notlar || "",
    });
    setPendingFiles([]);
    setEditBelgeler([]);
    setEditStatus(null);
    setLockedFiles(new Set());
    setMykKayitlar([]);
    setMykSecim(""); setMykSecimTarih(""); setMykSecimSure("");
    fetchEditBelgeler(p.id);
    fetchPersonelMykEgitimler(p.id);
  };

  const fetchPersonelMykEgitimler = async (personelId: string) => {
    const { data } = await supabase.from("personel_myk_egitimleri").select("myk_egitim_id, alis_tarihi, gecerlilik_suresi").eq("personel_id", personelId);
    if (data) {
      setMykKayitlar(data.map((r: any) => ({
        myk_egitim_id: r.myk_egitim_id,
        alis_tarihi: r.alis_tarihi || "",
        gecerlilik_suresi: r.gecerlilik_suresi ? r.gecerlilik_suresi.toString() : "",
      })));
    }
  };

  const fetchEditBelgeler = async (personelId: string) => {
    const { data } = await supabase.from("personel_belgeleri").select("*").eq("personel_id", personelId).is("silinme_tarihi", null).order("eklenme_tarihi", { ascending: false });
    if (data) setEditBelgeler(data);
  };

  const belgeTipiLabel = (tip: string) => {
    const labels: Record<string, string> = { isg_egitim: "İSG Eğitim", yuksekte_calisma: "Yüksekte Çalışma", myk: "MYK", operator_belgesi: "Operatör Belgesi", kkd: "KKD", oryantasyon: "Oryantasyon", saglik_raporu: "Sağlık Raporu", sertifika: "Sertifika", yuksekte_calisamaz: "Yüksekte Çalışamaz", gece_calisamaz: "Gece Çalışamaz", vardiyali_calisamaz: "Vardiyalı Çalışamaz", diger: "Diğer" };
    return labels[tip] || tip;
  };

  const getEgitimDurumu = (p: any, f: typeof EGITIM_FIELDS[0]) => {
    const tarih = p[f.tarihField];
    const sure = p[f.sureField];
    if (!tarih || !sure) return null;
    if (isExpired(tarih, sure)) return "expired";
    const threshold = f.ayarKey === "uyari_myk" ? 30 : 7;
    if (isWarningNeeded(tarih, sure, threshold)) return "warning";
    return "ok";
  };

  const getDurumRenk = (durum: string | null) => {
    if (durum === "expired") return "text-red-500";
    if (durum === "warning") return "text-amber-500";
    return "text-gray-300";
  };

  const getDurumIcon = (durum: string | null) => {
    if (durum === "expired") return "●";
    if (durum === "warning") return "◉";
    return "○";
  };

  const addFiles = (field: string, files: File[]) => {
    const valid = files.filter(f => ALLOWED_TYPES.includes(f.type));
    const newFiles: PendingFile[] = valid.map(f => ({
      field,
      file: f,
      preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
    }));
    setPendingFiles(prev => [...prev, ...newFiles]);
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => {
      const f = prev[index];
      if (f?.preview) URL.revokeObjectURL(f.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setUploadDragOver(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setUploadDragOver(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setUploadDragOver(false);
    if (uploadModalField) addFiles(uploadModalField, Array.from(e.dataTransfer.files));
  }, [uploadModalField]);

  const uploadFiles = async () => {
    if (!editingPerson || pendingFiles.length === 0) return;
    for (const pf of pendingFiles) {
      if (!BELGE_TIPLERI[pf.field]) continue;
      const fileExt = getFileExt(pf.file.name);
      const fileName = `${editingPerson.id}/${Date.now()}_${pf.file.name}`;
      const { error: uploadError } = await supabase.storage.from("personel-belgeleri").upload(fileName, pf.file);
      if (uploadError) { console.error("Upload error:", uploadError); continue; }
      const { data: urlData } = supabase.storage.from("personel-belgeleri").getPublicUrl(fileName);
      await supabase.from("personel_belgeleri").insert({
        personel_id: editingPerson.id,
        belge_tipi: BELGE_TIPLERI[pf.field],
        dosya_url: urlData.publicUrl,
        dosya_adi: pf.file.name,
        dosya_uzantisi: fileExt,
        dosya_boyut: pf.file.size,
      });
    }
    setPendingFiles([]);
    fetchEditBelgeler(editingPerson.id);
  };

  const saveEditMykEgitimler = async () => {
    if (!editingPerson) return;
    await supabase.from("personel_myk_egitimleri").delete().eq("personel_id", editingPerson.id);
    if (mykKayitlar.length > 0) {
      const inserts = mykKayitlar.map(k => ({
        personel_id: editingPerson.id,
        myk_egitim_id: k.myk_egitim_id,
        alis_tarihi: k.alis_tarihi || null,
        gecerlilik_suresi: k.gecerlilik_suresi ? parseInt(k.gecerlilik_suresi) : null,
      }));
      await supabase.from("personel_myk_egitimleri").insert(inserts);
    }
  };

  const saveEdit = async () => {
    setEditLoading(true);
    setEditStatus(null);
    try {
      const payload = sanitizeForm({
        ad: editForm.ad,
        soyad: editForm.soyad,
        telefon: editForm.telefon,
        email: editForm.email,
        ogrenim_durumu: editForm.ogrenim_durumu,
        santiye_adi: editForm.santiye_adi,
        ekip_adi: editForm.ekip_adi,
        meslek_kodu: editForm.meslek_kodu,
        sgk_tarihi: editForm.sgk_tarihi || null,
        ise_giris_tarihi: editForm.ise_giris_tarihi || null,
        isg_egitim_tarihi: editForm.isg_egitim_tarihi || null,
        yuksekte_calisma_tarihi: editForm.yuksekte_calisma_tarihi || null,
        myk_tarihi: editForm.myk_tarihi || null,
        operator_belgesi_tarihi: editForm.operator_belgesi_tarihi || null,
        kkd_tarihi: editForm.kkd_tarihi || null,
        oryantasyon_tarihi: editForm.oryantasyon_tarihi || null,
        sertifika_tarihi: editForm.sertifika_tarihi || null,
        saglik_raporu_tarihi: editForm.saglik_raporu_tarihi || null,
        isg_egitim_gecerlilik_suresi: editForm.isg_egitim_gecerlilik_suresi ? parseInt(editForm.isg_egitim_gecerlilik_suresi) : null,
        yuksekte_calisma_gecerlilik_suresi: editForm.yuksekte_calisma_gecerlilik_suresi ? parseInt(editForm.yuksekte_calisma_gecerlilik_suresi) : null,
        myk_gecerlilik_suresi: editForm.myk_gecerlilik_suresi ? parseInt(editForm.myk_gecerlilik_suresi) : null,
        sertifika_gecerlilik_suresi: editForm.sertifika_gecerlilik_suresi ? parseInt(editForm.sertifika_gecerlilik_suresi) : null,
        operator_belgesi_gecerlilik_suresi: editForm.operator_belgesi_gecerlilik_suresi ? parseInt(editForm.operator_belgesi_gecerlilik_suresi) : null,
        kkd_gecerlilik_suresi: editForm.kkd_gecerlilik_suresi ? parseInt(editForm.kkd_gecerlilik_suresi) : null,
        oryantasyon_gecerlilik_suresi: editForm.oryantasyon_gecerlilik_suresi ? parseInt(editForm.oryantasyon_gecerlilik_suresi) : null,
        saglik_raporu_gecerlilik_suresi: editForm.saglik_raporu_gecerlilik_suresi ? parseInt(editForm.saglik_raporu_gecerlilik_suresi) : null,
        kan_grubu: editForm.kan_grubu,
        kronik_rahatlik: editForm.kronik_rahatlik,
        yuksekte_calisir: !!editForm.yuksekte_calisir,
        yuksekte_calisamaz: !!editForm.yuksekte_calisamaz,
        gece_calisir: !!editForm.gece_calisir,
        gece_calisamaz: !!editForm.gece_calisamaz,
        vardiyali_calisir: !!editForm.vardiyali_calisir,
        vardiyali_calisamaz: !!editForm.vardiyali_calisamaz,
        notlar: editForm.notlar,
      });
      const oldValues = { ...editingPerson };
      const { error } = await supabase.from("personel").update(payload).eq("id", editingPerson.id);
      if (error) throw error;
      await uploadFiles();
      await saveEditMykEgitimler();
      await logAudit("personel", "UPDATE", editingPerson.id, oldValues, payload);
      setEditStatus({ type: "success", message: "Personel güncellendi!" });
    fetchPersonnel();
    } catch (err: any) {
      setEditStatus({ type: "error", message: err.message || "Güncelleme hatası" });
    } finally {
      setEditLoading(false);
    }
  };

  const deleteBelge = async (b: any) => {
    if (!confirm("Bu belgeyi silmek istediğinize emin misiniz?")) return;
    const urlParts = b.dosya_url.split("/personel-belgeleri/");
    if (urlParts.length > 1) {
      await supabase.storage.from("personel-belgeleri").remove([urlParts[1]]);
    }
    await supabase.from("personel_belgeleri").update({ silinme_tarihi: new Date().toISOString() }).eq("id", b.id);
    await logAudit("personel_belgeleri", "DELETE", b.id, b, null);
    fetchEditBelgeler(editingPerson.id);
  };

  const toggleLock = (id: string) => {
    setLockedFiles(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleLockPerson = (id: string) => {
    setLockedPersons(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSort = (col: string) => {
    if (sortCol === col) setSortDir(prev => prev === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  const sortArrow = (col: string) => {
    if (sortCol !== col) return null;
    return sortDir === "asc" ? <ArrowUp className="w-3 h-3 inline ml-1" /> : <ArrowDown className="w-3 h-3 inline ml-1" />;
  };

  const filtered = personnel.filter((p) => {
    const q = search.toLowerCase();
    const terms = q.split(/\s+/).filter(Boolean);
    if (terms.length === 0) return true;
    const fullName = `${p.ad || ""} ${p.soyad || ""}`.toLowerCase();
    return terms.every(
      (t) =>
        fullName.includes(t) ||
        p.kimlik_no?.toLowerCase().includes(t) ||
        p.santiye_adi?.toLowerCase().includes(t)
    );
  }).sort((a, b) => {
    let va = "", vb = "";
    if (sortCol === "ad") { va = (a.ad || "").toLowerCase(); vb = (b.ad || "").toLowerCase(); }
    else if (sortCol === "soyad") { va = (a.soyad || "").toLowerCase(); vb = (b.soyad || "").toLowerCase(); }
    else if (sortCol === "kimlik_no") { va = a.kimlik_no || ""; vb = b.kimlik_no || ""; }
    else if (sortCol === "santiye_adi") { va = (a.santiye_adi || "").toLowerCase(); vb = (b.santiye_adi || "").toLowerCase(); }
    else if (sortCol === "ise_giris_tarihi") { va = a.ise_giris_tarihi || ""; vb = b.ise_giris_tarihi || ""; }
    else if (sortCol === "created_at") { va = a.created_at || ""; vb = b.created_at || ""; }
    const cmp = va.localeCompare(vb);
    return sortDir === "asc" ? cmp : -cmp;
  });

  const arsivDegistir = async (v: boolean) => {
    setArsivGoster(v);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("personel").select("*")
        .eq("arsivde", v)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (data) setPersonnel(data);
    } catch (err) {
      console.error("Arşiv değiştirme hatası:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-8 app-bg min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Personel Listesi</h2>
          <p className="text-gray-500 mt-1">Toplam {personnel.length} kayıtlı personel</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
            <button onClick={() => arsivDegistir(false)} className={`px-3 py-1.5 text-xs flex items-center gap-1 transition ${!arsivGoster ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}>Aktif</button>
            <button onClick={() => arsivDegistir(true)} className={`px-3 py-1.5 text-xs flex items-center gap-1 transition ${arsivGoster ? "bg-amber-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}>Arşiv</button>
          </div>
          <Link href="/" className="btn btn-primary">
          <UserPlus className="w-4 h-4" />
          Yeni Personel
        </Link>
      </div>
    </div>

      <div className="card p-4 mb-6">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Personel ara (ad, TC, şantiye)..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pr-12" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin mr-2"></div>
          Yükleniyor...
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th className="cursor-pointer hover:text-gray-900 select-none" onClick={() => toggleSort("ad")}>Ad{sortArrow("ad")}</th>
                  <th className="cursor-pointer hover:text-gray-900 select-none" onClick={() => toggleSort("soyad")}>Soyad{sortArrow("soyad")}</th>
                  <th className="cursor-pointer hover:text-gray-900 select-none" onClick={() => toggleSort("kimlik_no")}>TC Kimlik No{sortArrow("kimlik_no")}</th>
                  <th className="cursor-pointer hover:text-gray-900 select-none" onClick={() => toggleSort("santiye_adi")}>Şantiye{sortArrow("santiye_adi")}</th>
                  <th>Telefon</th>
                  <th>E-posta</th>
                  <th>Öğrenim</th>
                  <th className="cursor-pointer hover:text-gray-900 select-none" onClick={() => toggleSort("ise_giris_tarihi")}>İşe Giriş{sortArrow("ise_giris_tarihi")}</th>
                  <th style={{ textAlign: "center" }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} onClick={() => openEdit(p)} className="cursor-pointer hover:bg-gray-50 transition align-middle">
                    <td className="font-medium text-gray-800 align-middle">{p.ad || "-"}</td>
                    <td className="font-medium text-gray-600 align-middle">{p.soyad || "-"}</td>
                    <td className="font-mono text-sm align-middle">{maskTC(p.kimlik_no)}</td>
                    <td className="text-gray-600 align-middle">{p.santiye_adi || "-"}</td>
                    <td className="text-gray-600 align-middle">{p.telefon || "-"}</td>
                    <td className="text-gray-600 align-middle">{p.email || "-"}</td>
                    <td className="text-gray-600 align-middle">{p.ogrenim_durumu || "-"}</td>
                    <td className="text-gray-500 align-middle">{displayDate(p.ise_giris_tarihi)}</td>
                    <td className="align-middle">
                      <div className="flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                        {arsivGoster ? (
                          <>
                            <button onClick={async () => { await supabase.from("personel").update({ arsivde: false, ayrilis_tarihi: null, ayrilis_nedeni: null }).eq("id", p.id); fetchPersonnel(); }} className="text-xs text-green-600 hover:text-green-800 px-2 py-1 rounded hover:bg-green-50 transition flex items-center gap-1 border border-green-200">
                              <Archive className="w-3.5 h-3.5" /> Geri Al
                            </button>
                            <div className="flex items-center gap-0.5">
                              <button type="button" onClick={() => toggleLockPerson(p.id)} className={`p-1 rounded border transition ${lockedPersons.has(p.id) ? "border-amber-400 bg-amber-50 text-amber-600 hover:bg-amber-100" : "border-gray-200 bg-gray-50 text-gray-400 hover:bg-gray-100"}`} title={lockedPersons.has(p.id) ? "Kilidi aç" : "Kilitli"}>
                                {lockedPersons.has(p.id) ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                              </button>
                              <button onClick={() => setDeleteModal({ open: true, id: p.id })} disabled={!lockedPersons.has(p.id)} className={`text-xs px-2 py-1 rounded transition flex items-center gap-1 ${lockedPersons.has(p.id) ? "text-red-600 hover:text-red-800 hover:bg-red-50" : "text-gray-300 cursor-not-allowed"}`}>
                                <Trash2 className="w-3.5 h-3.5" /> Sil
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <button onClick={() => openDetail(p)} className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" /> Detay
                            </button>
                            <button onClick={() => openEdit(p)} className="text-xs text-green-600 hover:text-green-800 px-2 py-1 rounded hover:bg-green-50 transition flex items-center gap-1">
                              <Edit className="w-3.5 h-3.5" /> Düzenle
                            </button>
                            <div className="flex items-center gap-0.5">
                              <button type="button" onClick={() => toggleLockPerson(p.id)} className={`p-1 rounded border transition ${lockedPersons.has(p.id) ? "border-amber-400 bg-amber-50 text-amber-600 hover:bg-amber-100" : "border-gray-200 bg-gray-50 text-gray-400 hover:bg-gray-100"}`} title={lockedPersons.has(p.id) ? "Kilidi aç" : "Kilitli"}>
                                {lockedPersons.has(p.id) ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                              </button>
                              <button onClick={() => setDeleteModal({ open: true, id: p.id })} disabled={!lockedPersons.has(p.id)} className={`text-xs px-2 py-1 rounded transition flex items-center gap-1 ${lockedPersons.has(p.id) ? "text-red-600 hover:text-red-800 hover:bg-red-50" : "text-gray-300 cursor-not-allowed"}`}>
                                <Trash2 className="w-3.5 h-3.5" /> Sil
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">Kayıt bulunamadı</div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedPerson && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPerson(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-800">Personel Detayı</h3>
              <button onClick={() => setSelectedPerson(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-2xl font-medium text-gray-600">{(selectedPerson.ad || "?").charAt(0)}</div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-800">{selectedPerson.ad} {selectedPerson.soyad || "-"}</h4>
                  <p className="text-gray-500">{maskTC(selectedPerson.kimlik_no)}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"><Phone className="w-4 h-4 text-gray-400" /><span className="text-sm">{selectedPerson.telefon || "-"}</span></div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"><Mail className="w-4 h-4 text-gray-400" /><span className="text-sm">{selectedPerson.email || "-"}</span></div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"><Building2 className="w-4 h-4 text-gray-400" /><span className="text-sm">{selectedPerson.santiye_adi || "-"}</span></div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"><Calendar className="w-4 h-4 text-gray-400" /><span className="text-sm">{selectedPerson.ogrenim_durumu || "-"}</span></div>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <h5 className="text-sm font-medium text-gray-500 mb-3">İSG Belgeleri</h5>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {EGITIM_FIELDS.map(f => {
                      const durum = getEgitimDurumu(selectedPerson, f);
                      const tarih = selectedPerson[f.tarihField];
                      const sure = selectedPerson[f.sureField];
                      return (
                        <div key={f.tarihField} className="p-2 bg-gray-50 rounded flex items-center gap-1.5">
                          <span className={`text-[10px] ${getDurumRenk(durum)}`}>{getDurumIcon(durum)}</span>
                          <span className="text-gray-500">{f.label}:</span>
                          <span className="text-gray-700">{displayDate(tarih)}{sure ? ` (${sure} yıl)` : ""}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {belgeler.length > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <h5 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-1"><Paperclip className="w-4 h-4" /> Ekli Belgeler ({belgeler.length})</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {belgeler.map((b: any) => (
                        <div key={b.id} className="card p-2 flex items-center gap-2">
                          {isImage(b.dosya_url) ? <img src={b.dosya_url} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" /> : <div className="w-10 h-10 rounded bg-amber-50 flex items-center justify-center flex-shrink-0"><FileDoc className="w-5 h-5 text-amber-500" /></div>}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate">{b.dosya_adi}</p>
                            <p className="text-[10px] text-gray-400">{belgeTipiLabel(b.belge_tipi)}{b.dosya_boyut ? ` • ${formatBytes(b.dosya_boyut)}` : ""}</p>
                          </div>
                          <a href={b.dosya_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 flex-shrink-0"><ExternalLink className="w-3.5 h-3.5" /></a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="pt-4 border-t border-gray-100">
                  <h5 className="text-sm font-medium text-gray-500 mb-3">Sağlık Durumu</h5>
                  <div className="flex gap-2">
                    {selectedPerson.yuksekte_calisamaz ? <span className="badge bg-red-100 text-red-700">Yüksekte Çalışamaz</span> : <span className="badge bg-green-100 text-green-700">Yüksekte Çalışır</span>}
                    {selectedPerson.kan_grubu && <span className="badge bg-gray-100 text-gray-600">Kan: {selectedPerson.kan_grubu}</span>}
                  </div>
                  {selectedPerson.kronik_rahatlik && <p className="text-sm text-gray-600 bg-red-50 p-3 rounded-lg mt-2"><strong>Kronik Rahatsızlık:</strong> {selectedPerson.kronik_rahatlik}</p>}
                  {(() => {
                    const srField = EGITIM_FIELDS.find(f => f.tarihField === "saglik_raporu_tarihi");
                    const durum = srField ? getEgitimDurumu(selectedPerson, srField) : null;
                    return (
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        {durum && <span className={`${getDurumRenk(durum)}`}>{getDurumIcon(durum)}</span>}
                        <strong>Sağlık Raporu Tarihi:</strong> {displayDate(selectedPerson.saglik_raporu_tarihi)}{selectedPerson.saglik_raporu_gecerlilik_suresi ? ` (${selectedPerson.saglik_raporu_gecerlilik_suresi} yıl)` : ""}
                      </p>
                    );
                  })()}
                </div>
                {selectedPerson.notlar && (
                  <div className="pt-4 border-t border-gray-100">
                    <h5 className="text-sm font-medium text-gray-500 mb-2">Notlar</h5>
                    <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">{selectedPerson.notlar}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingPerson && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => { setEditingPerson(null); setPendingFiles([]); }}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-base font-semibold text-gray-800">Personel Düzenle</h3>
              <button onClick={() => { setEditingPerson(null); setPendingFiles([]); }} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-2">
              {editStatus && (
                <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${editStatus.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {editStatus.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{editStatus.message}</span>
                </div>
              )}

              {/* Kişisel Bilgiler */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 w-12 shrink-0">Ad</label>
                  <input type="text" value={editForm.ad} onChange={e => setEditForm({...editForm, ad: e.target.value})} className="input text-xs flex-1 min-w-0" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 w-12 shrink-0">Soyad</label>
                  <input type="text" value={editForm.soyad} onChange={e => setEditForm({...editForm, soyad: e.target.value})} className="input text-xs flex-1 min-w-0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 w-12 shrink-0">Telefon</label>
                  <input type="text" value={editForm.telefon} onChange={e => setEditForm({...editForm, telefon: e.target.value})} className="input text-xs flex-1 min-w-0" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 w-12 shrink-0">E-posta</label>
                  <input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="input text-xs flex-1 min-w-0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 w-12 shrink-0">Öğrenim</label>
                  <select value={editForm.ogrenim_durumu} onChange={e => setEditForm({...editForm, ogrenim_durumu: e.target.value})} className="input text-xs flex-1 min-w-0"><option value="">Seç</option>{["İlkokul","Ortaokul","Lise","Önlisans","Lisans","Yüksek Lisans","Doktora"].map(o=><option key={o} value={o}>{o}</option>)}</select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 w-12 shrink-0">Şantiye</label>
                  <input type="text" value={editForm.santiye_adi} onChange={e => setEditForm({...editForm, santiye_adi: e.target.value})} className="input text-xs flex-1 min-w-0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 w-12 shrink-0">Meslek Kodu</label>
                  <input type="text" value={editForm.meslek_kodu} onChange={e => setEditForm({...editForm, meslek_kodu: e.target.value})} className="input text-xs flex-1 min-w-0" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 w-12 shrink-0">SGK Tarihi</label>
                  <input type="date" value={editForm.sgk_tarihi || ""} onChange={e => setEditForm({...editForm, sgk_tarihi: e.target.value})} className="input text-xs flex-1 min-w-0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 w-12 shrink-0">Ekip</label>
                  <input type="text" value={editForm.ekip_adi} onChange={e => setEditForm({...editForm, ekip_adi: e.target.value})} className="input text-xs flex-1 min-w-0" />
                </div>
              </div>

              <div className="pt-2 mt-2 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">İSG Tarihleri</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "İSG", field: "isg_egitim_tarihi", sureField: "isg_egitim_gecerlilik_suresi" },
                    { label: "Yüksekte", field: "yuksekte_calisma_tarihi", sureField: "yuksekte_calisma_gecerlilik_suresi" },
                    { label: "Sertifika", field: "sertifika_tarihi", sureField: "sertifika_gecerlilik_suresi" },
                    { label: "Operatör", field: "operator_belgesi_tarihi", sureField: "operator_belgesi_gecerlilik_suresi" },
                    { label: "KKD", field: "kkd_tarihi", sureField: "kkd_gecerlilik_suresi" },
                    { label: "Oryantasyon", field: "oryantasyon_tarihi", sureField: "oryantasyon_gecerlilik_suresi" },
                  ].map(item => (
                    <div key={item.field} className="flex items-center gap-1">
                      <label className="text-xs text-gray-500 w-12 shrink-0">{item.label}</label>
                      <input type="date" value={editForm[item.field] || ""} onChange={e => setEditForm({...editForm, [item.field]: e.target.value})} className="input text-xs flex-1 min-w-0" />
                      <select value={editForm[item.sureField] || ""} onChange={e => setEditForm({...editForm, [item.sureField]: e.target.value})} className="input text-xs" style={{ width: "3rem" }}>
                        <option value="">y</option>
                        {sureOptions.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <button type="button" onClick={() => setUploadModalField(item.field)} className={`p-1 rounded transition relative shrink-0 ${pendingFiles.filter(f => f.field === item.field).length > 0 ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-blue-600"}`} title="Dosya Ekle">
                        <Paperclip className="w-3.5 h-3.5" />
                        {pendingFiles.filter(f => f.field === item.field).length > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 text-white text-[8px] rounded-full flex items-center justify-center">{pendingFiles.filter(f => f.field === item.field).length}</span>}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 mt-2 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">MYK Eğitim Kayıtları</h4>
                <div className="flex items-start gap-1 mb-2">
                  <div className="flex-1 min-w-0">
                    <select value={mykSecim} onChange={(e) => setMykSecim(e.target.value)} className="input text-xs w-full">
                      <option value="">Eğitim seçiniz</option>
                      {mykEgitimListesi.filter(eg => mykZorunluIds.includes(eg.id)).map(eg => <option key={eg.id} value={eg.id}>{eg.ad}</option>)}
                      {mykShowAll && mykEgitimListesi.filter(eg => !mykZorunluIds.includes(eg.id)).length > 0 && <option disabled>──────────</option>}
                      {mykShowAll && mykEgitimListesi.filter(eg => !mykZorunluIds.includes(eg.id)).map(eg => <option key={eg.id} value={eg.id}>{eg.ad}</option>)}
                    </select>
                    {!mykShowAll && mykEgitimListesi.length > mykZorunluIds.length && (
                      <button type="button" onClick={() => setMykShowAll(true)} className="text-[10px] text-blue-500 hover:text-blue-700 mt-0.5">Tümünü Göster ({mykEgitimListesi.length})</button>
                    )}
                    {mykShowAll && (
                      <button type="button" onClick={() => setMykShowAll(false)} className="text-[10px] text-blue-500 hover:text-blue-700 mt-0.5">Sadece Zorunlu Göster</button>
                    )}
                  </div>
                  <input type="date" value={mykSecimTarih} onChange={(e) => setMykSecimTarih(e.target.value)} className="input text-xs" style={{ width: "4rem" }} />
                  <select value={mykSecimSure} onChange={(e) => setMykSecimSure(e.target.value)} className="input text-xs" style={{ width: "2.5rem" }}>
                    <option value="">y</option>
                    {sureOptions.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <button type="button" onClick={mykEkle} className="text-blue-600 hover:text-blue-800 p-0.5 shrink-0" title="Ekle"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg></button>
                </div>
                {mykKayitlar.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {mykKayitlar.map((k, i) => {
                      const eg = mykEgitimListesi.find(e => e.id === k.myk_egitim_id);
                      return (
                        <div key={i} className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 border border-blue-100 rounded text-[10px]">
                          <span className="text-blue-700 truncate max-w-24">{eg?.ad || k.myk_egitim_id}</span>
                          <span className="text-blue-400">|</span>
                          <span className="text-blue-600">{displayDate(k.alis_tarihi) || "?"}</span>
                          <span className="text-blue-400">|</span>
                          <span className="text-blue-600">{k.gecerlilik_suresi}y</span>
                          <button type="button" onClick={() => mykKaldir(i)} className="text-red-400 hover:text-red-600 ml-0.5"><X className="w-2.5 h-2.5" /></button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-2 mt-2 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Sağlık</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-gray-500 w-16 shrink-0">Sağlık Rap.</label>
                    <input type="date" value={editForm.saglik_raporu_tarihi || ""} onChange={e => setEditForm({...editForm, saglik_raporu_tarihi: e.target.value})} className="input text-xs flex-1 min-w-0" />
                    <select value={editForm.saglik_raporu_gecerlilik_suresi || ""} onChange={e => setEditForm({...editForm, saglik_raporu_gecerlilik_suresi: e.target.value})} className="input text-xs" style={{ width: "3rem" }}>
                      <option value="">y</option>
                      {sureOptions.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <button type="button" onClick={() => setUploadModalField("saglik_raporu_tarihi")} className={`p-1 rounded transition relative shrink-0 ${pendingFiles.filter(f => f.field === "saglik_raporu_tarihi").length > 0 ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-blue-600"}`} title="Dosya Ekle">
                      <Paperclip className="w-3.5 h-3.5" />
                      {pendingFiles.filter(f => f.field === "saglik_raporu_tarihi").length > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 text-white text-[8px] rounded-full flex items-center justify-center">{pendingFiles.filter(f => f.field === "saglik_raporu_tarihi").length}</span>}
                    </button>
                  </div>
                  {[
                    { label: "Yüksekte", canWork: "yuksekte_calisir", cannotWork: "yuksekte_calisamaz", uploadField: "yuksekte_calisamaz" },
                    { label: "Gece", canWork: "gece_calisir", cannotWork: "gece_calisamaz", uploadField: "gece_calisamaz" },
                    { label: "Vardiyalı", canWork: "vardiyali_calisir", cannotWork: "vardiyali_calisamaz", uploadField: "vardiyali_calisamaz" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-4 text-sm">
                      <span className="text-xs text-gray-700 w-16 shrink-0">{item.label}</span>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name={item.label} checked={(editForm as any)[item.canWork]} onChange={() => { setEditForm({...editForm, [item.canWork]: true, [item.cannotWork]: false}); }} className="w-4 h-4 accent-gray-600" />
                        <span className="text-gray-600 text-xs">Çalışır</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name={item.label} checked={(editForm as any)[item.cannotWork]} onChange={() => { setEditForm({...editForm, [item.cannotWork]: true, [item.canWork]: false}); }} className="w-4 h-4 accent-gray-600" />
                        <span className="text-gray-600 text-xs">Çalışamaz</span>
                      </label>
                      <button type="button" onClick={() => setUploadModalField(item.uploadField)} className={`p-1 rounded transition relative ${pendingFiles.filter(f => f.field === item.uploadField).length > 0 ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-gray-600"}`} title="Dosya Ekle">
                        <Paperclip className="w-3 h-3" />
                        {pendingFiles.filter(f => f.field === item.uploadField).length > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 text-white text-[8px] rounded-full flex items-center justify-center">{pendingFiles.filter(f => f.field === item.uploadField).length}</span>}
                      </button>
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500 w-12 shrink-0">Kan</label>
                      <select value={editForm.kan_grubu} onChange={e => setEditForm({...editForm, kan_grubu: e.target.value})} className="input text-xs flex-1 min-w-0"><option value="">Seç</option>{["A+","A-","B+","B-","AB+","AB-","0+","0-"].map(kg=><option key={kg} value={kg}>{kg}</option>)}</select>
                    </div>
                    <div className="flex items-center gap-2 col-span-2">
                      <label className="text-xs text-gray-500 w-12 shrink-0">Kronik</label>
                      <input type="text" value={editForm.kronik_rahatlik} onChange={e => setEditForm({...editForm, kronik_rahatlik: e.target.value})} className="input text-xs flex-1 min-w-0" placeholder="Varsa..." />
                    </div>
                  </div>
                </div>

                {/* Sağlık Raporu Pending Files */}
                {pendingFiles.filter(f => f.field === "saglik_raporu_tarihi").length > 0 && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-[10px] font-medium text-blue-700 mb-1">Sağlık Raporu - Yeni Dosyalar</p>
                    <div className="flex flex-wrap gap-1.5">
                      {pendingFiles.filter(f => f.field === "saglik_raporu_tarihi").map((pf, i) => {
                        const globalIdx = pendingFiles.indexOf(pf);
                        return (
                          <div key={i} className="flex items-center gap-1 px-1.5 py-1 bg-white rounded text-[10px]">
                            {pf.preview ? <ImageIcon className="w-2.5 h-2.5 text-blue-500" /> : <FileDoc className="w-2.5 h-2.5 text-amber-500" />}
                            <span className="truncate max-w-20">{pf.file.name}</span>
                            <button onClick={() => removePendingFile(globalIdx)} className="text-red-400 hover:text-red-600"><X className="w-2.5 h-2.5" /></button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Existing Files - Grouped by Type */}
              {editBelgeler.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><Paperclip className="w-4 h-4" /> Mevcut Belgeler ({editBelgeler.length})</h4>
                  {["isg_egitim", "yuksekte_calisma", "myk", "operator_belgesi", "kkd", "oryantasyon", "saglik_raporu", "sertifika", "yuksekte_calisamaz", "gece_calisamaz", "vardiyali_calisamaz"].map(tip => {
                    const tipFiles = editBelgeler.filter((b: any) => b.belge_tipi === tip);
                    if (tipFiles.length === 0) return null;
                    return (
                      <div key={tip} className="mb-2">
                        <p className="text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wide">{belgeTipiLabel(tip)}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {tipFiles.map((b: any) => (
                            <div key={b.id} className="card p-2 flex items-center gap-2">
                              <a href={b.dosya_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80 transition">
                                {isImage(b.dosya_url) ? <img src={b.dosya_url} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" /> : <div className="w-8 h-8 rounded bg-amber-50 flex items-center justify-center flex-shrink-0"><FileDoc className="w-4 h-4 text-amber-500" /></div>}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-800 truncate">{b.dosya_adi}</p>
                                  <p className="text-[10px] text-gray-400">{b.dosya_boyut ? formatBytes(b.dosya_boyut) : ""}</p>
                                </div>
                              </a>
                              <div className="flex items-center gap-1">
                                <button type="button" onClick={() => toggleLock(b.id)} className={`p-1.5 rounded border transition ${lockedFiles.has(b.id) ? "border-amber-400 bg-amber-50 text-amber-600 hover:bg-amber-100" : "border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100"}`} title={lockedFiles.has(b.id) ? "Kilidi aç" : "Kilitli"}>
                                  {lockedFiles.has(b.id) ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                </button>
                                <button type="button" onClick={() => deleteBelge(b)} disabled={!lockedFiles.has(b.id)} className={`p-1.5 rounded transition ${lockedFiles.has(b.id) ? "bg-red-50 text-red-500 hover:bg-red-100" : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {(() => {
                    const otherFiles = editBelgeler.filter((b: any) => !["isg_egitim", "yuksekte_calisma", "myk", "operator_belgesi", "kkd", "oryantasyon", "saglik_raporu", "sertifika"].includes(b.belge_tipi));
                    if (otherFiles.length === 0) return null;
                    return (
                      <div className="mb-2">
                        <p className="text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wide">Diğer</p>
                        <div className="grid grid-cols-2 gap-2">
                          {otherFiles.map((b: any) => (
                            <div key={b.id} className="card p-2 flex items-center gap-2">
                              {isImage(b.dosya_url) ? <img src={b.dosya_url} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" /> : <div className="w-8 h-8 rounded bg-amber-50 flex items-center justify-center flex-shrink-0"><FileDoc className="w-4 h-4 text-amber-500" /></div>}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-800 truncate">{b.dosya_adi}</p>
                                <p className="text-[10px] text-gray-400">{b.dosya_boyut ? formatBytes(b.dosya_boyut) : ""}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button type="button" onClick={() => toggleLock(b.id)} className={`p-1.5 rounded border transition ${lockedFiles.has(b.id) ? "border-amber-400 bg-amber-50 text-amber-600 hover:bg-amber-100" : "border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100"}`} title={lockedFiles.has(b.id) ? "Kilidi aç" : "Kilitli"}>
                                  {lockedFiles.has(b.id) ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                </button>
                                <button type="button" onClick={() => deleteBelge(b)} disabled={!lockedFiles.has(b.id)} className={`p-1.5 rounded transition ${lockedFiles.has(b.id) ? "bg-red-50 text-red-500 hover:bg-red-100" : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Pending Files */}
              {pendingFiles.length > 0 && (
                <div className="p-2 bg-blue-50 border border-blue-100 rounded-lg">
                  <p className="text-xs font-medium text-blue-700 mb-1">Yeni Dosyalar ({pendingFiles.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {pendingFiles.map((pf, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-white rounded text-xs">
                        {pf.preview ? <ImageIcon className="w-3 h-3 text-blue-500" /> : <FileDoc className="w-3 h-3 text-amber-500" />}
                        <span className="truncate max-w-24">{pf.file.name}</span>
                        <button onClick={() => removePendingFile(i)} className="text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => { setEditingPerson(null); setPendingFiles([]); }} className="btn text-sm" style={{background:"#f3f4f6",color:"#374151"}}>İptal</button>
                <button onClick={saveEdit} disabled={editLoading} className="btn btn-primary text-sm"><Save className="w-4 h-4" /> {editLoading ? "Kaydediliyor..." : "Kaydet"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Upload Modal */}
      {uploadModalField && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4" onClick={() => { setUploadModalField(null); setUploadDragOver(false); }}>
          <div className="bg-white rounded-2xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-800">Dosya Ekle</h3>
              <button onClick={() => { setUploadModalField(null); setUploadDragOver(false); }}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-4">
              <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${uploadDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"}`}>
                <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf" onChange={(e) => { if (e.target.files) addFiles(uploadModalField, Array.from(e.target.files)); e.target.value = ""; }} className="hidden" />
                <Upload className={`w-10 h-10 mx-auto mb-2 ${uploadDragOver ? "text-blue-500" : "text-gray-400"}`} />
                <p className="text-sm text-gray-600 font-medium">Sürükle-bırak veya tıklayarak seç</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF, WebP, PDF</p>
              </div>
              {pendingFiles.filter(f => f.field === uploadModalField).length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {pendingFiles.filter(f => f.field === uploadModalField).map((pf, i) => {
                    const globalIdx = pendingFiles.indexOf(pf);
                    return (
                      <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        {pf.preview ? <img src={pf.preview} alt="" className="w-6 h-6 rounded object-cover" /> : <FileDoc className="w-5 h-5 text-amber-500" />}
                        <span className="text-xs truncate flex-1">{pf.file.name}</span>
                        <button onClick={() => removePendingFile(globalIdx)} className="text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Silme Modalı */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDeleteModal({ open: false, id: "" })}>
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Personel Sil</h3>
              <button onClick={() => setDeleteModal({ open: false, id: "" })} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            {arsivGoster ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-gray-600 mb-2">Bu personel arşivden kalıcı olarak silinecektir. Onaylıyor musunuz?</p>
                <button onClick={() => deletePerson(deleteModal.id, "hatali_kayit")} className="w-full py-3 px-4 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition text-sm font-medium text-center">
                  Kalıcı Olarak Sil
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4">Bu personel için hangi işlemi yapmak istiyorsunuz?</p>
                <div className="flex flex-col gap-3">
                  <button onClick={() => deletePerson(deleteModal.id, "istirak_ayrilis")} className="w-full py-3 px-4 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition text-sm font-medium text-left">
                    <div className="font-semibold">İşten Ayrılış</div>
                    <div className="text-xs text-amber-500 mt-0.5">Personel arşive taşınır, veriler korunur</div>
                  </button>
                  <button onClick={() => deletePerson(deleteModal.id, "hatali_kayit")} className="w-full py-3 px-4 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition text-sm font-medium text-left">
                    <div className="font-semibold">Hatalı Kayıt</div>
                    <div className="text-xs text-red-500 mt-0.5">Personel tamamen silinir, geri alınamaz</div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
