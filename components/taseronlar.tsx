"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeForm } from "@/lib/security";
import { HardHat, Plus, Edit, Trash2, Search, X, Save } from "lucide-react";

export default function Taseronlar() {
  const [taseronlar, setTaseronlar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [santiyeler, setSantiyeler] = useState<any[]>([]);
  const [form, setForm] = useState({ firma_adi: "", yetkili: "", telefon: "", email: "", adres: "", vergi_no: "", santiye_id: "", durum: "aktif", notlar: "" });

  useEffect(() => { fetchTaseronlar(); fetchSantiyeler(); }, []);

  const fetchTaseronlar = async () => {
    const { data } = await supabase.from("taseronlar").select("*, santiyeler(ad)").order("created_at", { ascending: false });
    if (data) setTaseronlar(data);
    setLoading(false);
  };

  const fetchSantiyeler = async () => {
    const { data } = await supabase.from("santiyeler").select("id, ad");
    if (data) setSantiyeler(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) await supabase.from("taseronlar").update(sanitizeForm(form)).eq("id", editing.id);
    else await supabase.from("taseronlar").insert(sanitizeForm(form));
    setShowForm(false); setEditing(null); setForm({ firma_adi: "", yetkili: "", telefon: "", email: "", adres: "", vergi_no: "", santiye_id: "", durum: "aktif", notlar: "" });
    fetchTaseronlar();
  };

  const handleDelete = async (id: string) => { if (confirm("Sil?")) { await supabase.from("taseronlar").delete().eq("id", id); fetchTaseronlar(); } };

  return (
    <main className="flex-1 p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Taşeronlar</h2>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ firma_adi: "", yetkili: "", telefon: "", email: "", adres: "", vergi_no: "", santiye_id: "", durum: "aktif", notlar: "" }); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <Plus className="w-5 h-5" /> Yeni Taşeron
        </button>
      </div>

      <div className="card p-4 mb-6">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Firma ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pr-12" />
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{editing ? "Taşeron Düzenle" : "Yeni Taşeron"}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input required placeholder="Firma Adı" value={form.firma_adi} onChange={(e) => setForm({ ...form, firma_adi: e.target.value })} className="w-full p-2 border rounded-lg" />
              <input placeholder="Yetkili" value={form.yetkili} onChange={(e) => setForm({ ...form, yetkili: e.target.value })} className="w-full p-2 border rounded-lg" />
              <input placeholder="Telefon" value={form.telefon} onChange={(e) => setForm({ ...form, telefon: e.target.value })} className="w-full p-2 border rounded-lg" />
              <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full p-2 border rounded-lg" />
              <input placeholder="Vergi No" value={form.vergi_no} onChange={(e) => setForm({ ...form, vergi_no: e.target.value })} className="w-full p-2 border rounded-lg" />
              <select value={form.santiye_id} onChange={(e) => setForm({ ...form, santiye_id: e.target.value })} className="w-full p-2 border rounded-lg">
                <option value="">Şantiye Seçin</option>
                {santiyeler.map((s) => <option key={s.id} value={s.id}>{s.ad}</option>)}
              </select>
              <textarea placeholder="Adres" value={form.adres} onChange={(e) => setForm({ ...form, adres: e.target.value })} className="w-full p-2 border rounded-lg h-20" />
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
          {taseronlar.filter((t) => !search || t.firma_adi.toLowerCase().includes(search.toLowerCase())).map((t) => (
            <div key={t.id} className="bg-white rounded-lg shadow-md p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <HardHat className="w-5 h-5 text-orange-600" />
                  <h3 className="font-semibold">{t.firma_adi}</h3>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${t.durum === "aktif" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>{t.durum}</span>
              </div>
              {t.yetkili && <p className="text-sm text-gray-600">Yetkili: {t.yetkili}</p>}
              {t.telefon && <p className="text-sm text-gray-600">Tel: {t.telefon}</p>}
              {t.email && <p className="text-sm text-gray-600">Email: {t.email}</p>}
              {t.santiyeler?.ad && <p className="text-sm text-gray-600">Şantiye: {t.santiyeler.ad}</p>}
              <div className="flex gap-2 mt-3 pt-3 border-t">
                <button onClick={() => { setEditing(t); setForm({ firma_adi: t.firma_adi, yetkili: t.yetkili || "", telefon: t.telefon || "", email: t.email || "", adres: t.adres || "", vergi_no: t.vergi_no || "", santiye_id: t.santiye_id || "", durum: t.durum, notlar: t.notlar || "" }); setShowForm(true); }} className="flex-1 text-green-600 hover:bg-green-50 py-1 rounded text-sm">Düzenle</button>
                <button onClick={() => handleDelete(t.id)} className="flex-1 text-red-600 hover:bg-red-50 py-1 rounded text-sm">Sil</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}