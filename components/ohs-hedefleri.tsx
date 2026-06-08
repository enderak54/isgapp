"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeForm } from "@/lib/security";
import { logAudit } from "@/lib/audit";
import { displayDate } from "@/lib/tarih";
import { Target, Plus, Search, Edit, Trash2, X, CheckCircle } from "lucide-react";

const durumOptions = [
  { value: "devam", label: "Devam Ediyor" },
  { value: "tamamlandi", label: "Tamamlandı" },
  { value: "iptal", label: "İptal" },
];

export default function OhsHedefleri() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editStatus, setEditStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [form, setForm] = useState({ hedef_adi: "", aciklama: "", kpi: "", hedef_deger: "", mevcut_deger: "", birim: "", baslangic_tarihi: "", hedef_tarih: "", sorumlu: "", durum: "devam" });

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      const { data } = await supabase.from("ohs_hedefleri").select("*").order("olusturma_tarihi", { ascending: false });
      if (data) setItems(data);
    } catch (e: any) {
      setEditStatus({ type: "error", message: "Veriler yüklenirken hata oluştu" });
    } finally {
      setLoading(false);
    }
  };

  const filtered = items.filter(i =>
    (i.hedef_adi || "").toLowerCase().includes(search.toLowerCase()) || (i.aciklama && i.aciklama.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSubmit = async () => {
    if (!form.hedef_adi) return;
    try {
      const payload = sanitizeForm({
        ...form,
        hedef_deger: form.hedef_deger ? parseFloat(form.hedef_deger) : null,
        mevcut_deger: form.mevcut_deger ? parseFloat(form.mevcut_deger) : null,
        baslangic_tarihi: form.baslangic_tarihi || null,
        hedef_tarih: form.hedef_tarih || null,
      });
      if (editing) {
        const { error: updateError } = await supabase.from("ohs_hedefleri").update(payload).eq("id", editing.id);
        if (updateError) throw updateError;
        await logAudit("ohs_hedefleri", "UPDATE", editing.id, editing, payload);
      } else {
        const { data, error: insertError } = await supabase.from("ohs_hedefleri").insert(payload).select();
        if (insertError) throw insertError;
        if (data) await logAudit("ohs_hedefleri", "INSERT", data[0].id, null, payload);
      }
      setShowForm(false);
      setEditing(null);
      setEditStatus({ type: "success", message: editing ? "Hedef güncellendi" : "Hedef eklendi" });
      setForm({ hedef_adi: "", aciklama: "", kpi: "", hedef_deger: "", mevcut_deger: "", birim: "", baslangic_tarihi: "", hedef_tarih: "", sorumlu: "", durum: "devam" });
      fetchItems();
    } catch (e: any) {
      setEditStatus({ type: "error", message: e.message || "Kayıt işlemi başarısız" });
    }
  };

  const handleEdit = (item: any) => {
    setEditing(item);
    setForm({
      hedef_adi: item.hedef_adi, aciklama: item.aciklama || "", kpi: item.kpi || "",
      hedef_deger: item.hedef_deger?.toString() || "", mevcut_deger: item.mevcut_deger?.toString() || "",
      birim: item.birim || "", baslangic_tarihi: item.baslangic_tarihi?.split("T")[0] || "",
      hedef_tarih: item.hedef_tarih?.split("T")[0] || "", sorumlu: item.sorumlu || "", durum: item.durum,
    });
    setShowForm(true);
    setEditStatus(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu hedefi silmek istediğinize emin misiniz?")) return;
    try {
      const item = items.find(i => i.id === id);
      const { error: deleteError } = await supabase.from("ohs_hedefleri").delete().eq("id", id);
      if (deleteError) throw deleteError;
      if (item) await logAudit("ohs_hedefleri", "DELETE", id, item, null);
      setEditStatus({ type: "success", message: "Hedef silindi" });
      fetchItems();
    } catch (e: any) {
      setEditStatus({ type: "error", message: e.message || "Silme işlemi başarısız" });
    }
  };

  if (loading) return <div className="flex-1 p-8 flex items-center justify-center text-gray-400">Yükleniyor...</div>;

  const stats = {
    toplam: items.length, tamamlanan: items.filter(i => i.durum === "tamamlandi").length,
    devam: items.filter(i => i.durum === "devam").length, hedefe_ulasan: items.filter(i => i.durum === "tamamlandi" && i.mevcut_deger >= i.hedef_deger).length,
  };

  return (
    <div className="flex-1 p-8 app-bg min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="page-header">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">OHS Hedefleri ve Planlama</h2>
              <p className="text-sm text-gray-500">ISO 45001 Madde 6.2 - İSG hedefleri ve planlama</p>
            </div>
          </div>
          <button onClick={() => { setShowForm(true); setEditing(null); setEditStatus(null); setForm({ hedef_adi: "", aciklama: "", kpi: "", hedef_deger: "", mevcut_deger: "", birim: "", baslangic_tarihi: "", hedef_tarih: "", sorumlu: "", durum: "devam" }); }} className="btn btn-primary">
            <Plus className="w-4 h-4" /> Yeni Hedef
          </button>
        </div>

        {editStatus && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm border ${editStatus.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
            {editStatus.type === "success" ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {editStatus.message}
          </div>
        )}

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card p-4"><p className="text-xs text-gray-500">Toplam Hedef</p><p className="text-2xl font-bold text-gray-800">{stats.toplam}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Tamamlanan</p><p className="text-2xl font-bold text-green-600">{stats.tamamlanan}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Devam Eden</p><p className="text-2xl font-bold text-blue-600">{stats.devam}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Hedefe Ulaşan</p><p className="text-2xl font-bold text-purple-600">{stats.hedefe_ulasan}</p></div>
        </div>

        <div className="card p-4 mb-6">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Hedef ara..." value={search} onChange={e => setSearch(e.target.value)} className="input pr-12" />
          </div>
        </div>

        <div className="card overflow-hidden">
          <table>
            <thead>
              <tr>
                <th>Hedef Adı</th>
                <th>KPI</th>
                <th>Hedef Değer</th>
                <th>Mevcut Değer</th>
                <th>Başlangıç</th>
                <th>Hedef Tarih</th>
                <th>Sorumlu</th>
                <th>Durum</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const durum = durumOptions.find(d => d.value === item.durum);
                const ilerleme = item.hedef_deger > 0 ? Math.min(100, Math.round((item.mevcut_deger || 0) / item.hedef_deger * 100)) : 0;
                return (
                  <tr key={item.id}>
                    <td className="font-medium">{item.hedef_adi}</td>
                    <td className="text-sm">{item.kpi || "-"}</td>
                    <td>{item.hedef_deger != null ? `${item.hedef_deger} ${item.birim || ""}` : "-"}</td>
                    <td>{item.mevcut_deger != null ? `${item.mevcut_deger} ${item.birim || ""}` : "-"}</td>
                    <td className="text-sm">{displayDate(item.baslangic_tarihi)}</td>
                    <td className="text-sm">{displayDate(item.hedef_tarih)}</td>
                    <td className="text-sm">{item.sorumlu || "-"}</td>
                    <td>
                      <span className={`badge ${item.durum === "tamamlandi" ? "bg-green-100 text-green-700" : item.durum === "devam" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>
                        {durum?.label} {item.durum === "devam" && `(%${ilerleme})`}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(item)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={9} className="text-center py-8 text-gray-400">Henüz hedef kaydı yok</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? "Hedef Düzenle" : "Yeni Hedef Ekle"}</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="modal-body space-y-4">
              <div>
                <label>Hedef Adı *</label>
                <input type="text" value={form.hedef_adi} onChange={e => setForm({ ...form, hedef_adi: e.target.value })} placeholder="Örn: Kaza sıklık oranını %20 azaltmak" />
              </div>
              <div>
                <label>Açıklama</label>
                <textarea value={form.aciklama} onChange={e => setForm({ ...form, aciklama: e.target.value })} rows={2} placeholder="Hedefin detaylı açıklaması..." />
              </div>
              <div>
                <label>KPI (Performans Göstergesi)</label>
                <input type="text" value={form.kpi} onChange={e => setForm({ ...form, kpi: e.target.value })} placeholder="Örn: KSO" />
              </div>
              <div className="grid-2">
                <div>
                  <label>Hedef Değer</label>
                  <input type="number" step="0.01" value={form.hedef_deger} onChange={e => setForm({ ...form, hedef_deger: e.target.value })} />
                </div>
                <div>
                  <label>Mevcut Değer</label>
                  <input type="number" step="0.01" value={form.mevcut_deger} onChange={e => setForm({ ...form, mevcut_deger: e.target.value })} />
                </div>
              </div>
              <div>
                <label>Birim</label>
                <input type="text" value={form.birim} onChange={e => setForm({ ...form, birim: e.target.value })} placeholder="Örn: %, adet, gün" />
              </div>
              <div className="grid-2">
                <div>
                  <label>Başlangıç Tarihi</label>
                  <input type="date" value={form.baslangic_tarihi} onChange={e => setForm({ ...form, baslangic_tarihi: e.target.value })} />
                </div>
                <div>
                  <label>Hedef Tarih</label>
                  <input type="date" value={form.hedef_tarih} onChange={e => setForm({ ...form, hedef_tarih: e.target.value })} />
                </div>
              </div>
              <div className="grid-2">
                <div>
                  <label>Sorumlu</label>
                  <input type="text" value={form.sorumlu} onChange={e => setForm({ ...form, sorumlu: e.target.value })} placeholder="Ad soyad" />
                </div>
                <div>
                  <label>Durum</label>
                  <select value={form.durum} onChange={e => setForm({ ...form, durum: e.target.value })}>
                    {durumOptions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
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
