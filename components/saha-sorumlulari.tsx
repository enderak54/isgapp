"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeForm } from "@/lib/security";
import { UserCog, Plus, Edit, Trash2, Search, X, Save } from "lucide-react";

export default function SahaSorumlulari() {
  const [sorumlular, setSorumlular] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [santiyeler, setSantiyeler] = useState<any[]>([]);
  const [form, setForm] = useState({ ad_soyad: "", telefon: "", email: "", pozisyon: "", santiye_id: "", durum: "aktif", notlar: "" });

  useEffect(() => { fetchSorumlular(); fetchSantiyeler(); }, []);

  const fetchSorumlular = async () => {
    const { data } = await supabase.from("saha_sorumlulari").select("*, santiyeler(ad)").order("ad_soyad", { ascending: true });
    if (data) setSorumlular(data);
    setLoading(false);
  };

  const fetchSantiyeler = async () => {
    const { data } = await supabase.from("santiyeler").select("id, ad");
    if (data) setSantiyeler(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) await supabase.from("saha_sorumlulari").update(sanitizeForm(form)).eq("id", editing.id);
    else await supabase.from("saha_sorumlulari").insert(sanitizeForm(form));
    setShowForm(false); setEditing(null); setForm({ ad_soyad: "", telefon: "", email: "", pozisyon: "", santiye_id: "", durum: "aktif", notlar: "" });
    fetchSorumlular();
  };

  const handleDelete = async (id: string) => { if (confirm("Sil?")) { await supabase.from("saha_sorumlulari").delete().eq("id", id); fetchSorumlular(); } };

  return (
    <main className="flex-1 p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Saha Sorumluları</h2>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ ad_soyad: "", telefon: "", email: "", pozisyon: "", santiye_id: "", durum: "aktif", notlar: "" }); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <Plus className="w-5 h-5" /> Yeni Sorumlu
        </button>
      </div>

      <div className="card p-4 mb-6">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Sorumlu ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pr-12" />
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{editing ? "Sorumlu Düzenle" : "Yeni Saha Sorumlusu"}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input required placeholder="Ad Soyad" value={form.ad_soyad} onChange={(e) => setForm({ ...form, ad_soyad: e.target.value })} className="w-full p-2 border rounded-lg" />
              <input placeholder="Telefon" value={form.telefon} onChange={(e) => setForm({ ...form, telefon: e.target.value })} className="w-full p-2 border rounded-lg" />
              <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full p-2 border rounded-lg" />
              <input placeholder="Pozisyon (Örn: İSG Mühendisi)" value={form.pozisyon} onChange={(e) => setForm({ ...form, pozisyon: e.target.value })} className="w-full p-2 border rounded-lg" />
              <select value={form.santiye_id} onChange={(e) => setForm({ ...form, santiye_id: e.target.value })} className="w-full p-2 border rounded-lg">
                <option value="">Şantiye Seçin</option>
                {santiyeler.map((s) => <option key={s.id} value={s.id}>{s.ad}</option>)}
              </select>
              <select value={form.durum} onChange={(e) => setForm({ ...form, durum: e.target.value })} className="w-full p-2 border rounded-lg">
                <option value="aktif">Aktif</option>
                <option value="pasif">Pasif</option>
              </select>
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
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Ad Soyad</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Pozisyon</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Telefon</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Şantiye</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Durum</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sorumlular.filter((s) => !search || s.ad_soyad.toLowerCase().includes(search.toLowerCase())).map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm flex items-center gap-2"><UserCog className="w-4 h-4 text-gray-400" />{s.ad_soyad}</td>
                  <td className="px-4 py-3 text-sm">{s.pozisyon || "-"}</td>
                  <td className="px-4 py-3 text-sm">{s.telefon || "-"}</td>
                  <td className="px-4 py-3 text-sm">{s.santiyeler?.ad || "-"}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${s.durum === "aktif" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>{s.durum}</span></td>
                  <td className="px-4 py-3 flex justify-center gap-2">
                    <button onClick={() => { setEditing(s); setForm({ ad_soyad: s.ad_soyad, telefon: s.telefon || "", email: s.email || "", pozisyon: s.pozisyon || "", santiye_id: s.santiye_id || "", durum: s.durum, notlar: s.notlar || "" }); setShowForm(true); }} className="p-1 text-green-600 hover:bg-green-50 rounded"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(s.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
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