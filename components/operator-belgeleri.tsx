"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Shield, Plus, Edit, Trash2, Search, X, Save } from "lucide-react";

export default function OperatorBelgeleri() {
  const [belgeler, setBelgeler] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [personel, setPersonel] = useState<any[]>([]);
  const [form, setForm] = useState({ personel_id: "", belge_adi: "", belge_no: "", alis_tarihi: "", gecerlilik_tarihi: "", durum: "gecerli", notlar: "" });

  useEffect(() => { fetchBelgeler(); fetchPersonel(); }, []);

  const fetchBelgeler = async () => {
    const { data } = await supabase.from("operator_belgeri").select("*, personel(kimlik_no, ad_soyad)").order("gecerlilik_tarihi", { ascending: true });
    if (data) setBelgeler(data);
    setLoading(false);
  };

  const fetchPersonel = async () => {
    const { data } = await supabase.from("personel").select("id, kimlik_no, ad_soyad");
    if (data) setPersonel(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) await supabase.from("operator_belgeri").update(form).eq("id", editing.id);
    else await supabase.from("operator_belgeri").insert(form);
    setShowForm(false); setEditing(null); setForm({ personel_id: "", belge_adi: "", belge_no: "", alis_tarihi: "", gecerlilik_tarihi: "", durum: "gecerli", notlar: "" });
    fetchBelgeler();
  };

  const handleDelete = async (id: string) => { if (confirm("Sil?")) { await supabase.from("operator_belgeri").delete().eq("id", id); fetchBelgeler(); } };

  const isExpired = (tarih: string) => tarih && new Date(tarih) < new Date();

  return (
    <main className="flex-1 p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Operatör Belgeleri</h2>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ personel_id: "", belge_adi: "", belge_no: "", alis_tarihi: "", gecerlilik_tarihi: "", durum: "gecerli", notlar: "" }); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <Plus className="w-5 h-5" /> Yeni Belge
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Belge ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{editing ? "Belge Düzenle" : "Yeni Operatör Belgesi"}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <select required value={form.personel_id} onChange={(e) => setForm({ ...form, personel_id: e.target.value })} className="w-full p-2 border rounded-lg">
                <option value="">Personel Seçin</option>
                {personel.map((p) => <option key={p.id} value={p.id}>{p.ad_soyad} ({p.kimlik_no})</option>)}
              </select>
              <input required placeholder="Belge Adı (Forklift, Vinç, vb.)" value={form.belge_adi} onChange={(e) => setForm({ ...form, belge_adi: e.target.value })} className="w-full p-2 border rounded-lg" />
              <input placeholder="Belge No" value={form.belge_no} onChange={(e) => setForm({ ...form, belge_no: e.target.value })} className="w-full p-2 border rounded-lg" />
              <div className="grid grid-cols-2 gap-4">
                <input type="date" value={form.alis_tarihi} onChange={(e) => setForm({ ...form, alis_tarihi: e.target.value })} className="p-2 border rounded-lg" />
                <input type="date" value={form.gecerlilik_tarihi} onChange={(e) => setForm({ ...form, gecerlilik_tarihi: e.target.value })} className="p-2 border rounded-lg" />
              </div>
              <select value={form.durum} onChange={(e) => setForm({ ...form, durum: e.target.value })} className="w-full p-2 border rounded-lg">
                <option value="gecerli">Geçerli</option>
                <option value="süresi_doldu">Süresi Doldu</option>
                <option value="yenileniyor">Yenileniyor</option>
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
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Personel</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Belge Adı</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Belge No</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Geçerlilik</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Durum</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {belgeler.filter((b) => !search || b.personel?.ad_soyad?.toLowerCase().includes(search.toLowerCase()) || b.belge_adi?.toLowerCase().includes(search.toLowerCase())).map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{b.personel?.ad_soyad || "-"}</td>
                  <td className="px-4 py-3 text-sm">{b.belge_adi}</td>
                  <td className="px-4 py-3 text-sm">{b.belge_no || "-"}</td>
                  <td className={`px-4 py-3 text-sm ${isExpired(b.gecerlilik_tarihi) ? "text-red-600 font-medium" : ""}`}>{b.gecerlilik_tarihi || "-"}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${b.durum === "gecerli" ? "bg-green-100 text-green-700" : b.durum === "süresi_doldu" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{b.durum}</span></td>
                  <td className="px-4 py-3 flex justify-center gap-2">
                    <button onClick={() => { setEditing(b); setForm({ personel_id: b.personel_id, belge_adi: b.belge_adi, belge_no: b.belge_no || "", alis_tarihi: b.alis_tarihi || "", gecerlilik_tarihi: b.gecerlilik_tarihi || "", durum: b.durum, notlar: b.notlar || "" }); setShowForm(true); }} className="p-1 text-green-600 hover:bg-green-50 rounded"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(b.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
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