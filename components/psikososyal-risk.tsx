"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeForm } from "@/lib/security";
import { logAudit } from "@/lib/audit";
import { Briefcase, Users, Shield, Calendar, X, CheckCircle, Search, Edit, Trash2 } from "lucide-react";

export default function PsikososyalRisk() {
  const [loading, setLoading] = useState(true);
  const [editStatus, setEditStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [items, setItems] = useState<Array<any>>([]);
  const [santiyeler, setSantiyeler] = useState<Array<any>>([]);
  const [form, setForm] = useState({
    santiye_id: "",
    bolum: "",
    risk_faktoru: "",
    aciklama: "",
    olasilik: 1,
    etki: 1,
    onlenen_onlemler: "",
    tavsiye_edilen_onlemler: "",
    sorumlu_kisi: "",
    durum: "aktif",
  });
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchItems();
    fetchSantiyeler();
  }, []);

  const fetchItems = async () => {
    try {
      const { data } = await supabase
        .from("psikososyal_risk_degerlendirme")
        .select(`
          id,
          santiye_id,
          bolum,
          risk_faktoru,
          aciklama,
          olasilik,
          etki,
          risk_skoru,
          risk_seviyesi,
          onlenen_onlemler,
          tavsiye_edilen_onlemler,
          sorumlu_kisi,
          durum
        `)
        .order("olusturma_tarihi", { ascending: false });
      if (data) setItems(data);
    } catch (e: any) {
      console.error("Psikososyal risk yükleme hatası:", e);
      setEditStatus({ type: "error", message: "Veriler yüklenirken hata oluştu" });
    } finally {
      setLoading(false);
    }
  };

  const fetchSantiyeler = async () => {
    try {
      const { data } = await supabase.from("santiyeler").select("id, adi").order("adi");
      if (data) setSantiyeler(data);
    } catch (e: any) {
      console.error("Şantiye yükleme hatası:", e);
      setEditStatus({ type: "error", message: "Şantiye listesi yüklenirken hata oluştu" });
    }
  };

  const filtered = items.filter((i) => {
    const santiye = i.santiye_id ? santiyeler.find((s) => s.id === i.santiye_id)?.adi : "";
    const bolum = i.bolum || "";
    const riskFaktoru = i.risk_faktoru || "";
    return (
      santiye.toLowerCase().includes(search.toLowerCase()) ||
      bolum.toLowerCase().includes(search.toLowerCase()) ||
      riskFaktoru.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleSubmit = async () => {
    if (!form.santiye_id || !form.bolum || !form.risk_faktoru) return;
    try {
      const payload = sanitizeForm({
        ...form,
        olasilik: Number(form.olasilik),
        etki: Number(form.etki),
      });
      if (editing) {
        const { error: updateError } = await supabase
          .from("psikososyal_risk_degerlendirme")
          .update(payload)
          .eq("id", editing.id);
        if (updateError) throw updateError;
        await logAudit("psikososyal_risk_degerlendirme", "UPDATE", editing.id, editing, payload);
      } else {
        const { data, error: insertError } = await supabase
          .from("psikososyal_risk_degerlendirme")
          .insert(payload)
          .select();
        if (insertError) throw insertError;
        if (data) await logAudit("psikososyal_risk_degerlendirme", "INSERT", data[0].id, null, payload);
      }
      setShowForm(false);
      setEditing(null);
      setEditStatus({
        type: "success",
        message: editing ? "Psikososyal risk kaydı güncellendi" : "Psikososyal risk kaydı eklendi",
      });
      setForm({
        santiye_id: "",
        bolum: "",
        risk_faktoru: "",
        aciklama: "",
        olasilik: 1,
        etki: 1,
        onlenen_onlemler: "",
        tavsiye_edilen_onlemler: "",
        sorumlu_kisi: "",
        durum: "aktif",
      });
      fetchItems();
    } catch (e: any) {
      setEditStatus({ type: "error", message: e.message || "Kayıt işlemi başarısız" });
    }
  };

  const handleEdit = (item: any) => {
    setEditing(item);
    setForm({
      santiye_id: item.santiye_id,
      bolum: item.bolum || "",
      risk_faktoru: item.risk_faktoru || "",
      aciklama: item.aciklama || "",
      olasilik: item.olasilik ?? 1,
      etki: item.etki ?? 1,
      onlenen_onlemler: item.onlenen_onlemler || "",
      tavsiye_edilen_onlemler: item.tavsiye_edilen_onlemler || "",
      sorumlu_kisi: item.sorumlu_kisi || "",
      durum: item.durum || "aktif",
    });
    setShowForm(true);
    setEditStatus(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu psikososyal risk kaydını silmek istediğinize emin misiniz?")) return;
    try {
      const item = items.find((i) => i.id === id);
      const { error: deleteError } = await supabase
        .from("psikososyal_risk_degerlendirme")
        .delete()
        .eq("id", id);
      if (deleteError) throw deleteError;
      if (item) await logAudit("psikososyal_risk_degerlendirme", "DELETE", id, item, null);
      setEditStatus({ type: "success", message: "Psikososyal risk kaydı silindi" });
      fetchItems();
    } catch (e: any) {
      setEditStatus({ type: "error", message: e.message || "Silme işlemi başarısız" });
    }
  };

  const riskFaktorOptions = [
    "Aşırı İş Yükü",
    "Denetimsiz İş Akışı",
    "ROL Çatışması",
    "Kariyer Gelişimi Olanakları",
    "İlisâkli İlişkiler",
    "Örgütsel Adalet",
    "Örgütsel Değişim Yönetimi",
    "İş-Güneş Dengesi",
    "Psikolojik Güvenlik",
    "Mobbing ve Zorbalık",
    "İşten Tekdüze ve Monoton İçerik",
    "Duygusal İş Ekleri",
    "İş Güvendsizliği",
    "Örgütsel Kültürel Değerler",
    "Liderlik Kalitesi",
    "İş Uyumu",
    "İşe Giriş ve Eğitim Yetersizliği",
    "İş Stresi ve Tükenmişlik",
    "Diğer"
  ];

  return (
    <div className="p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <h1 className="text-2xl font-bold">Psikososyal Risk Değerlendirme</h1>
        <div className="flex flex-col lg:flex-row lg:space-x-4 mt-4 lg:mt-0">
          <button
            onClick={() => {
              setShowForm(true);
              setEditing(null);
              setEditStatus(null);
              setForm({
                santiye_id: "",
                bolum: "",
                risk_faktoru: "",
                aciklama: "",
                olasilik: 1,
                etki: 1,
                onlenen_onlemler: "",
                tavsiye_edilen_onlemler: "",
                sorumlu_kisi: "",
                durum: "aktif",
              });
            }}
            className="btn btn-primary"
          >
            Yeni Psikososyal Risk Ekle
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
          Psikososyal Risk Kayıtlarını Ara
        </label>
        <div className="relative">
          <input
            type="text"
            id="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Şantiye adı, bölüm, risk faktörü ara..."
            className="block w-full pr-12 pl-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-indigo-200 focus:border-indigo-300 text-sm"
          />
          <Search className="absolute inset-y-0 right-3 flex items-center text-gray-500" />
        </div>
      </div>

      <div className="space-y-4">
        {showForm && (
          <div className="card p-6">
            <h2 className="text-xl font-bold mb-4">
              {editing ? "Psikososyal Risk Kaydını Düzenle" : "Yeni Psikososyal Risk Kaydı Ekle"}
            </h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" htmlFor="santiye_id">
                    Şantiye *
                  </label>
                  <select
                    id="santiye_id"
                    value={form.santiye_id}
                    onChange={(e) => setForm({ ...form, santiye_id: e.target.value })}
                    className="block w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-indigo-200 focus:border-indigo-300 text-sm"
                  >
                    <option value="">Şantiye seçin...</option>
                    {santiyeler.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.adi}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" htmlFor="bolum">
                    Bölüm *
                  </label>
                  <input
                    type="text"
                    id="bolum"
                    value={form.bolum}
                    onChange={(e) => setForm({ ...form, bolum: e.target.value })}
                    className="block w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-indigo-200 focus:border-indigo-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" htmlFor="risk_faktoru">
                    Psikososyal Risk Faktörü *
                  </label>
                  <select
                    id="risk_faktoru"
                    value={form.risk_faktoru}
                    onChange={(e) => setForm({ ...form, risk_faktoru: e.target.value })}
                    className="block w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-indigo-200 focus:border-indigo-300 text-sm"
                  >
                    <option value="">Risk faktörü seçin...</option>
                    {riskFaktorOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" htmlFor="aciklama">
                    Açıklama
                  </label>
                  <textarea
                    id="aciklama"
                    value={form.aciklama}
                    onChange={(e) => setForm({ ...form, aciklama: e.target.value })}
                    rows={3}
                    className="block w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-indigo-200 focus:border-indigo-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" htmlFor="olasilik">
                    Olasılık (1-5)
                  </label>
                  <input
                    type="number"
                    id="olasilik"
                    min="1"
                    max="5"
                    value={form.olasilik}
                    onChange={(e) => setForm({ ...form, olasilik: Number(e.target.value) || 1 })}
                    className="block w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-indigo-200 focus:border-indigo-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" htmlFor="etki">
                    Etki (1-5)
                  </label>
                  <input
                    type="number"
                    id="etki"
                    min="1"
                    max="5"
                    value={form.etki}
                    onChange={(e) => setForm({ ...form, etki: Number(e.target.value) || 1 })}
                    className="block w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-indigo-200 focus:border-indigo-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" htmlFor="onlenen_onlemler">
                    Alınan Önlemler
                  </label>
                  <textarea
                    id="onlenen_onlemler"
                    value={form.onlenen_onlemler}
                    onChange={(e) => setForm({ ...form, onlenen_onlemler: e.target.value })}
                    rows={2}
                    className="block w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-indigo-200 focus:border-indigo-300 text-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" htmlFor="tavsiye_edilen_onlemler">
                    Tavsiye Edilen Önlemler
                  </label>
                  <textarea
                    id="tavsiye_edilen_onlemler"
                    value={form.tavsiye_edilen_onlemler}
                    onChange={(e) => setForm({ ...form, tavsiye_edilen_onlemler: e.target.value })}
                    rows={2}
                    className="block w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-indigo-200 focus:border-indigo-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" htmlFor="sorumlu_kisi">
                    Sorumlu Kişi
                  </label>
                  <input
                    type="text"
                    id="sorumlu_kisi"
                    value={form.sorumlu_kisi}
                    onChange={(e) => setForm({ ...form, sorumlu_kisi: e.target.value })}
                    className="block w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-indigo-200 focus:border-indigo-300 text-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" htmlFor="durum">
                    Durum
                  </label>
                  <select
                    id="durum"
                    value={form.durum}
                    onChange={(e) => setForm({ ...form, durum: e.target.value })}
                    className="block w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-indigo-200 focus:border-indigo-300 text-sm"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="pasif">Pasif</option>
                    <option value="giderildi">Giderildi</option>
                  </select>
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
          <p className="text-center py-8">Henüz psikososyal risk kaydı bulunamadı.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Şantiye
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bölüm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Faktörü
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Olasılık
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Etki
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Skoru
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Seviyesi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.santiye_id ? santiyeler.find((s) => s.id === item.santiye_id)?.adi : "Bilinmiyor"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.bolum || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.risk_faktoru || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.olasilik}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.etki}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.risk_skoru}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.risk_seviyesi || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.durum === "aktif" ? (
                        <span className="text-green-600">Aktif</span>
                      ) : item.durum === "pasif" ? (
                        <span className="text-yellow-600">Pasif</span>
                      ) : (
                        <span className="text-red-600">Giderildi</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-font-medium flex gap-2">
                      <button aria-label="Duzenle"
                        onClick={() => handleEdit(item)}
                        className="p-1 bg-indigo-50 text-indigo-800 text-xs rounded hover:bg-indigo-100"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button aria-label="Sil"
                        onClick={() => handleDelete(item.id)}
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