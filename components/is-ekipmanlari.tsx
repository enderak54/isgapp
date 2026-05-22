"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeForm } from "@/lib/security";
import { displayDate } from "@/lib/tarih";
import { Wrench, Plus, Edit, Trash2, Search, X, Save, AlertTriangle } from "lucide-react";

export default function IsEkipmanlari() {
  const [ekipmanlar, setEkipmanlar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ ad: "", seri_no: "", tip: "", santiye_id: "", son_kontrol_tarihi: "", sonraki_kontrol_tarihi: "", durum: "aktif", notlar: "" });
  const [santiyeler, setSantiyeler] = useState<any[]>([]);

  useEffect(() => { fetchEkipmanlar(); fetchSantiyeler(); }, []);

  const fetchEkipmanlar = async () => {
    const { data } = await supabase.from("is_ekipmanlari").select("*, santiyeler(ad)").order("created_at", { ascending: false });
    if (data) setEkipmanlar(data);
    setLoading(false);
  };

  const fetchSantiyeler = async () => {
    const { data } = await supabase.from("santiyeler").select("id, ad");
    if (data) setSantiyeler(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) await supabase.from("is_ekipmanlari").update(sanitizeForm(form)).eq("id", editing.id);
    else await supabase.from("is_ekipmanlari").insert(sanitizeForm(form));
    setShowForm(false); setEditing(null);
    setForm({ ad: "", seri_no: "", tip: "", santiye_id: "", son_kontrol_tarihi: "", sonraki_kontrol_tarihi: "", durum: "aktif", notlar: "" });
    fetchEkipmanlar();
  };

  const handleDelete = async (id: string) => { if (confirm("Sil?")) { await supabase.from("is_ekipmanlari").delete().eq("id", id); fetchEkipmanlar(); } };

  const filtered = ekipmanlar.filter((e) => e.ad.toLowerCase().includes(search.toLowerCase()));

  return (
    <main className="flex-1 p-8 app-bg min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">İş Ekipmanları</h2>
          <p className="text-gray-500 mt-1">Toplam {ekipmanlar.length} ekipman</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ ad: "", seri_no: "", tip: "", santiye_id: "", son_kontrol_tarihi: "", sonraki_kontrol_tarihi: "", durum: "aktif", notlar: "" }); }} className="btn btn-primary">
          <Plus className="w-4 h-4" /> Yeni Ekipman
        </button>
      </div>

      <div className="card p-4 mb-6">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Ekipman ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pr-12" />
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">{editing ? "Düzenle" : "Yeni Ekipman"}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <input required placeholder="Ekipman Adı" value={form.ad} onChange={(e) => setForm({ ...form, ad: e.target.value })} className="input" />
              <input placeholder="Seri No" value={form.seri_no} onChange={(e) => setForm({ ...form, seri_no: e.target.value })} className="input" />
              <input placeholder="Tip" value={form.tip} onChange={(e) => setForm({ ...form, tip: e.target.value })} className="input" />
              <select value={form.santiye_id} onChange={(e) => setForm({ ...form, santiye_id: e.target.value })} className="input">
                <option value="">Şantiye Seçin</option>
                {santiyeler.map((s) => <option key={s.id} value={s.id}>{s.ad}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input type="date" value={form.son_kontrol_tarihi} onChange={(e) => setForm({ ...form, son_kontrol_tarihi: e.target.value })} className="input" />
                <input type="date" value={form.sonraki_kontrol_tarihi} onChange={(e) => setForm({ ...form, sonraki_kontrol_tarihi: e.target.value })} className="input" />
              </div>
              <select value={form.durum} onChange={(e) => setForm({ ...form, durum: e.target.value })} className="input">
                <option value="aktif">Aktif</option>
                <option value="bakimda">Bakımda</option>
                <option value="kullanilmaz">Kullanılmaz</option>
              </select>
              <button type="submit" className="w-full btn btn-primary"><Save className="w-4 h-4" /> Kaydet</button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400"><div className="w-6 h-6 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin mr-2"></div>Yükleniyor...</div>
      ) : (
        <div className="card overflow-hidden">
          <table>
            <thead>
              <tr><th>Ekipman</th><th>Seri No</th><th>Şantiye</th><th>Sonraki Kontrol</th><th>Durum</th><th style={{textAlign:"center"}}>İşlemler</th></tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id}>
                  <td className="font-medium text-gray-800 flex items-center gap-2"><Wrench className="w-4 h-4 text-gray-400" />{e.ad}</td>
                  <td className="text-gray-600">{e.seri_no || "-"}</td>
                  <td className="text-gray-600">{e.santiyeler?.ad || "-"}</td>
                  <td className="text-gray-600">{displayDate(e.sonraki_kontrol_tarihi)}</td>
                  <td><span className={`badge ${e.durum === "aktif" ? "bg-green-100 text-green-700" : e.durum === "bakimda" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{e.durum}</span></td>
                  <td>
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => { setEditing(e); setForm({ ad: e.ad, seri_no: e.seri_no || "", tip: e.tip || "", santiye_id: e.santiye_id || "", son_kontrol_tarihi: e.son_kontrol_tarihi || "", sonraki_kontrol_tarihi: e.sonraki_kontrol_tarihi || "", durum: e.durum, notlar: e.notlas || "" }); setShowForm(true); }} className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(e.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}