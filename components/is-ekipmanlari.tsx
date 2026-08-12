"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeForm } from "@/lib/security";
import { logAudit } from "@/lib/audit";
import { displayDate } from "@/lib/tarih";
import { validateFile, validateFileServer, sanitizeFileName, loadFileSizeExemptAreas } from "@/lib/file-validation";
import { Wrench, Plus, Edit, Trash2, Search, X, Save, AlertTriangle, CheckCircle, AlertCircle, Loader2, Upload, Paperclip, Download, Calendar } from "lucide-react";

const emptyForm = {
  ad: "", seri_no: "", tip: "", firma_adi: "", son_kontrol_tarihi: "", sonraki_kontrol_tarihi: "", durum: "aktif", notlar: "",
};

export default function IsEkipmanlari() {
  const [ekipmanlar, setEkipmanlar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editStatus, setEditStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [pendingFiles, setPendingFiles] = useState<{ file: File; preview?: string }[]>([]);
  const [ekipmanDosyalari, setEkipmanDosyalari] = useState<Record<string, any[]>>({});
  const [uploadDragOver, setUploadDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  useEffect(() => { loadFileSizeExemptAreas(); fetchEkipmanlar(); }, []);

  const fetchEkipmanlar = async () => {
    setLoading(true);
    const [ekipmanRes, dosyaRes] = await Promise.all([
      supabase.from("is_ekipmanlari").select("*").order("created_at", { ascending: false }),
      supabase.from("ekipman_dosyalari").select("*").is("silinme_tarihi", null),
    ]);
    if (ekipmanRes.data) setEkipmanlar(ekipmanRes.data);
    if (dosyaRes.data) {
      const grouped: Record<string, any[]> = {};
      for (const d of dosyaRes.data) {
        if (!grouped[d.ekipman_id]) grouped[d.ekipman_id] = [];
        grouped[d.ekipman_id].push(d);
      }
      setEkipmanDosyalari(grouped);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setEditStatus(null);
    try {
      let ekipmanId: string;
      if (editing) {
        const { error } = await supabase.from("is_ekipmanlari").update(sanitizeForm(form)).eq("id", editing.id);
        if (error) throw error;
        await logAudit("is_ekipmanlari", "UPDATE", editing.id, editing, form);
        ekipmanId = editing.id;
        setEditStatus({ type: "success", message: "Ekipman güncellendi" });
      } else {
        const { data, error } = await supabase.from("is_ekipmanlari").insert(sanitizeForm(form)).select();
        if (error) throw error;
        if (!data?.[0]) throw new Error("Kayıt oluşturulamadı");
        await logAudit("is_ekipmanlari", "INSERT", data[0].id, null, form);
        ekipmanId = data[0].id;
        setEditStatus({ type: "success", message: "Ekipman eklendi" });
      }

      const upErrors: string[] = [];
      for (const pf of pendingFiles) {
        const serverValidation = await validateFileServer(pf.file, "ekipman-dosyalari");
        if (!serverValidation.valid) { upErrors.push(`${pf.file.name}: ${serverValidation.error || "Sunucu doğrulaması başarısız"}`); continue; }
        const fileName = `${ekipmanId}/${Date.now()}_${sanitizeFileName(pf.file.name)}`;
        const { error: upErr } = await supabase.storage.from("ekipman-dosyalari").upload(fileName, pf.file);
        if (upErr) { upErrors.push(`${pf.file.name}: ${upErr.message}`); continue; }
        const { data: urlData } = supabase.storage.from("ekipman-dosyalari").getPublicUrl(fileName);
        const ext = pf.file.name.split(".").pop() || "";
        const { data: dosyaData } = await supabase.from("ekipman_dosyalari").insert({
          ekipman_id: ekipmanId, dosya_url: urlData.publicUrl, dosya_adi: pf.file.name,
          dosya_uzantisi: ext, dosya_boyut: pf.file.size,
        }).select();
        if (dosyaData?.[0]) await logAudit("ekipman_dosyalari", "INSERT", dosyaData[0].id, null, dosyaData[0]);
      }
      if (upErrors.length > 0) upErrors.forEach(m => console.error("Upload error:", m));
      if (upErrors.length > 0 && !editing) {
        setEditStatus({ type: "error", message: `Ekipman kaydedildi ancak ${upErrors.length} dosya yüklenemedi: ${upErrors.join("; ")}` });
      }

      if (pendingFiles.length) { pendingFiles.forEach(pf => { if (pf.preview) URL.revokeObjectURL(pf.preview); }); }
      setShowForm(false); setEditing(null); setForm(emptyForm); setPendingFiles([]); setUploadStatus(null);
      fetchEkipmanlar();
    } catch (e: any) {
      setEditStatus({ type: "error", message: e.message || "Kayıt işlemi başarısız" });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (e: any) => {
    if (pendingFiles.length) { pendingFiles.forEach(pf => { if (pf.preview) URL.revokeObjectURL(pf.preview); }); }
    setEditing(e);
    setForm({
      ad: e.ad || "", seri_no: e.seri_no || "", tip: e.tip || "",
      firma_adi: e.firma_adi || "",
      son_kontrol_tarihi: e.son_kontrol_tarihi || "",
      sonraki_kontrol_tarihi: e.sonraki_kontrol_tarihi || "",
      durum: e.durum || "aktif", notlar: e.notlar || "",
    });
    setPendingFiles([]);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    setEditStatus(null);
    try {
      const { data: oldDosyalar } = await supabase.from("ekipman_dosyalari").select("*").eq("ekipman_id", id);
      for (const d of (oldDosyalar || [])) {
        const path = d.dosya_url?.split("/").pop();
        if (path) await supabase.storage.from("ekipman-dosyalari").remove([`${id}/${path}`]);
        await logAudit("ekipman_dosyalari", "DELETE", d.id, d, null);
      }
      await supabase.from("ekipman_dosyalari").delete().eq("ekipman_id", id);
      const { error } = await supabase.from("is_ekipmanlari").delete().eq("id", id);
      if (error) throw error;
      await logAudit("is_ekipmanlari", "DELETE", id, null, null);
      setEditStatus({ type: "success", message: "Ekipman silindi" });
      fetchEkipmanlar();
    } catch (e: any) {
      setEditStatus({ type: "error", message: e.message || "Silme işlemi başarısız" });
    }
  };

  const handleDosyaSil = async (d: any, ekipmanId: string) => {
    if (!confirm("Dosyayı silmek istediğinize emin misiniz?")) return;
    await supabase.from("ekipman_dosyalari").update({ silinme_tarihi: new Date().toISOString() }).eq("id", d.id);
    await logAudit("ekipman_dosyalari", "UPDATE", d.id, d, { silinme_tarihi: new Date().toISOString() });
    setEkipmanDosyalari(prev => ({
      ...prev,
      [ekipmanId]: (prev[ekipmanId] || []).filter(x => x.id !== d.id),
    }));
  };

  const isYaklasan = (tarih: string) => {
    if (!tarih) return false;
    const diff = Math.ceil((new Date(tarih).getTime() - Date.now()) / 86400000);
    return diff >= 0 && diff <= 7;
  };

  const isGecmis = (tarih: string) => {
    if (!tarih) return false;
    return new Date(tarih).getTime() < Date.now();
  };

  const filtered = ekipmanlar.filter((e) =>
    e.ad.toLowerCase().includes(search.toLowerCase()) ||
    (e.firma_adi || "").toLowerCase().includes(search.toLowerCase()) ||
    (e.seri_no || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 p-8 app-bg min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">İş Ekipmanları</h2>
          <p className="text-gray-500 mt-1">Toplam {ekipmanlar.length} ekipman</p>
        </div>
        <button onClick={() => { if (pendingFiles.length) { pendingFiles.forEach(pf => { if (pf.preview) URL.revokeObjectURL(pf.preview); }); }; setShowForm(true); setEditing(null); setForm(emptyForm); setPendingFiles([]); setUploadStatus(null); }} className="btn btn-primary">
          <Plus className="w-4 h-4" /> Yeni Ekipman
        </button>
      </div>

      {/* Warning Banner */}
      {(() => {
        const yaklasan = ekipmanlar.filter(e => isYaklasan(e.sonraki_kontrol_tarihi));
        const gecen = ekipmanlar.filter(e => isGecmis(e.sonraki_kontrol_tarihi));
        if (yaklasan.length === 0 && gecen.length === 0) return null;
        return (
          <div className="mb-4 p-3 rounded-lg flex items-center gap-2 text-sm border bg-amber-50 border-amber-200 text-amber-700">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>
              {gecen.length > 0 && <strong>{gecen.length} ekipmanın</strong>}
              {gecen.length > 0 && yaklasan.length > 0 && " ve "}
              {yaklasan.length > 0 && <strong>{yaklasan.length} ekipmanın</strong>}
              {" kontrol tarihi "}{gecen.length > 0 ? "geçmiş" : ""}{gecen.length > 0 && yaklasan.length > 0 ? " / " : ""}{yaklasan.length > 0 ? "yaklaşıyor" : ""} (1 hafta içinde)
            </span>
          </div>
        );
      })()}

      <div className="card p-4 mb-6">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Ekipman, firma veya seri no ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pr-12" />
        </div>
      </div>

      {editStatus && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm border ${editStatus.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          {editStatus.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {editStatus.message}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">{editing ? "Düzenle" : "Yeni Ekipman"}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <input required placeholder="Ekipman Adı" value={form.ad} onChange={(e) => setForm({ ...form, ad: e.target.value })} className="input" />
              <input placeholder="Seri No" value={form.seri_no} onChange={(e) => setForm({ ...form, seri_no: e.target.value })} className="input" />
              <input placeholder="Tip" value={form.tip} onChange={(e) => setForm({ ...form, tip: e.target.value })} className="input" />
              <input placeholder="Firma Adı (ait olduğu firma)" value={form.firma_adi} onChange={(e) => setForm({ ...form, firma_adi: e.target.value })} className="input" />
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs text-gray-500 mb-1">Son Kontrol Tarihi</label><input type="date" value={form.son_kontrol_tarihi} onChange={(e) => setForm({ ...form, son_kontrol_tarihi: e.target.value })} className="input" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Sonraki Kontrol Tarihi</label><input type="date" value={form.sonraki_kontrol_tarihi} onChange={(e) => setForm({ ...form, sonraki_kontrol_tarihi: e.target.value })} className="input" /></div>
              </div>
              <select value={form.durum} onChange={(e) => setForm({ ...form, durum: e.target.value })} className="input">
                <option value="aktif">Aktif</option>
                <option value="bakimda">Bakımda</option>
                <option value="kullanilmaz">Kullanılmaz</option>
              </select>
              <textarea rows={2} placeholder="Notlar..." value={form.notlar} onChange={(e) => setForm({ ...form, notlar: e.target.value })} className="input" />

              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Sözleşme / Periyodik Kontrol Evrakları</h4>
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition ${uploadDragOver ? "border-purple-400 bg-purple-50" : "border-gray-300 hover:border-gray-400"}`}
                  onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; setUploadDragOver(true); }}
                  onDragLeave={e => { e.preventDefault(); setUploadDragOver(false); }}
                  onDrop={e => { e.preventDefault(); setUploadDragOver(false); const files = Array.from(e.dataTransfer.files); const errors: string[] = []; const valid: File[] = []; for (const f of files) { const res = validateFile(f, "ekipman-dosyalari"); if (res.valid) valid.push(f); else if (res.error) errors.push(`${f.name}: ${res.error}`); } if (errors.length) setUploadStatus(errors.join(" | ")); setPendingFiles(prev => [...prev, ...valid.map(file => ({ file, preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined }))]); }}
                >
                  <Upload className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">Sözleşme / rapor dosyalarını sürükleyin veya tıklayın</p>
                  <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.txt" className="hidden" id="ekipman-dosya-input" onChange={e => { const files = Array.from(e.target.files || []); const errors: string[] = []; const valid: File[] = []; for (const f of files) { const res = validateFile(f, "ekipman-dosyalari"); if (res.valid) valid.push(f); else if (res.error) errors.push(`${f.name}: ${res.error}`); } if (errors.length) setUploadStatus(errors.join(" | ")); setPendingFiles(prev => [...prev, ...valid.map(file => ({ file, preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined }))]); e.target.value = ""; }} />
                  <button type="button" onClick={() => document.getElementById("ekipman-dosya-input")?.click()} className="text-xs text-purple-600 hover:underline mt-1">Dosya Seç</button>
                </div>
                {uploadStatus && <p className="text-xs text-red-500 mt-1">{uploadStatus}</p>}
                {pendingFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {pendingFiles.map((pf, i) => (
                      <div key={i} className="flex items-center justify-between bg-purple-50 px-3 py-1.5 rounded-lg text-xs">
                        <div className="flex items-center gap-2">
                          {pf.preview ? <img src={pf.preview} className="w-8 h-8 object-cover rounded" /> : <Paperclip className="w-4 h-4 text-purple-400" />}
                          <span className="truncate max-w-[200px]">{pf.file.name}</span>
                        </div>
                        <button onClick={() => { if (pf.preview) URL.revokeObjectURL(pf.preview); setPendingFiles(prev => prev.filter((_, j) => j !== i)); setUploadStatus(null); }} className="text-red-500 hover:text-red-700"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" disabled={saving} className="w-full btn btn-primary disabled:opacity-50">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{saving ? "Kaydediliyor..." : "Kaydet"}</button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400"><div className="w-6 h-6 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin mr-2"></div>Yükleniyor...</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-[900px]">
            <thead>
              <tr><th>Ekipman</th><th>Seri No</th><th>Firma</th><th>Sonraki Kontrol</th><th>Durum</th><th>Evrak</th><th className="!text-center">İşlemler</th></tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const dosyalar = ekipmanDosyalari[e.id] || [];
                const kontrolYaklasan = isYaklasan(e.sonraki_kontrol_tarihi);
                const kontrolGecmis = isGecmis(e.sonraki_kontrol_tarihi);
                const dosyaYaklasan = dosyalar.some((d: any) => isYaklasan(d.bitis_tarihi));
                const dosyaGecmis = dosyalar.some((d: any) => isGecmis(d.bitis_tarihi));
                return (
                  <tr key={e.id}>
                    <td className="font-medium text-gray-800">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span>{e.ad}</span>
                        {(kontrolGecmis || dosyaGecmis) && <span title="Tarih geçmiş"><AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" /></span>}
                        {!kontrolGecmis && !dosyaGecmis && (kontrolYaklasan || dosyaYaklasan) && <span title="1 hafta içinde süre doluyor"><AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" /></span>}
                      </div>
                    </td>
                    <td className="text-gray-600">{e.seri_no || "-"}</td>
                    <td className="text-gray-600">{e.firma_adi || "-"}</td>
                    <td className="text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className={kontrolGecmis ? "text-red-600 font-medium" : kontrolYaklasan ? "text-amber-600 font-medium" : ""}>{displayDate(e.sonraki_kontrol_tarihi)}</span>
                      </div>
                    </td>
                    <td><span className={`badge ${e.durum === "aktif" ? "bg-green-100 text-green-700" : e.durum === "bakimda" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{e.durum}</span></td>
                    <td>
                      {dosyalar.length > 0 ? (
                        <div className="flex flex-col gap-0.5">
                          {dosyalar.slice(0, 3).map((d: any) => (
                            <div key={d.id} className="flex items-center gap-1 text-xs">
                              <Paperclip className="w-3 h-3 text-gray-400 flex-shrink-0" />
                              <a href={d.dosya_url} target="_blank" rel="noopener noreferrer" className="truncate max-w-[100px] text-purple-600 hover:underline">{d.dosya_adi}</a>
                              {d.bitis_tarihi && isGecmis(d.bitis_tarihi) && <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0" />}
                              {d.bitis_tarihi && !isGecmis(d.bitis_tarihi) && isYaklasan(d.bitis_tarihi) && <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />}
                            </div>
                          ))}
                          {dosyalar.length > 3 && <span className="text-xs text-gray-400">+{dosyalar.length - 3} daha</span>}
                        </div>
                      ) : <span className="text-xs text-gray-400">-</span>}
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleEdit(e)} className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(e.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
