"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeForm } from "@/lib/security";
import { logAudit } from "@/lib/audit";
import { ShieldCheck, Plus, Search, Edit, Trash2, X, AlertTriangle, AlertCircle, CheckCircle, Info } from "lucide-react";

const riskLevels = { Dusuk: { color: "bg-green-100 text-green-700", icon: CheckCircle }, Orta: { color: "bg-amber-100 text-amber-700", icon: AlertCircle }, Yuksek: { color: "bg-orange-100 text-orange-700", icon: AlertTriangle }, Kritik: { color: "bg-red-100 text-red-700", icon: AlertTriangle } };
const durumOptions = [
  { value: "acik", label: "Açık" },
  { value: "devam", label: "Devam Ediyor" },
  { value: "tamamlandi", label: "Tamamlandı" },
  { value: "iptal", label: "İptal" },
];
const tehlikeTipleri = ["Fiziksel", "Kimyasal", "Biyolojik", "Ergonomik", "Psikososyal", "Mekanik", "Elektrik", "Yangın", "Patlama", "Diger"];

export default function RiskDegerlendirme() {
  const [risks, setRisks] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ risk_adi: "", bolum: "", tehlike_tipi: "", mevcut_onlem: "", olasilik: 1, siddet: 1, ek_onlemler: "", sorumlu_kisi: "", tamamlanma_tarihi: "", durum: "acik", santiye_id: "" });
  const [saving, setSaving] = useState(false);
  const [editStatus, setEditStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => { fetchRisks(); fetchSites(); }, []);

  const fetchRisks = async () => {
    const { data } = await supabase.from("risk_degerlendirme").select("*, santiyeler(ad)").order("olusturma_tarihi", { ascending: false });
    if (data) setRisks(data);
    setLoading(false);
  };

  const fetchSites = async () => {
    const { data } = await supabase.from("santiyeler").select("id, ad");
    if (data) setSites(data);
  };

  const filtered = risks.filter(r => r.risk_adi.toLowerCase().includes(search.toLowerCase()) || (r.bolum && r.bolum.toLowerCase().includes(search.toLowerCase())));

  const handleSubmit = async () => {
    if (!form.risk_adi) return;
    setSaving(true);
    setEditStatus(null);
    try {
      const payload = sanitizeForm({ ...form, santiye_id: form.santiye_id || null });
      if (editing) {
        const { error } = await supabase.from("risk_degerlendirme").update(payload).eq("id", editing.id);
        if (error) throw error;
        await logAudit("risk_degerlendirme", "UPDATE", editing.id, editing, payload);
        setEditStatus({ type: "success", message: "Risk güncellendi" });
      } else {
        const { data, error } = await supabase.from("risk_degerlendirme").insert(payload).select();
        if (error) throw error;
        if (data) await logAudit("risk_degerlendirme", "INSERT", data[0].id, null, payload);
        setEditStatus({ type: "success", message: "Risk kaydedildi" });
      }
      setShowForm(false);
      setEditing(null);
      setForm({ risk_adi: "", bolum: "", tehlike_tipi: "", mevcut_onlem: "", olasilik: 1, siddet: 1, ek_onlemler: "", sorumlu_kisi: "", tamamlanma_tarihi: "", durum: "acik", santiye_id: "" });
      fetchRisks();
    } catch (e: any) {
      setEditStatus({ type: "error", message: e.message || "Kayıt işlemi başarısız" });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (r: any) => {
    setEditing(r);
    setForm({ risk_adi: r.risk_adi, bolum: r.bolum || "", tehlike_tipi: r.tehlike_tipi || "", mevcut_onlem: r.mevcut_onlem || "", olasilik: r.olasilik, siddet: r.siddet, ek_onlemler: r.ek_onlemler || "", sorumlu_kisi: r.sorumlu_kisi || "", tamamlanma_tarihi: r.tamamlanma_tarihi || "", durum: r.durum, santiye_id: r.santiye_id || "" });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu risk kaydını silmek istediğinize emin misiniz?")) return;
    setEditStatus(null);
    try {
      const { error } = await supabase.from("risk_degerlendirme").delete().eq("id", id);
      if (error) throw error;
      await logAudit("risk_degerlendirme", "DELETE", id, null, null);
      setEditStatus({ type: "success", message: "Risk silindi" });
      fetchRisks();
    } catch (e: any) {
      setEditStatus({ type: "error", message: e.message || "Silme işlemi başarısız" });
    }
  };

  if (loading) return <div className="flex-1 p-8 flex items-center justify-center text-gray-400">Yükleniyor...</div>;

  const stats = { toplam: risks.length, kritik: risks.filter(r => r.risk_seviyesi === "Kritik").length, yuksek: risks.filter(r => r.risk_seviyesi === "Yuksek").length, acik: risks.filter(r => r.durum === "acik").length };

  return (
    <div className="flex-1 p-8 app-bg min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="page-header">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">Risk Değerlendirme</h2>
              <p className="text-sm text-gray-500">Tehlike tanımlama ve risk analizi</p>
            </div>
          </div>
          <button onClick={() => { setShowForm(true); setEditing(null); setForm({ risk_adi: "", bolum: "", tehlike_tipi: "", mevcut_onlem: "", olasilik: 1, siddet: 1, ek_onlemler: "", sorumlu_kisi: "", tamamlanma_tarihi: "", durum: "acik", santiye_id: "" }); }} className="btn btn-primary">
            <Plus className="w-4 h-4" /> Yeni Risk
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card p-4"><p className="text-xs text-gray-500">Toplam Risk</p><p className="text-2xl font-bold text-gray-800">{stats.toplam}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Kritik</p><p className="text-2xl font-bold text-red-600">{stats.kritik}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Yüksek</p><p className="text-2xl font-bold text-orange-600">{stats.yuksek}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Açık</p><p className="text-2xl font-bold text-amber-600">{stats.acik}</p></div>
        </div>

        <div className="card p-4 mb-6">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Risk ara..." value={search} onChange={e => setSearch(e.target.value)} className="input pr-12" />
          </div>
        </div>

        {editStatus && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm border ${editStatus.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
            {editStatus.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {editStatus.message}
          </div>
        )}

        <div className="card overflow-hidden">
          <table>
            <thead>
              <tr>
                <th>Risk Adı</th>
                <th>Bölüm</th>
                <th>Tehlike Tipi</th>
                <th>Olasılık</th>
                <th>Şiddet</th>
                <th>Risk Skoru</th>
                <th>Seviye</th>
                <th>Durum</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const lvl = riskLevels[r.risk_seviyesi as keyof typeof riskLevels] || riskLevels.Orta;
                const Icon = lvl.icon;
                return (
                  <tr key={r.id}>
                    <td className="font-medium">{r.risk_adi}</td>
                    <td>{r.bolum || "-"}</td>
                    <td>{r.tehlike_tipi || "-"}</td>
                    <td className="text-center">{r.olasilik}</td>
                    <td className="text-center">{r.siddet}</td>
                    <td className="text-center font-bold">{r.risk_skoru}</td>
                    <td><span className={`badge ${lvl.color}`}><Icon className="w-3 h-3 mr-1" />{r.risk_seviyesi}</span></td>
                    <td><span className={`badge ${r.durum === "tamamlandi" ? "bg-green-100 text-green-700" : r.durum === "devam" ? "bg-blue-100 text-blue-700" : r.durum === "iptal" ? "bg-gray-100 text-gray-700" : "bg-amber-100 text-amber-700"}`}>{durumOptions.find(d => d.value === r.durum)?.label}</span></td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(r)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={9} className="text-center py-8 text-gray-400">Henüz risk kaydı yok</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? "Risk Düzenle" : "Yeni Risk Ekle"}</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="modal-body space-y-4">
              <div>
                <label>Risk Adı *</label>
                <input type="text" value={form.risk_adi} onChange={e => setForm({ ...form, risk_adi: e.target.value })} placeholder="Örn: Yüksekte düşme riski" />
              </div>
              <div className="grid-2">
                <div>
                  <label>Bölüm</label>
                  <input type="text" value={form.bolum} onChange={e => setForm({ ...form, bolum: e.target.value })} placeholder="Örn: A Blok" />
                </div>
                <div>
                  <label>Tehlike Tipi</label>
                  <select value={form.tehlike_tipi} onChange={e => setForm({ ...form, tehlike_tipi: e.target.value })}>
                    <option value="">Seçiniz</option>
                    {tehlikeTipleri.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label>Şantiye</label>
                <select value={form.santiye_id} onChange={e => setForm({ ...form, santiye_id: e.target.value })}>
                  <option value="">Seçiniz</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.ad}</option>)}
                </select>
              </div>
              <div>
                <label>Mevcut Önlemler</label>
                <textarea value={form.mevcut_onlem} onChange={e => setForm({ ...form, mevcut_onlem: e.target.value })} rows={2} placeholder="Mevcut kontrol önlemleri..." />
              </div>
              <div className="grid-2">
                <div>
                  <label>Olasılık (1-5)</label>
                  <input type="number" min={1} max={5} value={form.olasilik} onChange={e => setForm({ ...form, olasilik: parseInt(e.target.value) || 1 })} />
                </div>
                <div>
                  <label>Şiddet (1-5)</label>
                  <input type="number" min={1} max={5} value={form.siddet} onChange={e => setForm({ ...form, siddet: parseInt(e.target.value) || 1 })} />
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-500">Risk Skoru: <span className="font-bold text-lg">{form.olasilik * form.siddet}</span> - {form.olasilik * form.siddet <= 4 ? "Düşük" : form.olasilik * form.siddet <= 9 ? "Orta" : form.olasilik * form.siddet <= 15 ? "Yüksek" : "Kritik"}</p>
              </div>
              <div>
                <label>Ek Önlemler</label>
                <textarea value={form.ek_onlemler} onChange={e => setForm({ ...form, ek_onlemler: e.target.value })} rows={2} placeholder="Planlanan ek önlemler..." />
              </div>
              <div className="grid-2">
                <div>
                  <label>Sorumlu Kişi</label>
                  <input type="text" value={form.sorumlu_kisi} onChange={e => setForm({ ...form, sorumlu_kisi: e.target.value })} />
                </div>
                <div>
                  <label>Tamamlanma Tarihi</label>
                  <input type="date" value={form.tamamlanma_tarihi} onChange={e => setForm({ ...form, tamamlanma_tarihi: e.target.value })} />
                </div>
              </div>
              <div>
                <label>Durum</label>
                <select value={form.durum} onChange={e => setForm({ ...form, durum: e.target.value })}>
                  {durumOptions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => setShowForm(false)} className="btn" style={{ background: "#f3f4f6", color: "#374151" }}>İptal</button>
                <button onClick={handleSubmit} className="btn btn-primary">{editing ? "Güncelle" : "Kaydet"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
