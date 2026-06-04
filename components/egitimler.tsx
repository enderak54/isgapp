"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeForm } from "@/lib/security";
import { logAudit } from "@/lib/audit";
import { displayDate } from "@/lib/tarih";
import { GraduationCap, Plus, Edit, Trash2, Search, X, Save, Calendar, BookOpen, UserCheck, Settings, ChevronDown, ChevronUp, UserPlus, Lock, Unlock } from "lucide-react";

const emptyForm = {
  tanim_id: "", egitim_adi_manuel: "", egitmen_id: "", egitmen_manuel: "",
  yer_id: "", yer: "",
  tarih: "", sure_saat: "", sure_dakika: "", sure: "", notlar: "", katilimcilar: [] as string[], katilimci_manuel: "",
};

const sureBirlestir = (saat: string, dakika: string) => {
  const s = parseInt(saat) || 0;
  const d = parseInt(dakika) || 0;
  if (!s && !d) return "";
  const parts: string[] = [];
  if (s) parts.push(`${s} saat`);
  if (d) parts.push(`${d} dakika`);
  return parts.join(" ");
};

const sureAyristir = (sure: string) => {
  let sure_saat = "", sure_dakika = "";
  if (!sure) return { sure_saat, sure_dakika };
  const s = sure.match(/(\d+)\s*saat/);
  const d = sure.match(/(\d+)\s*dakika/);
  if (s) sure_saat = s[1];
  if (d) sure_dakika = d[1];
  return { sure_saat, sure_dakika };
};

export default function Egitimler() {
  const [kayitlar, setKayitlar] = useState<any[]>([]);
  const [tanimlar, setTanimlar] = useState<any[]>([]);
  const [egitmenler, setEgitmenler] = useState<any[]>([]);
  const [yerTanimlari, setYerTanimlari] = useState<any[]>([]);
  const [personel, setPersonel] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [personelFiltre, setPersonelFiltre] = useState("");
  const [filtrePersonelId, setFiltrePersonelId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showTanitim, setShowTanitim] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [editStatus, setEditStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [katilimcilarDetay, setKatilimcilarDetay] = useState<Record<string, any[]>>({});

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (!filtrePersonelId) return;
    const missingIds = kayitlar.filter(k => !katilimcilarDetay[k.id]).map(k => k.id);
    if (missingIds.length === 0) return;
    (async () => {
      const { data } = await supabase
        .from("egitim_katilimcilar")
        .select("id, egitim_kaydi_id, personel_id, katilimci_manuel, personel:personel_id(id, ad, soyad)")
        .in("egitim_kaydi_id", missingIds);
      if (data) {
        const grouped: Record<string, any[]> = {};
        data.forEach(d => {
          if (!grouped[d.egitim_kaydi_id]) grouped[d.egitim_kaydi_id] = [];
          grouped[d.egitim_kaydi_id].push(d);
        });
        setKatilimcilarDetay(prev => ({ ...prev, ...grouped }));
      }
    })();
  }, [filtrePersonelId, kayitlar, katilimcilarDetay]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [kayitRes, tanimRes, egitmenRes, yerRes, personelRes] = await Promise.all([
        supabase.from("egitim_kayitlari").select("*").order("tarih", { ascending: false }),
        supabase.from("egitim_tanimlari").select("*").order("ad"),
        supabase.from("egitmen_tanimlari").select("*").order("ad"),
        supabase.from("egitim_yer_tanimlari").select("*").order("ad"),
        supabase.from("personel").select("id, ad, soyad, kimlik_no").eq("arsivde", false).order("ad"),
      ]);
      if (kayitRes.data) setKayitlar(kayitRes.data);
      if (tanimRes.data) setTanimlar(tanimRes.data);
      if (egitmenRes.data) setEgitmenler(egitmenRes.data);
      if (yerRes.data) setYerTanimlari(yerRes.data);
      if (personelRes.data) setPersonel(personelRes.data);
    } catch (e: any) {
      setEditStatus({ type: "error", message: "Veriler yüklenirken hata" });
    }
    setLoading(false);
  };

  const fetchKatilimcilar = useCallback(async (egitimKaydiId: string) => {
    const { data } = await supabase
      .from("egitim_katilimcilar")
      .select("id, personel_id, katilimci_manuel, personel:personel_id(id, ad, soyad)")
      .eq("egitim_kaydi_id", egitimKaydiId);
    if (data) setKatilimcilarDetay(prev => ({ ...prev, [egitimKaydiId]: data }));
  }, []);

  const toggleExpand = (id: string) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (!katilimcilarDetay[id]) fetchKatilimcilar(id);
  };

  const getEgitimAdi = (k: any) => {
    if (k.tanim_id) {
      const t = tanimlar.find(t => t.id === k.tanim_id);
      if (t) return t.ad;
    }
    return k.egitim_adi_manuel || "(isimsiz)";
  };

  const getEgitmenAdi = (k: any) => {
    if (k.egitmen_id) {
      const e = egitmenler.find(e => e.id === k.egitmen_id);
      if (e) return e.ad;
    }
    return k.egitmen_manuel || "-";
  };

  const filteredKayitlar = kayitlar.filter(k => {
    const ad = getEgitimAdi(k).toLowerCase();
    const matchesSearch = !search || ad.includes(search.toLowerCase()) || (k.yer || "").toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filtrePersonelId) {
      const detay = katilimcilarDetay[k.id];
      if (detay) return detay.some(kat => kat.personel_id === filtrePersonelId);
      return true;
    }
    return true;
  });

  const filtrelenmisPersonel = personel.filter(p => {
    if (!personelFiltre) return true;
    const q = personelFiltre.toLowerCase();
    return `${p.ad} ${p.soyad} ${p.kimlik_no || ""}`.toLowerCase().includes(q);
  });

  const handleSubmit = async () => {
    if (!form.tanim_id && !form.egitim_adi_manuel) { setEditStatus({ type: "error", message: "Eğitim adı gerekli" }); return; }
    try {
      const payload = sanitizeForm({
        tanim_id: form.tanim_id || null,
        egitim_adi_manuel: form.tanim_id ? null : (form.egitim_adi_manuel || null),
        egitmen_id: form.egitmen_id || null,
        egitmen_manuel: form.egitmen_id ? null : (form.egitmen_manuel || null),
        yer_id: form.yer_id || null,
        yer: form.yer_id ? null : (form.yer || null),
        tarih: form.tarih || null,
        sure: sureBirlestir(form.sure_saat, form.sure_dakika) || null,
        notlar: form.notlar || null,
      });

      let kayitId: string;
      if (editing) {
        const { error } = await supabase.from("egitim_kayitlari").update(payload).eq("id", editing.id);
        if (error) throw error;
        await logAudit("egitim_kayitlari", "UPDATE", editing.id, editing, payload);
        await supabase.from("egitim_katilimcilar").delete().eq("egitim_kaydi_id", editing.id);
        kayitId = editing.id;
      } else {
        const { data, error } = await supabase.from("egitim_kayitlari").insert(payload).select();
        if (error) throw error;
        if (!data?.[0]) throw new Error("Kayıt oluşturulamadı");
        await logAudit("egitim_kayitlari", "INSERT", data[0].id, null, payload);
        kayitId = data[0].id;
      }

      for (const pid of form.katilimcilar) {
        await supabase.from("egitim_katilimcilar").insert({
          egitim_kaydi_id: kayitId, personel_id: pid, katilimci_manuel: null,
        });
      }
      if (form.katilimci_manuel) {
        const manuelIsimler = form.katilimci_manuel.split(",").map(s => s.trim()).filter(Boolean);
        for (const isim of manuelIsimler) {
          await supabase.from("egitim_katilimcilar").insert({
            egitim_kaydi_id: kayitId, personel_id: null, katilimci_manuel: isim,
          });
        }
      }

      setShowForm(false); setEditing(null); setForm(emptyForm);
      setEditStatus({ type: "success", message: editing ? "Eğitim güncellendi" : "Eğitim eklendi" });
      fetchAll();
    } catch (e: any) {
      setEditStatus({ type: "error", message: e.message || "Kayıt başarısız" });
    }
  };

  const handleEdit = async (k: any) => {
    setEditing(k);
    const { data: katData } = await supabase
      .from("egitim_katilimcilar")
      .select("id, personel_id, katilimci_manuel, personel:personel_id(id, ad, soyad)")
      .eq("egitim_kaydi_id", k.id);
    if (katData) setKatilimcilarDetay(prev => ({ ...prev, [k.id]: katData }));
    const kat = katData || [];
    const { sure_saat, sure_dakika } = sureAyristir(k.sure || "");
    setForm({
      tanim_id: k.tanim_id || "", egitim_adi_manuel: k.egitim_adi_manuel || "",
      egitmen_id: k.egitmen_id || "", egitmen_manuel: k.egitmen_manuel || "",
      yer_id: k.yer_id || "", yer: k.yer || "",
      tarih: k.tarih || "", sure_saat, sure_dakika, sure: "", notlar: k.notlar || "",
      katilimcilar: kat.filter((c: any) => c.personel_id).map((c: any) => c.personel_id),
      katilimci_manuel: kat.filter((c: any) => c.katilimci_manuel).map((c: any) => c.katilimci_manuel).join(", "),
    });
    setShowForm(true);
    setEditStatus(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu eğitimi silmek istediğinize emin misiniz?")) return;
    try {
      const item = kayitlar.find(k => k.id === id);
      await supabase.from("egitim_katilimcilar").delete().eq("egitim_kaydi_id", id);
      await supabase.from("egitim_kayitlari").delete().eq("id", id);
      if (item) await logAudit("egitim_kayitlari", "DELETE", id, item, null);
      setEditStatus({ type: "success", message: "Eğitim silindi" });
      fetchAll();
    } catch (e: any) {
      setEditStatus({ type: "error", message: e.message || "Silme başarısız" });
    }
  };

  const katilimciToggle = (pid: string) => {
    setForm(prev => ({
      ...prev,
      katilimcilar: prev.katilimcilar.includes(pid)
        ? prev.katilimcilar.filter(id => id !== pid)
        : [...prev.katilimcilar, pid],
    }));
  };

  if (loading) return <div className="flex-1 min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Yükleniyor...</div>;

  return (
    <div className="flex-1 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Eğitimler</h2>
              <p className="text-xs text-gray-500">Eğitim kayıtları ve katılımcı yönetimi</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setShowTanitim(true); }} className="btn bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <Settings className="w-4 h-4" /> Tanımlar
            </button>
            <button onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm); setEditStatus(null); }} className="btn btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Yeni Eğitim
            </button>
          </div>
        </div>

        {editStatus && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm border ${
            editStatus.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
          }`}>
            {editStatus.type === "success" ? <Save className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {editStatus.message}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card p-4"><p className="text-xs text-gray-500">Toplam Eğitim</p><p className="text-2xl font-bold text-gray-800">{kayitlar.length}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Tanımlı Eğitim</p><p className="text-2xl font-bold text-purple-600">{tanimlar.length}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Tanımlı Eğitmen</p><p className="text-2xl font-bold text-blue-600">{egitmenler.length}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Kayıtlı Personel</p><p className="text-2xl font-bold text-green-600">{personel.length}</p></div>
        </div>

        {/* Search + Personel Filter */}
        <div className="card p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Eğitim adı veya yer ara..." value={search} onChange={e => setSearch(e.target.value)} className="input pr-12" />
            </div>
            <div className="relative sm:w-64">
              <UserCheck className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Personele göre filtrele..." value={personelFiltre} onChange={e => { setPersonelFiltre(e.target.value); setFiltrePersonelId(""); }} className="input pr-12" />
            </div>
          </div>
          {personelFiltre && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {filtrelenmisPersonel.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setFiltrePersonelId(p.id); setPersonelFiltre(""); }}
                  className={`px-3 py-1 rounded-full text-xs border transition ${
                    filtrePersonelId === p.id ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-700 border-gray-200 hover:border-purple-300"
                  }`}
                >
                  {p.ad} {p.soyad}
                </button>
              ))}
              {filtrelenmisPersonel.length === 0 && <p className="text-xs text-gray-400 py-1">Personel bulunamadı</p>}
            </div>
          )}
          {filtrePersonelId && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full flex items-center gap-1">
                {personel.find(p => p.id === filtrePersonelId)?.ad} {personel.find(p => p.id === filtrePersonelId)?.soyad}
                <button onClick={() => { setFiltrePersonelId(""); setPersonelFiltre(""); }}><X className="w-3 h-3" /></button>
              </span>
              <span className="text-xs text-gray-400">
                {kayitlar.filter(k => katilimcilarDetay[k.id]?.some(kat => kat.personel_id === filtrePersonelId)).length} eğitim
              </span>
            </div>
          )}
        </div>

        {/* Training List */}
        <div className="space-y-3">
          {filteredKayitlar.map(k => (
            <div key={k.id} className="card overflow-hidden">
              <div className="p-4 flex flex-wrap items-start justify-between gap-3 cursor-pointer" onClick={() => toggleExpand(k.id)}>
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <BookOpen className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-800">{getEgitimAdi(k)}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{displayDate(k.tarih)}</span>
                      {k.sure && <span>Süre: {k.sure}</span>}
                      <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" />{getEgitmenAdi(k)}</span>
                      {k.yer && <span>Yer: {k.yer}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                  <button onClick={() => handleEdit(k)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(k.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                  {expandedId === k.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </div>
              {expandedId === k.id && (
                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50">
                  {katilimcilarDetay[k.id] ? (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">Katılımcılar ({katilimcilarDetay[k.id].length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {katilimcilarDetay[k.id].map(kat => (
                          <span key={kat.id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white rounded-full text-xs border border-gray-200">
                            <UserPlus className="w-3 h-3 text-gray-400" />
                            {kat.personel ? `${kat.personel.ad} ${kat.personel.soyad}` : kat.katilimci_manuel}
                          </span>
                        ))}
                        {katilimcilarDetay[k.id].length === 0 && <p className="text-xs text-gray-400">Katılımcı yok</p>}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">Yükleniyor...</p>
                  )}
                  {k.notlar && <p className="text-xs text-gray-500 mt-3 border-t border-gray-200 pt-3">{k.notlar}</p>}
                </div>
              )}
            </div>
          ))}
          {filteredKayitlar.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              {filtrePersonelId ? "Bu personelin katıldığı eğitim bulunamadı" : "Henüz eğitim kaydı yok"}
            </div>
          )}
        </div>
      </div>

      {/* Training Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? "Eğitim Düzenle" : "Yeni Eğitim"}</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="modal-body space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Eğitim Adı *</label>
                <select value={form.tanim_id} onChange={e => setForm({ ...form, tanim_id: e.target.value, egitim_adi_manuel: e.target.value ? "" : form.egitim_adi_manuel })} className="w-full p-2 border rounded-lg mb-2">
                  <option value="">-- Tanımlı eğitim seç --</option>
                  {tanimlar.map(t => <option key={t.id} value={t.id}>{t.ad}</option>)}
                </select>
                <input type="text" placeholder="veya manuel yazın" value={form.egitim_adi_manuel} onChange={e => setForm({ ...form, egitim_adi_manuel: e.target.value, tanim_id: e.target.value ? "" : form.tanim_id })} disabled={!!form.tanim_id} className="w-full p-2 border rounded-lg" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Eğitmen</label>
                  <select value={form.egitmen_id} onChange={e => setForm({ ...form, egitmen_id: e.target.value, egitmen_manuel: e.target.value ? "" : form.egitmen_manuel })} className="w-full p-2 border rounded-lg mb-2">
                    <option value="">-- Seç --</option>
                    {egitmenler.map(e => <option key={e.id} value={e.id}>{e.ad}</option>)}
                  </select>
                  <input type="text" placeholder="veya manuel yazın" value={form.egitmen_manuel} onChange={e => setForm({ ...form, egitmen_manuel: e.target.value, egitmen_id: e.target.value ? "" : form.egitmen_id })} disabled={!!form.egitmen_id} className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yer</label>
                  <select value={form.yer_id} onChange={e => setForm({ ...form, yer_id: e.target.value, yer: e.target.value ? "" : form.yer })} className="w-full p-2 border rounded-lg mb-2">
                    <option value="">-- Seç --</option>
                    {yerTanimlari.map(t => <option key={t.id} value={t.id}>{t.ad}</option>)}
                  </select>
                  <input type="text" placeholder="veya manuel yazın" value={form.yer} onChange={e => setForm({ ...form, yer: e.target.value, yer_id: e.target.value ? "" : form.yer_id })} disabled={!!form.yer_id} className="w-full p-2 border rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                  <input type="date" value={form.tarih} onChange={e => setForm({ ...form, tarih: e.target.value })} className="w-full p-2 border rounded-lg" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Süre</label>
                  <div className="flex gap-2">
                    <input type="number" min="0" placeholder="Saat" value={form.sure_saat} onChange={e => setForm({ ...form, sure_saat: e.target.value })} className="w-full p-2 border rounded-lg" />
                    <input type="number" min="0" max="59" placeholder="Dakika" value={form.sure_dakika} onChange={e => setForm({ ...form, sure_dakika: e.target.value })} className="w-full p-2 border rounded-lg" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Katılımcılar (Personel Listesi)</label>
                <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
                  {personel.map(p => (
                    <label key={p.id} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer text-sm">
                      <input type="checkbox" checked={form.katilimcilar.includes(p.id)} onChange={() => katilimciToggle(p.id)} className="accent-purple-600" />
                      {p.ad} {p.soyad}
                    </label>
                  ))}
                  {personel.length === 0 && <p className="text-xs text-gray-400">Personel bulunamadı</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manuel Katılımcı Ekle</label>
                <input type="text" placeholder="Ad Soyad (virgülle ayırın)" value={form.katilimci_manuel} onChange={e => setForm({ ...form, katilimci_manuel: e.target.value })} className="w-full p-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                <textarea rows={2} placeholder="Ek notlar..." value={form.notlar} onChange={e => setForm({ ...form, notlar: e.target.value })} className="w-full p-2 border rounded-lg" />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button onClick={() => setShowForm(false)} className="btn bg-gray-100 text-gray-700 hover:bg-gray-200">İptal</button>
                <button onClick={handleSubmit} className="btn btn-primary">{editing ? "Güncelle" : "Kaydet"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Definitions Modal */}
      {showTanitim && (
        <div className="modal-overlay" onClick={() => setShowTanitim(false)}>
          <div className="modal-content max-w-xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tanımlar</h3>
              <button onClick={() => setShowTanitim(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="modal-body space-y-6">
              {/* Eğitim Tanımları */}
              <EgitanimBolumu
                baslik="Eğitim Tanımları"
                items={tanimlar}
                onEkle={async (ad) => {
                  const { data } = await supabase.from("egitim_tanimlari").insert({ ad }).select();
                  if (data) { setTanimlar(prev => [...prev, data[0]]); }
                }}
                onSil={async (id) => {
                  await supabase.from("egitim_tanimlari").delete().eq("id", id);
                  setTanimlar(prev => prev.filter(t => t.id !== id));
                }}
              />
              {/* Eğitmen Tanımları */}
              <EgitanimBolumu
                baslik="Eğitmen Tanımları"
                items={egitmenler}
                onEkle={async (ad) => {
                  const { data } = await supabase.from("egitmen_tanimlari").insert({ ad }).select();
                  if (data) { setEgitmenler(prev => [...prev, data[0]]); }
                }}
                onSil={async (id) => {
                  await supabase.from("egitmen_tanimlari").delete().eq("id", id);
                  setEgitmenler(prev => prev.filter(e => e.id !== id));
                }}
              />
              <EgitanimBolumu
                baslik="Yer Tanımları"
                items={yerTanimlari}
                onEkle={async (ad) => {
                  const { data } = await supabase.from("egitim_yer_tanimlari").insert({ ad }).select();
                  if (data) { setYerTanimlari(prev => [...prev, data[0]]); }
                }}
                onSil={async (id) => {
                  await supabase.from("egitim_yer_tanimlari").delete().eq("id", id);
                  setYerTanimlari(prev => prev.filter(t => t.id !== id));
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EgitanimBolumu({ baslik, items, onEkle, onSil }: {
  baslik: string; items: any[]; onEkle: (ad: string) => Promise<void>; onSil: (id: string) => Promise<void>;
}) {
  const [kilitli, setKilitli] = useState(true);
  const [yeni, setYeni] = useState("");
  const [ekleme, setEkleme] = useState(false);
  const handleEkle = async () => {
    if (!yeni.trim()) return;
    setEkleme(true);
    try { await onEkle(yeni.trim()); setYeni(""); } catch {}
    setEkleme(false);
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-800">{baslik} ({items.length})</h4>
        <button onClick={() => setKilitli(!kilitli)} className={`p-1 rounded transition ${kilitli ? "text-gray-300 hover:text-gray-500" : "text-red-400 hover:text-red-600"}`}>
          {kilitli ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
        </button>
      </div>
      <div className="space-y-1.5 max-h-48 overflow-y-auto mb-3">
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between py-1.5 px-3 bg-gray-50 rounded-lg text-sm">
            <span>{item.ad}</span>
            {!kilitli && (
              <button onClick={() => onSil(item.id)} className="text-red-400 hover:text-red-600 p-0.5"><Trash2 className="w-3.5 h-3.5" /></button>
            )}
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-gray-400">Henüz tanım eklenmemiş</p>}
      </div>
      <div className="flex gap-2">
        <input type="text" placeholder="Yeni ekle..." value={yeni} onChange={e => setYeni(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleEkle(); }} className="flex-1 p-2 border rounded-lg text-sm" />
        <button onClick={handleEkle} disabled={ekleme || !yeni.trim()} className="btn btn-primary text-sm px-3 py-1.5">{ekleme ? "..." : "Ekle"}</button>
      </div>
    </div>
  );
}
