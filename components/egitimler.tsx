"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { GraduationCap, Plus, Edit, Trash2, Search, X, Save, Calendar } from "lucide-react";

export default function Egitimler() {
  const [egitimler, setEgitimler] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ ad: "", tarih: "", sure: "", egitmen: "", yer: "", katilimcilar: "", notlar: "" });

  useEffect(() => { fetchEgitimler(); }, []);

  const fetchEgitimler = async () => {
    const { data } = await supabase.from("egitimler").select("*").order("tarih", { ascending: false });
    if (data) setEgitimler(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) await supabase.from("egitimler").update(form).eq("id", editing.id);
    else await supabase.from("egitimler").insert(form);
    setShowForm(false); setEditing(null); setForm({ ad: "", tarih: "", sure: "", egitmen: "", yer: "", katilimcilar: "", notlar: "" });
    fetchEgitimler();
  };

  const handleDelete = async (id: string) => { if (confirm("Sil?")) { await supabase.from("egitimler").delete().eq("id", id); fetchEgitimler(); } };

  return (
    <main className="flex-1 p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Eğitimler</h2>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ ad: "", tarih: "", sure: "", egitmen: "", yer: "", katilimcilar: "", notlar: "" }); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <Plus className="w-5 h-5" /> Yeni Eğitim
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Eğitim ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{editing ? "Eğitim Düzenle" : "Yeni Eğitim"}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input required placeholder="Eğitim Adı" value={form.ad} onChange={(e) => setForm({ ...form, ad: e.target.value })} className="w-full p-2 border rounded-lg" />
              <div className="grid grid-cols-2 gap-4">
                <input type="date" value={form.tarih} onChange={(e) => setForm({ ...form, tarih: e.target.value })} className="p-2 border rounded-lg" />
                <input placeholder="Süre (örn: 2 saat)" value={form.sure} onChange={(e) => setForm({ ...form, sure: e.target.value })} className="p-2 border rounded-lg" />
              </div>
              <input placeholder="Eğitmen" value={form.egitmen} onChange={(e) => setForm({ ...form, egitmen: e.target.value })} className="w-full p-2 border rounded-lg" />
              <input placeholder="Yer" value={form.yer} onChange={(e) => setForm({ ...form, yer: e.target.value })} className="w-full p-2 border rounded-lg" />
              <textarea placeholder="Katılımcılar (virgülle ayırın)" value={form.katilimcilar} onChange={(e) => setForm({ ...form, katilimcilar: e.target.value })} className="w-full p-2 border rounded-lg h-20" />
              <textarea placeholder="Notlar" value={form.notlar} onChange={(e) => setForm({ ...form, notlar: e.target.value })} className="w-full p-2 border rounded-lg h-20" />
              <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg flex items-center justify-center gap-2"><Save className="w-5 h-5" /> Kaydet</button>
            </form>
          </div>
        </div>
      )}

      {loading ? <div className="text-center py-12">Yükleniyor...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {egitimler.filter((e) => !search || e.ad.toLowerCase().includes(search.toLowerCase())).map((e) => (
            <div key={e.id} className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold">{e.ad}</h3>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <p className="flex items-center gap-2"><Calendar className="w-4 h-4" />{e.tarih || "-"}</p>
                {e.sure && <p>Süre: {e.sure}</p>}
                {e.egitmen && <p>Eğitmen: {e.egitmen}</p>}
                {e.yer && <p>Yer: {e.yer}</p>}
                {e.katilimcilar && <p className="text-xs">Katılımcı: {e.katilimcilar.substring(0, 50)}...</p>}
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t">
                <button onClick={() => { setEditing(e); setForm({ ad: e.ad, tarih: e.tarih || "", sure: e.sure || "", egitmen: e.egitmen || "", yer: e.yer || "", katilimcilar: e.katilimcilar || "", notlar: e.notlar || "" }); setShowForm(true); }} className="flex-1 text-green-600 hover:bg-green-50 py-1 rounded text-sm">Düzenle</button>
                <button onClick={() => handleDelete(e.id)} className="flex-1 text-red-600 hover:bg-red-50 py-1 rounded text-sm">Sil</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}