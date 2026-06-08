"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeForm } from "@/lib/security";
import { logAudit } from "@/lib/audit";
import { displayDate } from "@/lib/tarih";
import { Award, Plus, Search, Edit, Trash2, X, CheckCircle, AlertCircle } from "lucide-react";

const yetkinlikTipleri = [
  { value: "egitim", label: "Eğitim" },
  { value: "sertifika", label: "Sertifika" },
  { value: "deneyim", label: "Deneyim" },
  { value: "lisans", label: "Lisans" },
  { value: "diger", label: "Diğer" },
];
const durumlar = [
  { value: "gecerli", label: "Geçerli" },
  { value: "suresi_doluyor", label: "Süresi Doluyor" },
  { value: "suresi_dolmus", label: "Süresi Dolmuş" },
  { value: "beklemede", label: "Beklemede" },
];

export default function YetkinlikMatrisi() {
  const [items, setItems] = useState<any[]>([]);
  const [personel, setPersonel] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ personel_id: "", yetkinlik_adi: "", yetkinlik_tipi: "egitim", zorunlu_mu: false, seviye: 1, gereken_seviye: 1, alis_tarihi: "", gecerlilik_tarihi: "", veren_kurum: "", belge_no: "", belge_url: "", durum: "gecerli", notlar: "" });
  const [saving, setSaving] = useState(false);
  const [editStatus, setEditStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchItems = async () => {
    const { data } = await supabase.from("yetkinlik_matrisi").select("*, personel(ad, soyad, kimlik_no)").order("olusturma_tarihi", { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  const fetchPersonel = async () => {
    const { data } = await supabase.from("personel").select("id, ad, soyad").eq("arsivde", false);
    if (data) setPersonel(data);
  };

  useEffect(() => { fetchItems(); fetchPersonel(); }, []);

  const filtered = items.filter(i => i.yetkinlik_adi.toLowerCase().includes(search.toLowerCase()) || (i.personel && `${i.personel.ad || ""} ${i.personel.soyad || ""}`.toLowerCase().includes(search.toLowerCase())));

  const handleSubmit = async () => {
    if (!form.yetkinlik_adi || !form.personel_id) return;
    setSaving(true);
    setEditStatus(null);
    try {
      const payload = sanitizeForm({ ...form, alis_tarihi: form.alis_tarihi || null, gecerlilik_tarihi: form.gecerlilik_tarihi || null });
      if (editing) {
        const { error } = await supabase.from("yetkinlik_matrisi").update(payload).eq("id", editing.id);
        if (error) throw error;
        await logAudit("yetkinlik_matrisi", "UPDATE", editing.id, editing, payload);
        setEditStatus({ type: "success", message: "Yetkinlik güncellendi" });
      } else {
        const { data, error } = await supabase.from("yetkinlik_matrisi").insert(payload).select();
        if (error) throw error;
        if (data) await logAudit("yetkinlik_matrisi", "INSERT", data[0].id, null, payload);
        setEditStatus({ type: "success", message: "Yetkinlik kaydedildi" });
      }
      setShowForm(false);
      setEditing(null);
      setForm({ personel_id: "", yetkinlik_adi: "", yetkinlik_tipi: "egitim", zorunlu_mu: false, seviye: 1, gereken_seviye: 1, alis_tarihi: "", gecerlilik_tarihi: "", veren_kurum: "", belge_no: "", belge_url: "", durum: "gecerli", notlar: "" });
      fetchItems();
    } catch (e: any) {
      setEditStatus({ type: "error", message: e.message || "Kayıt işlemi başarısız" });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (i: any) => {
    setEditing(i);
    setForm({ personel_id: i.personel_id, yetkinlik_adi: i.yetkinlik_adi, yetkinlik_tipi: i.yetkinlik_tipi, zorunlu_mu: i.zorunlu_mu, seviye: i.seviye, gereken_seviye: i.gereken_seviye, alis_tarihi: i.alis_tarihi ? i.alis_tarihi.split("T")[0] : "", gecerlilik_tarihi: i.gecerlilik_tarihi ? i.gecerlilik_tarihi.split("T")[0] : "", veren_kurum: i.veren_kurum || "", belge_no: i.belge_no || "", belge_url: i.belge_url || "", durum: i.durum, notlar: i.notlar || "" });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu kaydı silmek istediğinize emin misiniz?")) return;
    setEditStatus(null);
    try {
      const { error } = await supabase.from("yetkinlik_matrisi").delete().eq("id", id);
      if (error) throw error;
      await logAudit("yetkinlik_matrisi", "DELETE", id, null, null);
      setEditStatus({ type: "success", message: "Yetkinlik silindi" });
      fetchItems();
    } catch (e: any) {
      setEditStatus({ type: "error", message: e.message || "Silme işlemi başarısız" });
    }
  };

  if (loading) return <div className="flex-1 p-8 flex items-center justify-center text-gray-400">Yükleniyor...</div>;

  const stats = { toplam: items.length, gecerli: items.filter(i => i.durum === "gecerli").length, sureDoluyor: items.filter(i => i.durum === "suresi_doluyor").length, sureDolmus: items.filter(i => i.durum === "suresi_dolmus").length };

  return (
    <div className="flex-1 p-8 app-bg min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="page-header">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center"><Award className="w-6 h-6 text-gray-600" /></div>
            <div><h2 className="text-2xl font-semibold text-gray-800">Yetkinlik Matrisi</h2><p className="text-sm text-gray-500">Personel yetkinlik ve sertifika takibi</p></div>
          </div>
          <button onClick={() => { setShowForm(true); setEditing(null); setForm({ personel_id: "", yetkinlik_adi: "", yetkinlik_tipi: "egitim", zorunlu_mu: false, seviye: 1, gereken_seviye: 1, alis_tarihi: "", gecerlilik_tarihi: "", veren_kurum: "", belge_no: "", belge_url: "", durum: "gecerli", notlar: "" }); }} className="btn btn-primary"><Plus className="w-4 h-4" /> Yeni Kayıt</button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card p-4"><p className="text-xs text-gray-500">Toplam</p><p className="text-2xl font-bold text-gray-800">{stats.toplam}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Geçerli</p><p className="text-2xl font-bold text-green-600">{stats.gecerli}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Süresi Doluyor</p><p className="text-2xl font-bold text-amber-600">{stats.sureDoluyor}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Süresi Dolmuş</p><p className="text-2xl font-bold text-red-600">{stats.sureDolmus}</p></div>
        </div>

        <div className="card p-4 mb-6"><div className="relative"><Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" placeholder="Yetkinlik veya personel ara..." value={search} onChange={e => setSearch(e.target.value)} className="input pr-12" /></div></div>

        {editStatus && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm border ${editStatus.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
            {editStatus.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {editStatus.message}
          </div>
        )}

        <div className="card overflow-hidden">
          <table>
            <thead><tr><th>Personel</th><th>Yetkinlik</th><th>Tip</th><th>Seviye</th><th>Gereken</th><th>Alış Tarihi</th><th>Geçerlilik</th><th>Durum</th><th>İşlem</th></tr></thead>
            <tbody>
              {filtered.map(i => (
                <tr key={i.id}>
                  <td className="font-medium">{i.personel ? `${i.personel.ad || ""} ${i.personel.soyad || ""}`.trim() || "-" : "-"}</td>
                  <td>{i.yetkinlik_adi}</td>
                  <td>{yetkinlikTipleri.find(y => y.value === i.yetkinlik_tipi)?.label}</td>
                  <td className="text-center">{i.seviye}/5</td>
                  <td className="text-center">{i.gereken_seviye}/5</td>
                  <td>{displayDate(i.alis_tarihi)}</td>
                  <td>{displayDate(i.gecerlilik_tarihi)}</td>
                  <td><span className={`badge ${i.durum === "gecerli" ? "bg-green-100 text-green-700" : i.durum === "suresi_doluyor" ? "bg-amber-100 text-amber-700" : i.durum === "suresi_dolmus" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}>{durumlar.find(d => d.value === i.durum)?.label}</span></td>
                  <td><div className="flex gap-1"><button onClick={() => handleEdit(i)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Edit className="w-4 h-4" /></button><button onClick={() => handleDelete(i.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button></div></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={9} className="text-center py-8 text-gray-400">Henüz kayıt yok</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{editing ? "Kayıt Düzenle" : "Yeni Yetkinlik Kaydı"}</h3><button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button></div>
            <div className="modal-body space-y-4">
              <div><label>Personel *</label><select value={form.personel_id} onChange={e => setForm({ ...form, personel_id: e.target.value })}><option value="">Seçiniz</option>{personel.map(p => <option key={p.id} value={p.id}>{p.ad} {p.soyad}</option>)}</select></div>
              <div><label>Yetkinlik Adı *</label><input type="text" value={form.yetkinlik_adi} onChange={e => setForm({ ...form, yetkinlik_adi: e.target.value })} placeholder="Örn: Yüksekte Çalışma Eğitimi" /></div>
              <div className="grid-2"><div><label>Tip</label><select value={form.yetkinlik_tipi} onChange={e => setForm({ ...form, yetkinlik_tipi: e.target.value })}>{yetkinlikTipleri.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}</select></div><div className="flex items-center gap-2 pt-6"><input type="checkbox" checked={form.zorunlu_mu} onChange={e => setForm({ ...form, zorunlu_mu: e.target.checked })} id="zorunlu" /><label htmlFor="zorunlu" className="mb-0">Zorunlu mu?</label></div></div>
              <div className="grid-2"><div><label>Mevcut Seviye (1-5)</label><input type="number" min={1} max={5} value={form.seviye} onChange={e => setForm({ ...form, seviye: parseInt(e.target.value) || 1 })} /></div><div><label>Gereken Seviye (1-5)</label><input type="number" min={1} max={5} value={form.gereken_seviye} onChange={e => setForm({ ...form, gereken_seviye: parseInt(e.target.value) || 1 })} /></div></div>
              <div className="grid-2"><div><label>Alış Tarihi</label><input type="date" value={form.alis_tarihi} onChange={e => setForm({ ...form, alis_tarihi: e.target.value })} /></div><div><label>Geçerlilik Tarihi</label><input type="date" value={form.gecerlilik_tarihi} onChange={e => setForm({ ...form, gecerlilik_tarihi: e.target.value })} /></div></div>
              <div className="grid-2"><div><label>Veren Kurum</label><input type="text" value={form.veren_kurum} onChange={e => setForm({ ...form, veren_kurum: e.target.value })} /></div><div><label>Belge No</label><input type="text" value={form.belge_no} onChange={e => setForm({ ...form, belge_no: e.target.value })} /></div></div>
              <div><label>Belge URL</label><input type="text" value={form.belge_url} onChange={e => setForm({ ...form, belge_url: e.target.value })} placeholder="https://..." /></div>
              <div><label>Durum</label><select value={form.durum} onChange={e => setForm({ ...form, durum: e.target.value })}>{durumlar.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}</select></div>
              <div><label>Notlar</label><textarea value={form.notlar} onChange={e => setForm({ ...form, notlar: e.target.value })} rows={2} /></div>
              <div className="flex justify-end gap-2 pt-4"><button onClick={() => setShowForm(false)} className="btn" style={{ background: "#f3f4f6", color: "#374151" }}>İptal</button><button onClick={handleSubmit} className="btn btn-primary">{editing ? "Güncelle" : "Kaydet"}</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
