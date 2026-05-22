"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeForm } from "@/lib/security";
import { FolderOpen, Plus, Edit, Trash2, Search, X, Save, File } from "lucide-react";

export default function PersonelDosyasi() {
  const [dosyalar, setDosyalar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [personel, setPersonel] = useState<any[]>([]);
  const [form, setForm] = useState({ personel_id: "", belge_adi: "", belge_turu: "", tarih: "", dosya_url: "", notlar: "" });

  useEffect(() => { fetchDosyalar(); fetchPersonel(); }, []);

  const fetchDosyalar = async () => {
    const { data } = await supabase.from("personel_dosyasi").select("*, personel(kimlik_no, ad, soyad)").order("tarih", { ascending: false });
    if (data) setDosyalar(data);
    setLoading(false);
  };

  const fetchPersonel = async () => {
    const { data } = await supabase.from("personel").select("id, kimlik_no, ad, soyad").eq("arsivde", false);
    if (data) setPersonel(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) await supabase.from("personel_dosyasi").update(sanitizeForm(form)).eq("id", editing.id);
    else await supabase.from("personel_dosyasi").insert(sanitizeForm(form));
    setShowForm(false); setEditing(null); setForm({ personel_id: "", belge_adi: "", belge_turu: "", tarih: "", dosya_url: "", notlar: "" });
    fetchDosyalar();
  };

  const handleDelete = async (id: string) => { if (confirm("Sil?")) { await supabase.from("personel_dosyasi").delete().eq("id", id); fetchDosyalar(); } };

  return (
    <main className="flex-1 p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Personel Dosyası</h2>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ personel_id: "", belge_adi: "", belge_turu: "", tarih: "", dosya_url: "", notlar: "" }); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <Plus className="w-5 h-5" /> Yeni Belge
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Dosya ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-4 pr-10 py-2 border rounded-lg" />
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{editing ? "Belge Düzenle" : "Yeni Belge Ekle"}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <select required value={form.personel_id} onChange={(e) => setForm({ ...form, personel_id: e.target.value })} className="w-full p-2 border rounded-lg">
                <option value="">Personel Seçin</option>
                {personel.map((p) => <option key={p.id} value={p.id}>{p.ad} {p.soyad} ({p.kimlik_no})</option>)}
              </select>
              <input required placeholder="Belge Adı" value={form.belge_adi} onChange={(e) => setForm({ ...form, belge_adi: e.target.value })} className="w-full p-2 border rounded-lg" />
              <select value={form.belge_turu} onChange={(e) => setForm({ ...form, belge_turu: e.target.value })} className="w-full p-2 border rounded-lg">
                <option value="">Belge Türü</option>
                <option value="saglik_raporu">Sağlık Raporu</option>
                <option value="egitim_belgesi">Eğitim Belgesi</option>
                <option value="kimlik">Kimlik Belgesi</option>
                <option value="sss_belgesi">SSK Belgesi</option>
                <option value="is_guvenligi">İş Güvenliği Belgesi</option>
                <option value="diger">Diğer</option>
              </select>
              <input type="date" value={form.tarih} onChange={(e) => setForm({ ...form, tarih: e.target.value })} className="w-full p-2 border rounded-lg" />
              <input placeholder="Dosya URL (opsiyonel)" value={form.dosya_url} onChange={(e) => setForm({ ...form, dosya_url: e.target.value })} className="w-full p-2 border rounded-lg" />
              <textarea placeholder="Notlar" value={form.notlar} onChange={(e) => setForm({ ...form, notlar: e.target.value })} className="w-full p-2 border rounded-lg h-20" />
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
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Tür</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Tarih</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {dosyalar.filter((d) => !search || (d.personel && `${d.personel.ad || ""} ${d.personel.soyad || ""}`.toLowerCase().includes(search.toLowerCase())) || d.belge_adi?.toLowerCase().includes(search.toLowerCase())).map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{d.personel ? `${d.personel.ad || ""} ${d.personel.soyad || ""}`.trim() || "-" : "-"}</td>
                  <td className="px-4 py-3 text-sm flex items-center gap-2"><File className="w-4 h-4 text-gray-400" />{d.belge_adi}</td>
                  <td className="px-4 py-3 text-sm"><span className="px-2 py-1 rounded text-xs bg-gray-100">{d.belge_turu || "-"}</span></td>
                  <td className="px-4 py-3 text-sm">{d.tarih || "-"}</td>
                  <td className="px-4 py-3 flex justify-center gap-2">
                    <button onClick={() => { setEditing(d); setForm({ personel_id: d.personel_id, belge_adi: d.belge_adi, belge_turu: d.belge_turu || "", tarih: d.tarih || "", dosya_url: d.dosya_url || "", notlar: d.notlar || "" }); setShowForm(true); }} className="p-1 text-green-600 hover:bg-green-50 rounded"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(d.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
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