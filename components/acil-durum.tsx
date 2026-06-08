"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeForm } from "@/lib/security";
import { logAudit } from "@/lib/audit";
import { displayDate } from "@/lib/tarih";
import { Siren, Plus, Search, Edit, Trash2, X, CheckCircle, AlertCircle } from "lucide-react";

const senaryoTipleri = [
  { value: "yangin", label: "Yangın" },
  { value: "deprem", label: "Deprem" },
  { value: "sel", label: "Sel" },
  { value: "kimyasal_dokulme", label: "Kimyasal Dökülme" },
  { value: "patlama", label: "Patlama" },
  { value: "elektrik_carpma", label: "Elektrik Çarpması" },
  { value: "gocekme", label: "Göçme" },
  { value: "diger", label: "Diğer" },
];
const riskSeviyeleri = [
  { value: "dusuk", label: "Düşük", color: "bg-green-100 text-green-700" },
  { value: "orta", label: "Orta", color: "bg-amber-100 text-amber-700" },
  { value: "yuksek", label: "Yüksek", color: "bg-orange-100 text-orange-700" },
  { value: "kritik", label: "Kritik", color: "bg-red-100 text-red-700" },
];
const durumlar = [
  { value: "aktif", label: "Aktif" },
  { value: "gozden_geciriliyor", label: "Gözden Geçiriliyor" },
  { value: "pasif", label: "Pasif" },
];

export default function AcilDurum() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ plan_adi: "", senaryo_tipi: "yangin", senaryo_aciklama: "", etki_alani: "", risk_seviyesi: "orta", onleyici_onlemler: "", mudahale_proseduru: "", tahliye_plani: "", acil_durum_ekibi: "", iletisim_bilgileri: "", ekipman_listesi: "", son_tatbikat_tarihi: "", sonraki_tatbikat_tarihi: "", tatbikat_sonucu: "", durum: "aktif" });
  const [saving, setSaving] = useState(false);
  const [editStatus, setEditStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    const { data } = await supabase.from("acil_durum").select("*").order("olusturma_tarihi", { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  const filtered = items.filter(i => i.plan_adi.toLowerCase().includes(search.toLowerCase()) || (i.senaryo_aciklama && i.senaryo_aciklama.toLowerCase().includes(search.toLowerCase())));

  const handleSubmit = async () => {
    if (!form.plan_adi || !form.senaryo_tipi) return;
    setSaving(true);
    setEditStatus(null);
    try {
      const payload = sanitizeForm({ ...form, acil_durum_ekibi: form.acil_durum_ekibi ? form.acil_durum_ekibi.split(",").map((s: string) => s.trim()) : [], son_tatbikat_tarihi: form.son_tatbikat_tarihi || null, sonraki_tatbikat_tarihi: form.sonraki_tatbikat_tarihi || null });
      if (editing) {
        await supabase.from("acil_durum").update(payload).eq("id", editing.id);
        await logAudit("acil_durum", "UPDATE", editing.id, editing, payload);
      } else {
        const { data } = await supabase.from("acil_durum").insert(payload).select().single();
        await logAudit("acil_durum", "INSERT", data?.id, null, payload);
      }
      setEditStatus({ type: "success", message: editing ? "Plan güncellendi!" : "Plan eklendi!" });
      setShowForm(false);
      setEditing(null);
      setForm({ plan_adi: "", senaryo_tipi: "yangin", senaryo_aciklama: "", etki_alani: "", risk_seviyesi: "orta", onleyici_onlemler: "", mudahale_proseduru: "", tahliye_plani: "", acil_durum_ekibi: "", iletisim_bilgileri: "", ekipman_listesi: "", son_tatbikat_tarihi: "", sonraki_tatbikat_tarihi: "", tatbikat_sonucu: "", durum: "aktif" });
      fetchItems();
    } catch (e: any) {
      setEditStatus({ type: "error", message: e.message || "Bir hata oluştu" });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (i: any) => {
    setEditing(i);
    setForm({ plan_adi: i.plan_adi, senaryo_tipi: i.senaryo_tipi, senaryo_aciklama: i.senaryo_aciklama || "", etki_alani: i.etki_alani || "", risk_seviyesi: i.risk_seviyesi, onleyici_onlemler: i.onleyici_onlemler || "", mudahale_proseduru: i.mudahale_proseduru || "", tahliye_plani: i.tahliye_plani || "", acil_durum_ekibi: Array.isArray(i.acil_durum_ekibi) ? i.acil_durum_ekibi.join(", ") : "", iletisim_bilgileri: i.iletisim_bilgileri || "", ekipman_listesi: i.ekipman_listesi || "", son_tatbikat_tarihi: i.son_tatbikat_tarihi ? i.son_tatbikat_tarihi.split("T")[0] : "", sonraki_tatbikat_tarihi: i.sonraki_tatbikat_tarihi ? i.sonraki_tatbikat_tarihi.split("T")[0] : "", tatbikat_sonucu: i.tatbikat_sonucu || "", durum: i.durum });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu planı silmek istediğinize emin misiniz?")) return;
    setSaving(true);
    setEditStatus(null);
    try {
      const old = items.find(i => i.id === id);
      await supabase.from("acil_durum").delete().eq("id", id);
      await logAudit("acil_durum", "DELETE", id, old, null);
      setEditStatus({ type: "success", message: "Plan silindi!" });
      fetchItems();
    } catch (e: any) {
      setEditStatus({ type: "error", message: e.message || "Bir hata oluştu" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex-1 p-8 flex items-center justify-center text-gray-400">Yükleniyor...</div>;

  const stats = { toplam: items.length, aktif: items.filter(i => i.durum === "aktif").length, kritik: items.filter(i => i.risk_seviyesi === "kritik").length, yuksek: items.filter(i => i.risk_seviyesi === "yuksek").length };

  return (
    <div className="flex-1 p-8 app-bg min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="page-header">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center"><Siren className="w-6 h-6 text-gray-600" /></div>
            <div><h2 className="text-2xl font-semibold text-gray-800">Acil Durum Planı</h2><p className="text-sm text-gray-500">Acil durum senaryoları ve tatbikat takibi</p></div>
          </div>
          <button onClick={() => { setShowForm(true); setEditing(null); setForm({ plan_adi: "", senaryo_tipi: "yangin", senaryo_aciklama: "", etki_alani: "", risk_seviyesi: "orta", onleyici_onlemler: "", mudahale_proseduru: "", tahliye_plani: "", acil_durum_ekibi: "", iletisim_bilgileri: "", ekipman_listesi: "", son_tatbikat_tarihi: "", sonraki_tatbikat_tarihi: "", tatbikat_sonucu: "", durum: "aktif" }); }} className="btn btn-primary"><Plus className="w-4 h-4" /> Yeni Plan</button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card p-4"><p className="text-xs text-gray-500">Toplam Plan</p><p className="text-2xl font-bold text-gray-800">{stats.toplam}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Aktif</p><p className="text-2xl font-bold text-green-600">{stats.aktif}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Kritik Risk</p><p className="text-2xl font-bold text-red-600">{stats.kritik}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Yüksek Risk</p><p className="text-2xl font-bold text-orange-600">{stats.yuksek}</p></div>
        </div>

        <div className="card p-4 mb-6"><div className="relative"><Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" placeholder="Plan ara..." value={search} onChange={e => setSearch(e.target.value)} className="input pr-12" /></div></div>

        {editStatus && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm border ${editStatus.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
            {editStatus.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {editStatus.message}
          </div>
        )}

        <div className="card overflow-hidden">
          <table>
            <thead><tr><th>Plan Adı</th><th>Senaryo</th><th>Risk Seviyesi</th><th>Son Tatbikat</th><th>Sonraki Tatbikat</th><th>Durum</th><th>İşlem</th></tr></thead>
            <tbody>
              {filtered.map(i => {
                const rs = riskSeviyeleri.find(r => r.value === i.risk_seviyesi) || riskSeviyeleri[1];
                return (
                  <tr key={i.id}>
                    <td className="font-medium">{i.plan_adi}</td>
                    <td>{senaryoTipleri.find(s => s.value === i.senaryo_tipi)?.label}</td>
                    <td><span className={`badge ${rs.color}`}>{rs.label}</span></td>
                    <td>{displayDate(i.son_tatbikat_tarihi)}</td>
                    <td>{displayDate(i.sonraki_tatbikat_tarihi)}</td>
                    <td><span className={`badge ${i.durum === "aktif" ? "bg-green-100 text-green-700" : i.durum === "gozden_geciriliyor" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700"}`}>{durumlar.find(d => d.value === i.durum)?.label}</span></td>
                    <td><div className="flex gap-1"><button onClick={() => handleEdit(i)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Edit className="w-4 h-4" /></button><button onClick={() => handleDelete(i.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button></div></td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">Henüz plan yok</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{editing ? "Plan Düzenle" : "Yeni Acil Durum Planı"}</h3><button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button></div>
            <div className="modal-body space-y-4">
              <div><label>Plan Adı *</label><input type="text" value={form.plan_adi} onChange={e => setForm({ ...form, plan_adi: e.target.value })} /></div>
              <div className="grid-2"><div><label>Senaryo Tipi</label><select value={form.senaryo_tipi} onChange={e => setForm({ ...form, senaryo_tipi: e.target.value })}>{senaryoTipleri.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div><div><label>Risk Seviyesi</label><select value={form.risk_seviyesi} onChange={e => setForm({ ...form, risk_seviyesi: e.target.value })}>{riskSeviyeleri.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div></div>
              <div><label>Senaryo Açıklaması</label><textarea value={form.senaryo_aciklama} onChange={e => setForm({ ...form, senaryo_aciklama: e.target.value })} rows={2} /></div>
              <div><label>Etki Alanı</label><input type="text" value={form.etki_alani} onChange={e => setForm({ ...form, etki_alani: e.target.value })} /></div>
              <div><label>Önleyici Önlemler</label><textarea value={form.onleyici_onlemler} onChange={e => setForm({ ...form, onleyici_onlemler: e.target.value })} rows={2} /></div>
              <div><label>Müdahale Prosedürü</label><textarea value={form.mudahale_proseduru} onChange={e => setForm({ ...form, mudahale_proseduru: e.target.value })} rows={2} /></div>
              <div><label>Tahliye Planı</label><textarea value={form.tahliye_plani} onChange={e => setForm({ ...form, tahliye_plani: e.target.value })} rows={2} /></div>
              <div><label>Acil Durum Ekibi (virgülle ayırın)</label><input type="text" value={form.acil_durum_ekibi} onChange={e => setForm({ ...form, acil_durum_ekibi: e.target.value })} /></div>
              <div><label>İletişim Bilgileri</label><textarea value={form.iletisim_bilgileri} onChange={e => setForm({ ...form, iletisim_bilgileri: e.target.value })} rows={2} /></div>
              <div><label>Ekipman Listesi</label><textarea value={form.ekipman_listesi} onChange={e => setForm({ ...form, ekipman_listesi: e.target.value })} rows={2} /></div>
              <div className="grid-2"><div><label>Son Tatbikat Tarihi</label><input type="date" value={form.son_tatbikat_tarihi} onChange={e => setForm({ ...form, son_tatbikat_tarihi: e.target.value })} /></div><div><label>Sonraki Tatbikat Tarihi</label><input type="date" value={form.sonraki_tatbikat_tarihi} onChange={e => setForm({ ...form, sonraki_tatbikat_tarihi: e.target.value })} /></div></div>
              <div><label>Tatbikat Sonucu</label><textarea value={form.tatbikat_sonucu} onChange={e => setForm({ ...form, tatbikat_sonucu: e.target.value })} rows={2} /></div>
              <div><label>Durum</label><select value={form.durum} onChange={e => setForm({ ...form, durum: e.target.value })}>{durumlar.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}</select></div>
              <div className="flex justify-end gap-2 pt-4"><button onClick={() => setShowForm(false)} className="btn" style={{ background: "#f3f4f6", color: "#374151" }}>İptal</button><button onClick={handleSubmit} className="btn btn-primary">{editing ? "Güncelle" : "Kaydet"}</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
