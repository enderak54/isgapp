"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Building2, Plus, Edit, Trash2, Search, X, Save, Phone, MapPin, User } from "lucide-react";

export default function Santiyeler() {
  const [santiyeler, setSantiyeler] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ ad: "", adres: "", sorumlu: "", telefon: "", baslangic_tarihi: "", bitis_tarihi: "", durum: "aktif", notlar: "" });

  useEffect(() => { fetchSantiyeler(); }, []);

  const fetchSantiyeler = async () => {
    const { data } = await supabase.from("santiyeler").select("*").order("created_at", { ascending: false });
    if (data) setSantiyeler(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) await supabase.from("santiyeler").update(form).eq("id", editing.id);
    else await supabase.from("santiyeler").insert(form);
    setShowForm(false); setEditing(null);
    setForm({ ad: "", adres: "", sorumlu: "", telefon: "", baslangic_tarihi: "", bitis_tarihi: "", durum: "aktif", notlar: "" });
    fetchSantiyeler();
  };

  const handleEdit = (s: any) => {
    setEditing(s);
    setForm({ ad: s.ad, adres: s.adres || "", sorumlu: s.sorumlu || "", telefon: s.telefon || "", baslangic_tarihi: s.baslangic_tarihi || "", bitis_tarihi: s.bitis_tarihi || "", durum: s.durum, notlar: s.notlar || "" });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Silmek istediğinize emin misiniz?")) {
      await supabase.from("santiyeler").delete().eq("id", id);
      fetchSantiyeler();
    }
  };

  const filtered = santiyeler.filter((s) => s.ad.toLowerCase().includes(search.toLowerCase()));

  return (
    <main className="flex-1 p-8 app-bg min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Şantiyeler</h2>
          <p className="text-gray-500 mt-1">Toplam {santiyeler.length} şantiye</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ ad: "", adres: "", sorumlu: "", telefon: "", baslangic_tarihi: "", bitis_tarihi: "", durum: "aktif", notlar: "" }); }} className="btn btn-primary">
          <Plus className="w-4 h-4" /> Yeni Şantiye
        </button>
      </div>

      <div className="card p-4 mb-6">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Şantiye ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pr-12" />
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">{editing ? "Düzenle" : "Yeni Şantiye"}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <input required placeholder="Şantiye Adı" value={form.ad} onChange={(e) => setForm({ ...form, ad: e.target.value })} className="input" />
              <textarea placeholder="Adres" value={form.adres} onChange={(e) => setForm({ ...form, adres: e.target.value })} className="input h-20" />
              <input placeholder="Sorumlu" value={form.sorumlu} onChange={(e) => setForm({ ...form, sorumlu: e.target.value })} className="input" />
              <input placeholder="Telefon" value={form.telefon} onChange={(e) => setForm({ ...form, telefon: e.target.value })} className="input" />
              <div className="grid grid-cols-2 gap-4">
                <input type="date" value={form.baslangic_tarihi} onChange={(e) => setForm({ ...form, baslangic_tarihi: e.target.value })} className="input" />
                <input type="date" value={form.bitis_tarihi} onChange={(e) => setForm({ ...form, bitis_tarihi: e.target.value })} className="input" />
              </div>
              <select value={form.durum} onChange={(e) => setForm({ ...form, durum: e.target.value })} className="input">
                <option value="aktif">Aktif</option>
                <option value="pasif">Pasif</option>
                <option value="tamamlandi">Tamamlandı</option>
              </select>
              <button type="submit" className="w-full btn btn-primary"><Save className="w-4 h-4" /> Kaydet</button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin mr-2"></div>
          Yükleniyor...
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((s) => (
            <div key={s.id} className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-500" />
                  </div>
                  <h3 className="font-semibold text-gray-800">{s.ad}</h3>
                </div>
                <span className={`badge ${s.durum === "aktif" ? "bg-green-100 text-green-700" : s.durum === "pasif" ? "bg-gray-100 text-gray-600" : "bg-blue-100 text-blue-700"}`}>
                  {s.durum}
                </span>
              </div>
              <div className="space-y-2 text-sm text-gray-500">
                {s.adres && <p className="flex items-center gap-2"><MapPin className="w-4 h-4" />{s.adres}</p>}
                {s.sorumlu && <p className="flex items-center gap-2"><User className="w-4 h-4" />{s.sorumlu}</p>}
                {s.telefon && <p className="flex items-center gap-2"><Phone className="w-4 h-4" />{s.telefon}</p>}
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <button onClick={() => handleEdit(s)} className="flex-1 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition">Düzenle</button>
                <button onClick={() => handleDelete(s.id)} className="flex-1 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition">Sil</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}