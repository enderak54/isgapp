"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeForm } from "@/lib/security";
import { logAudit } from "@/lib/audit";
import { X, CheckCircle, Search, Edit, Trash2 } from "lucide-react";

const calismaTuruLabels: Record<string, string> = { tam_uzak: "Tamamen Uzak", hibrit: "Hibrit", ofiste: "Ofiste" };
const masaTuruLabels: Record<string, string> = { normal: "Normal", ayarlanabilir_dikey: "Yukseklik Ayarlanabilir", ayarlanabilir_yatay: "Genislik Ayarlanabilir", ayarlanabilir_iki_yon: "Iki Yon Ayarlanabilir", diger: "Diger" };
const sandalyeTuruLabels: Record<string, string> = { normal: "Normal", ergonomik: "Ergonomik", ayarlanabilir_lordoz: "Lordoz Destekli", ayarlanabilir_kolluk: "Kolluk Ayarlanabilir", diger: "Diger" };

export default function HibritCalismaErgonomi() {
  const [loading, setLoading] = useState(true);
  const [editStatus, setEditStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [personels, setPersonels] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");

  const emptyForm = {
    personel_id: "", degerlendirme_tarihi: "", calisma_turu: "hibrit", ofis_gunu_sayisi: 3,
    masa_turu: "normal", sandalye_turu: "normal", ekran_yuksekligi_uygun: false,
    klavye_fare_duzeni_uygun: false, isik_yeterli: false, ses_seviyesi_uygun: false,
    sicaklik_nem_uygun: false, molalar_egizi_uygun: false, arbe_alkisi_uygun: false,
    yapisal_sorunlar: "", onerilen_onlemler: "", durum: "aktif",
  };
  const [form, setForm] = useState<any>(emptyForm);

  useEffect(() => { fetchItems(); fetchPersonels(); }, []);

  const fetchItems = async () => {
    try {
      const { data } = await supabase.from("hibrit_calisma_ergonomi").select("*, personel:personel_id(ad, soyad)").order("degerlendirme_tarihi", { ascending: false });
      if (data) setItems(data);
    } catch (e: any) {
      setEditStatus({ type: "error", message: "Veriler yuklenirken hata olustu" });
    } finally { setLoading(false); }
  };

  const fetchPersonels = async () => {
    try {
      const { data } = await supabase.from("personel").select("id, ad, soyad").order("ad");
      if (data) setPersonels(data);
    } catch {}
  };

  const filtered = items.filter((i: any) =>
    ((i.personel?.ad || "") + " " + (i.personel?.soyad || "")).toLowerCase().includes(search.toLowerCase()) ||
    (i.calisma_turu || "").toLowerCase().includes(search.toLowerCase())
  );

  const buildPayload = (f: any) => {
    const payload: any = {};
    const cols = [
      "personel_id", "degerlendirme_tarihi", "calisma_turu", "ofis_gunu_sayisi",
      "masa_turu", "sandalye_turu", "ekran_yuksekligi_uygun",
      "klavye_fare_duzeni_uygun", "isik_yeterli", "ses_seviyesi_uygun",
      "sicaklik_nem_uygun", "molalar_egizi_uygun", "arbe_alkisi_uygun",
      "yapisal_sorunlar", "onerilen_onlemler", "durum",
    ];
    cols.forEach((c) => {
      if (f[c] !== undefined) payload[c] = f[c];
    });
    return sanitizeForm(payload);
  };

  const handleSubmit = async () => {
    if (!form.personel_id) return;
    try {
      const payload = buildPayload(form);
      if (editing) {
        const { error: ue } = await supabase.from("hibrit_calisma_ergonomi").update(payload).eq("id", editing.id);
        if (ue) throw ue;
        await logAudit("hibrit_calisma_ergonomi", "UPDATE", editing.id, editing, payload);
      } else {
        const { data, error: ie } = await supabase.from("hibrit_calisma_ergonomi").insert(payload).select();
        if (ie) throw ie;
        if (data) await logAudit("hibrit_calisma_ergonomi", "INSERT", data[0].id, null, payload);
      }
      setShowForm(false); setEditing(null); setEditStatus({ type: "success", message: "Kayit basarili" });
      setForm(emptyForm); fetchItems();
    } catch (e: any) { setEditStatus({ type: "error", message: e.message || "Islem basarisiz" }); }
  };

  const handleEdit = (item: any) => {
    setEditing(item);
    setForm({
      personel_id: item.personel_id, degerlendirme_tarihi: item.degerlendirme_tarihi?.split("T")[0] || "",
      calisma_turu: item.calisma_turu || "hibrit", ofis_gunu_sayisi: item.ofis_gunu_sayisi ?? 3,
      masa_turu: item.masa_turu || "normal", sandalye_turu: item.sandalye_turu || "normal",
      ekran_yuksekligi_uygun: item.ekran_yuksekligi_uygun ?? false,
      klavye_fare_duzeni_uygun: item.klavye_fare_duzeni_uygun ?? false,
      isik_yeterli: item.isik_yeterli ?? false, ses_seviyesi_uygun: item.ses_seviyesi_uygun ?? false,
      sicaklik_nem_uygun: item.sicaklik_nem_uygun ?? false,
      molalar_egizi_uygun: item.molalar_egizi_uygun ?? false,
      arbe_alkisi_uygun: item.arbe_alkisi_uygun ?? false,
      yapisal_sorunlar: item.yapisal_sorunlar || "", onerilen_onlemler: item.onerilen_onlemler || "",
      durum: item.durum || "aktif",
    });
    setShowForm(true); setEditStatus(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Silmek istediginize emin misiniz?")) return;
    try {
      const item = items.find((i: any) => i.id === id);
      const { error: de } = await supabase.from("hibrit_calisma_ergonomi").delete().eq("id", id);
      if (de) throw de;
      if (item) await logAudit("hibrit_calisma_ergonomi", "DELETE", id, item, null);
      setEditStatus({ type: "success", message: "Kayit silindi" }); fetchItems();
    } catch (e: any) { setEditStatus({ type: "error", message: e.message || "Silme basarisiz" }); }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <h1 className="text-2xl font-bold">Hibrit Calisma Ergonomi</h1>
        <button onClick={() => { setShowForm(true); setEditing(null); setEditStatus(null); setForm(emptyForm); }} className="btn btn-primary">Yeni Degerlendirme Ekle</button>
      </div>
      {editStatus && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm border ${editStatus.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          {editStatus.type === "success" ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}{editStatus.message}
        </div>
      )}
      <div className="card p-4 mb-6 relative">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Personel ara..." className="block w-full pr-12 pl-4 py-2 border border-gray-300 rounded-md text-sm" />
        <Search className="absolute top-1/2 right-3 -translate-y-1/2 w-4 h-4 text-gray-500" />
      </div>
      <div className="space-y-4">
        {showForm && (
          <div className="card p-6">
            <h2 className="text-xl font-bold mb-4">{editing ? "Duzenle" : "Yeni Kayit"}</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Personel *</label>
                  <select value={form.personel_id} onChange={(e) => setForm({ ...form, personel_id: e.target.value })} className="block w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md text-sm">
                    <option value="">Secin...</option>
                    {personels.map((p: any) => <option key={p.id} value={p.id}>{p.ad + " " + p.soyad}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tarih</label>
                  <input type="date" value={form.degerlendirme_tarihi} onChange={(e) => setForm({ ...form, degerlendirme_tarihi: e.target.value })} className="block w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Calisma Turu</label>
                  <select value={form.calisma_turu} onChange={(e) => setForm({ ...form, calisma_turu: e.target.value })} className="block w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md text-sm">
                    {Object.entries(calismaTuruLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Ofis Gun Sayisi</label>
                  <input type="number" min="0" max="5" value={form.ofis_gunu_sayisi} onChange={(e) => setForm({ ...form, ofis_gunu_sayisi: Number(e.target.value) || 3 })} className="block w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Masa Turu</label>
                  <select value={form.masa_turu} onChange={(e) => setForm({ ...form, masa_turu: e.target.value })} className="block w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md text-sm">
                    {Object.entries(masaTuruLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Sandalye Turu</label>
                  <select value={form.sandalye_turu} onChange={(e) => setForm({ ...form, sandalye_turu: e.target.value })} className="block w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md text-sm">
                    {Object.entries(sandalyeTuruLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Ergonomik Kontroller</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { key: "ekran_yuksekligi_uygun", label: "Ekran Yuksekligi" },
                    { key: "klavye_fare_duzeni_uygun", label: "Klavye/Fare Duzeni" },
                    { key: "isik_yeterli", label: "Aydinlatma" },
                    { key: "ses_seviyesi_uygun", label: "Ses Seviyesi" },
                    { key: "sicaklik_nem_uygun", label: "Isi/Nem" },
                    { key: "molalar_egizi_uygun", label: "Mola/Egzersiz" },
                    { key: "arbe_alkisi_uygun", label: "Calisma Alani" },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={!!form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} className="rounded border-gray-300" />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Yapisal Sorunlar</label>
                  <textarea value={form.yapisal_sorunlar} onChange={(e) => setForm({ ...form, yapisal_sorunlar: e.target.value })} className="block w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md text-sm" rows={3} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Onlemler</label>
                  <textarea value={form.onerilen_onlemler} onChange={(e) => setForm({ ...form, onerilen_onlemler: e.target.value })} className="block w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md text-sm" rows={3} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Durum</label>
                <select value={form.durum} onChange={(e) => setForm({ ...form, durum: e.target.value })} className="block w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md text-sm">
                  <option value="aktif">Aktif</option>
                  <option value="pasif">Pasif</option>
                  <option value="tamamlandi">Tamamlandi</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); setEditStatus(null); }} className="btn bg-gray-100 text-gray-700 hover:bg-gray-200">Iptal</button>
                <button type="submit" className="btn btn-primary">{editing ? "Guncelle" : "Ekle"}</button>
              </div>
            </form>
          </div>
        )}
        {loading ? <p className="text-center py-8">Yukleniyor...</p> : filtered.length === 0 ? <p className="text-center py-8">Kayit bulunamadi.</p> : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Personel</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Calisma</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ofis Gun</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ekran</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Klavye</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Isik</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ses</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Isi/Nem</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mola</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alani</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Islemler</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{(item.personel?.ad || "") + " " + (item.personel?.soyad || "") || "-"}</td>
                    <td className="px-4 py-3 text-sm">{item.degerlendirme_tarihi ? new Date(item.degerlendirme_tarihi).toLocaleDateString("tr-TR") : "-"}</td>
                    <td className="px-4 py-3 text-sm">{calismaTuruLabels[item.calisma_turu] || item.calisma_turu}</td>
                    <td className="px-4 py-3 text-sm">{item.ofis_gunu_sayisi}</td>
                    <td className="px-4 py-3 text-sm">{item.ekran_yuksekligi_uygun ? "E" : "H"}</td>
                    <td className="px-4 py-3 text-sm">{item.klavye_fare_duzeni_uygun ? "E" : "H"}</td>
                    <td className="px-4 py-3 text-sm">{item.isik_yeterli ? "E" : "H"}</td>
                    <td className="px-4 py-3 text-sm">{item.ses_seviyesi_uygun ? "E" : "H"}</td>
                    <td className="px-4 py-3 text-sm">{item.sicaklik_nem_uygun ? "E" : "H"}</td>
                    <td className="px-4 py-3 text-sm">{item.molalar_egizi_uygun ? "E" : "H"}</td>
                    <td className="px-4 py-3 text-sm">{item.arbe_alkisi_uygun ? "E" : "H"}</td>
                    <td className="px-4 py-3 text-sm">{item.durum}</td>
                    <td className="px-4 py-3 text-sm flex gap-2">
                      <button aria-label="Duzenle" onClick={() => handleEdit(item)} className="p-1 bg-indigo-50 text-indigo-800 rounded hover:bg-indigo-100"><Edit className="h-4 w-4" /></button>
                      <button aria-label="Sil" onClick={() => handleDelete(item.id)} className="p-1 bg-red-50 text-red-800 rounded hover:bg-red-100"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}