"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeForm } from "@/lib/security";
import { logAudit } from "@/lib/audit";
import { displayDate } from "@/lib/tarih";
import { AlertOctagon, Plus, Search, Edit, Trash2, X, Eye, Upload, FileText, Image as ImageIcon, Download, Calendar, FolderOpen, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { sanitizeFileName, validateFileServer } from "@/lib/file-validation";

const ALLOWED_IMAGES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_DOCS = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/plain"];

function getFileType(mime: string): "gorsel" | "belge" | null {
  if (ALLOWED_IMAGES.includes(mime)) return "gorsel";
  if (ALLOWED_DOCS.includes(mime)) return "belge";
  return null;
}

function getFileExtension(name: string): string {
  return name.split(".").pop()?.toLowerCase() || "";
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

interface PivotRow {
  personel_id: string;
  ad: string;
  soyad: string;
  kimlik_no: string;
  ekip_adi: string;
  ihtarlar: { tarih: string; sebep: string; id: string }[];
  toplam: number;
  is_akdi_durumu: string;
}

const MAX_IHTAR = 3;

export default function IhtarTutanagi() {
  const [items, setItems] = useState<any[]>([]);
  const [personel, setPersonel] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ personel_id: "", tarih: "", konu: "", ekip_adi: "" });

  const [selectedIhtar, setSelectedIhtar] = useState<any>(null);
  const [dosyalar, setDosyalar] = useState<any[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadNeden, setUploadNeden] = useState("");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [editingDosya, setEditingDosya] = useState<any>(null);
  const [editNeden, setEditNeden] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [editStatus, setEditStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [personelDurum, setPersonelDurum] = useState<Record<string, string>>({});

  useEffect(() => { fetchItems(); fetchPersonel(); }, []);

  const fetchItems = async () => {
    const { data } = await supabase.from("ihtar_tutanagi").select("*, personel(ad, soyad, kimlik_no)").order("tarih", { ascending: false });
    if (data) {
      setItems(data);
      // Fetch personel is_akdi_durumu for all distinct personel_ids
      const pids = [...new Set(data.map(i => i.personel_id).filter(Boolean))];
      if (pids.length > 0) {
        const { data: personeller } = await supabase.from("personel").select("id, is_akdi_durumu").in("id", pids);
        if (personeller) {
          const map: Record<string, string> = {};
          personeller.forEach(p => { map[p.id] = p.is_akdi_durumu || "normal"; });
          setPersonelDurum(map);
        }
      }
    }
    setLoading(false);
  };

  const fetchPersonel = async () => {
    const { data } = await supabase.from("personel").select("id, ad, soyad").eq("arsivde", false);
    if (data) setPersonel(data);
  };

  const fetchDosyalar = async (ihtarId: string) => {
    const { data } = await supabase.from("ihtar_dosyalari").select("*").eq("ihtar_id", ihtarId).order("eklenme_tarihi", { ascending: false });
    if (data) setDosyalar(data);
  };

  const pivotData = useMemo<PivotRow[]>(() => {
    const grouped: Record<string, { personel_id: string; ad: string; soyad: string; kimlik_no: string; ihtarlar: { tarih: string; sebep: string; id: string }[]; ekip_adi: string }> = {};
    for (const item of items) {
      const pid = item.personel_id;
      if (!grouped[pid]) {
        grouped[pid] = {
          personel_id: pid,
          ad: item.personel?.ad || "",
          soyad: item.personel?.soyad || "",
          kimlik_no: item.personel?.kimlik_no || "",
          ekip_adi: item.ekip_adi || "",
          ihtarlar: [],
        };
      }
      grouped[pid].ihtarlar.push({
        tarih: item.tarih,
        sebep: item.konu || item.aciklama || "",
        id: item.id,
      });
      if (item.ekip_adi && !grouped[pid].ekip_adi) grouped[pid].ekip_adi = item.ekip_adi;
    }
    const rows = Object.values(grouped).map(g => {
      g.ihtarlar.sort((a, b) => new Date(a.tarih).getTime() - new Date(b.tarih).getTime());
      return { ...g, ihtarlar: g.ihtarlar.slice(0, MAX_IHTAR), toplam: g.ihtarlar.length, is_akdi_durumu: personelDurum[g.personel_id] || "normal" };
    });
    return rows;
  }, [items, personelDurum]);

  const filtered = useMemo(() => {
    if (!search) return pivotData;
    const q = search.toLowerCase();
    return pivotData.filter(r =>
      `${r.ad} ${r.soyad}`.toLowerCase().includes(q) ||
      r.kimlik_no.includes(q) ||
      r.ekip_adi.toLowerCase().includes(q)
    );
  }, [pivotData, search]);

  const handleSubmit = async () => {
    if (!form.personel_id || !form.tarih || !form.konu) return;
    setSaving(true);
    setEditStatus(null);
    try {
      const payload = sanitizeForm({ personel_id: form.personel_id, tarih: form.tarih, konu: form.konu, ekip_adi: form.ekip_adi || "" });
      if (editing) {
        const { error } = await supabase.from("ihtar_tutanagi").update(payload).eq("id", editing.id);
        if (error) throw error;
        await logAudit("ihtar_tutanagi", "UPDATE", editing.id, editing, payload);
        setEditStatus({ type: "success", message: "İhtar güncellendi" });
      } else {
        const { data, error } = await supabase.from("ihtar_tutanagi").insert(payload).select();
        if (error) throw error;
        if (data) await logAudit("ihtar_tutanagi", "INSERT", data[0].id, null, payload);

        // 3. ihtar kontrolü — iş akdi sonlandırma süreci
        const { data: ihtarCount } = await supabase.from("ihtar_tutanagi").select("id", { count: "exact", head: false }).eq("personel_id", form.personel_id);
        const count = ihtarCount?.length || 0;
        if (count >= 3) {
          const { data: person } = await supabase.from("personel").select("is_akdi_durumu").eq("id", form.personel_id).single();
          if (person && person.is_akdi_durumu === "normal") {
            await supabase.from("personel").update({ is_akdi_durumu: "sonlandirma_surecinde" }).eq("id", form.personel_id);
            await logAudit("personel", "UPDATE", form.personel_id, { is_akdi_durumu: "normal" }, { is_akdi_durumu: "sonlandirma_surecinde" });
            setEditStatus({ type: "success", message: `⚠️ ${count}. ihtar kaydedildi! Personelin iş akdi sonlandırma süreci başlatıldı.` });
          } else if (person && person.is_akdi_durumu === "sonlandirma_surecinde") {
            setEditStatus({ type: "success", message: `${count}. ihtar kaydedildi. İş akdi sonlandırma süreci devam ediyor.` });
          } else {
            setEditStatus({ type: "success", message: "İhtar kaydedildi" });
          }
        } else {
          setEditStatus({ type: "success", message: "İhtar kaydedildi" });
        }
      }
      setShowForm(false);
      setEditing(null);
      setForm({ personel_id: "", tarih: "", konu: "", ekip_adi: "" });
      fetchItems();
    } catch (e: any) {
      setEditStatus({ type: "error", message: e.message || "Kayıt işlemi başarısız" });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (i: any) => {
    setEditing(i);
    setForm({ personel_id: i.personel_id, tarih: i.tarih.split("T")[0], konu: i.konu, ekip_adi: i.ekip_adi || "" });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu ihtar tutanağını silmek istediğinize emin misiniz?")) return;
    setEditStatus(null);
    try {
      const { error } = await supabase.from("ihtar_tutanagi").delete().eq("id", id);
      if (error) throw error;
      await logAudit("ihtar_tutanagi", "DELETE", id, null, null);
      setEditStatus({ type: "success", message: "İhtar silindi" });
      fetchItems();
    } catch (e: any) {
      setEditStatus({ type: "error", message: e.message || "Silme işlemi başarısız" });
    }
  };

  const handleOpenIhtar = (row: PivotRow, ihtarIndex: number) => {
    const ihtar = row.ihtarlar[ihtarIndex];
    if (ihtar) {
      const fullItem = items.find(i => i.id === ihtar.id);
      if (fullItem) {
        setSelectedIhtar(fullItem);
        fetchDosyalar(fullItem.id);
        setShowUpload(false);
        setUploadFiles([]);
        setUploadNeden("");
        setEditingDosya(null);
      }
    }
  };

  const handleOpenAllForPerson = (row: PivotRow) => {
    const firstIhtar = items.find(i => i.personel_id === row.personel_id);
    if (firstIhtar) {
      setSelectedIhtar(firstIhtar);
      fetchDosyalar(firstIhtar.id);
      setShowUpload(false);
      setUploadFiles([]);
      setUploadNeden("");
      setEditingDosya(null);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    setUploadFiles(prev => [...prev, ...files.filter(f => getFileType(f.type) !== null)]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadFiles(prev => [...prev, ...files.filter(f => getFileType(f.type) !== null)]);
    }
  };

  const removeUploadFile = (index: number) => setUploadFiles(prev => prev.filter((_, i) => i !== index));

  const handleUpload = async () => {
    if (!selectedIhtar || uploadFiles.length === 0 || !uploadNeden.trim()) return;
    setSaving(true);
    setEditStatus(null);
    setUploading(true);
    try {
      for (const file of uploadFiles) {
        const serverValidation = await validateFileServer(file);
        if (!serverValidation.valid) { setEditStatus({ type: "error", message: `${file.name}: ${serverValidation.error || "Sunucu doğrulaması başarısız"}` }); continue; }
        const fileName = `${selectedIhtar.id}/${Date.now()}_${sanitizeFileName(file.name)}`;
        console.log("Uploading:", { original: file.name, sanitized: fileName, size: file.size, type: file.type });
        const { error: upErr } = await supabase.storage.from("ihtar-dosyalari").upload(fileName, file);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("ihtar-dosyalari").getPublicUrl(fileName);
        const { data: dosyaData, error: dosyaError } = await supabase.from("ihtar_dosyalari").insert(sanitizeForm({
          ihtar_id: selectedIhtar.id,
          dosya_url: urlData.publicUrl,
          dosya_adi: file.name,
          dosya_turu: getFileType(file.type),
          dosya_uzantisi: getFileExtension(file.name),
          dosya_boyut: file.size,
          neden: uploadNeden.trim(),
        })).select();
        if (dosyaError) throw dosyaError;
        if (dosyaData) await logAudit("ihtar_dosyalari", "INSERT", dosyaData[0].id, null, { ihtar_id: selectedIhtar.id, dosya_adi: file.name });
      }
      setUploadFiles([]);
      setUploadNeden("");
      setEditStatus({ type: "success", message: "Dosyalar yüklendi" });
      fetchDosyalar(selectedIhtar.id);
    } catch (err: any) {
      console.error("Upload error details:", err);
      setEditStatus({ type: "error", message: err.message || "Yükleme hatası" });
    } finally {
      setUploading(false);
      setSaving(false);
    }
  };

  const handleDeleteDosya = async (dosya: any) => {
    if (!confirm("Bu dosyayı silmek istediğinize emin misiniz?")) return;
    setEditStatus(null);
    try {
      const urlParts = dosya.dosya_url.split("/ihtar-dosyalari/");
      if (urlParts.length > 1) await supabase.storage.from("ihtar-dosyalari").remove([urlParts[1]]);
      const { error } = await supabase.from("ihtar_dosyalari").update({ silinme_tarihi: new Date().toISOString() }).eq("id", dosya.id);
      if (error) throw error;
      await logAudit("ihtar_dosyalari", "DELETE", dosya.id, dosya, null);
      setEditStatus({ type: "success", message: "Dosya silindi" });
      fetchDosyalar(selectedIhtar.id);
    } catch (e: any) {
      setEditStatus({ type: "error", message: e.message || "Silme işlemi başarısız" });
    }
  };

  const handleEditDosya = async () => {
    if (!editingDosya || !editNeden.trim()) return;
    setSaving(true);
    setEditStatus(null);
    try {
      const payload = sanitizeForm({ neden: editNeden.trim(), guncelleme_tarihi: new Date().toISOString() });
      const { error } = await supabase.from("ihtar_dosyalari").update(payload).eq("id", editingDosya.id);
      if (error) throw error;
      await logAudit("ihtar_dosyalari", "UPDATE", editingDosya.id, editingDosya, payload);
      setEditStatus({ type: "success", message: "Dosya güncellendi" });
      setEditingDosya(null);
      setEditNeden("");
      fetchDosyalar(selectedIhtar.id);
    } catch (e: any) {
      setEditStatus({ type: "error", message: e.message || "Güncelleme başarısız" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex-1 p-8 flex items-center justify-center text-gray-400">Yükleniyor...</div>;

  const getRowStyle = (toplam: number) => {
    if (toplam >= 3) return "bg-red-600 text-white font-bold";
    if (toplam === 2) return "bg-[#FCE4D6]";
    if (toplam === 1) return "bg-yellow-50";
    return "";
  };

  const getTextStyle = (toplam: number) => {
    if (toplam >= 3) return "text-white";
    return "";
  };

  return (
    <div className="flex-1 p-6 bg-gray-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <AlertOctagon className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">İş Güvenliği İhtar ve İhlal Takip Tablosu</h2>
              <p className="text-sm text-gray-500">Toplam {items.length} ihtar kaydı — {pivotData.length} personel</p>
            </div>
          </div>
          <button onClick={() => { setShowForm(true); setEditing(null); setForm({ personel_id: "", tarih: "", konu: "", ekip_adi: "" }); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Yeni İhtar
          </button>
        </div>

        {editStatus && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm border ${editStatus.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
            {editStatus.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {editStatus.message}
          </div>
        )}

        <div className="card p-4 mb-6">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Personel adı, TC kimlik veya ekip adı ile ara..." value={search} onChange={e => setSearch(e.target.value)} className="input pr-12" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="w-full min-w-[1300px] text-sm">
            <thead>
              <tr className="bg-[#f0ece4]">
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-800 uppercase whitespace-nowrap border-b border-gray-300">KİMLİK NUMARASI</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-800 uppercase whitespace-nowrap border-b border-gray-300">AD</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-800 uppercase whitespace-nowrap border-b border-gray-300">SOYAD</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-800 uppercase whitespace-nowrap border-b border-gray-300">EKİP ADI</th>
                <th className="px-3 py-3 text-center text-xs font-bold text-gray-800 uppercase whitespace-nowrap border-b border-gray-300">TARİH (1. İhtar)</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-800 uppercase whitespace-nowrap border-b border-gray-300">İHTAR SEBEBİ (1)</th>
                <th className="px-3 py-3 text-center text-xs font-bold text-gray-800 uppercase whitespace-nowrap border-b border-gray-300">TARİH (2. İhtar)</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-800 uppercase whitespace-nowrap border-b border-gray-300">İHTAR SEBEBİ (2)</th>
                <th className="px-3 py-3 text-center text-xs font-bold text-gray-800 uppercase whitespace-nowrap border-b border-gray-300">TARİH (3. İhtar)</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-800 uppercase whitespace-nowrap border-b border-gray-300">İHTAR SEBEBİ (3)</th>
                <th className="px-3 py-3 text-center text-xs font-bold text-gray-800 uppercase whitespace-nowrap border-b border-gray-300">İHTAR SAYISI</th>
                <th className="px-3 py-3 text-center text-xs font-bold text-gray-800 uppercase whitespace-nowrap border-b border-gray-300">İŞ AKDİ DURUMU</th>
                <th className="px-3 py-3 text-center text-xs font-bold text-gray-800 uppercase whitespace-nowrap border-b border-gray-300">İŞLEM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((row) => {
                const style = getRowStyle(row.toplam);
                const textStyle = getTextStyle(row.toplam);
                return (
                  <tr key={row.personel_id} className={`${style} hover:opacity-90 transition`}>
                    <td className={`px-3 py-2.5 whitespace-nowrap font-medium ${textStyle}`}>{row.kimlik_no || "-"}</td>
                    <td className={`px-3 py-2.5 whitespace-nowrap ${textStyle}`}>{row.ad}</td>
                    <td className={`px-3 py-2.5 whitespace-nowrap ${textStyle}`}>{row.soyad}</td>
                    <td className={`px-3 py-2.5 whitespace-nowrap ${textStyle}`}>{row.ekip_adi || "-"}</td>
                    {[0, 1, 2].map(idx => {
                      const ihtar = row.ihtarlar[idx];
                      return [
                        <td key={`t${idx}`} className={`px-3 py-2.5 text-center whitespace-nowrap ${textStyle}`}>
                          {ihtar ? displayDate(ihtar.tarih) : ""}
                        </td>,
                        <td key={`s${idx}`} className={`px-3 py-2.5 max-w-[200px] truncate ${textStyle}`} title={ihtar?.sebep || ""}>
                          {ihtar?.sebep || ""}
                        </td>,
                      ];
                    })}
                    <td className={`px-3 py-2.5 text-center whitespace-nowrap font-bold ${textStyle}`}>
                      {row.toplam}
                    </td>
                    <td className={`px-3 py-2.5 text-center whitespace-nowrap ${textStyle}`}>
                      {row.is_akdi_durumu === "sonlandi" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-700 text-white text-[10px] font-bold">SONLANDI</span>
                      ) : row.is_akdi_durumu === "sonlandirma_surecinde" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-500 text-white text-[10px] font-bold">SÜREÇ DEVAM EDİYOR</span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => handleOpenAllForPerson(row)} className={`p-1 rounded hover:bg-white/50 ${textStyle === "text-white" ? "text-white/70 hover:text-white" : "text-gray-500"}`} title="Tümünü Gör">
                          <Eye className="w-4 h-4" />
                        </button>
                        {row.ihtarlar[0] && (
                          <button onClick={() => handleOpenIhtar(row, 0)} className={`p-1 rounded hover:bg-white/50 ${textStyle === "text-white" ? "text-white/70 hover:text-white" : "text-gray-500"}`} title="Düzenle">
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {row.ihtarlar[0] && (
                          <button onClick={() => handleDelete(row.ihtarlar[0].id)} className={`p-1 rounded hover:bg-white/50 ${textStyle === "text-white" ? "text-white/70 hover:text-white" : "text-red-500"}`} title="Sil">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={13} className="text-center py-8 text-gray-400">Kayıt bulunamadı</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* İhtar Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? "İhtar Düzenle" : "Yeni İhtar Tutanağı"}</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="modal-body space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Personel *</label>
                <select value={form.personel_id} onChange={e => setForm({ ...form, personel_id: e.target.value })} className="w-full p-2 border rounded-lg">
                  <option value="">Seçiniz</option>
                  {personel.map(p => <option key={p.id} value={p.id}>{p.ad} {p.soyad}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Ekip Adı</label>
                <input type="text" value={form.ekip_adi} onChange={e => setForm({ ...form, ekip_adi: e.target.value })} placeholder="Taşeron / ekip / yönetici" className="w-full p-2 border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">İhtar Tarihi *</label>
                  <input type="date" value={form.tarih} onChange={e => setForm({ ...form, tarih: e.target.value })} className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">İhtar Sebebi *</label>
                  <input type="text" value={form.konu} onChange={e => setForm({ ...form, konu: e.target.value })} placeholder="İhlal açıklaması" className="w-full p-2 border rounded-lg" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200">İptal</button>
                <button onClick={handleSubmit} disabled={saving || !form.personel_id || !form.tarih || !form.konu} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">{saving ? "Kaydediliyor..." : (editing ? "Güncelle" : "Kaydet")}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* İhtar Detay + Dosya Yönetimi Modal */}
      {selectedIhtar && (
        <div className="modal-overlay" onClick={() => { setSelectedIhtar(null); setShowUpload(false); setEditingDosya(null); }}>
          <div className="modal-content max-w-4xl" style={{ maxHeight: "90vh" }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>İhtar Detayı — {selectedIhtar.personel ? `${selectedIhtar.personel.ad || ""} ${selectedIhtar.personel.soyad || ""}`.trim() : ""}</h3>
                <p className="text-xs text-gray-500 mt-1">{selectedIhtar.konu} — {displayDate(selectedIhtar.tarih)}</p>
              </div>
              <button onClick={() => { setSelectedIhtar(null); setShowUpload(false); setEditingDosya(null); }}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="modal-body">
              {!showUpload && !editingDosya && (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-6 text-sm">
                    <div className="p-3 bg-gray-50 rounded-lg"><span className="text-gray-500">Tarih:</span> <strong>{displayDate(selectedIhtar.tarih)}</strong></div>
                    <div className="p-3 bg-gray-50 rounded-lg"><span className="text-gray-500">Sebep:</span> <strong>{selectedIhtar.konu}</strong></div>
                    <div className="p-3 bg-gray-50 rounded-lg"><span className="text-gray-500">Ekip:</span> <strong>{selectedIhtar.ekip_adi || "-"}</strong></div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-800">Ek Dosyalar ({dosyalar.filter(d => !d.silinme_tarihi).length})</h4>
                    <button onClick={() => setShowUpload(true)} className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-blue-700"><Upload className="w-3.5 h-3.5" /> Dosya Yükle</button>
                  </div>

                  {dosyalar.length === 0 && <div className="text-center py-8 text-gray-400"><FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-50" /><p className="text-sm">Henüz dosya eklenmemiş</p></div>}

                  {dosyalar.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {dosyalar.map(d => (
                        <div key={d.id} className={`p-4 border rounded-lg ${d.silinme_tarihi ? "opacity-50" : ""}`}>
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${d.dosya_turu === "gorsel" ? "bg-blue-100" : "bg-amber-100"}`}>
                              {d.dosya_turu === "gorsel" ? <ImageIcon className="w-5 h-5 text-blue-600" /> : <FileText className="w-5 h-5 text-amber-600" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{d.dosya_adi}</p>
                              <p className="text-xs text-gray-500 mt-0.5">.{d.dosya_uzantisi} {d.dosya_boyut ? `— ${formatBytes(d.dosya_boyut)}` : ""}</p>
                              {d.neden && <p className="mt-1 text-xs text-gray-600 bg-gray-50 p-1.5 rounded">{d.neden}</p>}
                            </div>
                          </div>
                          {!d.silinme_tarihi && (
                            <div className="flex gap-1 mt-3 pt-3 border-t border-gray-100">
                              <a href={d.dosya_url} target="_blank" rel="noopener noreferrer" className="flex-1 text-center text-xs px-2 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition flex items-center justify-center gap-1"><Eye className="w-3 h-3" /> Göster</a>
                              <button onClick={() => { setEditingDosya(d); setEditNeden(d.neden || ""); }} className="flex-1 text-center text-xs px-2 py-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition flex items-center justify-center gap-1"><Edit className="w-3 h-3" /> Düzenle</button>
                              <button onClick={() => handleDeleteDosya(d)} className="flex-1 text-center text-xs px-2 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition flex items-center justify-center gap-1"><Trash2 className="w-3 h-3" /> Sil</button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {showUpload && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-800">Dosya Yükle</h4>
                    <button onClick={() => { setShowUpload(false); setUploadFiles([]); setUploadNeden(""); }} className="text-sm text-gray-500 hover:text-gray-700">← Geri</button>
                  </div>
                  <div ref={dropRef} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"}`}>
                    <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" onChange={handleFileSelect} className="hidden" />
                    <Upload className={`w-10 h-10 mx-auto mb-3 ${dragOver ? "text-blue-500" : "text-gray-400"}`} />
                    <p className="text-sm text-gray-600 font-medium">Dosyaları sürükleyip bırakın veya tıklayarak seçin</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG, GIF, WebP</p>
                  </div>
                  {uploadFiles.length > 0 && (
                    <div className="mt-4">
                      <label className="text-sm text-gray-600 mb-1.5 block">Yükleme Nedeni *</label>
                      <textarea value={uploadNeden} onChange={e => setUploadNeden(e.target.value)} className="w-full p-2 border rounded-lg h-16 resize-none text-sm mb-3" placeholder="Dosyaların eklenme nedenini yazınız..." />
                      <div className="space-y-2">
                        {uploadFiles.map((f, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className={`w-8 h-8 rounded flex items-center justify-center ${getFileType(f.type) === "gorsel" ? "bg-blue-100" : "bg-amber-100"}`}>
                              {getFileType(f.type) === "gorsel" ? <ImageIcon className="w-4 h-4 text-blue-600" /> : <FileText className="w-4 h-4 text-amber-600" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{f.name}</p>
                              <p className="text-xs text-gray-500">{formatBytes(f.size)}</p>
                            </div>
                            <button onClick={() => removeUploadFile(i)} className="p-1 rounded hover:bg-red-50 text-red-500"><X className="w-4 h-4" /></button>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <button onClick={() => { setShowUpload(false); setUploadFiles([]); setUploadNeden(""); }} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200">İptal</button>
                        <button onClick={handleUpload} disabled={saving || uploading || !uploadNeden.trim()} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">{uploading ? "Yükleniyor..." : `${uploadFiles.length} Dosya Yükle`}</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {editingDosya && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-800">Dosya Düzenle</h4>
                    <button onClick={() => { setEditingDosya(null); setEditNeden(""); }} className="text-sm text-gray-500 hover:text-gray-700">← Geri</button>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded flex items-center justify-center ${editingDosya.dosya_turu === "gorsel" ? "bg-blue-100" : "bg-amber-100"}`}>
                        {editingDosya.dosya_turu === "gorsel" ? <ImageIcon className="w-5 h-5 text-blue-600" /> : <FileText className="w-5 h-5 text-amber-600" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{editingDosya.dosya_adi}</p>
                        <p className="text-xs text-gray-500">.{editingDosya.dosya_uzantisi} {editingDosya.dosya_boyut ? `— ${formatBytes(editingDosya.dosya_boyut)}` : ""}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-600 mb-1.5 block">Neden</label>
                      <textarea value={editNeden} onChange={e => setEditNeden(e.target.value)} className="w-full p-2 border rounded-lg h-20 resize-none text-sm" placeholder="Dosyanın eklenme nedenini düzenleyin..." />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button onClick={() => { setEditingDosya(null); setEditNeden(""); }} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200">İptal</button>
                      <button onClick={handleEditDosya} disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">{saving ? "Kaydediliyor..." : "Güncelle"}</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
