"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeForm } from "@/lib/security";
import { logAudit } from "@/lib/audit";
import { displayDate } from "@/lib/tarih";
import { Scale, Plus, Search, Edit, Trash2, X, CheckCircle, AlertCircle, AlertTriangle, HelpCircle } from "lucide-react";

const uyumlulukDurumlari = [
  { value: "uyumlu", label: "Uyumlu", color: "bg-green-100 text-green-700", icon: CheckCircle },
  { value: "kismen_uyumlu", label: "Kısmen Uyumlu", color: "bg-amber-100 text-amber-700", icon: AlertCircle },
  { value: "uyumsuz", label: "Uyumsuz", color: "bg-red-100 text-red-700", icon: AlertTriangle },
  { value: "degerlendirilecek", label: "Değerlendirilecek", color: "bg-gray-100 text-gray-700", icon: HelpCircle },
];

export default function YasalUygunluk() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ yasal_metin_adi: "", yasal_dayanak: "", yayin_tarihi: "", resmi_gazete_no: "", kapsam: "", uyumluluk_durumu: "degerlendirilecek", uyumsuzluk_aciklama: "", gerekli_aksiyonlar: "", sorumlu_kisi: "", son_degerlendirme_tarihi: "", sonraki_degerlendirme_tarihi: "", notlar: "" });
  const [saving, setSaving] = useState(false);
  const [editStatus, setEditStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchItems = async () => {
    const { data } = await supabase.from("yasal_uygunluk").select("*").order("olusturma_tarihi", { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const filtered = items.filter(i => i.yasal_metin_adi.toLowerCase().includes(search.toLowerCase()) || (i.yasal_dayanak && i.yasal_dayanak.toLowerCase().includes(search.toLowerCase())));

  const handleSubmit = async () => {
    if (!form.yasal_metin_adi) return;
    setSaving(true);
    setEditStatus(null);
    try {
      const payload = sanitizeForm({ ...form, yayin_tarihi: form.yayin_tarihi || null, son_degerlendirme_tarihi: form.son_degerlendirme_tarihi || null, sonraki_degerlendirme_tarihi: form.sonraki_degerlendirme_tarihi || null });
      if (editing) {
        const { error } = await supabase.from("yasal_uygunluk").update(payload).eq("id", editing.id);
        if (error) throw error;
        await logAudit("yasal_uygunluk", "UPDATE", editing.id, editing, payload);
        setEditStatus({ type: "success", message: "Yasal uygunluk güncellendi" });
      } else {
        const { data, error } = await supabase.from("yasal_uygunluk").insert(payload).select();
        if (error) throw error;
        if (data) await logAudit("yasal_uygunluk", "INSERT", data[0].id, null, payload);
        setEditStatus({ type: "success", message: "Yasal uygunluk kaydedildi" });
      }
      setShowForm(false);
      setEditing(null);
      setForm({ yasal_metin_adi: "", yasal_dayanak: "", yayin_tarihi: "", resmi_gazete_no: "", kapsam: "", uyumluluk_durumu: "degerlendirilecek", uyumsuzluk_aciklama: "", gerekli_aksiyonlar: "", sorumlu_kisi: "", son_degerlendirme_tarihi: "", sonraki_degerlendirme_tarihi: "", notlar: "" });
      fetchItems();
    } catch (e: any) {
      setEditStatus({ type: "error", message: e.message || "Kayıt işlemi başarısız" });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (i: any) => {
    setEditing(i);
    setForm({ yasal_metin_adi: i.yasal_metin_adi, yasal_dayanak: i.yasal_dayanak || "", yayin_tarihi: i.yayin_tarihi ? i.yayin_tarihi.split("T")[0] : "", resmi_gazete_no: i.resmi_gazete_no || "", kapsam: i.kapsam || "", uyumluluk_durumu: i.uyumluluk_durumu, uyumsuzluk_aciklama: i.uyumsuzluk_aciklama || "", gerekli_aksiyonlar: i.gerekli_aksiyonlar || "", sorumlu_kisi: i.sorumlu_kisi || "", son_degerlendirme_tarihi: i.son_degerlendirme_tarihi ? i.son_degerlendirme_tarihi.split("T")[0] : "", sonraki_degerlendirme_tarihi: i.sonraki_degerlendirme_tarihi ? i.sonraki_degerlendirme_tarihi.split("T")[0] : "", notlar: i.notlar || "" });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu kaydı silmek istediğinize emin misiniz?")) return;
    setEditStatus(null);
    try {
      const { error } = await supabase.from("yasal_uygunluk").delete().eq("id", id);
      if (error) throw error;
      await logAudit("yasal_uygunluk", "DELETE", id, null, null);
      setEditStatus({ type: "success", message: "Yasal uygunluk silindi" });
      fetchItems();
    } catch (e: any) {
      setEditStatus({ type: "error", message: e.message || "Silme işlemi başarısız" });
    }
  };

  if (loading) return <div className="flex-1 p-8 flex items-center justify-center text-gray-400">Yükleniyor...</div>;

  const stats = { toplam: items.length, uyumlu: items.filter(i => i.uyumluluk_durumu === "uyumlu").length, uyumsuz: items.filter(i => i.uyumluluk_durumu === "uyumsuz").length, bekleyen: items.filter(i => i.uyumluluk_durumu === "degerlendirilecek").length };

  return (
    <div className="flex-1 p-8 app-bg min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="page-header">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center"><Scale className="w-6 h-6 text-gray-600" /></div>
            <div><h2 className="text-2xl font-semibold text-gray-800">Yasal Uygunluk</h2><p className="text-sm text-gray-500">Yasal gereklilikler ve uyum takibi</p></div>
          </div>
          <button onClick={() => { setShowForm(true); setEditing(null); setForm({ yasal_metin_adi: "", yasal_dayanak: "", yayin_tarihi: "", resmi_gazete_no: "", kapsam: "", uyumluluk_durumu: "degerlendirilecek", uyumsuzluk_aciklama: "", gerekli_aksiyonlar: "", sorumlu_kisi: "", son_degerlendirme_tarihi: "", sonraki_degerlendirme_tarihi: "", notlar: "" }); }} className="btn btn-primary"><Plus className="w-4 h-4" /> Yeni Kayıt</button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card p-4"><p className="text-xs text-gray-500">Toplam</p><p className="text-2xl font-bold text-gray-800">{stats.toplam}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Uyumlu</p><p className="text-2xl font-bold text-green-600">{stats.uyumlu}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Uyumsuz</p><p className="text-2xl font-bold text-red-600">{stats.uyumsuz}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Bekleyen</p><p className="text-2xl font-bold text-amber-600">{stats.bekleyen}</p></div>
        </div>

        <div className="card p-4 mb-6"><div className="relative"><Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" placeholder="Yasal metin ara..." value={search} onChange={e => setSearch(e.target.value)} className="input pr-12" /></div></div>

        {editStatus && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm border ${editStatus.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
            {editStatus.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {editStatus.message}
          </div>
        )}

        <div className="card overflow-hidden">
          <table>
            <thead><tr><th>Yasal Metin</th><th>Yasal Dayanak</th><th>Yayın Tarihi</th><th>Uyumluluk</th><th>Sorumlu</th><th>Son Değerlendirme</th><th>İşlem</th></tr></thead>
            <tbody>
              {filtered.map(i => {
                const d = uyumlulukDurumlari.find(u => u.value === i.uyumluluk_durumu) || uyumlulukDurumlari[3];
                const Icon = d.icon;
                return (
                  <tr key={i.id}>
                    <td className="font-medium">{i.yasal_metin_adi}</td>
                    <td>{i.yasal_dayanak || "-"}</td>
                    <td>{displayDate(i.yayin_tarihi)}</td>
                    <td><span className={`badge ${d.color}`}><Icon className="w-3 h-3 mr-1" />{d.label}</span></td>
                    <td>{i.sorumlu_kisi || "-"}</td>
                    <td>{displayDate(i.son_degerlendirme_tarihi)}</td>
                    <td><div className="flex gap-1"><button onClick={() => handleEdit(i)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Edit className="w-4 h-4" /></button><button onClick={() => handleDelete(i.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button></div></td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">Henüz kayıt yok</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{editing ? "Kayıt Düzenle" : "Yeni Yasal Uygunluk Kaydı"}</h3><button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button></div>
            <div className="modal-body space-y-4">
              <div><label>Yasal Metin Adı *</label><input type="text" value={form.yasal_metin_adi} onChange={e => setForm({ ...form, yasal_metin_adi: e.target.value })} placeholder="Örn: 6331 sayılı İSG Kanunu" /></div>
              <div className="grid-2"><div><label>Yasal Dayanak</label><input type="text" value={form.yasal_dayanak} onChange={e => setForm({ ...form, yasal_dayanak: e.target.value })} /></div><div><label>Resmi Gazete No</label><input type="text" value={form.resmi_gazete_no} onChange={e => setForm({ ...form, resmi_gazete_no: e.target.value })} /></div></div>
              <div className="grid-2"><div><label>Yayın Tarihi</label><input type="date" value={form.yayin_tarihi} onChange={e => setForm({ ...form, yayin_tarihi: e.target.value })} /></div><div><label>Kapsam</label><input type="text" value={form.kapsam} onChange={e => setForm({ ...form, kapsam: e.target.value })} /></div></div>
              <div><label>Uyumluluk Durumu</label><select value={form.uyumluluk_durumu} onChange={e => setForm({ ...form, uyumluluk_durumu: e.target.value })}>{uyumlulukDurumlari.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}</select></div>
              <div><label>Uyumsuzluk Açıklaması</label><textarea value={form.uyumsuzluk_aciklama} onChange={e => setForm({ ...form, uyumsuzluk_aciklama: e.target.value })} rows={2} /></div>
              <div><label>Gerekli Aksiyonlar</label><textarea value={form.gerekli_aksiyonlar} onChange={e => setForm({ ...form, gerekli_aksiyonlar: e.target.value })} rows={2} /></div>
              <div className="grid-2"><div><label>Sorumlu Kişi</label><input type="text" value={form.sorumlu_kisi} onChange={e => setForm({ ...form, sorumlu_kisi: e.target.value })} /></div><div><label>Son Değerlendirme</label><input type="date" value={form.son_degerlendirme_tarihi} onChange={e => setForm({ ...form, son_degerlendirme_tarihi: e.target.value })} /></div></div>
              <div><label>Sonraki Değerlendirme</label><input type="date" value={form.sonraki_degerlendirme_tarihi} onChange={e => setForm({ ...form, sonraki_degerlendirme_tarihi: e.target.value })} /></div>
              <div><label>Notlar</label><textarea value={form.notlar} onChange={e => setForm({ ...form, notlar: e.target.value })} rows={2} /></div>
              <div className="flex justify-end gap-2 pt-4"><button onClick={() => setShowForm(false)} className="btn" style={{ background: "#f3f4f6", color: "#374151" }}>İptal</button><button onClick={handleSubmit} className="btn btn-primary">{editing ? "Güncelle" : "Kaydet"}</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
