"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AlertTriangle, Plus, Edit, Trash2, Search, X, Save } from "lucide-react";

export default function IsKazalari() {
  const [kazalar, setKazalar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [personel, setPersonel] = useState<any[]>([]);
  const [form, setForm] = useState({ personel_id: "", tarih: "", saat: "", yer: "", aciklama: "", yaralanma_durumu: "", hastane: "", rapor_no: "", onleyici_onlemler: "" });

  useEffect(() => { fetchKazalar(); fetchPersonel(); }, []);

  const fetchKazalar = async () => {
    const { data } = await supabase.from("is_kazalari").select("*, personel(kimlik_no, ad_soyad)").order("tarih", { ascending: false });
    if (data) setKazalar(data);
    setLoading(false);
  };

  const fetchPersonel = async () => {
    const { data } = await supabase.from("personel").select("id, kimlik_no, ad_soyad");
    if (data) setPersonel(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) await supabase.from("is_kazalari").update(form).eq("id", editing.id);
    else await supabase.from("is_kazalari").insert(form);
    setShowForm(false); setEditing(null); setForm({ personel_id: "", tarih: "", saat: "", yer: "", aciklama: "", yaralanma_durumu: "", hastane: "", rapor_no: "", onleyici_onlemler: "" });
    fetchKazalar();
  };

  const handleDelete = async (id: string) => { if (confirm("Sil?")) { await supabase.from("is_kazalari").delete().eq("id", id); fetchKazalar(); } };

  return (
    <main className="flex-1 p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">İş Kazaları</h2>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ personel_id: "", tarih: "", saat: "", yer: "", aciklama: "", yaralanma_durumu: "", hastane: "", rapor_no: "", onleyici_onlemler: "" }); }} className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700">
          <Plus className="w-5 h-5" /> Yeni Kaza
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Kaza ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-4 pr-10 py-2 border rounded-lg" />
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{editing ? "Kaza Düzenle" : "Yeni İş Kazası"}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <select value={form.personel_id} onChange={(e) => setForm({ ...form, personel_id: e.target.value })} className="w-full p-2 border rounded-lg">
                <option value="">Personel Seçin</option>
                {personel.map((p) => <option key={p.id} value={p.id}>{p.ad_soyad} ({p.kimlik_no})</option>)}
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input type="date" required value={form.tarih} onChange={(e) => setForm({ ...form, tarih: e.target.value })} className="p-2 border rounded-lg" />
                <input type="time" value={form.saat} onChange={(e) => setForm({ ...form, saat: e.target.value })} className="p-2 border rounded-lg" />
              </div>
              <input placeholder="Kaza Yeri" value={form.yer} onChange={(e) => setForm({ ...form, yer: e.target.value })} className="w-full p-2 border rounded-lg" />
              <select value={form.yaralanma_durumu} onChange={(e) => setForm({ ...form, yaralanma_durumu: e.target.value })} className="w-full p-2 border rounded-lg">
                <option value="">Yaralanma Durumu</option>
                <option value="yok">Yaralanma Yok</option>
                <option value="hafif">Hafif Yaralanma</option>
                <option value="agri">Ağır Yaralanma</option>
                <option value="olum">Ölümlü</option>
              </select>
              <input placeholder="Hastane" value={form.hastane} onChange={(e) => setForm({ ...form, hastane: e.target.value })} className="w-full p-2 border rounded-lg" />
              <input placeholder="Rapor No" value={form.rapor_no} onChange={(e) => setForm({ ...form, rapor_no: e.target.value })} className="w-full p-2 border rounded-lg" />
              <textarea placeholder="Kaza Açıklaması" value={form.aciklama} onChange={(e) => setForm({ ...form, aciklama: e.target.value })} className="w-full p-2 border rounded-lg h-20" />
              <textarea placeholder="Önleyici Önlemler" value={form.onleyici_onlemler} onChange={(e) => setForm({ ...form, onleyici_onlemler: e.target.value })} className="w-full p-2 border rounded-lg h-20" />
              <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg flex items-center justify-center gap-2"><Save className="w-5 h-5" /> Kaydet</button>
            </form>
          </div>
        </div>
      )}

      {loading ? <div className="text-center py-12">Yükleniyor...</div> : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Tarih</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Personel</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Yer</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Yaralanma</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Rapor No</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {kazalar.filter((k) => !search || k.personel?.ad_soyad?.toLowerCase().includes(search.toLowerCase()) || k.yer?.toLowerCase().includes(search.toLowerCase())).map((k) => (
                <tr key={k.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{k.tarih}</td>
                  <td className="px-4 py-3 text-sm">{k.personel?.ad_soyad || "-"}</td>
                  <td className="px-4 py-3 text-sm">{k.yer || "-"}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${k.yaralanma_durumu === "yok" ? "bg-green-100 text-green-700" : k.yaralanma_durumu === "hafif" ? "bg-yellow-100 text-yellow-700" : k.yaralanma_durumu === "agri" ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"}`}>{k.yaralanma_durumu || "-"}</span></td>
                  <td className="px-4 py-3 text-sm">{k.rapor_no || "-"}</td>
                  <td className="px-4 py-3 flex justify-center gap-2">
                    <button onClick={() => { setEditing(k); setForm({ personel_id: k.personel_id || "", tarih: k.tarih || "", saat: k.saat || "", yer: k.yer || "", aciklama: k.aciklama || "", yaralanma_durumu: k.yaralanma_durumu || "", hastane: k.hastane || "", rapor_no: k.rapor_no || "", onleyici_onlemler: k.onleyici_onlemler || "" }); setShowForm(true); }} className="p-1 text-green-600 hover:bg-green-50 rounded"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(k.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
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