"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeForm } from "@/lib/security";
import { logAudit } from "@/lib/audit";
import { displayDate } from "@/lib/tarih";
import { MessageCircle, Plus, Search, Edit, Trash2, X, Mail, Phone, FileText, Users, Megaphone, CheckCircle } from "lucide-react";

const turOptions = [
  { value: "ic_iletisim", label: "İç İletişim", icon: Users },
  { value: "dis_iletisim", label: "Dış İletişim", icon: Megaphone },
  { value: "danisma", label: "Danışma", icon: MessageCircle },
];

const yontemOptions = [
  { value: "e_posta", label: "E-posta", icon: Mail },
  { value: "toplanti", label: "Toplantı", icon: Users },
  { value: "duyuru", label: "Duyuru", icon: Megaphone },
  { value: "telefon", label: "Telefon", icon: Phone },
  { value: "yazi", label: "Yazılı", icon: FileText },
  { value: "diger", label: "Diğer", icon: MessageCircle },
];

export default function IletisimKaydi() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editStatus, setEditStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [form, setForm] = useState({ tur: "ic_iletisim", konu: "", mesaj_icerik: "", gonderen: "", alici: "", tarih: "", yontem: "e_posta" });

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      const { data } = await supabase.from("iletisim_kaydi").select("*").order("olusturma_tarihi", { ascending: false });
      if (data) setItems(data);
    } catch (e: any) {
      setEditStatus({ type: "error", message: "Veriler yüklenirken hata oluştu" });
    } finally {
      setLoading(false);
    }
  };

  const filtered = items.filter(i =>
    (i.konu || "").toLowerCase().includes(search.toLowerCase()) || (i.mesaj_icerik && i.mesaj_icerik.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSubmit = async () => {
    if (!form.konu) return;
    try {
      const payload = sanitizeForm({ ...form, tarih: form.tarih || null });
      if (editing) {
        const { error: updateError } = await supabase.from("iletisim_kaydi").update(payload).eq("id", editing.id);
        if (updateError) throw updateError;
        await logAudit("iletisim_kaydi", "UPDATE", editing.id, editing, payload);
      } else {
        const { data, error: insertError } = await supabase.from("iletisim_kaydi").insert(payload).select();
        if (insertError) throw insertError;
        if (data) await logAudit("iletisim_kaydi", "INSERT", data[0].id, null, payload);
      }
      setShowForm(false);
      setEditing(null);
      setEditStatus({ type: "success", message: editing ? "Kayıt güncellendi" : "Kayıt eklendi" });
      setForm({ tur: "ic_iletisim", konu: "", mesaj_icerik: "", gonderen: "", alici: "", tarih: "", yontem: "e_posta" });
      fetchItems();
    } catch (e: any) {
      setEditStatus({ type: "error", message: e.message || "Kayıt işlemi başarısız" });
    }
  };

  const handleEdit = (item: any) => {
    setEditing(item);
    setForm({ tur: item.tur, konu: item.konu, mesaj_icerik: item.mesaj_icerik || "", gonderen: item.gonderen || "", alici: item.alici || "", tarih: item.tarih?.split("T")[0] || "", yontem: item.yontem || "e_posta" });
    setShowForm(true);
    setEditStatus(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu kaydı silmek istediğinize emin misiniz?")) return;
    try {
      const item = items.find(i => i.id === id);
      const { error: deleteError } = await supabase.from("iletisim_kaydi").delete().eq("id", id);
      if (deleteError) throw deleteError;
      if (item) await logAudit("iletisim_kaydi", "DELETE", id, item, null);
      setEditStatus({ type: "success", message: "Kayıt silindi" });
      fetchItems();
    } catch (e: any) {
      setEditStatus({ type: "error", message: e.message || "Silme işlemi başarısız" });
    }
  };

  if (loading) return <div className="flex-1 p-8 flex items-center justify-center text-gray-400">Yükleniyor...</div>;

  const stats = { toplam: items.length, ic: items.filter(i => i.tur === "ic_iletisim").length, dis: items.filter(i => i.tur === "dis_iletisim").length, danisma: items.filter(i => i.tur === "danisma").length };

  return (
    <main className="flex-1 p-8 app-bg min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="page-header">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">İletişim Kaydı</h2>
              <p className="text-sm text-gray-500">ISO 45001 Madde 7.4 - İç ve dış iletişim kayıtları</p>
            </div>
          </div>
          <button onClick={() => { setShowForm(true); setEditing(null); setEditStatus(null); setForm({ tur: "ic_iletisim", konu: "", mesaj_icerik: "", gonderen: "", alici: "", tarih: "", yontem: "e_posta" }); }} className="btn btn-primary">
            <Plus className="w-4 h-4" /> Yeni Kayıt
          </button>
        </div>

        {editStatus && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm border ${editStatus.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
            {editStatus.type === "success" ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {editStatus.message}
          </div>
        )}

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card p-4"><p className="text-xs text-gray-500">Toplam</p><p className="text-2xl font-bold text-gray-800">{stats.toplam}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">İç İletişim</p><p className="text-2xl font-bold text-blue-600">{stats.ic}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Dış İletişim</p><p className="text-2xl font-bold text-green-600">{stats.dis}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Danışma</p><p className="text-2xl font-bold text-purple-600">{stats.danisma}</p></div>
        </div>

        <div className="card p-4 mb-6">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="İletişim ara..." value={search} onChange={e => setSearch(e.target.value)} className="input pr-12" />
          </div>
        </div>

        <div className="card overflow-hidden">
          <table>
            <thead>
              <tr>
                <th>Tür</th>
                <th>Konu</th>
                <th>Gönderen</th>
                <th>Alıcı</th>
                <th>Yöntem</th>
                <th>Tarih</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const tur = turOptions.find(t => t.value === item.tur);
                const yontem = yontemOptions.find(y => y.value === item.yontem);
                return (
                  <tr key={item.id}>
                    <td><span className={`badge ${item.tur === "ic_iletisim" ? "bg-blue-100 text-blue-700" : item.tur === "dis_iletisim" ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"}`}>{tur?.label}</span></td>
                    <td className="font-medium max-w-xs truncate">{item.konu}</td>
                    <td className="text-sm">{item.gonderen || "-"}</td>
                    <td className="text-sm">{item.alici || "-"}</td>
                    <td><span className="badge bg-gray-100 text-gray-700">{yontem?.label || item.yontem}</span></td>
                    <td className="text-sm">{displayDate(item.tarih)}</td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(item)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">Henüz iletişim kaydı yok</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? "Kayıt Düzenle" : "Yeni İletişim Kaydı"}</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="modal-body space-y-4">
              <div className="grid-2">
                <div>
                  <label>Tür *</label>
                  <select value={form.tur} onChange={e => setForm({ ...form, tur: e.target.value })}>
                    {turOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label>Yöntem</label>
                  <select value={form.yontem} onChange={e => setForm({ ...form, yontem: e.target.value })}>
                    {yontemOptions.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label>Konu *</label>
                <input type="text" value={form.konu} onChange={e => setForm({ ...form, konu: e.target.value })} placeholder="İletişimin konusu" />
              </div>
              <div>
                <label>İçerik</label>
                <textarea value={form.mesaj_icerik} onChange={e => setForm({ ...form, mesaj_icerik: e.target.value })} rows={3} placeholder="Mesaj içeriği..." />
              </div>
              <div className="grid-2">
                <div>
                  <label>Gönderen</label>
                  <input type="text" value={form.gonderen} onChange={e => setForm({ ...form, gonderen: e.target.value })} placeholder="Ad soyad" />
                </div>
                <div>
                  <label>Alıcı</label>
                  <input type="text" value={form.alici} onChange={e => setForm({ ...form, alici: e.target.value })} placeholder="Ad soyad / kurum" />
                </div>
              </div>
              <div>
                <label>Tarih</label>
                <input type="date" value={form.tarih} onChange={e => setForm({ ...form, tarih: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => setShowForm(false)} className="btn bg-gray-100 text-gray-700 hover:bg-gray-200">İptal</button>
                <button onClick={handleSubmit} className="btn btn-primary">{editing ? "Güncelle" : "Kaydet"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
