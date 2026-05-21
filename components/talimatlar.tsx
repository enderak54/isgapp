"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeForm } from "@/lib/security";
import { FileText, Plus, Edit, Trash2, Search, X, Save, Calendar } from "lucide-react";

export default function Talimatlar() {
  const [talimatlar, setTalimatlar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ baslik: "", icerik: "", tarih: "", hedef: "", durum: "aktif" });

  useEffect(() => { fetchTalimatlar(); }, []);

  const fetchTalimatlar = async () => {
    const { data } = await supabase.from("talimatlar").select("*").order("created_at", { ascending: false });
    if (data) setTalimatlar(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) await supabase.from("talimatlar").update(sanitizeForm(form)).eq("id", editing.id);
    else await supabase.from("talimatlar").insert(sanitizeForm(form));
    setShowForm(false); setEditing(null); setForm({ baslik: "", icerik: "", tarih: "", hedef: "", durum: "aktif" });
    fetchTalimatlar();
  };

  const handleDelete = async (id: string) => { if (confirm("Sil?")) { await supabase.from("talimatlar").delete().eq("id", id); fetchTalimatlar(); } };

  return (
    <main className="flex-1 p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Talimat Takibi</h2>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ baslik: "", icerik: "", tarih: "", hedef: "", durum: "aktif" }); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <Plus className="w-5 h-5" /> Yeni Talimat
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Talimat ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-4 pr-10 py-2 border rounded-lg" />
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{editing ? "Talimat Düzenle" : "Yeni Talimat"}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input required placeholder="Başlık" value={form.baslik} onChange={(e) => setForm({ ...form, baslik: e.target.value })} className="w-full p-2 border rounded-lg" />
              <textarea required placeholder="İçerik" value={form.icerik} onChange={(e) => setForm({ ...form, icerik: e.target.value })} className="w-full p-2 border rounded-lg h-32" />
              <div className="grid grid-cols-2 gap-4">
                <input type="date" value={form.tarih} onChange={(e) => setForm({ ...form, tarih: e.target.value })} className="p-2 border rounded-lg" />
                <select value={form.hedef} onChange={(e) => setForm({ ...form, hedef: e.target.value })} className="p-2 border rounded-lg">
                  <option value="">Hedef Kitle</option>
                  <option value="tüm">Tüm Personel</option>
                  <option value="saha">Saha Personeli</option>
                  <option value="teknik">Teknik Personel</option>
                  <option value="idari">İdari Personel</option>
                </select>
              </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {talimatlar.filter((t) => !search || t.baslik.toLowerCase().includes(search.toLowerCase())).map((t) => (
            <div key={t.id} className="bg-white rounded-lg shadow-md p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold">{t.baslik}</h3>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${t.durum === "aktif" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>{t.durum}</span>
              </div>
              {t.icerik && <p className="text-sm text-gray-600 mb-2 line-clamp-3">{t.icerik}</p>}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {t.tarih && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{t.tarih}</span>}
                {t.hedef && <span className="bg-gray-100 px-2 py-0.5 rounded">{t.hedef}</span>}
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t">
                <button onClick={() => { setEditing(t); setForm({ baslik: t.baslik, icerik: t.icerik || "", tarih: t.tarih || "", hedef: t.hedef || "", durum: t.durum }); setShowForm(true); }} className="flex-1 text-green-600 hover:bg-green-50 py-1 rounded text-sm">Düzenle</button>
                <button onClick={() => handleDelete(t.id)} className="flex-1 text-red-600 hover:bg-red-50 py-1 rounded text-sm">Sil</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}