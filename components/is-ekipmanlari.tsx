"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Wrench, Plus, Edit, Trash2, Search, X, Save } from "lucide-react";

export default function IsEkipmanlari() {
  const [ekipmanlar, setEkipmanlar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    ad: "",
    seri_no: "",
    tip: "",
    santiye_id: "",
    son_kontrol_tarihi: "",
    sonraki_kontrol_tarihi: "",
    durum: "aktif",
    notlar: "",
  });
  const [santiyeler, setSantiyeler] = useState<any[]>([]);

  useEffect(() => {
    fetchEkipmanlar();
    fetchSantiyeler();
  }, []);

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
    if (editing) {
      await supabase.from("is_ekipmanlari").update(form).eq("id", editing.id);
    } else {
      await supabase.from("is_ekipmanlari").insert(form);
    }
    setShowForm(false);
    setEditing(null);
    setForm({ ad: "", seri_no: "", tip: "", santiye_id: "", son_kontrol_tarihi: "", sonraki_kontrol_tarihi: "", durum: "aktif", notlar: "" });
    fetchEkipmanlar();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bu ekipmanı silmek istediğinize emin misiniz?")) {
      await supabase.from("is_ekipmanlari").delete().eq("id", id);
      fetchEkipmanlar();
    }
  };

  const filtered = ekipmanlar.filter((e) => e.ad.toLowerCase().includes(search.toLowerCase()));

  return (
    <main className="flex-1 p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">İş Ekipmanları</h2>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm({ ad: "", seri_no: "", tip: "", santiye_id: "", son_kontrol_tarihi: "", sonraki_kontrol_tarihi: "", durum: "aktif", notlar: "" }); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Yeni Ekipman
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Ekipman ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{editing ? "Ekipman Düzenle" : "Yeni Ekipman"}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input required placeholder="Ekipman Adı" value={form.ad} onChange={(e) => setForm({ ...form, ad: e.target.value })} className="w-full p-2 border rounded-lg" />
              <input placeholder="Seri No" value={form.seri_no} onChange={(e) => setForm({ ...form, seri_no: e.target.value })} className="w-full p-2 border rounded-lg" />
              <input placeholder="Tip" value={form.tip} onChange={(e) => setForm({ ...form, tip: e.target.value })} className="w-full p-2 border rounded-lg" />
              <select value={form.santiye_id} onChange={(e) => setForm({ ...form, santiye_id: e.target.value })} className="w-full p-2 border rounded-lg">
                <option value="">Şantiye Seçin</option>
                {santiyeler.map((s) => <option key={s.id} value={s.id}>{s.ad}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input type="date" placeholder="Son Kontrol" value={form.son_kontrol_tarihi} onChange={(e) => setForm({ ...form, son_kontrol_tarihi: e.target.value })} className="p-2 border rounded-lg" />
                <input type="date" placeholder="Sonraki Kontrol" value={form.sonraki_kontrol_tarihi} onChange={(e) => setForm({ ...form, sonraki_kontrol_tarihi: e.target.value })} className="p-2 border rounded-lg" />
              </div>
              <select value={form.durum} onChange={(e) => setForm({ ...form, durum: e.target.value })} className="w-full p-2 border rounded-lg">
                <option value="aktif">Aktif</option>
                <option value="bakimda">Bakımda</option>
                <option value="kullanilmaz">Kullanılmaz</option>
              </select>
              <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg flex items-center justify-center gap-2">
                <Save className="w-5 h-5" /> Kaydet
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">Yükleniyor...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Ekipman</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Seri No</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Şantiye</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Sonraki Kontrol</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Durum</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm flex items-center gap-2"><Wrench className="w-4 h-4 text-gray-400" />{e.ad}</td>
                  <td className="px-4 py-3 text-sm">{e.seri_no || "-"}</td>
                  <td className="px-4 py-3 text-sm">{e.santiyeler?.ad || "-"}</td>
                  <td className="px-4 py-3 text-sm">{e.sonraki_kontrol_tarihi || "-"}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${e.durum === "aktif" ? "bg-green-100 text-green-700" : e.durum === "bakimda" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{e.durum}</span></td>
                  <td className="px-4 py-3 flex justify-center gap-2">
                    <button onClick={() => { setEditing(e); setForm({ ad: e.ad, seri_no: e.seri_no || "", tip: e.tip || "", santiye_id: e.santiye_id || "", son_kontrol_tarihi: e.son_kontrol_tarihi || "", sonraki_kontrol_tarihi: e.sonraki_kontrol_tarihi || "", durum: e.durum, notlar: e.notlar || "" }); setShowForm(true); }} className="p-1 text-green-600 hover:bg-green-50 rounded"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(e.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
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
