"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeForm } from "@/lib/security";
import { validateFile, sanitizeFileName } from "@/lib/file-validation";
import { logAudit } from "@/lib/audit";
import { displayDate } from "@/lib/tarih";
import {
  Building2, Plus, Edit, Trash2, Search, X, Save,
  CheckCircle, AlertCircle, Loader2, Upload, ExternalLink, FileText
} from "lucide-react";

const DOSYA_TIPLERI = [
  { key: "is_sozlesme", label: "İş Sözleşme", column: "is_sozlesme_dosyasi" },
  { key: "risk_analizi", label: "Risk Analizi", column: "risk_analizi_dosyasi" },
  { key: "acil_durum_plani", label: "Acil Durum Planı", column: "acil_durum_plani_dosyasi" },
  { key: "tatbikat", label: "Tatbikat", column: "tatbikat_dosyasi" },
];

export default function Santiyeler() {
  const [santiyeler, setSantiyeler] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [editStatus, setEditStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [form, setForm] = useState({
    ad: "", adres: "", sorumlu: "", telefon: "",
    baslangic_tarihi: "", bitis_tarihi: "", durum: "aktif", notlar: "",
    sicil_numarasi: "", yapilacak_isler: "", calisan_temsilcisi: "",
    destek_elemani: "", acil_durum_ekipleri: "",
    is_sozlesme_dosyasi: "", risk_analizi_dosyasi: "",
    acil_durum_plani_dosyasi: "", tatbikat_dosyasi: "",
  });

  useEffect(() => { fetchSantiyeler(); }, []);

  const fetchSantiyeler = async () => {
    try {
      const { data } = await supabase.from("santiyeler").select("*").order("created_at", { ascending: false });
      if (data) setSantiyeler(data);
    } catch (e: any) {
      setEditStatus({ type: "error", message: "Veriler yüklenirken hata oluştu" });
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File, santiyeId: string, dosyaTipi: string): Promise<string | null> => {
    try {
      const fileName = `${santiyeId}/${dosyaTipi}_${Date.now()}_${sanitizeFileName(file.name)}`;
      const { error: upErr } = await supabase.storage.from("santiye-dosyalari").upload(fileName, file);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("santiye-dosyalari").getPublicUrl(fileName);
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
      // Dosya kolonlarindaki pending placeholder'ları temizle
      const cleanForm = { ...form };
      for (const dt of DOSYA_TIPLERI) {
        if (cleanForm[dt.column as keyof typeof cleanForm]?.toString().startsWith("__pending__")) {
          (cleanForm as any)[dt.column] = "";
        }
      }
      const payload = sanitizeForm({
        ...cleanForm,
        baslangic_tarihi: cleanForm.baslangic_tarihi || null,
        bitis_tarihi: cleanForm.bitis_tarihi || null,
      });
      let santiyeId: string | null = editing?.id || null;

      if (editing) {
        const { error } = await supabase.from("santiyeler").update(payload).eq("id", editing.id);
        if (error) throw error;
        await logAudit("santiyeler", "UPDATE", editing.id, editing, payload);
        setEditStatus({ type: "success", message: "Şantiye güncellendi" });
      } else {
        const { data, error } = await supabase.from("santiyeler").insert(payload).select();
        if (error) throw error;
        if (data) {
          santiyeId = data[0].id;
          await logAudit("santiyeler", "INSERT", data[0].id, null, payload);
        }
        setEditStatus({ type: "success", message: "Şantiye kaydedildi" });
      }
      setShowForm(false); setEditing(null);
      setForm({ ad: "", adres: "", sorumlu: "", telefon: "", baslangic_tarihi: "", bitis_tarihi: "", durum: "aktif", notlar: "", sicil_numarasi: "", yapilacak_isler: "", calisan_temsilcisi: "", destek_elemani: "", acil_durum_ekipleri: "", is_sozlesme_dosyasi: "", risk_analizi_dosyasi: "", acil_durum_plani_dosyasi: "", tatbikat_dosyasi: "" });
      fetchSantiyeler();
    } catch (e: any) {
      setEditStatus({ type: "error", message: e.message || "Kayıt işlemi başarısız" });
    } finally {
      setSaving(false);
    }
  };

  const handleInlineUpload = async (santiyeId: string, tip: typeof DOSYA_TIPLERI[number], file: File) => {
    const key = `${santiyeId}_${tip.key}`;
    setUploadingFile(key);
    try {
      const fileName = `${santiyeId}/${tip.key}_${Date.now()}_${sanitizeFileName(file.name)}`;
      const { error: upErr } = await supabase.storage.from("santiye-dosyalari").upload(fileName, file);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("santiye-dosyalari").getPublicUrl(fileName);
      await supabase.from("santiyeler").update({ [tip.column]: urlData.publicUrl }).eq("id", santiyeId);
      await logAudit("santiyeler", "UPDATE", santiyeId, null, { [tip.column]: urlData.publicUrl });
      setEditStatus({ type: "success", message: `${tip.label} yüklendi` });
      fetchSantiyeler();
    } catch (e: any) {
      setEditStatus({ type: "error", message: `${tip.label} yüklenirken hata: ${e.message}` });
    } finally {
      setUploadingFile(null);
    }
  };

  const handleDeleteFile = async (tip: typeof DOSYA_TIPLERI[number], santiyeId: string) => {
    if (!confirm(`${tip.label} dosyasını silmek istediğinize emin misiniz?`)) return;
    await supabase.from("santiyeler").update({ [tip.column]: null }).eq("id", santiyeId);
    fetchSantiyeler();
  };

  const handleEdit = (s: any) => {
    setEditing(s);
    setForm({
      ad: s.ad, adres: s.adres || "", sorumlu: s.sorumlu || "", telefon: s.telefon || "",
      baslangic_tarihi: s.baslangic_tarihi || "", bitis_tarihi: s.bitis_tarihi || "",
      durum: s.durum, notlar: s.notlar || "",
      sicil_numarasi: s.sicil_numarasi || "",
      yapilacak_isler: s.yapilacak_isler || "",
      calisan_temsilcisi: s.calisan_temsilcisi || "",
      destek_elemani: s.destek_elemani || "",
      acil_durum_ekipleri: s.acil_durum_ekipleri || "",
      is_sozlesme_dosyasi: s.is_sozlesme_dosyasi || "",
      risk_analizi_dosyasi: s.risk_analizi_dosyasi || "",
      acil_durum_plani_dosyasi: s.acil_durum_plani_dosyasi || "",
      tatbikat_dosyasi: s.tatbikat_dosyasi || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    setEditStatus(null);
    try {
      const { error } = await supabase.from("santiyeler").delete().eq("id", id);
      if (error) throw error;
      await logAudit("santiyeler", "DELETE", id, null, null);
      setEditStatus({ type: "success", message: "Şantiye silindi" });
      fetchSantiyeler();
    } catch (e: any) {
      setEditStatus({ type: "error", message: e.message || "Silme işlemi başarısız" });
    }
  };

  const filtered = santiyeler.filter((s) =>
    s.ad.toLowerCase().includes(search.toLowerCase()) ||
    s.sicil_numarasi?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Şantiyeler</h2>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ ad: "", adres: "", sorumlu: "", telefon: "", baslangic_tarihi: "", bitis_tarihi: "", durum: "aktif", notlar: "", sicil_numarasi: "", yapilacak_isler: "", calisan_temsilcisi: "", destek_elemani: "", acil_durum_ekipleri: "", is_sozlesme_dosyasi: "", risk_analizi_dosyasi: "", acil_durum_plani_dosyasi: "", tatbikat_dosyasi: "" }); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <Plus className="w-5 h-5" /> Yeni Şantiye
        </button>
      </div>

      <div className="card p-4 mb-6">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Şantiye ara (ad, sicil no)..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pr-12" />
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
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{editing ? "Şantiye Düzenle" : "Yeni Şantiye"}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input required placeholder="Şantiye Adı" value={form.ad} onChange={(e) => setForm({ ...form, ad: e.target.value })} className="w-full p-2 border rounded-lg" />
                <input placeholder="Sicil Numarası" value={form.sicil_numarasi} onChange={(e) => setForm({ ...form, sicil_numarasi: e.target.value })} className="w-full p-2 border rounded-lg" />
              </div>
              <input placeholder="Çalışan Temsilcisi" value={form.calisan_temsilcisi} onChange={(e) => setForm({ ...form, calisan_temsilcisi: e.target.value })} className="w-full p-2 border rounded-lg" />
              <input placeholder="Destek Elemanı" value={form.destek_elemani} onChange={(e) => setForm({ ...form, destek_elemani: e.target.value })} className="w-full p-2 border rounded-lg" />
              <textarea placeholder="Yapılacak İşler" value={form.yapilacak_isler} onChange={(e) => setForm({ ...form, yapilacak_isler: e.target.value })} className="w-full p-2 border rounded-lg h-20" />
              <textarea placeholder="Acil Durum Ekipleri" value={form.acil_durum_ekipleri} onChange={(e) => setForm({ ...form, acil_durum_ekipleri: e.target.value })} className="w-full p-2 border rounded-lg h-20" />
              <textarea placeholder="Adres" value={form.adres} onChange={(e) => setForm({ ...form, adres: e.target.value })} className="w-full p-2 border rounded-lg h-20" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input placeholder="Sorumlu" value={form.sorumlu} onChange={(e) => setForm({ ...form, sorumlu: e.target.value })} className="w-full p-2 border rounded-lg" />
                <input placeholder="Telefon" value={form.telefon} onChange={(e) => setForm({ ...form, telefon: e.target.value })} className="w-full p-2 border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="date" value={form.baslangic_tarihi} onChange={(e) => setForm({ ...form, baslangic_tarihi: e.target.value })} className="w-full p-2 border rounded-lg" />
                <input type="date" value={form.bitis_tarihi} onChange={(e) => setForm({ ...form, bitis_tarihi: e.target.value })} className="w-full p-2 border rounded-lg" />
              </div>
              <select value={form.durum} onChange={(e) => setForm({ ...form, durum: e.target.value })} className="w-full p-2 border rounded-lg">
                <option value="aktif">Aktif</option>
                <option value="pasif">Pasif</option>
                <option value="tamamlandi">Tamamlandı</option>
              </select>

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
                              <a href={dosyaUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-600 hover:underline flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" /> Dosyayı Gör
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
                          <Upload className="w-3.5 h-3.5" /> Yükle
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.txt" className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) {
                                const res = validateFile(f);
                                if (res.valid) setForm({ ...form, [dt.column]: `__pending__${f.name}` });
                                else alert(res.error);
                              }
                              e.target.value = "";
                            }}
                          />
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button type="submit" disabled={saving} className="w-full bg-green-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin mr-2"></div>
          Yükleniyor...
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 whitespace-nowrap">Şantiye</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 whitespace-nowrap">Sicil No</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 whitespace-nowrap">Sorumlu</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 whitespace-nowrap">Telefon</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 whitespace-nowrap">Temsilci</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 whitespace-nowrap">Destek</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 whitespace-nowrap">Yapılacak İşler</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 whitespace-nowrap">Acil Ekipler</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 whitespace-nowrap">Tarih</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-600 whitespace-nowrap">Durum</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-600 whitespace-nowrap">Dosyalar</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-600 whitespace-nowrap">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 text-sm">
                  <td className="px-3 py-2.5 whitespace-nowrap font-medium">{s.ad}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{s.sicil_numarasi || "-"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{s.sorumlu || "-"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{s.telefon || "-"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{s.calisan_temsilcisi || "-"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{s.destek_elemani || "-"}</td>
                  <td className="px-3 py-2.5 max-w-[200px] truncate" title={s.yapilacak_isler || ""}>{s.yapilacak_isler || "-"}</td>
                  <td className="px-3 py-2.5 max-w-[150px] truncate" title={s.acil_durum_ekipleri || ""}>{s.acil_durum_ekipleri || "-"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-xs">
                    {s.baslangic_tarihi && <span>Baş: {displayDate(s.baslangic_tarihi)}</span>}
                    {s.bitis_tarihi && <span className="block">Bitiş: {displayDate(s.bitis_tarihi)}</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      s.durum === "aktif" ? "bg-green-100 text-green-700" :
                      s.durum === "pasif" ? "bg-gray-100 text-gray-600" :
                      "bg-blue-100 text-blue-700"
                    }`}>{s.durum}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      {DOSYA_TIPLERI.map((dt) => {
                        const dosyaUrl = s[dt.column];
                        const uploadKey = `${s.id}_${dt.key}`;
                        return (
                          <div key={dt.key} className="relative">
                            {dosyaUrl ? (
                              <a href={dosyaUrl} target="_blank" rel="noopener noreferrer" className="p-1 text-purple-600 hover:bg-purple-50 rounded block" title={dt.label}>
                                <FileText className="w-4 h-4" />
                              </a>
                            ) : (
                              <>
                                <button type="button" disabled={uploadingFile === uploadKey}
                                  onClick={() => document.getElementById(`sf-${s.id}-${dt.key}`)?.click()}
                                  className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded disabled:opacity-50"
                                  title={`${dt.label} yükle`}>
                                  {uploadingFile === uploadKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                </button>
                                <input id={`sf-${s.id}-${dt.key}`} type="file"
                                  accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.txt" className="hidden"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) {
                                      const res = validateFile(f);
                                      if (res.valid) handleInlineUpload(s.id, dt, f);
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
                      <button onClick={() => handleEdit(s)} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Düzenle"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(s.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Sil"><Trash2 className="w-4 h-4" /></button>
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
