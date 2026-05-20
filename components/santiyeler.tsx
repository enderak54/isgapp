"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Building2, Plus, Edit, Trash2, Search, X, Save, Loader2 } from "lucide-react";

export default function Santiyeler() {
  const [santiyeler, setSantiyeler] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    ad: "",
    adres: "",
    sorumlu: "",
    telefon: "",
    baslangic_tarihi: "",
    bitis_tarihi: "",
    durum: "aktif",
    notlar: "",
  });

  useEffect(() => {
    fetchSantiyeler();
  }, []);

  const fetchSantiyeler = async () => {
    const { data } = await supabase.from("santiyeler").select("*").order("created_at", { ascending: false });
    if (data) setSantiyeler(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await supabase.from("santiyeler").update(form).eq("id", editing.id);
    } else {
      await supabase.from("santiyeler").insert(form);
    }
    setShowForm(false);
    setEditing(null);
    setForm({ ad: "", adres: "", sorumlu: "", telefon: "", baslangic_tarihi: "", bitis_tarihi: "", durum: "aktif", notlar: "" });
    fetchSantiyeler();
  };

  const handleEdit = (s: any) => {
    setEditing(s);
    setForm({
      ad: s.ad,
      adres: s.adres || "",
      sorumlu: s.sorumlu || "",
      telefon: s.telefon || "",
      baslangic_tarihi: s.baslangic_tarihi || "",
      bitis_tarihi: s.bitis_tarihi || "",
      durum: s.durum,
      notlar: s.notlar || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bu şantiyeyi silmek istediğinize emin misiniz?")) {
      await supabase.from("santiyeler").delete().eq("id", id);
      fetchSantiyeler();
    }
  };

  const filtered = santiyeler.filter((s) => s.ad.toLowerCase().includes(search.toLowerCase()));

  return (
    <main className="flex-1 p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Şantiyeler</h2>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm({ ad: "", adres: "", sorumlu: "", telefon: "", baslangic_tarihi: "", bitis_tarihi: "", durum: "aktif", notlar: "" }); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Yeni Şantiye
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Şantiye ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{editing ? "Şantiye Düzenle" : "Yeni Şantiye"}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input required placeholder="Şantiye Adı" value={form.ad} onChange={(e) => setForm({ ...form, ad: e.target.value })} className="w-full p-2 border rounded-lg" />
              <textarea placeholder="Adres" value={form.adres} onChange={(e) => setForm({ ...form, adres: e.target.value })} className="w-full p-2 border rounded-lg h-20" />
              <input placeholder="Sorumlu" value={form.sorumlu} onChange={(e) => setForm({ ...form, sorumlu: e.target.value })} className="w-full p-2 border rounded-lg" />
              <input placeholder="Telefon" value={form.telefon} onChange={(e) => setForm({ ...form, telefon: e.target.value })} className="w-full p-2 border rounded-lg" />
              <div className="grid grid-cols-2 gap-4">
                <input type="date" value={form.baslangic_tarihi} onChange={(e) => setForm({ ...form, baslangic_tarihi: e.target.value })} className="p-2 border rounded-lg" />
                <input type="date" value={form.bitis_tarihi} onChange={(e) => setForm({ ...form, bitis_tarihi: e.target.value })} className="p-2 border rounded-lg" />
              </div>
              <select value={form.durum} onChange={(e) => setForm({ ...form, durum: e.target.value })} className="w-full p-2 border rounded-lg">
                <option value="aktif">Aktif</option>
                <option value="pasif">Pasif</option>
                <option value="tamamlandi">Tamamlandı</option>
              </select>
              <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700">
                <Save className="w-5 h-5" />
                Kaydet
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">Yükleniyor...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <div key={s.id} className="bg-white rounded-lg shadow-md p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold">{s.ad}</h3>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${s.durum === "aktif" ? "bg-green-100 text-green-700" : s.durum === "pasif" ? "bg-gray-100 text-gray-700" : "bg-blue-100 text-blue-700"}`}>
                  {s.durum}
                </span>
              </div>
              {s.adres && <p className="text-sm text-gray-500 mb-2">{s.adres}</p>}
              {s.sorumlu && <p className="text-sm text-gray-600">Sorumlu: {s.sorumlu}</p>}
              {s.telefon && <p className="text-sm text-gray-600">Tel: {s.telefon}</p>}
              <div className="flex gap-2 mt-3 pt-3 border-t">
                <button onClick={() => handleEdit(s)} className="flex-1 text-green-600 hover:bg-green-50 py-1 rounded text-sm flex items-center justify-center gap-1">
                  <Edit className="w-4 h-4" /> Düzenle
                </button>
                <button onClick={() => handleDelete(s.id)} className="flex-1 text-red-600 hover:bg-red-50 py-1 rounded text-sm flex items-center justify-center gap-1">
                  <Trash2 className="w-4 h-4" /> Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
