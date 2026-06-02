"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeForm } from "@/lib/security";
import { logAudit } from "@/lib/audit";
import { Building2, Plus, Search, Edit, Trash2, X, Users, Globe, AlertTriangle } from "lucide-react";

const turOptions = [
  { value: "ic_baglam", label: "İç Bağlam", icon: Building2 },
  { value: "dis_baglam", label: "Dış Bağlam", icon: Globe },
  { value: "ilgili_taraf", label: "İlgili Taraf", icon: Users },
];

const riskFirsatOptions = [
  { value: "risk", label: "Risk" },
  { value: "firsat", label: "Fırsat" },
  { value: "her_ikisi", label: "Her İkisi" },
];

export default function BaglamAnalizi() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ tur: "ic_baglam", baslik: "", aciklama: "", etki_analizi: "", risk_firsat: "" });

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      const { data } = await supabase.from("baglam_analizi").select("*").order("olusturma_tarihi", { ascending: false });
      if (data) setItems(data);
    } catch (e: any) {
      setError("Veriler yüklenirken hata oluştu");
    }
    setLoading(false);
  };

  const filtered = items.filter(i =>
    i.baslik.toLowerCase().includes(search.toLowerCase()) || (i.aciklama && i.aciklama.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSubmit = async () => {
    if (!form.baslik) return;
    try {
      const payload = sanitizeForm({ ...form });
      if (editing) {
        const { error: updateError } = await supabase.from("baglam_analizi").update(payload).eq("id", editing.id);
        if (updateError) throw updateError;
        await logAudit("baglam_analizi", "UPDATE", editing.id, editing, payload);
      } else {
        const { data, error: insertError } = await supabase.from("baglam_analizi").insert(payload).select();
        if (insertError) throw insertError;
        if (data) await logAudit("baglam_analizi", "INSERT", data[0].id, null, payload);
      }
      setShowForm(false);
      setEditing(null);
      setError(null);
      setForm({ tur: "ic_baglam", baslik: "", aciklama: "", etki_analizi: "", risk_firsat: "" });
      fetchItems();
    } catch (e: any) {
      setError(e.message || "Kayıt işlemi başarısız");
    }
  };

  const handleEdit = (item: any) => {
    setEditing(item);
    setForm({ tur: item.tur, baslik: item.baslik, aciklama: item.aciklama || "", etki_analizi: item.etki_analizi || "", risk_firsat: item.risk_firsat || "" });
    setShowForm(true);
    setError(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu kaydı silmek istediğinize emin misiniz?")) return;
    try {
      const item = items.find(i => i.id === id);
      const { error: deleteError } = await supabase.from("baglam_analizi").delete().eq("id", id);
      if (deleteError) throw deleteError;
      if (item) await logAudit("baglam_analizi", "DELETE", id, item, null);
      setError(null);
      fetchItems();
    } catch (e: any) {
      setError(e.message || "Silme işlemi başarısız");
    }
  };

  if (loading) return <div className="flex-1 p-8 flex items-center justify-center text-gray-400">Yükleniyor...</div>;

  const stats = { toplam: items.length, ic: items.filter(i => i.tur === "ic_baglam").length, dis: items.filter(i => i.tur === "dis_baglam").length, taraf: items.filter(i => i.tur === "ilgili_taraf").length };

  return (
    <main className="flex-1 p-8 app-bg min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="page-header">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">Bağlam ve İlgili Taraflar Analizi</h2>
              <p className="text-sm text-gray-500">ISO 45001 Madde 4.1/4.2 - Kuruluş bağlamı ve ilgili taraflar</p>
            </div>
          </div>
          <button onClick={() => { setShowForm(true); setEditing(null); setError(null); setForm({ tur: "ic_baglam", baslik: "", aciklama: "", etki_analizi: "", risk_firsat: "" }); }} className="btn btn-primary">
            <Plus className="w-4 h-4" /> Yeni Kayıt
          </button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card p-4"><p className="text-xs text-gray-500">Toplam</p><p className="text-2xl font-bold text-gray-800">{stats.toplam}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">İç Bağlam</p><p className="text-2xl font-bold text-blue-600">{stats.ic}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Dış Bağlam</p><p className="text-2xl font-bold text-green-600">{stats.dis}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">İlgili Taraflar</p><p className="text-2xl font-bold text-purple-600">{stats.taraf}</p></div>
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
                <th>Açıklama</th>
                <th>Etki Analizi</th>
                <th>Risk/Fırsat</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const tur = turOptions.find(t => t.value === item.tur);
                const TurIcon = tur?.icon || Building2;
                return (
                  <tr key={item.id}>
                    <td><span className="badge bg-blue-100 text-blue-700 flex items-center gap-1 w-fit"><TurIcon className="w-3 h-3" />{tur?.label}</span></td>
                    <td className="font-medium">{item.baslik}</td>
                    <td className="max-w-xs truncate">{item.aciklama || "-"}</td>
                    <td className="max-w-xs truncate">{item.etki_analizi || "-"}</td>
                    <td>{item.risk_firsat ? <span className={`badge ${item.risk_firsat === "risk" ? "bg-red-100 text-red-700" : item.risk_firsat === "firsat" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{riskFirsatOptions.find(r => r.value === item.risk_firsat)?.label}</span> : "-"}</td>
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
                <input type="text" value={form.baslik} onChange={e => setForm({ ...form, baslik: e.target.value })} placeholder="Örn: Mevzuat değişiklikleri, paydaş beklentileri" />
              </div>
              <div>
                <label>Açıklama</label>
                <textarea value={form.aciklama} onChange={e => setForm({ ...form, aciklama: e.target.value })} rows={3} placeholder="Detaylı açıklama..." />
              </div>
              <div>
                <label>Etki Analizi</label>
                <textarea value={form.etki_analizi} onChange={e => setForm({ ...form, etki_analizi: e.target.value })} rows={2} placeholder="İSG yönetim sistemine etkisi..." />
              </div>
              <div>
                <label>Risk / Fırsat</label>
                <select value={form.risk_firsat} onChange={e => setForm({ ...form, risk_firsat: e.target.value })}>
                  <option value="">Seçiniz</option>
                  {riskFirsatOptions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
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
    </main>
  );
}
