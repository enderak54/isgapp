"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeForm } from "@/lib/security";
import { TrendingUp, Plus, Search, Edit, Trash2, X, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

const gostergeTipleri = [
  { value: "leading", label: "Öncül (Leading)" },
  { value: "lagging", label: "Sonucul (Lagging)" },
];

export default function PerformansIzleme() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ gosterge_adi: "", gosterge_tipi: "leading", birim: "", hedef_deger: "", gercek_deger: "", olcum_tarihi: "", onceki_deger: "", aciklama: "", aksiyon_gerekli_mu: false, aksiyon_aciklama: "" });

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    const { data } = await supabase.from("performans_izleme").select("*").order("olcum_tarihi", { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  const filtered = items.filter(i => i.gosterge_adi.toLowerCase().includes(search.toLowerCase()));

  const handleSubmit = async () => {
    if (!form.gosterge_adi || !form.olcum_tarihi) return;
    const payload = sanitizeForm({ ...form, hedef_deger: form.hedef_deger ? parseFloat(form.hedef_deger) : null, gercek_deger: form.gercek_deger ? parseFloat(form.gercek_deger) : null, onceki_deger: form.onceki_deger ? parseFloat(form.onceki_deger) : null, olcum_tarihi: form.olcum_tarihi || null });
    if (editing) {
      await supabase.from("performans_izleme").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("performans_izleme").insert(payload);
    }
    setShowForm(false);
    setEditing(null);
    setForm({ gosterge_adi: "", gosterge_tipi: "leading", birim: "", hedef_deger: "", gercek_deger: "", olcum_tarihi: "", onceki_deger: "", aciklama: "", aksiyon_gerekli_mu: false, aksiyon_aciklama: "" });
    fetchItems();
  };

  const handleEdit = (i: any) => {
    setEditing(i);
    setForm({ gosterge_adi: i.gosterge_adi, gosterge_tipi: i.gosterge_tipi, birim: i.birim || "", hedef_deger: i.hedef_deger?.toString() || "", gercek_deger: i.gercek_deger?.toString() || "", olcum_tarihi: i.olcum_tarihi.split("T")[0], onceki_deger: i.onceki_deger?.toString() || "", aciklama: i.aciklama || "", aksiyon_gerekli_mu: i.aksiyon_gerekli_mu, aksiyon_aciklama: i.aksiyon_aciklama || "" });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu kaydı silmek istediğinize emin misiniz?")) return;
    await supabase.from("performans_izleme").delete().eq("id", id);
    fetchItems();
  };

  if (loading) return <div className="flex-1 p-8 flex items-center justify-center text-gray-400">Yükleniyor...</div>;

  const stats = { toplam: items.length, hedefUlasildi: items.filter(i => i.hedef_ulasildi_mu === true).length, aksiyonGerekli: items.filter(i => i.aksiyon_gerekli_mu).length, leading: items.filter(i => i.gosterge_tipi === "leading").length };

  return (
    <main className="flex-1 p-8 app-bg min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="page-header">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center"><TrendingUp className="w-6 h-6 text-gray-600" /></div>
            <div><h2 className="text-2xl font-semibold text-gray-800">Performans İzleme</h2><p className="text-sm text-gray-500">İSG performans göstergeleri ve trend analizi</p></div>
          </div>
          <button onClick={() => { setShowForm(true); setEditing(null); setForm({ gosterge_adi: "", gosterge_tipi: "leading", birim: "", hedef_deger: "", gercek_deger: "", olcum_tarihi: "", onceki_deger: "", aciklama: "", aksiyon_gerekli_mu: false, aksiyon_aciklama: "" }); }} className="btn btn-primary"><Plus className="w-4 h-4" /> Yeni Gösterge</button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card p-4"><p className="text-xs text-gray-500">Toplam Ölçüm</p><p className="text-2xl font-bold text-gray-800">{stats.toplam}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Hedef Ulaşıldı</p><p className="text-2xl font-bold text-green-600">{stats.hedefUlasildi}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Aksiyon Gerekli</p><p className="text-2xl font-bold text-red-600">{stats.aksiyonGerekli}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Öncül Gösterge</p><p className="text-2xl font-bold text-blue-600">{stats.leading}</p></div>
        </div>

        <div className="card p-4 mb-6"><div className="search-input"><input type="text" placeholder="Gösterge ara..." value={search} onChange={e => setSearch(e.target.value)} /><Search /></div></div>

        <div className="card overflow-hidden">
          <table>
            <thead><tr><th>Gösterge</th><th>Tip</th><th>Birim</th><th>Hedef</th><th>Gerçek</th><th>Trend</th><th>Ölçüm Tarihi</th><th>Aksiyon</th><th>İşlem</th></tr></thead>
            <tbody>
              {filtered.map(i => (
                <tr key={i.id}>
                  <td className="font-medium">{i.gosterge_adi}</td>
                  <td><span className={`badge ${i.gosterge_tipi === "leading" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>{gostergeTipleri.find(g => g.value === i.gosterge_tipi)?.label}</span></td>
                  <td>{i.birim || "-"}</td>
                  <td className="text-center">{i.hedef_deger ?? "-"}</td>
                  <td className="text-center font-semibold">{i.gercek_deger ?? "-"}</td>
                  <td className="text-center">
                    {i.trend === "artis" ? <ArrowUpRight className="w-4 h-4 text-green-600 inline" /> : i.trend === "azalis" ? <ArrowDownRight className="w-4 h-4 text-red-600 inline" /> : <Minus className="w-4 h-4 text-gray-400 inline" />}
                    <span className="ml-1 text-xs text-gray-500">{i.trend}</span>
                  </td>
                  <td>{new Date(i.olcum_tarihi).toLocaleDateString("tr-TR")}</td>
                  <td>{i.aksiyon_gerekli_mu ? <span className="badge bg-red-100 text-red-700">Gerekli</span> : <span className="badge bg-green-100 text-green-700">Yok</span>}</td>
                  <td><div className="flex gap-1"><button onClick={() => handleEdit(i)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Edit className="w-4 h-4" /></button><button onClick={() => handleDelete(i.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button></div></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={9} className="text-center py-8 text-gray-400">Henüz ölçüm kaydı yok</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{editing ? "Gösterge Düzenle" : "Yeni Performans Göstergesi"}</h3><button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button></div>
            <div className="modal-body space-y-4">
              <div><label>Gösterge Adı *</label><input type="text" value={form.gosterge_adi} onChange={e => setForm({ ...form, gosterge_adi: e.target.value })} placeholder="Örn: İş kazası sayısı (aylık)" /></div>
              <div className="grid-2"><div><label>Tip</label><select value={form.gosterge_tipi} onChange={e => setForm({ ...form, gosterge_tipi: e.target.value })}>{gostergeTipleri.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}</select></div><div><label>Birim</label><input type="text" value={form.birim} onChange={e => setForm({ ...form, birim: e.target.value })} placeholder="Örn: adet, %, gün" /></div></div>
              <div className="grid-2"><div><label>Hedef Değer</label><input type="number" step="0.01" value={form.hedef_deger} onChange={e => setForm({ ...form, hedef_deger: e.target.value })} /></div><div><label>Gerçek Değer</label><input type="number" step="0.01" value={form.gercek_deger} onChange={e => setForm({ ...form, gercek_deger: e.target.value })} /></div></div>
              <div><label>Önceki Değer (trend için)</label><input type="number" step="0.01" value={form.onceki_deger} onChange={e => setForm({ ...form, onceki_deger: e.target.value })} /></div>
              <div><label>Ölçüm Tarihi *</label><input type="date" value={form.olcum_tarihi} onChange={e => setForm({ ...form, olcum_tarihi: e.target.value })} /></div>
              <div><label>Açıklama</label><textarea value={form.aciklama} onChange={e => setForm({ ...form, aciklama: e.target.value })} rows={2} /></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={form.aksiyon_gerekli_mu} onChange={e => setForm({ ...form, aksiyon_gerekli_mu: e.target.checked })} id="aksiyon" /><label htmlFor="aksiyon" className="mb-0">Aksiyon gerekli mi?</label></div>
              {form.aksiyon_gerekli_mu && (
                <div><label>Aksiyon Açıklaması</label><textarea value={form.aksiyon_aciklama} onChange={e => setForm({ ...form, aksiyon_aciklama: e.target.value })} rows={2} /></div>
              )}
              <div className="flex justify-end gap-2 pt-4"><button onClick={() => setShowForm(false)} className="btn" style={{ background: "#f3f4f6", color: "#374151" }}>İptal</button><button onClick={handleSubmit} className="btn btn-primary">{editing ? "Güncelle" : "Kaydet"}</button></div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
