"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeForm } from "@/lib/security";
import { logAudit } from "@/lib/audit";
import { displayDate } from "@/lib/tarih";
import { ScrollText, Plus, Search, Edit, Trash2, X, CheckCircle, FileText } from "lucide-react";

const durumOptions = [
  { value: "aktif", label: "Aktif" },
  { value: "gecersiz", label: "Geçersiz" },
];

export default function PolitikaYonetimi() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editStatus, setEditStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [form, setForm] = useState({ baslik: "", politika_metni: "", versiyon: "1.0", onay_tarihi: "", gecerlilik_tarihi: "", durum: "aktif", onaylayan: "" });

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      const { data } = await supabase.from("politika_yonetimi").select("*").order("onay_tarihi", { ascending: false });
      if (data) setItems(data);
    } catch (e: any) {
      console.error("Politika yükleme hatası:", e);
      setEditStatus({ type: "error", message: "Veriler yüklenirken hata oluştu" });
    } finally {
      setLoading(false);
    }
  };

  const filtered = items.filter(i =>
    (i.baslik || "").toLowerCase().includes(search.toLowerCase()) || (i.politika_metni && i.politika_metni.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSubmit = async () => {
    if (!form.baslik) return;
    try {
      const payload = sanitizeForm({ ...form, onay_tarihi: form.onay_tarihi || null, gecerlilik_tarihi: form.gecerlilik_tarihi || null });
      if (editing) {
        const { error: updateError } = await supabase.from("politika_yonetimi").update(payload).eq("id", editing.id);
        if (updateError) throw updateError;
        await logAudit("politika_yonetimi", "UPDATE", editing.id, editing, payload);
      } else {
        const { data, error: insertError } = await supabase.from("politika_yonetimi").insert(payload).select();
        if (insertError) throw insertError;
        if (data) await logAudit("politika_yonetimi", "INSERT", data[0].id, null, payload);
      }
      setShowForm(false);
      setEditing(null);
      setEditStatus({ type: "success", message: editing ? "Politika güncellendi" : "Politika eklendi" });
      setForm({ baslik: "", politika_metni: "", versiyon: "1.0", onay_tarihi: "", gecerlilik_tarihi: "", durum: "aktif", onaylayan: "" });
      fetchItems();
    } catch (e: any) {
      setEditStatus({ type: "error", message: e.message || "Kayıt işlemi başarısız" });
    }
  };

  const handleEdit = (item: any) => {
    setEditing(item);
    setForm({
      baslik: item.baslik, politika_metni: item.politika_metni || "",
      versiyon: item.versiyon || "1.0", onay_tarihi: item.onay_tarihi?.split("T")[0] || "",
      gecerlilik_tarihi: item.gecerlilik_tarihi?.split("T")[0] || "", durum: item.durum, onaylayan: item.onaylayan || "",
    });
    setShowForm(true);
    setEditStatus(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu politikayı silmek istediğinize emin misiniz?")) return;
    try {
      const item = items.find(i => i.id === id);
      const { error: deleteError } = await supabase.from("politika_yonetimi").delete().eq("id", id);
      if (deleteError) throw deleteError;
      if (item) await logAudit("politika_yonetimi", "DELETE", id, item, null);
      setEditStatus({ type: "success", message: "Politika silindi" });
      fetchItems();
    } catch (e: any) {
      setEditStatus({ type: "error", message: e.message || "Silme işlemi başarısız" });
    }
  };

  if (loading) return <div className="flex-1 p-8 flex items-center justify-center text-gray-400">Yükleniyor...</div>;

  const stats = { toplam: items.length, aktif: items.filter(i => i.durum === "aktif").length, gecersiz: items.filter(i => i.durum === "gecersiz").length };

  return (
    <div className="flex-1 p-8 app-bg min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="page-header">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <ScrollText className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">Politika Yönetimi</h2>
              <p className="text-sm text-gray-500">ISO 45001 Madde 5.1 - İSG politikası ve taahhüt belgeleri</p>
            </div>
          </div>
          <button onClick={() => { setShowForm(true); setEditing(null); setEditStatus(null); setForm({ baslik: "", politika_metni: "", versiyon: "1.0", onay_tarihi: "", gecerlilik_tarihi: "", durum: "aktif", onaylayan: "" }); }} className="btn btn-primary">
            <Plus className="w-4 h-4" /> Yeni Politika
          </button>
        </div>

        {editStatus && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm border ${editStatus.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
            {editStatus.type === "success" ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {editStatus.message}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card p-4"><p className="text-xs text-gray-500">Toplam</p><p className="text-2xl font-bold text-gray-800">{stats.toplam}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Aktif</p><p className="text-2xl font-bold text-green-600">{stats.aktif}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Geçersiz</p><p className="text-2xl font-bold text-gray-400">{stats.gecersiz}</p></div>
        </div>

        <div className="card p-4 mb-6">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Politika ara..." value={search} onChange={e => setSearch(e.target.value)} className="input pr-12" />
          </div>
        </div>

        <div className="card overflow-hidden">
          <table>
            <thead>
              <tr>
                <th>Başlık</th>
                <th>Versiyon</th>
                <th>Onay Tarihi</th>
                <th>Geçerlilik</th>
                <th>Onaylayan</th>
                <th>Durum</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id}>
                  <td className="font-medium max-w-xs truncate">{item.baslik}</td>
                  <td><span className="badge bg-gray-100 text-gray-700">v{item.versiyon}</span></td>
                  <td className="text-sm">{displayDate(item.onay_tarihi)}</td>
                  <td className="text-sm">{displayDate(item.gecerlilik_tarihi)}</td>
                  <td className="text-sm">{item.onaylayan || "-"}</td>
                  <td><span className={`badge ${item.durum === "aktif" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>{item.durum === "aktif" ? "Aktif" : "Geçersiz"}</span></td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(item)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">Henüz politika kaydı yok</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? "Politika Düzenle" : "Yeni Politika Ekle"}</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="modal-body space-y-4">
              <div>
                <label>Başlık *</label>
                <input type="text" value={form.baslik} onChange={e => setForm({ ...form, baslik: e.target.value })} placeholder="Örn: İSG Politikası 2026" />
              </div>
              <div>
                <label>Politika Metni</label>
                <textarea value={form.politika_metni} onChange={e => setForm({ ...form, politika_metni: e.target.value })} rows={6} placeholder="Politika metnini buraya yazın..." />
              </div>
              <div className="grid-2">
                <div>
                  <label>Versiyon</label>
                  <input type="text" value={form.versiyon} onChange={e => setForm({ ...form, versiyon: e.target.value })} placeholder="1.0" />
                </div>
                <div>
                  <label>Onaylayan</label>
                  <input type="text" value={form.onaylayan} onChange={e => setForm({ ...form, onaylayan: e.target.value })} placeholder="Ad soyad" />
                </div>
              </div>
              <div className="grid-2">
                <div>
                  <label>Onay Tarihi</label>
                  <input type="date" value={form.onay_tarihi} onChange={e => setForm({ ...form, onay_tarihi: e.target.value })} />
                </div>
                <div>
                  <label>Geçerlilik Tarihi</label>
                  <input type="date" value={form.gecerlilik_tarihi} onChange={e => setForm({ ...form, gecerlilik_tarihi: e.target.value })} />
                </div>
              </div>
              <div>
                <label>Durum</label>
                <select value={form.durum} onChange={e => setForm({ ...form, durum: e.target.value })}>
                  {durumOptions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => setShowForm(false)} className="btn bg-gray-100 text-gray-700 hover:bg-gray-200">İptal</button>
                <button onClick={handleSubmit} className="btn btn-primary">{editing ? "Güncelle" : "Kaydet"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
