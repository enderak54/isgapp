"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeForm } from "@/lib/security";
import { logAudit } from "@/lib/audit";
import { X, CheckCircle, Search, Edit, Trash2 } from "lucide-react";

export default function KVKKConsents() {
  const [loading, setLoading] = useState(true);
  const [editStatus, setEditStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [consents, setConsents] = useState<Array<any>>([]);
  const [personels, setPersonels] = useState<Array<any>>([]);
  const [form, setForm] = useState({
    personel_id: "",
    consent_type: "islenmesi",
    consent_given: false,
    consent_date: "",
    consent_version: "1.0",
    ip_address: "",
    user_agent: "",
    notes: "",
  });
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchConsents();
    fetchPersonels();
  }, []);

  const fetchConsents = async () => {
    try {
      const { data } = await supabase
        .from("kvkk_consents")
        .select(`
          id,
          personel_id,
          consent_type,
          consent_given,
          consent_date,
          consent_version,
          ip_address,
          user_agent,
          notes,
          personel:personel_id (ad, soyad, kimlik_no)
        `)
        .order("consent_date", { ascending: false });
      if (data) setConsents(data);
    } catch (e: any) {
      console.error("KVKK consent yükleme hatası:", e);
      setEditStatus({ type: "error", message: "Veriler yüklenirken hata oluştu" });
    } finally {
      setLoading(false);
    }
  };

  const fetchPersonels = async () => {
    try {
      const { data } = await supabase.from("personel").select("id, ad, soyad, kimlik_no").order("ad");
      if (data) setPersonels(data);
    } catch (e: any) {
      console.error("Personel yükleme hatası:", e);
      setEditStatus({ type: "error", message: "Personel listesi yüklenirken hata oluştu" });
    }
  };

  const filtered = consents.filter((c) => {
    const personel = c.personel ? (c.personel.ad + " " + c.personel.soyad) : "";
    const kimlik = c.personel ? c.personel.kimlik_no : "";
    const type = c.consent_type || "";
    return (
      personel.toLowerCase().includes(search.toLowerCase()) ||
      kimlik.toLowerCase().includes(search.toLowerCase()) ||
      type.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleSubmit = async () => {
    if (!form.personel_id) return;
    try {
      const payload = sanitizeForm({
        ...form,
        consent_date: form.consent_date || null,
      });
      if (editing) {
        const { error: updateError } = await supabase
          .from("kvkk_consents")
          .update(payload)
          .eq("id", editing.id);
        if (updateError) throw updateError;
        await logAudit("kvkk_consents", "UPDATE", editing.id, editing, payload);
      } else {
        const { data, error: insertError } = await supabase
          .from("kvkk_consents")
          .insert(payload)
          .select();
        if (insertError) throw insertError;
        if (data) await logAudit("kvkk_consents", "INSERT", data[0].id, null, payload);
      }
      setShowForm(false);
      setEditing(null);
      setEditStatus({
        type: "success",
        message: editing ? "KVKK onayı güncellendi" : "KVKK onayı eklendi",
      });
      setForm({
        personel_id: "",
        consent_type: "islenmesi",
        consent_given: false,
        consent_date: "",
        consent_version: "1.0",
        ip_address: "",
        user_agent: "",
        notes: "",
      });
      fetchConsents();
    } catch (e: any) {
      setEditStatus({ type: "error", message: e.message || "Kayıt işlemi başarısız" });
    }
  };

  const handleEdit = (item: any) => {
    setEditing(item);
    setForm({
      personel_id: item.personel_id,
      consent_type: item.consent_type || "islenmesi",
      consent_given: item.consent_given ?? false,
      consent_date: item.consent_date?.split("T")[0] || "",
      consent_version: item.consent_version || "1.0",
      ip_address: item.ip_address || "",
      user_agent: item.user_agent || "",
      notes: item.notes || "",
    });
    setShowForm(true);
    setEditStatus(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu KVKK onayını silmek istediğinize emin misiniz?")) return;
    try {
      const item = consents.find((i) => i.id === id);
      const { error: deleteError } = await supabase
        .from("kvkk_consents")
        .delete()
        .eq("id", id);
      if (deleteError) throw deleteError;
      if (item) await logAudit("kvkk_consents", "DELETE", id, item, null);
      setEditStatus({ type: "success", message: "KVKK onayı silindi" });
      fetchConsents();
    } catch (e: any) {
      setEditStatus({ type: "error", message: e.message || "Silme işlemi başarısız" });
    }
  };

  const consentTypeOptions = [
    { label: "Veri İşlenmesi", value: "islenmesi" },
    { label: "Veri Saklanması", value: "saklanmasi" },
    { label: "Veri Paylaşımı", value: "paylasilmasi" },
    { label: "Sağlık Verisi", value: "saglik_verisi" },
  ];

  return (
    <div className="p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <h1 className="text-2xl font-bold">KVKK Onay Yönetimi</h1>
        <div className="flex flex-col lg:flex-row lg:space-x-4 mt-4 lg:mt-0">
          <button
            onClick={() => {
              setShowForm(true);
              setEditing(null);
              setEditStatus(null);
              setForm({
                personel_id: "",
                consent_type: "islenmesi",
                consent_given: false,
                consent_date: "",
                consent_version: "1.0",
                ip_address: "",
                user_agent: "",
                notes: "",
              });
            }}
            className="btn btn-primary"
          >
            Yeni KVKK Onayı Ekle
          </button>
        </div>
      </div>

      {editStatus && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm border ${editStatus.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          {editStatus.type === "success" ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {editStatus.message}
        </div>
      )}

      <div className="card p-4 mb-6">
        <label className="block text-sm font-medium mb-2" htmlFor="search">
          KVKK Onaylarını Ara
        </label>
        <div className="relative">
          <input
            type="text"
            id="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Personel adı, TC kimlik no veya onay türü ara..."
            className="block w-full pr-12 pl-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-indigo-200 focus:border-indigo-300 text-sm"
          />
          <Search className="absolute inset-y-0 right-3 flex items-center text-gray-500" />
        </div>
      </div>

      <div className="space-y-4">
        {showForm && (
          <div className="card p-6">
            <h2 className="text-xl font-bold mb-4">
              {editing ? "KVKK Onayı Düzenle" : "Yeni KVKK Onayı Ekle"}
            </h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" htmlFor="personel_id">
                    Personel *
                  </label>
                  <select
                    id="personel_id"
                    value={form.personel_id}
                    onChange={(e) => setForm({ ...form, personel_id: e.target.value })}
                    className="block w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-indigo-200 focus:border-indigo-300 text-sm"
                  >
                    <option value="">Personel seçin...</option>
                    {personels.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.ad + " " + p.soyad} ({p.kimlik_no})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" htmlFor="consent_type">
                    Onay Türü *
                  </label>
                  <select
                    id="consent_type"
                    value={form.consent_type}
                    onChange={(e) => setForm({ ...form, consent_type: e.target.value })}
                    className="block w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-indigo-200 focus:border-indigo-300 text-sm"
                  >
                    {consentTypeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" htmlFor="consent_given">
                    Onay Verildi mi? *
                  </label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                        id="consent_given"
                        checked={form.consent_given}
                        onChange={(e) => setForm({ ...form, consent_given: e.target.checked })}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    <span className="ml-2 text-sm">Onay verildi</span>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" htmlFor="consent_date">
                    Onay Tarihi
                  </label>
                  <input
                    type="date"
                    id="consent_date"
                    value={form.consent_date}
                    onChange={(e) => setForm({ ...form, consent_date: e.target.value })}
                    className="block w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-indigo-200 focus:border-indigo-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" htmlFor="consent_version">
                    Onay Versiyonu
                  </label>
                  <input
                    type="text"
                    id="consent_version"
                    value={form.consent_version}
                    onChange={(e) => setForm({ ...form, consent_version: e.target.value })}
                    className="block w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-indigo-200 focus:border-indigo-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" htmlFor="ip_address">
                    IP Adresi
                  </label>
                  <input
                    type="text"
                    id="ip_address"
                    value={form.ip_address}
                    onChange={(e) => setForm({ ...form, ip_address: e.target.value })}
                    className="block w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-indigo-200 focus:border-indigo-300 text-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" htmlFor="user_agent">
                    Kullanıcı Ajanı
                  </label>
                  <input
                    type="text"
                    id="user_agent"
                    value={form.user_agent}
                    onChange={(e) => setForm({ ...form, user_agent: e.target.value })}
                    className="block w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-indigo-200 focus:border-indigo-300 text-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" htmlFor="notes">
                    Notlar
                  </label>
                  <textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={3}
                    className="block w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-indigo-200 focus:border-indigo-300 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditing(null);
                    setEditStatus(null);
                  }}
                  className="btn bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  İptal
                </button>
                <button type="submit" className="btn btn-primary">
                  {editing ? "Güncelle" : "Ekle"}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <p className="text-center py-8">Yükleniyor...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center py-8">Henüz KVKK onay kaydı bulunamadı.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Personel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TC Kimlik No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Onay Türü
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Onay Tarihi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Onay Verildi mi?
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((consent) => (
                  <tr key={consent.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {consent.personel ? (consent.personel.ad + " " + consent.personel.soyad) : "Bilinmiyor"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {consent.personel ? consent.personel.kimlik_no : "Bilinmiyor"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {consentTypeOptions.find((opt) => opt.value === consent.consent_type)?.label || consent.consent_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {consent.consent_date ? new Date(consent.consent_date).toLocaleDateString("tr-TR") : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {consent.consent_given ? (
                        <span className="text-green-600">Evet</span>
                      ) : (
                        <span className="text-red-600">Hayır</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-font-medium flex gap-2">
                      <button aria-label="Duzenle"
                        onClick={() => handleEdit(consent)}
                        className="p-1 bg-indigo-50 text-indigo-800 text-xs rounded hover:bg-indigo-100"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button aria-label="Sil"
                        onClick={() => handleDelete(consent.id)}
                        className="p-1 bg-red-50 text-red-800 text-xs rounded hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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