"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeForm } from "@/lib/security";
import { ClipboardCheck, Plus, Search, Edit, Trash2, X, Eye } from "lucide-react";

const denetimTipleri = [
  { value: "ic", label: "İç Denetim" },
  { value: "dis", label: "Dış Denetim" },
  { value: "sertifikasyon", label: "Sertifikasyon" },
];
const durumlar = [
  { value: "planlandi", label: "Planlandı" },
  { value: "devam", label: "Devam Ediyor" },
  { value: "tamamlandi", label: "Tamamlandı" },
  { value: "iptal", label: "İptal" },
];

export default function ICDenetim() {
  const [items, setItems] = useState<any[]>([]);
  const [bulgular, setBulgular] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showBulguForm, setShowBulguForm] = useState(false);
  const [selectedDenetim, setSelectedDenetim] = useState<string | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ denetim_adi: "", denetim_tarihi: "", denetim_tipi: "ic", denetci: "", kapsam: "", kapsam_alanlari: "", guclu_yonler: "", iyilestirme_alanlari: "", genel_degerlendirme: "", durum: "planlandi" });
  const [bulguForm, setBulguForm] = useState({ bulgu_no: "", bulgu_tipi: "uygunsuzluk", bolum: "", bulgu_aciklama: "", dayanak_madde: "", oneri: "", sorumlu_kisi: "", duzeltme_tarihi: "", durum: "acik" });

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    const { data } = await supabase.from("ic_denetim").select("*").order("denetim_tarihi", { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  const fetchBulgular = async (denetimId: string) => {
    const { data } = await supabase.from("denetim_bulgulari").select("*").eq("denetim_id", denetimId).order("olusturma_tarihi");
    if (data) setBulgular(data);
  };

  const filtered = items.filter(i => i.denetim_adi.toLowerCase().includes(search.toLowerCase()) || i.denetci.toLowerCase().includes(search.toLowerCase()));

  const handleSubmit = async () => {
    if (!form.denetim_adi || !form.denetim_tarihi || !form.denetci) return;
    const payload = sanitizeForm({ ...form, denetim_tarihi: form.denetim_tarihi || null, kapsam_alanlari: form.kapsam_alanlari ? form.kapsam_alanlari.split(",").map((s: string) => s.trim()) : [] });
    if (editing) {
      await supabase.from("ic_denetim").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("ic_denetim").insert(payload);
    }
    setShowForm(false);
    setEditing(null);
    setForm({ denetim_adi: "", denetim_tarihi: "", denetim_tipi: "ic", denetci: "", kapsam: "", kapsam_alanlari: "", guclu_yonler: "", iyilestirme_alanlari: "", genel_degerlendirme: "", durum: "planlandi" });
    fetchItems();
  };

  const handleEdit = (i: any) => {
    setEditing(i);
    setForm({ denetim_adi: i.denetim_adi, denetim_tarihi: i.denetim_tarihi.split("T")[0], denetim_tipi: i.denetim_tipi, denetci: i.denetci, kapsam: i.kapsam || "", kapsam_alanlari: Array.isArray(i.kapsam_alanlari) ? i.kapsam_alanlari.join(", ") : "", guclu_yonler: i.guclu_yonler || "", iyilestirme_alanlari: i.iyilestirme_alanlari || "", genel_degerlendirme: i.genel_degerlendirme || "", durum: i.durum });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu denetimi silmek istediğinize emin misiniz?")) return;
    await supabase.from("ic_denetim").delete().eq("id", id);
    fetchItems();
  };

  const handleBulguSubmit = async () => {
    if (!bulguForm.bulgu_aciklama || !selectedDenetim) return;
    const payload = sanitizeForm({ ...bulguForm, denetim_id: selectedDenetim, duzeltme_tarihi: bulguForm.duzeltme_tarihi || null });
    await supabase.from("denetim_bulgulari").insert(payload);
    setShowBulguForm(false);
    setBulguForm({ bulgu_no: "", bulgu_tipi: "uygunsuzluk", bolum: "", bulgu_aciklama: "", dayanak_madde: "", oneri: "", sorumlu_kisi: "", duzeltme_tarihi: "", durum: "acik" });
    fetchBulgular(selectedDenetim);
  };

  const handleDeleteBulgu = async (id: string) => {
    if (!confirm("Bu bulguyu silmek istediğinize emin misiniz?")) return;
    await supabase.from("denetim_bulgulari").delete().eq("id", id);
    if (selectedDenetim) fetchBulgular(selectedDenetim);
  };

  if (loading) return <div className="flex-1 p-8 flex items-center justify-center text-gray-400">Yükleniyor...</div>;

  const stats = { toplam: items.length, planlanan: items.filter(i => i.durum === "planlandi").length, tamamlanan: items.filter(i => i.durum === "tamamlandi").length, toplamBulgu: items.reduce((a, b) => a + (b.bulgu_sayisi || 0), 0) };

  return (
    <div className="flex-1 p-8 app-bg min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="page-header">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center"><ClipboardCheck className="w-6 h-6 text-gray-600" /></div>
            <div><h2 className="text-2xl font-semibold text-gray-800">İç Denetim</h2><p className="text-sm text-gray-500">Denetim planlama, bulgu takibi</p></div>
          </div>
          <button onClick={() => { setShowForm(true); setEditing(null); setForm({ denetim_adi: "", denetim_tarihi: "", denetim_tipi: "ic", denetci: "", kapsam: "", kapsam_alanlari: "", guclu_yonler: "", iyilestirme_alanlari: "", genel_degerlendirme: "", durum: "planlandi" }); }} className="btn btn-primary"><Plus className="w-4 h-4" /> Yeni Denetim</button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card p-4"><p className="text-xs text-gray-500">Toplam Denetim</p><p className="text-2xl font-bold text-gray-800">{stats.toplam}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Planlanan</p><p className="text-2xl font-bold text-blue-600">{stats.planlanan}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Tamamlanan</p><p className="text-2xl font-bold text-green-600">{stats.tamamlanan}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Toplam Bulgu</p><p className="text-2xl font-bold text-amber-600">{stats.toplamBulgu}</p></div>
        </div>

        <div className="card p-4 mb-6"><div className="relative"><Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" placeholder="Denetim ara..." value={search} onChange={e => setSearch(e.target.value)} className="input pr-12" /></div></div>

        <div className="card overflow-hidden mb-6">
          <table>
            <thead><tr><th>Denetim Adı</th><th>Tarih</th><th>Tip</th><th>Denetçi</th><th>Bulgu</th><th>Uygunsuzluk</th><th>Durum</th><th>İşlem</th></tr></thead>
            <tbody>
              {filtered.map(i => (
                <tr key={i.id}>
                  <td className="font-medium">{i.denetim_adi}</td>
                  <td>{new Date(i.denetim_tarihi).toLocaleDateString("tr-TR")}</td>
                  <td>{denetimTipleri.find(d => d.value === i.denetim_tipi)?.label}</td>
                  <td>{i.denetci}</td>
                  <td className="text-center">{i.bulgu_sayisi || 0}</td>
                  <td className="text-center">{i.uygunsuzluk_sayisi || 0}</td>
                  <td><span className={`badge ${i.durum === "tamamlandi" ? "bg-green-100 text-green-700" : i.durum === "devam" ? "bg-blue-100 text-blue-700" : i.durum === "iptal" ? "bg-gray-100 text-gray-700" : "bg-amber-100 text-amber-700"}`}>{durumlar.find(d => d.value === i.durum)?.label}</span></td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => { setSelectedDenetim(i.id); fetchBulgular(i.id); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500" title="Bulgular"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => handleEdit(i)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(i.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-gray-400">Henüz denetim kaydı yok</td></tr>}
            </tbody>
          </table>
        </div>

        {selectedDenetim && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Denetim Bulguları</h3>
              <div className="flex gap-2">
                <button onClick={() => setShowBulguForm(true)} className="btn btn-primary text-sm"><Plus className="w-3 h-3" /> Bulgu Ekle</button>
                <button onClick={() => { setSelectedDenetim(null); setBulgular([]); }} className="btn text-sm" style={{ background: "#f3f4f6", color: "#374151" }}>Kapat</button>
              </div>
            </div>
            <table>
              <thead><tr><th>Bulgu No</th><th>Tip</th><th>Bölüm</th><th>Açıklama</th><th>Sorumlu</th><th>Durum</th><th>İşlem</th></tr></thead>
              <tbody>
                {bulgular.map(b => (
                  <tr key={b.id}>
                    <td>{b.bulgu_no || "-"}</td>
                    <td><span className={`badge ${b.bulgu_tipi === "uygunsuzluk" ? "bg-red-100 text-red-700" : b.bulgu_tipi === "gozlem" ? "bg-amber-100 text-amber-700" : b.bulgu_tipi === "firsat" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>{b.bulgu_tipi}</span></td>
                    <td>{b.bolum || "-"}</td>
                    <td className="max-w-xs truncate">{b.bulgu_aciklama}</td>
                    <td>{b.sorumlu_kisi || "-"}</td>
                    <td><span className={`badge ${b.durum === "tamamlandi" ? "bg-green-100 text-green-700" : b.durum === "devam" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>{b.durum}</span></td>
                    <td><button onClick={() => handleDeleteBulgu(b.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
                {bulgular.length === 0 && <tr><td colSpan={7} className="text-center py-4 text-gray-400">Bulgu yok</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{editing ? "Denetim Düzenle" : "Yeni Denetim"}</h3><button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button></div>
            <div className="modal-body space-y-4">
              <div><label>Denetim Adı *</label><input type="text" value={form.denetim_adi} onChange={e => setForm({ ...form, denetim_adi: e.target.value })} /></div>
              <div className="grid-2"><div><label>Tarih *</label><input type="date" value={form.denetim_tarihi} onChange={e => setForm({ ...form, denetim_tarihi: e.target.value })} /></div><div><label>Tip</label><select value={form.denetim_tipi} onChange={e => setForm({ ...form, denetim_tipi: e.target.value })}>{denetimTipleri.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}</select></div></div>
              <div><label>Denetçi *</label><input type="text" value={form.denetci} onChange={e => setForm({ ...form, denetci: e.target.value })} /></div>
              <div><label>Kapsam</label><textarea value={form.kapsam} onChange={e => setForm({ ...form, kapsam: e.target.value })} rows={2} /></div>
              <div><label>Kapsam Alanları (virgülle ayırın)</label><input type="text" value={form.kapsam_alanlari} onChange={e => setForm({ ...form, kapsam_alanlari: e.target.value })} placeholder="Örn: Üretim, Depo, İdari Bina" /></div>
              <div><label>Güçlü Yönler</label><textarea value={form.guclu_yonler} onChange={e => setForm({ ...form, guclu_yonler: e.target.value })} rows={2} /></div>
              <div><label>İyileştirme Alanları</label><textarea value={form.iyilestirme_alanlari} onChange={e => setForm({ ...form, iyilestirme_alanlari: e.target.value })} rows={2} /></div>
              <div><label>Genel Değerlendirme</label><textarea value={form.genel_degerlendirme} onChange={e => setForm({ ...form, genel_degerlendirme: e.target.value })} rows={2} /></div>
              <div><label>Durum</label><select value={form.durum} onChange={e => setForm({ ...form, durum: e.target.value })}>{durumlar.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}</select></div>
              <div className="flex justify-end gap-2 pt-4"><button onClick={() => setShowForm(false)} className="btn" style={{ background: "#f3f4f6", color: "#374151" }}>İptal</button><button onClick={handleSubmit} className="btn btn-primary">{editing ? "Güncelle" : "Kaydet"}</button></div>
            </div>
          </div>
        </div>
      )}

      {showBulguForm && (
        <div className="modal-overlay" onClick={() => setShowBulguForm(false)}>
          <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Yeni Bulgu Ekle</h3><button onClick={() => setShowBulguForm(false)}><X className="w-5 h-5 text-gray-400" /></button></div>
            <div className="modal-body space-y-4">
              <div className="grid-2"><div><label>Bulgu No</label><input type="text" value={bulguForm.bulgu_no} onChange={e => setBulguForm({ ...bulguForm, bulgu_no: e.target.value })} /></div><div><label>Tip</label><select value={bulguForm.bulgu_tipi} onChange={e => setBulguForm({ ...bulguForm, bulgu_tipi: e.target.value })}><option value="uygunsuzluk">Uygunsuzluk</option><option value="gozlem">Gözlem</option><option value="firsat">İyileştirme Fırsatı</option><option value="guclu_yon">Güçlü Yön</option></select></div></div>
              <div><label>Bölüm</label><input type="text" value={bulguForm.bolum} onChange={e => setBulguForm({ ...bulguForm, bolum: e.target.value })} /></div>
              <div><label>Bulgu Açıklaması *</label><textarea value={bulguForm.bulgu_aciklama} onChange={e => setBulguForm({ ...bulguForm, bulgu_aciklama: e.target.value })} rows={3} /></div>
              <div><label>Dayanak Madde</label><input type="text" value={bulguForm.dayanak_madde} onChange={e => setBulguForm({ ...bulguForm, dayanak_madde: e.target.value })} /></div>
              <div><label>Öneri</label><textarea value={bulguForm.oneri} onChange={e => setBulguForm({ ...bulguForm, oneri: e.target.value })} rows={2} /></div>
              <div className="grid-2"><div><label>Sorumlu Kişi</label><input type="text" value={bulguForm.sorumlu_kisi} onChange={e => setBulguForm({ ...bulguForm, sorumlu_kisi: e.target.value })} /></div><div><label>Düzeltme Tarihi</label><input type="date" value={bulguForm.duzeltme_tarihi} onChange={e => setBulguForm({ ...bulguForm, duzeltme_tarihi: e.target.value })} /></div></div>
              <div className="flex justify-end gap-2 pt-4"><button onClick={() => setShowBulguForm(false)} className="btn" style={{ background: "#f3f4f6", color: "#374151" }}>İptal</button><button onClick={handleBulguSubmit} className="btn btn-primary">Kaydet</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
