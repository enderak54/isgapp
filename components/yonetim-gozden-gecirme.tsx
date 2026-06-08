"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeForm } from "@/lib/security";
import { logAudit } from "@/lib/audit";
import { CheckCircle, AlertCircle, Eye, Plus, Search, Edit, Trash2, X } from "lucide-react";

const durumlar = [
  { value: "planlandi", label: "Planlandı" },
  { value: "yapildi", label: "Yapıldı" },
  { value: "rapor_hazirlaniyor", label: "Rapor Hazırlanıyor" },
  { value: "tamamlandi", label: "Tamamlandı" },
];

export default function YonetimGozdenGecirme() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ toplantı_adi: "", toplantı_tarihi: "", katilimcilar: "", gundem_maddeleri: "", isg_performans_ozeti: "", kaza_istatistikleri: "", denetim_sonuclari: "", yasal_uygunluk_durumu: "", risk_degerlendirme_guncelleme: "", kaynak_yeterliligi: "", iyilestirme_firsatlari: "", aksiyon_kararlari: "", bir_onceki_toplanti_takibi: "", sonuclar_ve_oneriler: "", durum: "planlandi" });
  const [saving, setSaving] = useState(false);
  const [editStatus, setEditStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    const { data } = await supabase.from("yonetim_gozden_gecirme").select("*").order("toplantı_tarihi", { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  const filtered = items.filter(i => i.toplantı_adi.toLowerCase().includes(search.toLowerCase()));

  const handleSubmit = async () => {
    if (!form.toplantı_adi || !form.toplantı_tarihi) return;
    setSaving(true);
    setEditStatus(null);
    try {
      const payload = sanitizeForm({ ...form, toplantı_tarihi: form.toplantı_tarihi || null, katilimcilar: form.katilimcilar ? form.katilimcilar.split(",").map((s: string) => s.trim()) : [], gundem_maddeleri: form.gundem_maddeleri ? form.gundem_maddeleri.split("\n").filter((s: string) => s.trim()) : [] });
      if (editing) {
        await supabase.from("yonetim_gozden_gecirme").update(payload).eq("id", editing.id);
        await logAudit("yonetim_gozden_gecirme", "UPDATE", editing.id, editing, payload);
        setEditStatus({ type: "success", message: "Toplantı güncellendi" });
      } else {
        const { data } = await supabase.from("yonetim_gozden_gecirme").insert(payload).select();
        if (data) await logAudit("yonetim_gozden_gecirme", "INSERT", data[0].id, null, payload);
        setEditStatus({ type: "success", message: "Toplantı kaydedildi" });
      }
      setShowForm(false);
      setEditing(null);
      setForm({ toplantı_adi: "", toplantı_tarihi: "", katilimcilar: "", gundem_maddeleri: "", isg_performans_ozeti: "", kaza_istatistikleri: "", denetim_sonuclari: "", yasal_uygunluk_durumu: "", risk_degerlendirme_guncelleme: "", kaynak_yeterliligi: "", iyilestirme_firsatlari: "", aksiyon_kararlari: "", bir_onceki_toplanti_takibi: "", sonuclar_ve_oneriler: "", durum: "planlandi" });
      fetchItems();
    } catch (e: any) {
      setEditStatus({ type: "error", message: e.message || "Kayıt işlemi başarısız" });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (i: any) => {
    setEditing(i);
    setForm({ toplantı_adi: i.toplantı_adi, toplantı_tarihi: i.toplantı_tarihi.split("T")[0], katilimcilar: Array.isArray(i.katilimcilar) ? i.katilimcilar.join(", ") : "", gundem_maddeleri: Array.isArray(i.gundem_maddeleri) ? i.gundem_maddeleri.join("\n") : "", isg_performans_ozeti: i.isg_performans_ozeti || "", kaza_istatistikleri: i.kaza_istatistikleri || "", denetim_sonuclari: i.denetim_sonuclari || "", yasal_uygunluk_durumu: i.yasal_uygunluk_durumu || "", risk_degerlendirme_guncelleme: i.risk_degerlendirme_guncelleme || "", kaynak_yeterliligi: i.kaynak_yeterliligi || "", iyilestirme_firsatlari: i.iyilestirme_firsatlari || "", aksiyon_kararlari: i.aksiyon_kararlari || "", bir_onceki_toplanti_takibi: i.bir_onceki_toplanti_takibi || "", sonuclar_ve_oneriler: i.sonuclar_ve_oneriler || "", durum: i.durum });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu kaydı silmek istediğinize emin misiniz?")) return;
    setEditStatus(null);
    try {
      await supabase.from("yonetim_gozden_gecirme").delete().eq("id", id);
      await logAudit("yonetim_gozden_gecirme", "DELETE", id, null, null);
      setEditStatus({ type: "success", message: "Toplantı silindi" });
      fetchItems();
    } catch (e: any) {
      setEditStatus({ type: "error", message: e.message || "Silme işlemi başarısız" });
    }
  };

  if (loading) return <div className="flex-1 p-8 flex items-center justify-center text-gray-400">Yükleniyor...</div>;

  const stats = { toplam: items.length, planlanan: items.filter(i => i.durum === "planlandi").length, tamamlanan: items.filter(i => i.durum === "tamamlandi").length };

  return (
    <div className="flex-1 p-8 app-bg min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="page-header">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center"><Eye className="w-6 h-6 text-gray-600" /></div>
            <div><h2 className="text-2xl font-semibold text-gray-800">Yönetim Gözden Geçirme</h2><p className="text-sm text-gray-500">Üst yönetim değerlendirme toplantıları</p></div>
          </div>
          <button onClick={() => { setShowForm(true); setEditing(null); setForm({ toplantı_adi: "", toplantı_tarihi: "", katilimcilar: "", gundem_maddeleri: "", isg_performans_ozeti: "", kaza_istatistikleri: "", denetim_sonuclari: "", yasal_uygunluk_durumu: "", risk_degerlendirme_guncelleme: "", kaynak_yeterliligi: "", iyilestirme_firsatlari: "", aksiyon_kararlari: "", bir_onceki_toplanti_takibi: "", sonuclar_ve_oneriler: "", durum: "planlandi" }); }} className="btn btn-primary"><Plus className="w-4 h-4" /> Yeni Toplantı</button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card p-4"><p className="text-xs text-gray-500">Toplam Toplantı</p><p className="text-2xl font-bold text-gray-800">{stats.toplam}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Planlanan</p><p className="text-2xl font-bold text-blue-600">{stats.planlanan}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Tamamlanan</p><p className="text-2xl font-bold text-green-600">{stats.tamamlanan}</p></div>
        </div>

        <div className="card p-4 mb-6"><div className="relative"><Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" placeholder="Toplantı ara..." value={search} onChange={e => setSearch(e.target.value)} className="input pr-12" /></div></div>

        {editStatus && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm border ${editStatus.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
            {editStatus.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {editStatus.message}
          </div>
        )}

        <div className="card overflow-hidden">
          <table>
            <thead><tr><th>Toplantı Adı</th><th>Tarih</th><th>Katılımcılar</th><th>Durum</th><th>Oluşturma</th><th>İşlem</th></tr></thead>
            <tbody>
              {filtered.map(i => (
                <tr key={i.id}>
                  <td className="font-medium">{i.toplantı_adi}</td>
                  <td>{new Date(i.toplantı_tarihi).toLocaleDateString("tr-TR")}</td>
                  <td>{Array.isArray(i.katilimcilar) ? i.katilimcilar.length + " kişi" : "-"}</td>
                  <td><span className={`badge ${i.durum === "tamamlandi" ? "bg-green-100 text-green-700" : i.durum === "yapildi" ? "bg-blue-100 text-blue-700" : i.durum === "rapor_hazirlaniyor" ? "bg-purple-100 text-purple-700" : "bg-amber-100 text-amber-700"}`}>{durumlar.find(d => d.value === i.durum)?.label}</span></td>
                  <td>{new Date(i.olusturma_tarihi).toLocaleDateString("tr-TR")}</td>
                  <td><div className="flex gap-1"><button onClick={() => handleEdit(i)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Edit className="w-4 h-4" /></button><button onClick={() => handleDelete(i.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button></div></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400">Henüz toplantı kaydı yok</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{editing ? "Toplantı Düzenle" : "Yeni Yönetim Gözden Geçirme"}</h3><button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button></div>
            <div className="modal-body space-y-4">
              <div className="grid-2"><div><label>Toplantı Adı *</label><input type="text" value={form.toplantı_adi} onChange={e => setForm({ ...form, toplantı_adi: e.target.value })} /></div><div><label>Tarih *</label><input type="date" value={form.toplantı_tarihi} onChange={e => setForm({ ...form, toplantı_tarihi: e.target.value })} /></div></div>
              <div><label>Katılımcılar (virgülle ayırın)</label><input type="text" value={form.katilimcilar} onChange={e => setForm({ ...form, katilimcilar: e.target.value })} /></div>
              <div><label>Gündem Maddeleri (her satıra bir madde)</label><textarea value={form.gundem_maddeleri} onChange={e => setForm({ ...form, gundem_maddeleri: e.target.value })} rows={3} /></div>
              <div><label>İSG Performans Özeti</label><textarea value={form.isg_performans_ozeti} onChange={e => setForm({ ...form, isg_performans_ozeti: e.target.value })} rows={2} /></div>
              <div><label>Kaza İstatistikleri</label><textarea value={form.kaza_istatistikleri} onChange={e => setForm({ ...form, kaza_istatistikleri: e.target.value })} rows={2} /></div>
              <div><label>Denetim Sonuçları</label><textarea value={form.denetim_sonuclari} onChange={e => setForm({ ...form, denetim_sonuclari: e.target.value })} rows={2} /></div>
              <div><label>Yasal Uygunluk Durumu</label><textarea value={form.yasal_uygunluk_durumu} onChange={e => setForm({ ...form, yasal_uygunluk_durumu: e.target.value })} rows={2} /></div>
              <div><label>Risk Değerlendirme Güncellemesi</label><textarea value={form.risk_degerlendirme_guncelleme} onChange={e => setForm({ ...form, risk_degerlendirme_guncelleme: e.target.value })} rows={2} /></div>
              <div><label>Kaynak Yeterliliği</label><textarea value={form.kaynak_yeterliligi} onChange={e => setForm({ ...form, kaynak_yeterliligi: e.target.value })} rows={2} /></div>
              <div><label>İyileştirme Fırsatları</label><textarea value={form.iyilestirme_firsatlari} onChange={e => setForm({ ...form, iyilestirme_firsatlari: e.target.value })} rows={2} /></div>
              <div><label>Aksiyon Kararları</label><textarea value={form.aksiyon_kararlari} onChange={e => setForm({ ...form, aksiyon_kararlari: e.target.value })} rows={2} /></div>
              <div><label>Bir Önceki Toplantı Takibi</label><textarea value={form.bir_onceki_toplanti_takibi} onChange={e => setForm({ ...form, bir_onceki_toplanti_takibi: e.target.value })} rows={2} /></div>
              <div><label>Sonuçlar ve Öneriler</label><textarea value={form.sonuclar_ve_oneriler} onChange={e => setForm({ ...form, sonuclar_ve_oneriler: e.target.value })} rows={2} /></div>
              <div><label>Durum</label><select value={form.durum} onChange={e => setForm({ ...form, durum: e.target.value })}>{durumlar.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}</select></div>
              <div className="flex justify-end gap-2 pt-4"><button onClick={() => setShowForm(false)} className="btn" style={{ background: "#f3f4f6", color: "#374151" }}>İptal</button><button onClick={handleSubmit} className="btn btn-primary">{editing ? "Güncelle" : "Kaydet"}</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
