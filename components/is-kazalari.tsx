"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeForm } from "@/lib/security";
import { validateFile, sanitizeFileName } from "@/lib/file-validation";
import { logAudit } from "@/lib/audit";
import { displayDate, formatDate } from "@/lib/tarih";
import {
  AlertTriangle, Plus, Edit, Trash2, Search, X, Save,
  CheckCircle, AlertCircle, Loader2, Upload, ExternalLink, FileText
} from "lucide-react";

const DOSYA_TIPLERI = [
  { key: "kaza_tutanagi", label: "Kaza Tutanağı", column: "kaza_tutanagi_dosyasi" },
  { key: "kaza_bildirim", label: "Kaza Bildirimi", column: "kaza_bildirim_dosyasi" },
  { key: "ise_donus_egitimi", label: "İşe Dönüş Eğitimi", column: "ise_donus_egitimi_dosyasi" },
  { key: "rapor", label: "Rapor", column: "rapor_dosyasi" },
];

export default function IsKazalari() {
  const [kazalar, setKazalar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [personel, setPersonel] = useState<any[]>([]);
  const [form, setForm] = useState({
    personel_id: "",
    tarih: "",
    saat: "",
    bildirim_no: "",
    bildirim_tarihi: "",
    dosya_no: "",
    yer: "",
    aciklama: "",
    yaralanan_uzuv: "",
    uzuv_kaybi: false,
    uzuv_kaybi_aciklama: "",
    yaralanma_durumu: "",
    calismaya_devam: false,
    tibbi_mudahale: false,
    hastane: "",
    rapor_no: "",
    istirahat_gun: "",
    istirahat_bitis_tarihi: "",
    santiye_adi: "",
    ise_donus_tarihi: "",
    ise_donus_egitimi: false,
    kaza_tutanagi: false,
    kaza_tutanagi_dosyasi: "",
    kaza_bildirim_dosyasi: "",
    ise_donus_egitimi_dosyasi: "",
    rapor_dosyasi: "",
    onleyici_onlemler: "",
  });
  const [saving, setSaving] = useState(false);
  const [editStatus, setEditStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [pendingFiles, setPendingFiles] = useState<Record<string, File | null>>({});
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);

  const defaultForm = {
    personel_id: "", tarih: "", saat: "", bildirim_no: "", bildirim_tarihi: "",
    dosya_no: "", yer: "", aciklama: "", yaralanan_uzuv: "",
    uzuv_kaybi: false, uzuv_kaybi_aciklama: "", yaralanma_durumu: "",
    calismaya_devam: false, tibbi_mudahale: false, hastane: "", rapor_no: "",
    istirahat_gun: "", istirahat_bitis_tarihi: "", santiye_adi: "",
    ise_donus_tarihi: "", ise_donus_egitimi: false, kaza_tutanagi: false,
    kaza_tutanagi_dosyasi: "", kaza_bildirim_dosyasi: "",
    ise_donus_egitimi_dosyasi: "", rapor_dosyasi: "",
    onleyici_onlemler: "",
  };

  useEffect(() => { fetchKazalar(); fetchPersonel(); }, []);

  const fetchKazalar = async () => {
    const { data } = await supabase
      .from("is_kazalari")
      .select("*, personel(kimlik_no, ad, soyad, meslek_kodu)")
      .order("tarih", { ascending: false });
    if (data) setKazalar(data);
    setLoading(false);
  };

  const fetchPersonel = async () => {
    const { data } = await supabase
      .from("personel")
      .select("id, kimlik_no, ad, soyad, meslek_kodu")
      .eq("arsivde", false);
    if (data) setPersonel(data);
  };

  const uploadFile = async (file: File, kazaId: string, dosyaTipi: string): Promise<string | null> => {
    try {
      const ext = file.name.split(".").pop() || "";
      const fileName = `${kazaId}/${dosyaTipi}_${Date.now()}_${sanitizeFileName(file.name)}`;
      const { error: upErr } = await supabase.storage.from("kaza-dosyalari").upload(fileName, file);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("kaza-dosyalari").getPublicUrl(fileName);
      return urlData.publicUrl;
    } catch (e: any) {
      console.error(`${dosyaTipi} yüklenirken hata:`, e.message);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setEditStatus(null);
    try {
      const payload = sanitizeForm({
        ...form,
        istirahat_gun: form.istirahat_gun ? Number(form.istirahat_gun) : null,
      });
      let kazaId: string | null = editing?.id || null;

      if (editing) {
        const { error } = await supabase
          .from("is_kazalari")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
        await logAudit("is_kazalari", "UPDATE", editing.id, editing, payload);
        setEditStatus({ type: "success", message: "Kaza kaydı güncellendi" });
      } else {
        const { data, error } = await supabase
          .from("is_kazalari")
          .insert(payload)
          .select();
        if (error) throw error;
        if (data) {
          kazaId = data[0].id;
          await logAudit("is_kazalari", "INSERT", data[0].id, null, payload);
        }
        setEditStatus({ type: "success", message: "Kaza kaydı eklendi" });
      }

      // Dosyaları yükle
      if (kazaId) {
        const updates: Record<string, string | null> = {};
        for (const dt of DOSYA_TIPLERI) {
          const file = pendingFiles[dt.key];
          if (file) {
            const url = await uploadFile(file, kazaId, dt.key);
            if (url) updates[dt.column] = url;
          }
        }
        if (Object.keys(updates).length > 0) {
          await supabase.from("is_kazalari").update(updates).eq("id", kazaId);
        }
      }

      setShowForm(false);
      setEditing(null);
      setPendingFiles({});
      setForm(defaultForm);
      fetchKazalar();
    } catch (e: any) {
      setEditStatus({ type: "error", message: e.message || "Kayıt işlemi başarısız" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    setEditStatus(null);
    try {
      const { error } = await supabase.from("is_kazalari").delete().eq("id", id);
      if (error) throw error;
      await logAudit("is_kazalari", "DELETE", id, null, null);
      setEditStatus({ type: "success", message: "Kaza kaydı silindi" });
      fetchKazalar();
    } catch (e: any) {
      setEditStatus({ type: "error", message: e.message || "Silme işlemi başarısız" });
    }
  };

  const openEdit = (k: any) => {
    setEditing(k);
    setForm({
      personel_id: k.personel_id || "",
      tarih: k.tarih || "",
      saat: k.saat || "",
      bildirim_no: k.bildirim_no || "",
      bildirim_tarihi: k.bildirim_tarihi || "",
      dosya_no: k.dosya_no || "",
      yer: k.yer || "",
      aciklama: k.aciklama || "",
      yaralanan_uzuv: k.yaralanan_uzuv || "",
      uzuv_kaybi: k.uzuv_kaybi || false,
      uzuv_kaybi_aciklama: k.uzuv_kaybi_aciklama || "",
      yaralanma_durumu: k.yaralanma_durumu || "",
      calismaya_devam: k.calismaya_devam || false,
      tibbi_mudahale: k.tibbi_mudahale || false,
      hastane: k.hastane || "",
      rapor_no: k.rapor_no || "",
      istirahat_gun: k.istirahat_gun != null ? String(k.istirahat_gun) : "",
      istirahat_bitis_tarihi: k.istirahat_bitis_tarihi || "",
      santiye_adi: k.santiye_adi || "",
      ise_donus_tarihi: k.ise_donus_tarihi || "",
      ise_donus_egitimi: k.ise_donus_egitimi || false,
      kaza_tutanagi: k.kaza_tutanagi || false,
      onleyici_onlemler: k.onleyici_onlemler || "",
      kaza_tutanagi_dosyasi: k.kaza_tutanagi_dosyasi || "",
      kaza_bildirim_dosyasi: k.kaza_bildirim_dosyasi || "",
      ise_donus_egitimi_dosyasi: k.ise_donus_egitimi_dosyasi || "",
      rapor_dosyasi: k.rapor_dosyasi || "",
    });
    setPendingFiles({});
    setShowForm(true);
  };

  const handleDeleteFile = async (tip: typeof DOSYA_TIPLERI[number], kazaId: string) => {
    if (!confirm(`${tip.label} dosyasını silmek istediğinize emin misiniz?`)) return;
    await supabase.from("is_kazalari").update({ [tip.column]: null }).eq("id", kazaId);
    setForm({ ...form, [tip.column]: "" });
    fetchKazalar();
  };

  const handleInlineUpload = async (kazaId: string, tip: typeof DOSYA_TIPLERI[number], file: File) => {
    const key = `${kazaId}_${tip.key}`;
    setUploadingFile(key);
    try {
      const ext = file.name.split(".").pop() || "";
      const fileName = `${kazaId}/${tip.key}_${Date.now()}_${sanitizeFileName(file.name)}`;
      const { error: upErr } = await supabase.storage.from("kaza-dosyalari").upload(fileName, file);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("kaza-dosyalari").getPublicUrl(fileName);
      await supabase.from("is_kazalari").update({ [tip.column]: urlData.publicUrl }).eq("id", kazaId);
      await logAudit("is_kazalari", "UPDATE", kazaId, null, { [tip.column]: urlData.publicUrl });
      setEditStatus({ type: "success", message: `${tip.label} yüklendi` });
      fetchKazalar();
    } catch (e: any) {
      setEditStatus({ type: "error", message: `${tip.label} yüklenirken hata: ${e.message}` });
    } finally {
      setUploadingFile(null);
    }
  };

  const yaralanmaRenk = (d: string) => {
    const map: Record<string, string> = {
      yok: "bg-green-100 text-green-700",
      hafif: "bg-yellow-100 text-yellow-700",
      agri: "bg-orange-100 text-orange-700",
      olum: "bg-red-100 text-red-700",
    };
    return map[d] || "bg-gray-100 text-gray-600";
  };

  return (
    <div className="flex-1 p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">İş Kazaları</h2>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm(defaultForm); setPendingFiles({}); }}
          className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700"
        >
          <Plus className="w-5 h-5" /> Yeni Kaza
        </button>
      </div>

      <div className="card p-4 mb-6">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Kaza ara (personel, şantiye, yer...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pr-12"
          />
        </div>
      </div>

      {editStatus && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm border ${editStatus.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          {editStatus.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {editStatus.message}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{editing ? "Kaza Düzenle" : "Yeni İş Kazası"}</h3>
              <button onClick={() => { setShowForm(false); setPendingFiles({}); }} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Personel + Şantiye */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Personel</label>
                  <select value={form.personel_id} onChange={(e) => setForm({ ...form, personel_id: e.target.value })} className="w-full p-2 border rounded-lg">
                    <option value="">Personel Seçin</option>
                    {personel.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.ad} {p.soyad} — {p.meslek_kodu || "Meslek kodu yok"}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Şantiye Adı</label>
                  <input
                    placeholder="Şantiye adı"
                    value={form.santiye_adi}
                    onChange={(e) => setForm({ ...form, santiye_adi: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>

              {/* Kaza Tarih/Saat + Bildirim */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Kaza Tarihi *</label>
                  <input type="date" required value={form.tarih} onChange={(e) => setForm({ ...form, tarih: e.target.value })} className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Saat</label>
                  <input type="time" value={form.saat} onChange={(e) => setForm({ ...form, saat: e.target.value })} className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Bildirim No</label>
                  <input placeholder="Bildirim no" value={form.bildirim_no} onChange={(e) => setForm({ ...form, bildirim_no: e.target.value })} className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Bildirim Tarihi</label>
                  <input type="date" value={form.bildirim_tarihi} onChange={(e) => setForm({ ...form, bildirim_tarihi: e.target.value })} className="w-full p-2 border rounded-lg" />
                </div>
              </div>

              {/* Dosya No + Yer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Dosya No</label>
                  <input placeholder="Dosya no" value={form.dosya_no} onChange={(e) => setForm({ ...form, dosya_no: e.target.value })} className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Nerede Oldu</label>
                  <input placeholder="Kaza yeri" value={form.yer} onChange={(e) => setForm({ ...form, yer: e.target.value })} className="w-full p-2 border rounded-lg" />
                </div>
              </div>

              {/* Kaza Açıklaması */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Kaza Nasıl Oldu</label>
                <textarea placeholder="Kazanın oluş şekli..." value={form.aciklama} onChange={(e) => setForm({ ...form, aciklama: e.target.value })} className="w-full p-2 border rounded-lg h-20" />
              </div>

              {/* Yaralanma Detayları */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Yaralanan Uzuv</label>
                  <input placeholder="Örn: Sağ kol, sol bacak" value={form.yaralanan_uzuv} onChange={(e) => setForm({ ...form, yaralanan_uzuv: e.target.value })} className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Yaralanma Durumu</label>
                  <select value={form.yaralanma_durumu} onChange={(e) => setForm({ ...form, yaralanma_durumu: e.target.value })} className="w-full p-2 border rounded-lg">
                    <option value="">Seçin</option>
                    <option value="yok">Yaralanma Yok</option>
                    <option value="hafif">Hafif Yaralanma</option>
                    <option value="agri">Ağır Yaralanma</option>
                    <option value="olum">Ölümlü</option>
                  </select>
                </div>
              </div>

              {/* Uzuv Kaybı */}
              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.uzuv_kaybi} onChange={(e) => setForm({ ...form, uzuv_kaybi: e.target.checked })} className="w-4 h-4" />
                  <span className="text-sm font-medium">Uzuv Kaybı Var</span>
                </label>
                {form.uzuv_kaybi && (
                  <input
                    placeholder="Kaybedilen uzuv..."
                    value={form.uzuv_kaybi_aciklama}
                    onChange={(e) => setForm({ ...form, uzuv_kaybi_aciklama: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                )}
              </div>

              {/* Çalışma + Tıbbi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center gap-2 cursor-pointer p-3 border border-gray-200 rounded-lg">
                  <input type="checkbox" checked={form.calismaya_devam} onChange={(e) => setForm({ ...form, calismaya_devam: e.target.checked })} className="w-4 h-4" />
                  <span className="text-sm font-medium">Çalışmaya Devam Etti</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-3 border border-gray-200 rounded-lg">
                  <input type="checkbox" checked={form.tibbi_mudahale} onChange={(e) => setForm({ ...form, tibbi_mudahale: e.target.checked })} className="w-4 h-4" />
                  <span className="text-sm font-medium">Tıbbi Müdahale Oldu</span>
                </label>
              </div>

              {/* Hastane + Rapor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Hastane</label>
                  <input placeholder="Hastane adı" value={form.hastane} onChange={(e) => setForm({ ...form, hastane: e.target.value })} className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Rapor No</label>
                  <input placeholder="Rapor no" value={form.rapor_no} onChange={(e) => setForm({ ...form, rapor_no: e.target.value })} className="w-full p-2 border rounded-lg" />
                </div>
              </div>

              {/* İstirahat */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">İstirahat Bilgisi</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">İstirahat Gün Sayısı</label>
                    <input type="number" min="0" placeholder="Gün" value={form.istirahat_gun} onChange={(e) => setForm({ ...form, istirahat_gun: e.target.value })} className="w-full p-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">İstirahat Bitiş Tarihi</label>
                    <input type="date" value={form.istirahat_bitis_tarihi} onChange={(e) => setForm({ ...form, istirahat_bitis_tarihi: e.target.value })} className="w-full p-2 border rounded-lg" />
                  </div>
                </div>
              </div>

              {/* İşe Dönüş */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">İşe Dönüş</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer p-3 border border-gray-200 rounded-lg">
                    <input
                      type="checkbox"
                      checked={!!form.ise_donus_tarihi}
                      onChange={(e) => {
                        if (!e.target.checked) {
                          setForm({ ...form, ise_donus_tarihi: "", ise_donus_egitimi: false });
                        } else {
                          setForm({ ...form, ise_donus_tarihi: new Date().toISOString().split("T")[0] });
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">İşe Döndü</span>
                  </label>
                  {form.ise_donus_tarihi && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">İşe Dönüş Tarihi</label>
                      <input type="date" value={form.ise_donus_tarihi} onChange={(e) => setForm({ ...form, ise_donus_tarihi: e.target.value })} className="w-full p-2 border rounded-lg" />
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 cursor-pointer p-3 border border-gray-200 rounded-lg">
                      <input type="checkbox" checked={form.ise_donus_egitimi} onChange={(e) => setForm({ ...form, ise_donus_egitimi: e.target.checked })} className="w-4 h-4" />
                      <span className="text-sm font-medium">İşe Dönüş Eğitimi</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-3 border border-gray-200 rounded-lg">
                      <input type="checkbox" checked={form.kaza_tutanagi} onChange={(e) => setForm({ ...form, kaza_tutanagi: e.target.checked })} className="w-4 h-4" />
                      <span className="text-sm font-medium">Kaza Tutanağı</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Dosyalar */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Dosyalar</h4>
                <div className="space-y-3">
                  {DOSYA_TIPLERI.map((dt) => {
                    const dosyaUrl = (form as any)[dt.column];
                    return (
                      <div key={dt.key} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700">{dt.label}</p>
                          {dosyaUrl ? (
                            <div className="flex items-center gap-2 mt-1">
                              <a href={dosyaUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-600 hover:underline truncate flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" />
                                Dosyayı Gör
                              </a>
                              {editing && (
                                <button type="button" onClick={() => handleDeleteFile(dt, editing.id)} className="text-xs text-red-500 hover:underline">Sil</button>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 mt-1">Dosya seçilmedi</p>
                          )}
                        </div>
                        <label className="cursor-pointer text-xs text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200 flex items-center gap-1 flex-shrink-0">
                          <Upload className="w-3.5 h-3.5" />
                          {pendingFiles[dt.key] ? "Değiştir" : "Yükle"}
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.txt"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) {
                                const res = validateFile(f);
                                if (res.valid) setPendingFiles({ ...pendingFiles, [dt.key]: f });
                                else alert(res.error);
                              }
                              e.target.value = "";
                            }}
                          />
                        </label>
                        {pendingFiles[dt.key] && (
                          <button type="button" onClick={() => {
                            const pf = { ...pendingFiles };
                            delete pf[dt.key];
                            setPendingFiles(pf);
                          }} className="text-red-400 hover:text-red-600 flex-shrink-0">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Önleyici Önlemler */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Önleyici Önlemler</label>
                <textarea placeholder="Alınan/alınacak önleyici önlemler..." value={form.onleyici_onlemler} onChange={(e) => setForm({ ...form, onleyici_onlemler: e.target.value })} className="w-full p-2 border rounded-lg h-20" />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-green-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? <div className="text-center py-12">Yükleniyor...</div> : (
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 whitespace-nowrap">Tarih/Saat</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 whitespace-nowrap">Personel</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 whitespace-nowrap">TC</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 whitespace-nowrap">Meslek</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 whitespace-nowrap">Şantiye</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 whitespace-nowrap">Bildirim</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 whitespace-nowrap">Dosya No</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 whitespace-nowrap">Nerede Oldu</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 whitespace-nowrap">Yaralanan Uzuv</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 whitespace-nowrap">Uzuv Kaybı</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 whitespace-nowrap">Durum</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-600 vertical-text">Çalışıyor</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-600 vertical-text">Tıbbi</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 whitespace-nowrap">Hastane</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-600 vertical-text">Rapor No</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-600 vertical-text">İstirahat</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 whitespace-nowrap">İşe Dönüş</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-600 vertical-text">Dönüş Eğt</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-600 vertical-text">Tutanak</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-600 whitespace-nowrap">Dosyalar</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-600 whitespace-nowrap">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {kazalar
                .filter((k) => {
                  if (!search) return true;
                  const q = search.toLowerCase();
                  const p = k.personel;
                  return (
                    (p && `${p.ad || ""} ${p.soyad || ""}`.toLowerCase().includes(q)) ||
                    (p && p.kimlik_no && p.kimlik_no.includes(q)) ||
                    k.yer?.toLowerCase().includes(q) ||
                    k.santiye_adi?.toLowerCase().includes(q) ||
                    k.bildirim_no?.toLowerCase().includes(q)
                  );
                })
                .map((k) => (
                  <tr key={k.id} className="hover:bg-gray-50 text-sm">
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {displayDate(k.tarih)}
                      {k.saat && <span className="text-gray-400 ml-1">{k.saat.slice(0, 5)}</span>}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {k.personel ? `${k.personel.ad || ""} ${k.personel.soyad || ""}`.trim() || "-" : "-"}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-gray-500">{k.personel?.kimlik_no || "-"}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-gray-500">{k.personel?.meslek_kodu || "-"}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{k.santiye_adi || "-"}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {k.bildirim_no || "-"}
                      {k.bildirim_tarihi && <span className="text-gray-400 text-xs block">{displayDate(k.bildirim_tarihi)}</span>}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{k.dosya_no || "-"}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{k.yer || "-"}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{k.yaralanan_uzuv || "-"}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {k.uzuv_kaybi ? (
                        <span title={k.uzuv_kaybi_aciklama || ""} className="text-red-600 font-medium">Evet{k.uzuv_kaybi_aciklama ? "!" : ""}</span>
                      ) : "-"}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${yaralanmaRenk(k.yaralanma_durumu)}`}>
                        {k.yaralanma_durumu === "yok" ? "Yok" : k.yaralanma_durumu === "hafif" ? "Hafif" : k.yaralanma_durumu === "agri" ? "Ağır" : k.yaralanma_durumu === "olum" ? "Ölümlü" : "-"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{k.calismaya_devam ? <span className="text-green-600 font-medium">Evet</span> : <span className="text-red-500">Hayır</span>}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{k.tibbi_mudahale ? <span className="text-blue-600 font-medium">Evet</span> : "Hayır"}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{k.hastane || "-"}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{k.rapor_no || "-"}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {k.istirahat_gun ? (
                        <span>
                          {k.istirahat_gun} gün
                          {k.istirahat_bitis_tarihi && (
                            <span className="text-gray-400 text-xs block">
                              {displayDate(k.istirahat_bitis_tarihi)}
                              {new Date(k.istirahat_bitis_tarihi) < new Date() && (
                                <span className="text-red-500 ml-1">(süre doldu)</span>
                              )}
                            </span>
                          )}
                        </span>
                      ) : "-"}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {k.ise_donus_tarihi ? (
                        <span>
                          {displayDate(k.ise_donus_tarihi)}
                          {(() => {
                            const diff = Math.ceil((new Date(k.ise_donus_tarihi).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                            if (diff <= 1 && diff >= 0) return <span className="text-amber-600 text-xs block">Yarın!</span>;
                            if (diff < 0) return <span className="text-red-500 text-xs block">Gecikmiş</span>;
                            return null;
                          })()}
                        </span>
                      ) : "-"}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{k.ise_donus_egitimi ? <span className="text-green-600 font-medium">Var</span> : "Yok"}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{k.kaza_tutanagi ? <span className="text-green-600 font-medium">Var</span> : "Yok"}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {DOSYA_TIPLERI.map((dt) => {
                          const dosyaUrl = k[dt.column];
                          const uploadKey = `${k.id}_${dt.key}`;
                          return (
                            <div key={dt.key} className="relative">
                              {dosyaUrl ? (
                                <a href={dosyaUrl} target="_blank" rel="noopener noreferrer" className="p-1 text-purple-600 hover:bg-purple-50 rounded block" title={dt.label}>
                                  <FileText className="w-4 h-4" />
                                </a>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    disabled={uploadingFile === uploadKey}
                                    onClick={() => document.getElementById(`file-${k.id}-${dt.key}`)?.click()}
                                    className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded disabled:opacity-50"
                                    title={`${dt.label} yükle`}
                                  >
                                    {uploadingFile === uploadKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                  </button>
                                  <input
                                    id={`file-${k.id}-${dt.key}`}
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.txt"
                                    className="hidden"
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (f) {
                                        const res = validateFile(f);
                                        if (res.valid) handleInlineUpload(k.id, dt, f);
                                        else alert(res.error);
                                      }
                                      e.target.value = "";
                                    }}
                                  />
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => openEdit(k)} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Düzenle">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(k.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Sil">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
