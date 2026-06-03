"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeForm } from "@/lib/security";
import { logAudit } from "@/lib/audit";
import { displayDate } from "@/lib/tarih";
import { Users, Plus, Search, Edit, Trash2, X, MessageSquare, ClipboardList, ThumbsUp, CheckCircle } from "lucide-react";

const turOptions = [
  { value: "komite_toplandi", label: "Komite Toplantısı", icon: Users },
  { value: "calisan_danismasi", label: "Çalışan Danışması", icon: MessageSquare },
  { value: "anket", label: "Anket", icon: ClipboardList },
  { value: "oneri", label: "Öneri", icon: ThumbsUp },
];

const durumOptions = [
  { value: "planlandi", label: "Planlandı" },
  { value: "gerceklesti", label: "Gerçekleşti" },
  { value: "iptal", label: "İptal" },
];

export default function IsciKatilimi() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editStatus, setEditStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [form, setForm] = useState({ tur: "komite_toplandi", baslik: "", aciklama: "", tarih: "", katilimcilar: "", sonuclar: "", durum: "planlandi" });

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      const { data } = await supabase.from("isci_katilimi").select("*").order("olusturma_tarihi", { ascending: false });
      if (data) setItems(data);
    } catch (e: any) {
      console.error("İşçi katılımı yükleme hatası:", e);
      setEditStatus({ type: "error", message: "Veriler yüklenirken hata oluştu" });
    } finally {
      setLoading(false);
    }
  };

  const filtered = items.filter(i =>
    (i.baslik || "").toLowerCase().includes(search.toLowerCase()) || (i.aciklama && i.aciklama.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSubmit = async () => {
    if (!form.baslik) return;
    try {
      const payload = sanitizeForm({ ...form, tarih: form.tarih || null });
      if (editing) {
        const { error: updateError } = await supabase.from("isci_katilimi").update(payload).eq("id", editing.id);
        if (updateError) throw updateError;
        await logAudit("isci_katilimi", "UPDATE", editing.id, editing, payload);
      } else {
        const { data, error: insertError } = await supabase.from("isci_katilimi").insert(payload).select();
        if (insertError) throw insertError;
        if (data) await logAudit("isci_katilimi", "INSERT", data[0].id, null, payload);
      }
      setShowForm(false);
      setEditing(null);
      setEditStatus({ type: "success", message: editing ? "Kayıt güncellendi" : "Kayıt eklendi" });
      setForm({ tur: "komite_toplandi", baslik: "", aciklama: "", tarih: "", katilimcilar: "", sonuclar: "", durum: "planlandi" });
      fetchItems();
    } catch (e: any) {
      setEditStatus({ type: "error", message: e.message || "Kayıt işlemi başarısız" });
    }
  };

  const handleEdit = (item: any) => {
    setEditing(item);
    setForm({ tur: item.tur, baslik: item.baslik, aciklama: item.aciklama || "", tarih: item.tarih?.split("T")[0] || "", katilimcilar: item.katilimcilar || "", sonuclar: item.sonuclar || "", durum: item.durum });
    setShowForm(true);
    setEditStatus(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu kaydı silmek istediğinize emin misiniz?")) return;
    try {
      const item = items.find(i => i.id === id);
      const { error: deleteError } = await supabase.from("isci_katilimi").delete().eq("id", id);
      if (deleteError) throw deleteError;
      if (item) await logAudit("isci_katilimi", "DELETE", id, item, null);
      setEditStatus({ type: "success", message: "Kayıt silindi" });
      fetchItems();
    } catch (e: any) {
      setEditStatus({ type: "error", message: e.message || "Silme işlemi başarısız" });
    }
  };

  if (loading) return <div className="flex-1 p-8 flex items-center justify-center text-gray-400">Yükleniyor...</div>;

  const stats = { toplam: items.length, gerceklesen: items.filter(i => i.durum === "gerceklesti").length, planlanan: items.filter(i => i.durum === "planlandi").length, iptal: items.filter(i => i.durum === "iptal").length };

  return (
    <div className="flex-1 p-8 app-bg min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="page-header">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">İşçi Katılımı ve Danışma</h2>
              <p className="text-sm text-gray-500">ISO 45001 Madde 5.4 - Çalışan katılımı ve danışma kayıtları</p>
            </div>
          </div>
          <button onClick={() => { setShowForm(true); setEditing(null); setEditStatus(null); setForm({ tur: "komite_toplandi", baslik: "", aciklama: "", tarih: "", katilimcilar: "", sonuclar: "", durum: "planlandi" }); }} className="btn btn-primary">
            <Plus className="w-4 h-4" /> Yeni Kayıt
          </button>
        </div>

        {editStatus && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm border ${editStatus.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
            {editStatus.type === "success" ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {editStatus.message}
          </div>
        )}

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card p-4"><p className="text-xs text-gray-500">Toplam</p><p className="text-2xl font-bold text-gray-800">{stats.toplam}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Gerçekleşen</p><p className="text-2xl font-bold text-green-600">{stats.gerceklesen}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Planlanan</p><p className="text-2xl font-bold text-blue-600">{stats.planlanan}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">İptal</p><p className="text-2xl font-bold text-gray-400">{stats.iptal}</p></div>
        </div>

        <div className="card p-4 mb-6">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Kayıt ara..." value={search} onChange={e => setSearch(e.target.value)} className="input pr-12" />
          </div>
        </div>

        <div className="card overflow-hidden">
          <table>
            <thead>
              <tr>
                <th>Tür</th>
                <th>Başlık</th>
                <th>Tarih</th>
                <th>Katılımcılar</th>
                <th>Durum</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const tur = turOptions.find(t => t.value === item.tur);
                const durum = durumOptions.find(d => d.value === item.durum);
                const TurIcon = tur?.icon || Users;
                return (
                  <tr key={item.id}>
                    <td><span className="badge bg-purple-100 text-purple-700 flex items-center gap-1 w-fit"><TurIcon className="w-3 h-3" />{tur?.label}</span></td>
                    <td className="font-medium">{item.baslik}</td>
                    <td>{displayDate(item.tarih)}</td>
                    <td className="max-w-xs truncate">{item.katilimcilar || "-"}</td>
                    <td><span className={`badge ${item.durum === "gerceklesti" ? "bg-green-100 text-green-700" : item.durum === "planlandi" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>{durum?.label}</span></td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(item)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400">Henüz kayıt yok</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? "Kayıt Düzenle" : "Yeni Kayıt Ekle"}</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="modal-body space-y-4">
              <div>
                <label>Tür *</label>
                <select value={form.tur} onChange={e => setForm({ ...form, tur: e.target.value })}>
                  {turOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label>Başlık *</label>
                <input type="text" value={form.baslik} onChange={e => setForm({ ...form, baslik: e.target.value })} placeholder="Örn: Nisan ayı OHS komite toplantısı" />
              </div>
              <div>
                <label>Açıklama</label>
                <textarea value={form.aciklama} onChange={e => setForm({ ...form, aciklama: e.target.value })} rows={3} placeholder="Toplantı gündemi, anket detayı..." />
              </div>
              <div className="grid-2">
                <div>
                  <label>Tarih</label>
                  <input type="date" value={form.tarih} onChange={e => setForm({ ...form, tarih: e.target.value })} />
                </div>
                <div>
                  <label>Durum</label>
                  <select value={form.durum} onChange={e => setForm({ ...form, durum: e.target.value })}>
                    {durumOptions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label>Katılımcılar</label>
                <input type="text" value={form.katilimcilar} onChange={e => setForm({ ...form, katilimcilar: e.target.value })} placeholder="Ad soyad, ünvan (virgülle ayırın)" />
              </div>
              <div>
                <label>Sonuçlar / Çıktılar</label>
                <textarea value={form.sonuclar} onChange={e => setForm({ ...form, sonuclar: e.target.value })} rows={2} placeholder="Alınan kararlar, aksiyonlar..." />
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
