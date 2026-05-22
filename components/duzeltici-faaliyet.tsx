"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeForm } from "@/lib/security";
import { RotateCcw, Plus, Search, Edit, Trash2, X } from "lucide-react";

const kaynaklar = [
  { value: "is_kazasi", label: "İş Kazası" },
  { value: "denetim", label: "Denetim" },
  { value: "sikayet", label: "Şikayet" },
  { value: "gozlem", label: "Gözlem" },
  { value: "risk_analizi", label: "Risk Analizi" },
  { value: "yasal_gereklilik", label: "Yasal Gereklilik" },
  { value: "diger", label: "Diğer" },
];
const analizYontemleri = [
  { value: "5_neden", label: "5 Neden" },
  { value: "balik_kilcigi", label: "Balık Kılçığı" },
  { value: "pareto", label: "Pareto" },
  { value: "fta", label: "FTA" },
  { value: "diger", label: "Diğer" },
];
const durumlar = [
  { value: "acik", label: "Açık" },
  { value: "devam", label: "Devam Ediyor" },
  { value: "dogrulama", label: "Doğrulamada" },
  { value: "tamamlandi", label: "Tamamlandı" },
  { value: "kapatildi", label: "Kapatıldı" },
];
const dogrulamaSonuclari = [
  { value: "etkili", label: "Etkili" },
  { value: "kismen_etkili", label: "Kısmen Etkili" },
  { value: "etkisiz", label: "Etkisiz" },
  { value: "beklemede", label: "Beklemede" },
];

export default function DuzelticiFaaliyet() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ kaynak: "gozlem", baslik: "", uygunsuzluk_aciklama: "", kok_neden_analizi: "", analiz_yontemi: "", duzeltici_aksiyon: "", onleyici_aksiyon: "", sorumlu_kisi: "", baslangic_tarihi: "", hedef_tarih: "", tamamlanma_tarihi: "", etki_degerlendirmesi: "", dogrulama_sonucu: "", durum: "acik" });

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    const { data } = await supabase.from("duzeltici_faaliyet").select("*").order("olusturma_tarihi", { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  const filtered = items.filter(i => i.baslik.toLowerCase().includes(search.toLowerCase()) || i.uygunsuzluk_aciklama.toLowerCase().includes(search.toLowerCase()));

  const handleSubmit = async () => {
    if (!form.baslik || !form.uygunsuzluk_aciklama || !form.sorumlu_kisi) return;
    const payload = sanitizeForm({ ...form, baslangic_tarihi: form.baslangic_tarihi || null, hedef_tarih: form.hedef_tarih || null, tamamlanma_tarihi: form.tamamlanma_tarihi || null });
    if (editing) {
      await supabase.from("duzeltici_faaliyet").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("duzeltici_faaliyet").insert(payload);
    }
    setShowForm(false);
    setEditing(null);
    setForm({ kaynak: "gozlem", baslik: "", uygunsuzluk_aciklama: "", kok_neden_analizi: "", analiz_yontemi: "", duzeltici_aksiyon: "", onleyici_aksiyon: "", sorumlu_kisi: "", baslangic_tarihi: "", hedef_tarih: "", tamamlanma_tarihi: "", etki_degerlendirmesi: "", dogrulama_sonucu: "", durum: "acik" });
    fetchItems();
  };

  const handleEdit = (i: any) => {
    setEditing(i);
    setForm({ kaynak: i.kaynak || "gozlem", baslik: i.baslik, uygunsuzluk_aciklama: i.uygunsuzluk_aciklama, kok_neden_analizi: i.kok_neden_analizi || "", analiz_yontemi: i.analiz_yontemi || "", duzeltici_aksiyon: i.duzeltici_aksiyon, onleyici_aksiyon: i.onleyici_aksiyon || "", sorumlu_kisi: i.sorumlu_kisi, baslangic_tarihi: i.baslangic_tarihi ? i.baslangic_tarihi.split("T")[0] : "", hedef_tarih: i.hedef_tarih ? i.hedef_tarih.split("T")[0] : "", tamamlanma_tarihi: i.tamamlanma_tarihi ? i.tamamlanma_tarihi.split("T")[0] : "", etki_degerlendirmesi: i.etki_degerlendirmesi || "", dogrulama_sonucu: i.dogrulama_sonucu || "", durum: i.durum });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu faaliyeti silmek istediğinize emin misiniz?")) return;
    await supabase.from("duzeltici_faaliyet").delete().eq("id", id);
    fetchItems();
  };

  if (loading) return <div className="flex-1 p-8 flex items-center justify-center text-gray-400">Yükleniyor...</div>;

  const stats = { toplam: items.length, acik: items.filter(i => i.durum === "acik").length, devam: items.filter(i => i.durum === "devam").length, tamamlandi: items.filter(i => i.durum === "tamamlandi" || i.durum === "kapatildi").length };

  return (
    <main className="flex-1 p-8 app-bg min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="page-header">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center"><RotateCcw className="w-6 h-6 text-gray-600" /></div>
            <div><h2 className="text-2xl font-semibold text-gray-800">Düzeltici Faaliyet</h2><p className="text-sm text-gray-500">Kök neden analizi ve CAPA takibi</p></div>
          </div>
          <button onClick={() => { setShowForm(true); setEditing(null); setForm({ kaynak: "gozlem", baslik: "", uygunsuzluk_aciklama: "", kok_neden_analizi: "", analiz_yontemi: "", duzeltici_aksiyon: "", onleyici_aksiyon: "", sorumlu_kisi: "", baslangic_tarihi: "", hedef_tarih: "", tamamlanma_tarihi: "", etki_degerlendirmesi: "", dogrulama_sonucu: "", durum: "acik" }); }} className="btn btn-primary"><Plus className="w-4 h-4" /> Yeni Faaliyet</button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card p-4"><p className="text-xs text-gray-500">Toplam</p><p className="text-2xl font-bold text-gray-800">{stats.toplam}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Açık</p><p className="text-2xl font-bold text-amber-600">{stats.acik}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Devam Eden</p><p className="text-2xl font-bold text-blue-600">{stats.devam}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Tamamlanan</p><p className="text-2xl font-bold text-green-600">{stats.tamamlandi}</p></div>
        </div>

        <div className="card p-4 mb-6"><div className="relative"><Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" placeholder="Faaliyet ara..." value={search} onChange={e => setSearch(e.target.value)} className="input pr-12" /></div></div>

        <div className="card overflow-hidden">
          <table>
            <thead><tr><th>Başlık</th><th>Kaynak</th><th>Analiz Yöntemi</th><th>Sorumlu</th><th>Hedef Tarih</th><th>Durum</th><th>Doğrulama</th><th>İşlem</th></tr></thead>
            <tbody>
              {filtered.map(i => (
                <tr key={i.id}>
                  <td className="font-medium max-w-xs truncate">{i.baslik}</td>
                  <td>{kaynaklar.find(k => k.value === i.kaynak)?.label || "-"}</td>
                  <td>{analizYontemleri.find(a => a.value === i.analiz_yontemi)?.label || "-"}</td>
                  <td>{i.sorumlu_kisi}</td>
                  <td>{i.hedef_tarih ? new Date(i.hedef_tarih).toLocaleDateString("tr-TR") : "-"}</td>
                  <td><span className={`badge ${i.durum === "tamamlandi" || i.durum === "kapatildi" ? "bg-green-100 text-green-700" : i.durum === "devam" ? "bg-blue-100 text-blue-700" : i.durum === "dogrulama" ? "bg-purple-100 text-purple-700" : "bg-amber-100 text-amber-700"}`}>{durumlar.find(d => d.value === i.durum)?.label}</span></td>
                  <td>{i.dogrulama_sonucu ? <span className={`badge ${i.dogrulama_sonucu === "etkili" ? "bg-green-100 text-green-700" : i.dogrulama_sonucu === "kismen_etkili" ? "bg-amber-100 text-amber-700" : i.dogrulama_sonucu === "etkisiz" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}>{dogrulamaSonuclari.find(d => d.value === i.dogrulama_sonucu)?.label}</span> : "-"}</td>
                  <td><div className="flex gap-1"><button onClick={() => handleEdit(i)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Edit className="w-4 h-4" /></button><button onClick={() => handleDelete(i.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button></div></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-gray-400">Henüz faaliyet kaydı yok</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{editing ? "Faaliyet Düzenle" : "Yeni Düzeltici Faaliyet"}</h3><button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button></div>
            <div className="modal-body space-y-4">
              <div><label>Başlık *</label><input type="text" value={form.baslik} onChange={e => setForm({ ...form, baslik: e.target.value })} /></div>
              <div className="grid-2"><div><label>Kaynak</label><select value={form.kaynak} onChange={e => setForm({ ...form, kaynak: e.target.value })}>{kaynaklar.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}</select></div><div><label>Analiz Yöntemi</label><select value={form.analiz_yontemi} onChange={e => setForm({ ...form, analiz_yontemi: e.target.value })}><option value="">Seçiniz</option>{analizYontemleri.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}</select></div></div>
              <div><label>Uygunsuzluk Açıklaması *</label><textarea value={form.uygunsuzluk_aciklama} onChange={e => setForm({ ...form, uygunsuzluk_aciklama: e.target.value })} rows={3} /></div>
              <div><label>Kök Neden Analizi</label><textarea value={form.kok_neden_analizi} onChange={e => setForm({ ...form, kok_neden_analizi: e.target.value })} rows={2} /></div>
              <div><label>Düzeltici Aksiyon *</label><textarea value={form.duzeltici_aksiyon} onChange={e => setForm({ ...form, duzeltici_aksiyon: e.target.value })} rows={2} /></div>
              <div><label>Önleyici Aksiyon</label><textarea value={form.onleyici_aksiyon} onChange={e => setForm({ ...form, onleyici_aksiyon: e.target.value })} rows={2} /></div>
              <div><label>Sorumlu Kişi *</label><input type="text" value={form.sorumlu_kisi} onChange={e => setForm({ ...form, sorumlu_kisi: e.target.value })} /></div>
              <div className="grid-2"><div><label>Başlangıç Tarihi</label><input type="date" value={form.baslangic_tarihi} onChange={e => setForm({ ...form, baslangic_tarihi: e.target.value })} /></div><div><label>Hedef Tarih</label><input type="date" value={form.hedef_tarih} onChange={e => setForm({ ...form, hedef_tarih: e.target.value })} /></div></div>
              <div><label>Tamamlanma Tarihi</label><input type="date" value={form.tamamlanma_tarihi} onChange={e => setForm({ ...form, tamamlanma_tarihi: e.target.value })} /></div>
              <div><label>Etki Değerlendirmesi</label><textarea value={form.etki_degerlendirmesi} onChange={e => setForm({ ...form, etki_degerlendirmesi: e.target.value })} rows={2} /></div>
              <div><label>Doğrulama Sonucu</label><select value={form.dogrulama_sonucu} onChange={e => setForm({ ...form, dogrulama_sonucu: e.target.value })}><option value="">Seçiniz</option>{dogrulamaSonuclari.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}</select></div>
              <div><label>Durum</label><select value={form.durum} onChange={e => setForm({ ...form, durum: e.target.value })}>{durumlar.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}</select></div>
              <div className="flex justify-end gap-2 pt-4"><button onClick={() => setShowForm(false)} className="btn" style={{ background: "#f3f4f6", color: "#374151" }}>İptal</button><button onClick={handleSubmit} className="btn btn-primary">{editing ? "Güncelle" : "Kaydet"}</button></div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
