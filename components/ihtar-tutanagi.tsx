"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeForm } from "@/lib/security";
import { AlertOctagon, Plus, Search, Edit, Trash2, X } from "lucide-react";

const ihtarTipleri = [
  { value: "yazili", label: "Yazılı İhtar" },
  { value: "kesin", label: "Kesin İhtar" },
  { value: "uyari", label: "Uyarı" },
  { value: "kinai", label: "Kınama" },
];
const durumlar = [
  { value: "duzenlendi", label: "Düzenlendi" },
  { value: "teblig edildi", label: "Tebliğ Edildi" },
  { value: "itiraz var", label: "İtiraz Var" },
  { value: "kapatildi", label: "Kapatıldı" },
];

export default function IhtarTutanagi() {
  const [items, setItems] = useState<any[]>([]);
  const [personel, setPersonel] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ personel_id: "", ihtar_tipi: "uyari", tarih: "", yer: "", konu: "", aciklama: "", dayanak_madde: "", teblig_tarihi: "", personel_gorusu: "", durum: "duzenlendi" });

  useEffect(() => { fetchItems(); fetchPersonel(); }, []);

  const fetchItems = async () => {
    const { data } = await supabase.from("ihtar_tutanagi").select("*, personel(ad_soyad, kimlik_no)").order("tarih", { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  const fetchPersonel = async () => {
    const { data } = await supabase.from("personel").select("id, ad_soyad");
    if (data) setPersonel(data);
  };

  const filtered = items.filter(i => i.konu.toLowerCase().includes(search.toLowerCase()) || (i.personel?.ad_soyad && i.personel.ad_soyad.toLowerCase().includes(search.toLowerCase())));

  const handleSubmit = async () => {
    if (!form.konu || !form.personel_id || !form.tarih) return;
    const payload = sanitizeForm({ ...form, tarih: form.tarih || null, teblig_tarihi: form.teblig_tarihi || null });
    if (editing) {
      await supabase.from("ihtar_tutanagi").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("ihtar_tutanagi").insert(payload);
    }
    setShowForm(false);
    setEditing(null);
    setForm({ personel_id: "", ihtar_tipi: "uyari", tarih: "", yer: "", konu: "", aciklama: "", dayanak_madde: "", teblig_tarihi: "", personel_gorusu: "", durum: "duzenlendi" });
    fetchItems();
  };

  const handleEdit = (i: any) => {
    setEditing(i);
    setForm({ personel_id: i.personel_id, ihtar_tipi: i.ihtar_tipi, tarih: i.tarih.split("T")[0], yer: i.yer || "", konu: i.konu, aciklama: i.aciklama || "", dayanak_madde: i.dayanak_madde || "", teblig_tarihi: i.teblig_tarihi ? i.teblig_tarihi.split("T")[0] : "", personel_gorusu: i.personel_gorusu || "", durum: i.durum });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu ihtar tutanağını silmek istediğinize emin misiniz?")) return;
    await supabase.from("ihtar_tutanagi").delete().eq("id", id);
    fetchItems();
  };

  if (loading) return <div className="flex-1 p-8 flex items-center justify-center text-gray-400">Yükleniyor...</div>;

  const stats = { toplam: items.length, duzenlendi: items.filter(i => i.durum === "duzenlendi").length, teblig: items.filter(i => i.durum === "teblig edildi").length, kapatildi: items.filter(i => i.durum === "kapatildi").length };

  return (
    <main className="flex-1 p-8 app-bg min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="page-header">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center"><AlertOctagon className="w-6 h-6 text-gray-600" /></div>
            <div><h2 className="text-2xl font-semibold text-gray-800">İhtar Tutanağı</h2><p className="text-sm text-gray-500">Personel ihtar ve uyarı kayıtları</p></div>
          </div>
          <button onClick={() => { setShowForm(true); setEditing(null); setForm({ personel_id: "", ihtar_tipi: "uyari", tarih: "", yer: "", konu: "", aciklama: "", dayanak_madde: "", teblig_tarihi: "", personel_gorusu: "", durum: "duzenlendi" }); }} className="btn btn-primary"><Plus className="w-4 h-4" /> Yeni İhtar</button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card p-4"><p className="text-xs text-gray-500">Toplam</p><p className="text-2xl font-bold text-gray-800">{stats.toplam}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Düzenlendi</p><p className="text-2xl font-bold text-blue-600">{stats.duzenlendi}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Teblig Edildi</p><p className="text-2xl font-bold text-amber-600">{stats.teblig}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Kapatıldı</p><p className="text-2xl font-bold text-green-600">{stats.kapatildi}</p></div>
        </div>

        <div className="card p-4 mb-6"><div className="search-input"><input type="text" placeholder="İhtar ara..." value={search} onChange={e => setSearch(e.target.value)} /><Search /></div></div>

        <div className="card overflow-hidden">
          <table>
            <thead><tr><th>Personel</th><th>İhtar Tipi</th><th>Tarih</th><th>Yer</th><th>Konu</th><th>Teblig Tarihi</th><th>Durum</th><th>İşlem</th></tr></thead>
            <tbody>
              {filtered.map(i => (
                <tr key={i.id}>
                  <td className="font-medium">{i.personel?.ad_soyad || "-"}</td>
                  <td><span className={`badge ${i.ihtar_tipi === "kesin" ? "bg-red-100 text-red-700" : i.ihtar_tipi === "kinai" ? "bg-orange-100 text-orange-700" : i.ihtar_tipi === "yazili" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>{ihtarTipleri.find(t => t.value === i.ihtar_tipi)?.label}</span></td>
                  <td>{new Date(i.tarih).toLocaleDateString("tr-TR")}</td>
                  <td>{i.yer || "-"}</td>
                  <td className="max-w-xs truncate">{i.konu}</td>
                  <td>{i.teblig_tarihi ? new Date(i.teblig_tarihi).toLocaleDateString("tr-TR") : "-"}</td>
                  <td><span className={`badge ${i.durum === "kapatildi" ? "bg-green-100 text-green-700" : i.durum === "teblig edildi" ? "bg-amber-100 text-amber-700" : i.durum === "itiraz var" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>{durumlar.find(d => d.value === i.durum)?.label}</span></td>
                  <td><div className="flex gap-1"><button onClick={() => handleEdit(i)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Edit className="w-4 h-4" /></button><button onClick={() => handleDelete(i.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button></div></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-gray-400">Henüz ihtar kaydı yok</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{editing ? "İhtar Düzenle" : "Yeni İhtar Tutanağı"}</h3><button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button></div>
            <div className="modal-body space-y-4">
              <div><label>Personel *</label><select value={form.personel_id} onChange={e => setForm({ ...form, personel_id: e.target.value })}><option value="">Seçiniz</option>{personel.map(p => <option key={p.id} value={p.id}>{p.ad_soyad}</option>)}</select></div>
              <div className="grid-2"><div><label>İhtar Tipi</label><select value={form.ihtar_tipi} onChange={e => setForm({ ...form, ihtar_tipi: e.target.value })}>{ihtarTipleri.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div><div><label>Tarih *</label><input type="date" value={form.tarih} onChange={e => setForm({ ...form, tarih: e.target.value })} /></div></div>
              <div><label>Yer</label><input type="text" value={form.yer} onChange={e => setForm({ ...form, yer: e.target.value })} placeholder="Olay yeri" /></div>
              <div><label>Konu *</label><input type="text" value={form.konu} onChange={e => setForm({ ...form, konu: e.target.value })} placeholder="İhtar konusu" /></div>
              <div><label>Açıklama</label><textarea value={form.aciklama} onChange={e => setForm({ ...form, aciklama: e.target.value })} rows={3} placeholder="Detaylı açıklama..." /></div>
              <div><label>Dayanak Madde</label><input type="text" value={form.dayanak_madde} onChange={e => setForm({ ...form, dayanak_madde: e.target.value })} placeholder="Örn: İş Kanunu Madde 25" /></div>
              <div><label>Tebliğ Tarihi</label><input type="date" value={form.teblig_tarihi} onChange={e => setForm({ ...form, teblig_tarihi: e.target.value })} /></div>
              <div><label>Personel Görüşü</label><textarea value={form.personel_gorusu} onChange={e => setForm({ ...form, personel_gorusu: e.target.value })} rows={2} placeholder="Personelin beyanı..." /></div>
              <div><label>Durum</label><select value={form.durum} onChange={e => setForm({ ...form, durum: e.target.value })}>{durumlar.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}</select></div>
              <div className="flex justify-end gap-2 pt-4"><button onClick={() => setShowForm(false)} className="btn" style={{ background: "#f3f4f6", color: "#374151" }}>İptal</button><button onClick={handleSubmit} className="btn btn-primary">{editing ? "Güncelle" : "Kaydet"}</button></div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
