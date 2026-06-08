"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeForm } from "@/lib/security";
import { logAudit } from "@/lib/audit";
import { displayDate } from "@/lib/tarih";
import { FileCheck, Plus, Search, Edit, Trash2, X, CheckCircle, AlertCircle } from "lucide-react";

const dokumanTipleri = [
  { value: "prosedur", label: "Prosedür" },
  { value: "talimat", label: "Talimat" },
  { value: "form", label: "Form" },
  { value: "plan", label: "Plan" },
  { value: "rapor", label: "Rapor" },
  { value: "politika", label: "Politika" },
  { value: "diger", label: "Diğer" },
];
const durumlar = [
  { value: "taslak", label: "Taslak" },
  { value: "onay_bekliyor", label: "Onay Bekliyor" },
  { value: "yayinda", label: "Yayında" },
  { value: "gecersiz", label: "Geçersiz" },
  { value: "arsiv", label: "Arşiv" },
];

export default function DokumanKontrol() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editStatus, setEditStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [form, setForm] = useState({ dokuman_adi: "", dokuman_no: "", versiyon: "1.0", dokuman_tipi: "prosedur", icerik_ozeti: "", hazirlayan: "", onaylayan: "", onay_tarihi: "", yayin_tarihi: "", gecerlilik_tarihi: "", dosya_url: "", durum: "taslak", degisiklik_aciklama: "", ilgili_dokumanlar: "" });

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    const { data } = await supabase.from("dokuman_kontrol").select("*").order("olusturma_tarihi", { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  const filtered = items.filter(i => i.dokuman_adi.toLowerCase().includes(search.toLowerCase()) || (i.dokuman_no && i.dokuman_no.toLowerCase().includes(search.toLowerCase())));

  const handleSubmit = async () => {
    if (!form.dokuman_adi) return;
    setSaving(true);
    setEditStatus(null);
    try {
      const payload = sanitizeForm({ ...form, onay_tarihi: form.onay_tarihi || null, yayin_tarihi: form.yayin_tarihi || null, gecerlilik_tarihi: form.gecerlilik_tarihi || null, ilgili_dokumanlar: form.ilgili_dokumanlar ? form.ilgili_dokumanlar.split(",").map((s: string) => s.trim()) : [] });
      if (editing) {
        const { error } = await supabase.from("dokuman_kontrol").update(payload).eq("id", editing.id);
        if (error) throw error;
        await logAudit("dokuman_kontrol", "UPDATE", editing.id, editing, payload);
        setEditStatus({ type: "success", message: "Doküman güncellendi" });
      } else {
        const { data, error } = await supabase.from("dokuman_kontrol").insert(payload).select();
        if (error) throw error;
        if (data) await logAudit("dokuman_kontrol", "INSERT", data[0].id, null, payload);
        setEditStatus({ type: "success", message: "Doküman kaydedildi" });
      }
      setShowForm(false);
      setEditing(null);
      setForm({ dokuman_adi: "", dokuman_no: "", versiyon: "1.0", dokuman_tipi: "prosedur", icerik_ozeti: "", hazirlayan: "", onaylayan: "", onay_tarihi: "", yayin_tarihi: "", gecerlilik_tarihi: "", dosya_url: "", durum: "taslak", degisiklik_aciklama: "", ilgili_dokumanlar: "" });
      fetchItems();
    } catch (e: any) {
      setEditStatus({ type: "error", message: e.message || "Kayıt işlemi başarısız" });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (i: any) => {
    setEditing(i);
    setForm({ dokuman_adi: i.dokuman_adi, dokuman_no: i.dokuman_no || "", versiyon: i.versiyon || "1.0", dokuman_tipi: i.dokuman_tipi, icerik_ozeti: i.icerik_ozeti || "", hazirlayan: i.hazirlayan || "", onaylayan: i.onaylayan || "", onay_tarihi: i.onay_tarihi ? i.onay_tarihi.split("T")[0] : "", yayin_tarihi: i.yayin_tarihi ? i.yayin_tarihi.split("T")[0] : "", gecerlilik_tarihi: i.gecerlilik_tarihi ? i.gecerlilik_tarihi.split("T")[0] : "", dosya_url: i.dosya_url || "", durum: i.durum, degisiklik_aciklama: i.degisiklik_aciklama || "", ilgili_dokumanlar: Array.isArray(i.ilgili_dokumanlar) ? i.ilgili_dokumanlar.join(", ") : "" });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu dokümanı silmek istediğinize emin misiniz?")) return;
    setEditStatus(null);
    try {
      const { error } = await supabase.from("dokuman_kontrol").delete().eq("id", id);
      if (error) throw error;
      await logAudit("dokuman_kontrol", "DELETE", id, null, null);
      setEditStatus({ type: "success", message: "Doküman silindi" });
      fetchItems();
    } catch (e: any) {
      setEditStatus({ type: "error", message: e.message || "Silme işlemi başarısız" });
    }
  };

  if (loading) return <div className="flex-1 p-8 flex items-center justify-center text-gray-400">Yükleniyor...</div>;

  const stats = { toplam: items.length, yayinda: items.filter(i => i.durum === "yayinda").length, taslak: items.filter(i => i.durum === "taslak").length, gecersiz: items.filter(i => i.durum === "gecersiz").length };

  return (
    <div className="flex-1 p-8 app-bg min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="page-header">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center"><FileCheck className="w-6 h-6 text-gray-600" /></div>
            <div><h2 className="text-2xl font-semibold text-gray-800">Doküman Kontrol</h2><p className="text-sm text-gray-500">Doküman versiyon ve onay takibi</p></div>
          </div>
          <button onClick={() => { setShowForm(true); setEditing(null); setForm({ dokuman_adi: "", dokuman_no: "", versiyon: "1.0", dokuman_tipi: "prosedur", icerik_ozeti: "", hazirlayan: "", onaylayan: "", onay_tarihi: "", yayin_tarihi: "", gecerlilik_tarihi: "", dosya_url: "", durum: "taslak", degisiklik_aciklama: "", ilgili_dokumanlar: "" }); }} className="btn btn-primary"><Plus className="w-4 h-4" /> Yeni Doküman</button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card p-4"><p className="text-xs text-gray-500">Toplam</p><p className="text-2xl font-bold text-gray-800">{stats.toplam}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Yayında</p><p className="text-2xl font-bold text-green-600">{stats.yayinda}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Taslak</p><p className="text-2xl font-bold text-blue-600">{stats.taslak}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Geçersiz</p><p className="text-2xl font-bold text-red-600">{stats.gecersiz}</p></div>
        </div>

        <div className="card p-4 mb-6"><div className="relative"><Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" placeholder="Doküman ara..." value={search} onChange={e => setSearch(e.target.value)} className="input pr-12" /></div></div>

        {editStatus && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm border ${editStatus.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
            {editStatus.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {editStatus.message}
          </div>
        )}

        <div className="card overflow-hidden">
          <table>
            <thead><tr><th>Doküman No</th><th>Doküman Adı</th><th>Tip</th><th>Versiyon</th><th>Hazırlayan</th><th>Onaylayan</th><th>Yayın Tarihi</th><th>Durum</th><th>İşlem</th></tr></thead>
            <tbody>
              {filtered.map(i => (
                <tr key={i.id}>
                  <td className="font-mono text-sm">{i.dokuman_no || "-"}</td>
                  <td className="font-medium">{i.dokuman_adi}</td>
                  <td>{dokumanTipleri.find(d => d.value === i.dokuman_tipi)?.label}</td>
                  <td><span className="badge bg-gray-100 text-gray-700">v{i.versiyon}</span></td>
                  <td>{i.hazirlayan || "-"}</td>
                  <td>{i.onaylayan || "-"}</td>
                  <td>{displayDate(i.yayin_tarihi)}</td>
                  <td><span className={`badge ${i.durum === "yayinda" ? "bg-green-100 text-green-700" : i.durum === "onay_bekliyor" ? "bg-blue-100 text-blue-700" : i.durum === "taslak" ? "bg-gray-100 text-gray-700" : i.durum === "arsiv" ? "bg-purple-100 text-purple-700" : "bg-red-100 text-red-700"}`}>{durumlar.find(d => d.value === i.durum)?.label}</span></td>
                  <td><div className="flex gap-1"><button onClick={() => handleEdit(i)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Edit className="w-4 h-4" /></button><button onClick={() => handleDelete(i.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button></div></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={9} className="text-center py-8 text-gray-400">Henüz doküman yok</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{editing ? "Doküman Düzenle" : "Yeni Doküman"}</h3><button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button></div>
            <div className="modal-body space-y-4">
              <div className="grid-2"><div><label>Doküman Adı *</label><input type="text" value={form.dokuman_adi} onChange={e => setForm({ ...form, dokuman_adi: e.target.value })} /></div><div><label>Doküman No</label><input type="text" value={form.dokuman_no} onChange={e => setForm({ ...form, dokuman_no: e.target.value })} placeholder="Örn: PR-001" /></div></div>
              <div className="grid-2"><div><label>Versiyon</label><input type="text" value={form.versiyon} onChange={e => setForm({ ...form, versiyon: e.target.value })} /></div><div><label>Tip</label><select value={form.dokuman_tipi} onChange={e => setForm({ ...form, dokuman_tipi: e.target.value })}>{dokumanTipleri.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}</select></div></div>
              <div><label>İçerik Özeti</label><textarea value={form.icerik_ozeti} onChange={e => setForm({ ...form, icerik_ozeti: e.target.value })} rows={2} /></div>
              <div className="grid-2"><div><label>Hazırlayan</label><input type="text" value={form.hazirlayan} onChange={e => setForm({ ...form, hazirlayan: e.target.value })} /></div><div><label>Onaylayan</label><input type="text" value={form.onaylayan} onChange={e => setForm({ ...form, onaylayan: e.target.value })} /></div></div>
              <div className="grid-2"><div><label>Onay Tarihi</label><input type="date" value={form.onay_tarihi} onChange={e => setForm({ ...form, onay_tarihi: e.target.value })} /></div><div><label>Yayın Tarihi</label><input type="date" value={form.yayin_tarihi} onChange={e => setForm({ ...form, yayin_tarihi: e.target.value })} /></div></div>
              <div><label>Geçerlilik Tarihi</label><input type="date" value={form.gecerlilik_tarihi} onChange={e => setForm({ ...form, gecerlilik_tarihi: e.target.value })} /></div>
              <div><label>Dosya URL</label><input type="text" value={form.dosya_url} onChange={e => setForm({ ...form, dosya_url: e.target.value })} placeholder="https://..." /></div>
              <div><label>İlgili Dokümanlar (virgülle ayırın)</label><input type="text" value={form.ilgili_dokumanlar} onChange={e => setForm({ ...form, ilgili_dokumanlar: e.target.value })} /></div>
              <div><label>Değişiklik Açıklaması</label><textarea value={form.degisiklik_aciklama} onChange={e => setForm({ ...form, degisiklik_aciklama: e.target.value })} rows={2} /></div>
              <div><label>Durum</label><select value={form.durum} onChange={e => setForm({ ...form, durum: e.target.value })}>{durumlar.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}</select></div>
              <div className="flex justify-end gap-2 pt-4"><button onClick={() => setShowForm(false)} className="btn" style={{ background: "#f3f4f6", color: "#374151" }}>İptal</button><button onClick={handleSubmit} className="btn btn-primary">{editing ? "Güncelle" : "Kaydet"}</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
