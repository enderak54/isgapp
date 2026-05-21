"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Search, Edit, Trash2, UserPlus, Eye, X, Phone, Mail, Building2, Calendar, FileText as FileDoc, Image as ImageIcon, Paperclip, ExternalLink, Upload, Save, CheckCircle, AlertCircle } from "lucide-react";
import { maskTC, sanitizeForm } from "@/lib/security";
import Link from "next/link";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchPersonnel(); }, []);

  const fetchPersonnel = async () => {
    const { data } = await supabase.from("personel").select("*").order("created_at", { ascending: false });
    if (data) setPersonnel(data);
    setLoading(false);
  };

  const deletePerson = async (id: string) => {
    if (confirm("Bu personeli silmek istediğinize emin misiniz?")) {
      await supabase.from("personel").delete().eq("id", id);
      fetchPersonnel();
    }
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

  const openEdit = (p: any) => {
    setEditingPerson(p);
    setEditForm({
      ad_soyad: p.ad_soyad || "",
      telefon: p.telefon || "",
      email: p.email || "",
      ogrenim_durumu: p.ogrenim_durumu || "",
      santiye_adi: p.santiye_adi || "",
      ekip_adi: p.ekip_adi || "",
      meslek_kodu: p.meslek_kodu || "",
      ise_giris_tarihi: p.ise_giris_tarihi || "",
      isg_egitim_tarihi: p.isg_egitim_tarihi || "",
      yuksekte_calisma_tarihi: p.yuksekte_calisma_tarihi || "",
      myk_tarihi: p.myk_tarihi || "",
      operator_belgesi_tarihi: p.operator_belgesi_tarihi || "",
      kkd_tarihi: p.kkd_tarihi || "",
      oryantasyon_tarihi: p.oryantasyon_tarihi || "",
      saglik_raporu_tarihi: p.saglik_raporu_tarihi || "",
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
    fetchEditBelgeler(p.id);
  };

  const fetchEditBelgeler = async (personelId: string) => {
    const { data } = await supabase.from("personel_belgeleri").select("*").eq("personel_id", personelId).is("silinme_tarihi", null).order("eklenme_tarihi", { ascending: false });
    if (data) setEditBelgeler(data);
  };

  const belgeTipiLabel = (tip: string) => {
    const labels: Record<string, string> = { isg_egitim: "İSG Eğitim", yuksekte_calisma: "Yüksekte Çalışma", myk: "MYK", operator_belgesi: "Operatör Belgesi", kkd: "KKD", oryantasyon: "Oryantasyon", saglik_raporu: "Sağlık Raporu", diger: "Diğer" };
    return labels[tip] || tip;
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

  const saveEdit = async () => {
    setEditLoading(true);
    setEditStatus(null);
    try {
      const payload = sanitizeForm({
        ad_soyad: editForm.ad_soyad,
        telefon: editForm.telefon,
        email: editForm.email,
        ogrenim_durumu: editForm.ogrenim_durumu,
        santiye_adi: editForm.santiye_adi,
        ekip_adi: editForm.ekip_adi,
        meslek_kodu: editForm.meslek_kodu,
        ise_giris_tarihi: editForm.ise_giris_tarihi || null,
        isg_egitim_tarihi: editForm.isg_egitim_tarihi || null,
        yuksekte_calisma_tarihi: editForm.yuksekte_calisma_tarihi || null,
        myk_tarihi: editForm.myk_tarihi || null,
        operator_belgesi_tarihi: editForm.operator_belgesi_tarihi || null,
        kkd_tarihi: editForm.kkd_tarihi || null,
        oryantasyon_tarihi: editForm.oryantasyon_tarihi || null,
        saglik_raporu_tarihi: editForm.saglik_raporu_tarihi || null,
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
      const { error } = await supabase.from("personel").update(payload).eq("id", editingPerson.id);
      if (error) throw error;
      await uploadFiles();
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
    fetchEditBelgeler(editingPerson.id);
  };

  const filtered = personnel.filter(
    (p) =>
      p.ad_soyad?.toLowerCase().includes(search.toLowerCase()) ||
      p.kimlik_no?.includes(search) ||
      p.santiye_adi?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="flex-1 p-8 app-bg min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Personel Listesi</h2>
          <p className="text-gray-500 mt-1">Toplam {personnel.length} kayıtlı personel</p>
        </div>
        <Link href="/" className="btn btn-primary">
          <UserPlus className="w-4 h-4" />
          Yeni Personel
        </Link>
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
                  <th>Ad Soyad</th>
                  <th>TC Kimlik No</th>
                  <th>Şantiye</th>
                  <th>Telefon</th>
                  <th>E-posta</th>
                  <th>Öğrenim</th>
                  <th>İşe Giriş</th>
                  <th style={{ textAlign: "center" }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium text-gray-800">{p.ad_soyad || "-"}</td>
                    <td className="font-mono text-sm">{maskTC(p.kimlik_no)}</td>
                    <td className="text-gray-600">{p.santiye_adi || "-"}</td>
                    <td className="text-gray-600">{p.telefon || "-"}</td>
                    <td className="text-gray-600">{p.email || "-"}</td>
                    <td className="text-gray-600">{p.ogrenim_durumu || "-"}</td>
                    <td className="text-gray-500">{p.ise_giris_tarihi || "-"}</td>
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openDetail(p)} className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" /> Detay
                        </button>
                        <button onClick={() => openEdit(p)} className="text-xs text-green-600 hover:text-green-800 px-2 py-1 rounded hover:bg-green-50 transition flex items-center gap-1">
                          <Edit className="w-3.5 h-3.5" /> Düzenle
                        </button>
                        <button onClick={() => deletePerson(p.id)} className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50 transition flex items-center gap-1">
                          <Trash2 className="w-3.5 h-3.5" /> Sil
                        </button>
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
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-2xl font-medium text-gray-600">{(selectedPerson.ad_soyad || "?").charAt(0)}</div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-800">{selectedPerson.ad_soyad || "-"}</h4>
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
                    <div className="p-2 bg-gray-50 rounded"><span className="text-gray-500">İSG Eğitim:</span> {selectedPerson.isg_egitim_tarihi || "-"}</div>
                    <div className="p-2 bg-gray-50 rounded"><span className="text-gray-500">Yüksekte:</span> {selectedPerson.yuksekte_calisma_tarihi || "-"}</div>
                    <div className="p-2 bg-gray-50 rounded"><span className="text-gray-500">MYK:</span> {selectedPerson.myk_tarihi || "-"}</div>
                    <div className="p-2 bg-gray-50 rounded"><span className="text-gray-500">Operatör:</span> {selectedPerson.operator_belgesi_tarihi || "-"}</div>
                    <div className="p-2 bg-gray-50 rounded"><span className="text-gray-500">KKD:</span> {selectedPerson.kkd_tarihi || "-"}</div>
                    <div className="p-2 bg-gray-50 rounded"><span className="text-gray-500">Oryantasyon:</span> {selectedPerson.oryantasyon_tarihi || "-"}</div>
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
                  {selectedPerson.saglik_raporu_tarihi && <p className="text-xs text-gray-500 mt-2"><strong>Sağlık Raporu Tarihi:</strong> {selectedPerson.saglik_raporu_tarihi}</p>}
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
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-800">Personel Düzenle</h3>
              <button onClick={() => { setEditingPerson(null); setPendingFiles([]); }} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {editStatus && (
                <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${editStatus.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {editStatus.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{editStatus.message}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-gray-600 mb-1 block">Ad Soyad</label><input type="text" value={editForm.ad_soyad} onChange={e => setEditForm({...editForm, ad_soyad: e.target.value})} className="input" /></div>
                <div><label className="text-sm text-gray-600 mb-1 block">Telefon</label><input type="text" value={editForm.telefon} onChange={e => setEditForm({...editForm, telefon: e.target.value})} className="input" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-gray-600 mb-1 block">E-posta</label><input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="input" /></div>
                <div><label className="text-sm text-gray-600 mb-1 block">Öğrenim Durumu</label><select value={editForm.ogrenim_durumu} onChange={e => setEditForm({...editForm, ogrenim_durumu: e.target.value})} className="input"><option value="">Seçiniz</option>{["İlkokul","Ortaokul","Lise","Önlisans","Lisans","Yüksek Lisans","Doktora"].map(o=><option key={o} value={o}>{o}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-gray-600 mb-1 block">Şantiye</label><input type="text" value={editForm.santiye_adi} onChange={e => setEditForm({...editForm, santiye_adi: e.target.value})} className="input" /></div>
                <div><label className="text-sm text-gray-600 mb-1 block">Ekip</label><input type="text" value={editForm.ekip_adi} onChange={e => setEditForm({...editForm, ekip_adi: e.target.value})} className="input" /></div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">İSG Tarihleri</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "İSG Eğitim", field: "isg_egitim_tarihi" },
                    { label: "Yüksekte Çalışma", field: "yuksekte_calisma_tarihi" },
                    { label: "MYK", field: "myk_tarihi" },
                    { label: "Operatör Belgesi", field: "operator_belgesi_tarihi" },
                    { label: "KKD", field: "kkd_tarihi" },
                    { label: "Oryantasyon", field: "oryantasyon_tarihi" },
                  ].map(item => (
                    <div key={item.field} className="flex items-center gap-2">
                      <label className="text-xs text-gray-500 w-28">{item.label}</label>
                      <input type="date" value={editForm[item.field] || ""} onChange={e => setEditForm({...editForm, [item.field]: e.target.value})} className="input text-xs" style={{width: "auto", flex: 1}} />
                      <button type="button" onClick={() => setUploadModalField(item.field)} className="p-1 rounded text-gray-400 hover:text-blue-600"><Paperclip className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Sağlık</h4>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-gray-500 whitespace-nowrap">Sağlık Raporu</label>
                    <input type="date" value={editForm.saglik_raporu_tarihi || ""} onChange={e => setEditForm({...editForm, saglik_raporu_tarihi: e.target.value})} className="input text-xs" style={{width: "auto"}} />
                    <button type="button" onClick={() => setUploadModalField("saglik_raporu_tarihi")} className={`p-1 rounded transition relative ${pendingFiles.filter(f => f.field === "saglik_raporu_tarihi").length > 0 ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-blue-600"}`} title="Dosya Ekle">
                      <Paperclip className="w-3.5 h-3.5" />
                      {pendingFiles.filter(f => f.field === "saglik_raporu_tarihi").length > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 text-white text-[8px] rounded-full flex items-center justify-center">{pendingFiles.filter(f => f.field === "saglik_raporu_tarihi").length}</span>}
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-gray-500 whitespace-nowrap">Kan</label>
                    <select value={editForm.kan_grubu} onChange={e => setEditForm({...editForm, kan_grubu: e.target.value})} className="input text-xs" style={{width: "auto"}}><option value="">Seç</option>{["A+","A-","B+","B-","AB+","AB-","0+","0-"].map(kg=><option key={kg} value={kg}>{kg}</option>)}</select>
                  </div>
                  <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                    <label className="text-xs text-gray-500 whitespace-nowrap">Kronik</label>
                    <input type="text" value={editForm.kronik_rahatlik} onChange={e => setEditForm({...editForm, kronik_rahatlik: e.target.value})} className="input text-xs flex-1" placeholder="Varsa..." />
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
                  {["isg_egitim", "yuksekte_calisma", "myk", "operator_belgesi", "kkd", "oryantasyon", "saglik_raporu"].map(tip => {
                    const tipFiles = editBelgeler.filter((b: any) => b.belge_tipi === tip);
                    if (tipFiles.length === 0) return null;
                    return (
                      <div key={tip} className="mb-3">
                        <p className="text-[10px] font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">{belgeTipiLabel(tip)}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {tipFiles.map((b: any) => (
                            <div key={b.id} className="card p-2 flex items-center gap-2">
                              {isImage(b.dosya_url) ? <img src={b.dosya_url} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" /> : <div className="w-8 h-8 rounded bg-amber-50 flex items-center justify-center flex-shrink-0"><FileDoc className="w-4 h-4 text-amber-500" /></div>}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-800 truncate">{b.dosya_adi}</p>
                                <p className="text-[10px] text-gray-400">{b.dosya_boyut ? formatBytes(b.dosya_boyut) : ""}</p>
                              </div>
                              <button onClick={() => deleteBelge(b)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {(() => {
                    const otherFiles = editBelgeler.filter((b: any) => !["isg_egitim", "yuksekte_calisma", "myk", "operator_belgesi", "kkd", "oryantasyon", "saglik_raporu"].includes(b.belge_tipi));
                    if (otherFiles.length === 0) return null;
                    return (
                      <div className="mb-3">
                        <p className="text-[10px] font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Diğer</p>
                        <div className="grid grid-cols-2 gap-2">
                          {otherFiles.map((b: any) => (
                            <div key={b.id} className="card p-2 flex items-center gap-2">
                              {isImage(b.dosya_url) ? <img src={b.dosya_url} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" /> : <div className="w-8 h-8 rounded bg-amber-50 flex items-center justify-center flex-shrink-0"><FileDoc className="w-4 h-4 text-amber-500" /></div>}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-800 truncate">{b.dosya_adi}</p>
                                <p className="text-[10px] text-gray-400">{b.dosya_boyut ? formatBytes(b.dosya_boyut) : ""}</p>
                              </div>
                              <button onClick={() => deleteBelge(b)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
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
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <p className="text-xs font-medium text-blue-700 mb-2">Yeni Dosyalar ({pendingFiles.length})</p>
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
    </main>
  );
}
