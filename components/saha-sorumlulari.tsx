"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeForm } from "@/lib/security";
import { UserCog, Plus, Edit, Trash2, Search, X, Save, Users } from "lucide-react";

export default function SahaSorumlulari() {
  const [sorumlular, setSorumlular] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [santiyeler, setSantiyeler] = useState<any[]>([]);
  const [form, setForm] = useState({ ad_soyad: "", telefon: "", email: "", pozisyon: "", santiye_id: "", durum: "aktif", notlar: "" });

  // Ekip state
  const [ekipler, setEkipler] = useState<any[]>([]);
  const [personel, setPersonel] = useState<any[]>([]);
  const [ekipForm, setEkipForm] = useState({ ad: "", sorumlu_personel_id: "" });
  const [ekipEditing, setEkipEditing] = useState<any>(null);
  const [showEkipForm, setShowEkipForm] = useState(false);

  useEffect(() => { fetchSorumlular(); fetchSantiyeler(); fetchEkipler(); fetchPersonel(); }, []);

  const fetchSorumlular = async () => {
    const { data } = await supabase.from("saha_sorumlulari").select("*, santiyeler(ad)").order("ad_soyad", { ascending: true });
    if (data) setSorumlular(data);
    setLoading(false);
  };

  const fetchSantiyeler = async () => {
    const { data } = await supabase.from("santiyeler").select("id, ad");
    if (data) setSantiyeler(data);
  };

  const fetchEkipler = async () => {
    const { data } = await supabase.from("ekipler").select("*, personel!ekipler_sorumlu_personel_id_fkey(ad, soyad)").order("ad");
    if (data) setEkipler(data);
  };

  const fetchPersonel = async () => {
    const { data } = await supabase.from("personel").select("id, ad, soyad").eq("arsivde", false).order("ad");
    if (data) setPersonel(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) await supabase.from("saha_sorumlulari").update(sanitizeForm(form)).eq("id", editing.id);
    else await supabase.from("saha_sorumlulari").insert(sanitizeForm(form));
    setShowForm(false); setEditing(null); setForm({ ad_soyad: "", telefon: "", email: "", pozisyon: "", santiye_id: "", durum: "aktif", notlar: "" });
    fetchSorumlular();
  };

  const handleDelete = async (id: string) => { if (confirm("Sil?")) { await supabase.from("saha_sorumlulari").delete().eq("id", id); fetchSorumlular(); } };

  const handleEkipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ekipForm.ad.trim()) return;
    const payload = sanitizeForm({ ad: ekipForm.ad.trim(), sorumlu_personel_id: ekipForm.sorumlu_personel_id || null });
    if (ekipEditing) await supabase.from("ekipler").update(payload).eq("id", ekipEditing.id);
    else await supabase.from("ekipler").insert(payload);
    setShowEkipForm(false); setEkipEditing(null); setEkipForm({ ad: "", sorumlu_personel_id: "" });
    fetchEkipler();
  };

  const handleEkipDelete = async (id: string) => {
    if (confirm("Bu ekibi silmek istediğinize emin misiniz?")) {
      await supabase.from("personel").update({ ekip_id: null }).eq("ekip_id", id);
      await supabase.from("ekipler").delete().eq("id", id);
      fetchEkipler();
    }
  };

  return (
    <div className="flex-1 p-6 bg-gray-50 min-h-screen space-y-8">
      {/* Saha Sorumluları */}
      <div>
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
      </div>

      {/* Ekip Tanımları */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Users className="w-6 h-6" /> Ekip Tanımları</h2>
          <button onClick={() => { setShowEkipForm(true); setEkipEditing(null); setEkipForm({ ad: "", sorumlu_personel_id: "" }); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
            <Plus className="w-5 h-5" /> Yeni Ekip
          </button>
        </div>

        {showEkipForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">{ekipEditing ? "Ekip Düzenle" : "Yeni Ekip"}</h3>
                <button onClick={() => setShowEkipForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleEkipSubmit} className="space-y-4">
                <input required placeholder="Ekip Adı" value={ekipForm.ad} onChange={(e) => setEkipForm({ ...ekipForm, ad: e.target.value })} className="w-full p-2 border rounded-lg" />
                <select value={ekipForm.sorumlu_personel_id} onChange={(e) => setEkipForm({ ...ekipForm, sorumlu_personel_id: e.target.value })} className="w-full p-2 border rounded-lg">
                  <option value="">Ekip Sorumlusu Seçin</option>
                  {personel.map((p) => <option key={p.id} value={p.id}>{p.ad} {p.soyad}</option>)}
                </select>
                <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg flex items-center justify-center gap-2"><Save className="w-5 h-5" /> Kaydet</button>
              </form>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Ekip Adı</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Ekip Sorumlusu</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Durum</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {ekipler.map((e) => {
                const sorumlu = e.personel;
                return (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{e.ad}</td>
                    <td className="px-4 py-3 text-sm">{sorumlu ? `${sorumlu.ad} ${sorumlu.soyad}` : "-"}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${e.aktif ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>{e.aktif ? "Aktif" : "Pasif"}</span></td>
                    <td className="px-4 py-3 flex justify-center gap-2">
                      <button onClick={() => { setEkipEditing(e); setEkipForm({ ad: e.ad, sorumlu_personel_id: e.sorumlu_personel_id || "" }); setShowEkipForm(true); }} className="p-1 text-green-600 hover:bg-green-50 rounded"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleEkipDelete(e.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                );
              })}
              {ekipler.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">Henüz ekip tanımlanmamış</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
