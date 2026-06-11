"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeForm } from "@/lib/security";
import { logAudit } from "@/lib/audit";
import { displayDate } from "@/lib/tarih";
import Link from "next/link";
import { Building, Plus, Edit, Trash2, Search, X, Save, Lock, Unlock, ArrowLeft, Users } from "lucide-react";

function kalanGunHesapla(tarih: string): { text: string; bgCls: string; textCls: string } {
  if (!tarih) return { text: "-", bgCls: "bg-gray-50", textCls: "text-gray-400" };
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const t = new Date(tarih); t.setHours(0, 0, 0, 0);
  const diff = Math.ceil((t.getTime() - now.getTime()) / 86400000);
  if (diff < 0) return { text: `${diff}`, bgCls: "bg-red-200", textCls: "text-red-800 font-semibold" };
  if (diff >= 91) return { text: `${diff}`, bgCls: "bg-green-200", textCls: "text-green-800 font-semibold" };
  return { text: `${diff}`, bgCls: "bg-yellow-100", textCls: "text-yellow-700" };
}

function durumRenk(deger: string, tip: string): { bg: string; text: string } {
  const yesil = ["AKTİF", "VAR", "KULLANABİLİR", "KULLANABİLİR"];
  const kirmizi = ["PASİF", "YOK", "KULLANAMAZ"];
  const mavi = ["BİLİNMİYOR", "ELİMİZDE YOK"];
  const turuncu = ["DİPLOMA"];
  if (yesil.includes(deger)) return { bg: "bg-green-100", text: "text-green-800" };
  if (kirmizi.includes(deger)) return { bg: "bg-red-100", text: "text-red-800" };
  if (mavi.includes(deger)) return { bg: "bg-blue-100", text: "text-blue-800" };
  if (turuncu.includes(deger)) return { bg: "bg-orange-100", text: "text-orange-800" };
  return { bg: "bg-gray-100", text: "text-gray-700" };
}

function getTodayStr(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

export default function Taseronlar() {
  const [taseronlar, setTaseronlar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [locked, setLocked] = useState<Set<string>>(new Set());
  const [santiyeler, setSantiyeler] = useState<any[]>([]);
  const [form, setForm] = useState({ firma_adi: "", yetkili: "", telefon: "", email: "", adres: "", vergi_no: "", santiye_id: "", durum: "aktif", notlar: "" });
  const [sorumlular, setSorumlular] = useState<{ ad_soyad: string; telefon: string; email: string; pozisyon: string }[]>([]);
  const addSorumlu = () => setSorumlular(prev => [...prev, { ad_soyad: "", telefon: "", email: "", pozisyon: "" }]);
  const removeSorumlu = (idx: number) => setSorumlular(prev => prev.filter((_, i) => i !== idx));
  const updateSorumlu = (idx: number, field: string, value: string) => setSorumlular(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));

  const [selectedTaseron, setSelectedTaseron] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [empMykMap, setEmpMykMap] = useState<Record<string, any[]>>({});
  const [empDocsMap, setEmpDocsMap] = useState<Record<string, Record<string, any>>>({});
  const [empLoading, setEmpLoading] = useState(false);

  // Add employee
  const [showAddEmp, setShowAddEmp] = useState(false);
  const [allPersonel, setAllPersonel] = useState<any[]>([]);
  const [personelSearch, setPersonelSearch] = useState("");
  const [selectedPersonelIds, setSelectedPersonelIds] = useState<Set<string>>(new Set());
  const [linkSaving, setLinkSaving] = useState(false);

  const COLUMNS = ["sayi", "adi_soyadi", "sigorta", "gorev_alani", "ise_giris", "tc_kimlik", "telefon", "gorev", "myk_izme", "myk_icerik", "myk_yenileme", "is_makinesi", "isg_zimmet", "talimat", "yuksekte_yenileme", "saglik_yenileme", "isg_egitim_yenileme", "myk_kalan", "yuksekte_kalan", "saglik_kalan", "isg_egitim_kalan"];

  const COL_LABELS: Record<string, string> = {
    sayi: "SAYI", adi_soyadi: "ADI SOYADI", sigorta: "SİGORTA DURUMU", gorev_alani: "GÖREVİ/ALANI",
    ise_giris: "İŞE GİRİŞ", tc_kimlik: "T.C. KİMLİK", telefon: "TELEFON", gorev: "GÖREV",
    myk_izme: "MYK İZME", myk_icerik: "MYK/DİPLOMA İÇERİĞİ", myk_yenileme: "MYK YENİLEME TARİHİ",
    is_makinesi: "İŞ MAKİNESİ KULLANIM DURUMU", isg_zimmet: "İSG ZİMMET", talimat: "TALİMAT",
    yuksekte_yenileme: "YÜKSEKTE ÇALIŞMA YENİLEME TARİHİ",
    saglik_yenileme: "SAĞLIK RAPORU YENİLEME TARİHİ",
    isg_egitim_yenileme: "İSG EĞİTİMİ YENİLEME TARİHİ",
    myk_kalan: "MYK YENİLEME KALAN", yuksekte_kalan: "YÜKSEKTE ÇALIŞMA YENİLEME KALAN",
    saglik_kalan: "SAĞLIK RAPORU YENİLEME KALAN", isg_egitim_kalan: "İSG EĞİTİMİ YENİLEME KALAN",
  };

  const GROUP1 = ["sayi", "adi_soyadi", "sigorta", "gorev_alani", "ise_giris", "tc_kimlik", "telefon"];
  const GROUP2 = ["gorev", "myk_izme", "myk_icerik", "myk_yenileme", "is_makinesi", "isg_zimmet", "talimat", "yuksekte_yenileme", "saglik_yenileme", "isg_egitim_yenileme"];
  const RENK_KALAN = ["myk_kalan", "yuksekte_kalan", "saglik_kalan", "isg_egitim_kalan"];

  const fetchTaseronlar = async () => {
    const { data } = await supabase.from("taseronlar").select("*, santiyeler(ad)").order("firma_adi");
    if (data) setTaseronlar(data);
    setLoading(false);
  };

  const fetchSantiyeler = async () => {
    const { data } = await supabase.from("santiyeler").select("id, ad");
    if (data) setSantiyeler(data);
  };

  useEffect(() => { fetchTaseronlar(); fetchSantiyeler(); }, []);

  const toggleLock = (id: string) => {
    setLocked(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const openCompany = async (t: any) => {
    setSelectedTaseron(t);
    setEmpLoading(true);
    const { data: emp } = await supabase.from("personel")
      .select("id, ad, soyad, kimlik_no, telefon, sgk_tarihi, ise_giris_tarihi, meslek_kodu, hat, ekip_adi")
      .eq("taseron_id", t.id).eq("arsivde", false).order("ad");
    if (emp) {
      setEmployees(emp);
      if (emp.length > 0) {
        const ids = emp.map(e => e.id);
        const [belgeResult, mykResult, egitimResult] = await Promise.all([
          supabase.from("personel_belgeleri").select("*").in("personel_id", ids).order("eklenme_tarihi", { ascending: false }),
          supabase.from("personel_myk_egitimleri").select("*").in("personel_id", ids),
          supabase.from("myk_egitim_listesi").select("id, ad").eq("aktif", true),
        ]);
        const allDocs = belgeResult.data || [];
        const mykKayitlari = mykResult.data || [];
        const egitimMap = new Map((egitimResult.data || []).map(e => [e.id, e.ad]));

        const mykMap: Record<string, any[]> = {};
        for (const m of mykKayitlari) {
          if (!mykMap[m.personel_id]) mykMap[m.personel_id] = [];
          const egitimAd = egitimMap.get(m.myk_egitim_id) || "MYK";
          let expiry = null;
          if (m.alis_tarihi && m.gecerlilik_suresi) {
            const d = new Date(m.alis_tarihi);
            d.setFullYear(d.getFullYear() + m.gecerlilik_suresi);
            expiry = d.toISOString().split("T")[0];
          }
          mykMap[m.personel_id].push({ ...m, egitimAd, expiry, alisTarih: m.alis_tarihi });
        }
        setEmpMykMap(mykMap);

        const docMap: Record<string, Record<string, any>> = {};
        for (const e of emp) {
          const latest: Record<string, any> = {};
          const empDocs = allDocs.filter(d => d.personel_id === e.id);
          for (const d of empDocs) {
            if (!latest[d.belge_tipi]) latest[d.belge_tipi] = d;
          }
          docMap[e.id] = latest;
        }
        setEmpDocsMap(docMap);
      }
    }
    supabase.from("taseron_sorumlulari").select("ad_soyad, telefon, email, pozisyon").eq("taseron_id", t.id).then(({ data }) => { if (data) setSorumlular(data); });
    setEmpLoading(false);
  };

  const closeCompany = () => { setSelectedTaseron(null); setEmployees([]); setEmpMykMap({}); setEmpDocsMap({}); setSorumlular([]); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = sanitizeForm({ ...form, santiye_id: form.santiye_id || null });
    try {
      if (editing) {
        const { error } = await supabase.from("taseronlar").update(payload).eq("id", editing.id);
        if (error) throw error;
        await saveSorumlular(editing.id);
      } else {
        const { data, error } = await supabase.from("taseronlar").insert(payload).select();
        if (error) throw error;
        if (data?.[0]) await saveSorumlular(data[0].id);
      }
      setShowForm(false); setEditing(null); setForm({ firma_adi: "", yetkili: "", telefon: "", email: "", adres: "", vergi_no: "", santiye_id: "", durum: "aktif", notlar: "" });
      setSorumlular([]);
      fetchTaseronlar();
    } catch (e: any) { alert(e.message); }
  };

  const saveSorumlular = async (taseronId: string) => {
    await supabase.from("taseron_sorumlulari").delete().eq("taseron_id", taseronId);
    const valid = sorumlular.filter(s => s.ad_soyad.trim());
    if (valid.length === 0) return;
    const inserts = valid.map(s => ({ taseron_id: taseronId, ...s }));
    const { error } = await supabase.from("taseron_sorumlulari").insert(inserts);
    if (error) throw error;
    await logAudit("taseron_sorumlulari", editing ? "UPDATE" : "INSERT", taseronId, null, valid);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu taşeronu silmek istediğinize emin misiniz?")) return;
    try {
      const { error } = await supabase.from("taseronlar").delete().eq("id", id);
      if (error) throw error;
      await logAudit("taseronlar", "DELETE", id, null, null);
      fetchTaseronlar();
    } catch (e: any) { alert(e.message); }
  };

  const handleLinkPersonel = async () => {
    if (selectedPersonelIds.size === 0) return;
    setLinkSaving(true);
    try {
      const ids = Array.from(selectedPersonelIds);
      const { error } = await supabase.from("personel").update({ taseron_id: selectedTaseron?.id }).in("id", ids);
      if (error) throw error;
      for (const id of ids) await logAudit("personel", "UPDATE", id, null, { taseron_id: selectedTaseron?.id });
      setShowAddEmp(false);
      setSelectedPersonelIds(new Set());
      setPersonelSearch("");
      if (selectedTaseron) openCompany(selectedTaseron);
    } catch (e: any) { alert(e.message); }
    finally { setLinkSaving(false); }
  };

  const openLinkPersonel = () => {
    setPersonelSearch("");
    setSelectedPersonelIds(new Set());
    const existingIds = new Set(employees.map(e => e.id));
    supabase.from("personel").select("id, ad, soyad, kimlik_no, telefon").eq("arsivde", false).order("ad").then(({ data }) => {
      if (data) setAllPersonel(data.filter(p => !existingIds.has(p.id)));
    });
    setShowAddEmp(true);
  };

  // Company List View
  if (!selectedTaseron) {
    return (
      <div className="flex-1 p-6 bg-gray-50 min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Taşeron Dosya Takip</h2>
            <p className="text-sm text-gray-500 mt-1">Toplam {taseronlar.length} firma</p>
          </div>
          <button onClick={() => { setShowForm(true); setEditing(null); setForm({ firma_adi: "", yetkili: "", telefon: "", email: "", adres: "", vergi_no: "", santiye_id: "", durum: "aktif", notlar: "" }); setSorumlular([]); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
            <Plus className="w-5 h-5" /> Yeni Firma
          </button>
        </div>

        <div className="card p-4 mb-6">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Firma ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pr-12" />
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">{editing ? "Firma Düzenle" : "Yeni Firma"}</h3>
                <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input required placeholder="Firma Adı" value={form.firma_adi} onChange={(e) => setForm({ ...form, firma_adi: e.target.value })} className="w-full p-2 border rounded-lg" />
                <input placeholder="Yetkili" value={form.yetkili} onChange={(e) => setForm({ ...form, yetkili: e.target.value })} className="w-full p-2 border rounded-lg" />
                <input placeholder="Telefon" value={form.telefon} onChange={(e) => setForm({ ...form, telefon: e.target.value })} className="w-full p-2 border rounded-lg" />
                <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full p-2 border rounded-lg" />
                <input placeholder="Vergi No" value={form.vergi_no} onChange={(e) => setForm({ ...form, vergi_no: e.target.value })} className="w-full p-2 border rounded-lg" />
                <select value={form.santiye_id} onChange={(e) => setForm({ ...form, santiye_id: e.target.value })} className="w-full p-2 border rounded-lg">
                  <option value="">Şantiye Seçin</option>
                  {santiyeler.map((s) => <option key={s.id} value={s.id}>{s.ad}</option>)}
                </select>
                <textarea placeholder="Adres" value={form.adres} onChange={(e) => setForm({ ...form, adres: e.target.value })} className="w-full p-2 border rounded-lg h-20" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {taseronlar.filter((t) => !search || t.firma_adi.toLowerCase().includes(search.toLowerCase())).map((t) => (
              <div key={t.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition cursor-pointer" onClick={() => openCompany(t)}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-orange-600" />
                    <h3 className="font-semibold">{t.firma_adi}</h3>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${t.durum === "aktif" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>{t.durum}</span>
                </div>
                {t.yetkili && <p className="text-sm text-gray-600">Yetkili: {t.yetkili}</p>}
                {t.telefon && <p className="text-sm text-gray-600">Tel: {t.telefon}</p>}
                {t.email && <p className="text-sm text-gray-600">Email: {t.email}</p>}
                {t.santiyeler?.ad && <p className="text-sm text-gray-600">Şantiye: {t.santiyeler.ad}</p>}
                <div className="flex gap-2 mt-3 pt-3 border-t" onClick={e => e.stopPropagation()}>
                  <button onClick={() => openCompany(t)} className="flex-1 text-blue-600 hover:bg-blue-50 py-1 rounded text-sm flex items-center justify-center gap-1"><Users className="w-4 h-4" />Personel</button>
                  <button onClick={() => { setEditing(t); setForm({ firma_adi: t.firma_adi, yetkili: t.yetkili || "", telefon: t.telefon || "", email: t.email || "", adres: t.adres || "", vergi_no: t.vergi_no || "", santiye_id: t.santiye_id || "", durum: t.durum, notlar: t.notlar || "" }); setSorumlular([]); supabase.from("taseron_sorumlulari").select("ad_soyad, telefon, email, pozisyon").eq("taseron_id", t.id).then(({ data }) => { if (data) setSorumlular(data); }); setShowForm(true); }} className="text-green-600 hover:bg-green-50 py-1 px-2 rounded text-sm"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => toggleLock(t.id)} className={`px-2 py-1 rounded text-sm ${locked.has(t.id) ? "text-amber-500 bg-amber-50" : "text-gray-400 hover:text-gray-600"}`}>{locked.has(t.id) ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}</button>
                  <button onClick={() => handleDelete(t.id)} disabled={!locked.has(t.id)} className={`py-1 px-2 rounded text-sm ${locked.has(t.id) ? "text-red-600 hover:bg-red-50" : "text-gray-300 cursor-not-allowed"}`}><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Company Detail View
  return (
    <div className="flex-1 p-4 bg-gray-50 min-h-screen">
      <button onClick={closeCompany} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
        <ArrowLeft className="w-4 h-4" /> Firma Listesine Dön
      </button>

      <div className="bg-white rounded-lg shadow-sm p-3 mb-3">
        <div className="flex items-start gap-2">
          <Building className="w-6 h-6 text-orange-600 mt-0.5" />
          <div className="flex-1">
            <h2 className="text-lg font-bold">{selectedTaseron.firma_adi}</h2>
            <p className="text-xs text-gray-500">{selectedTaseron.yetkili} • {selectedTaseron.telefon} • {selectedTaseron.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={openLinkPersonel} className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Personel Bağla
            </button>
            <Link href="/personel" className="text-xs text-blue-600 hover:underline">Personel Yönetimi</Link>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        {empLoading ? (
          <div className="text-center py-8 text-gray-400">Yükleniyor...</div>
        ) : employees.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Bu firmaya ait personel bulunmuyor</p>
            <p className="text-xs mt-1">Personel eklemek için Personel sayfasından Taşeron seçin</p>
          </div>
        ) : (
          <table className="w-full min-w-[2000px] text-xs border-collapse">
            <thead>
              {/* Row 1: Main group headers */}
              <tr className="bg-gray-800 text-white">
                <th colSpan={7} className="px-2 py-1.5 text-center text-[10px] font-bold border border-gray-700">{selectedTaseron.firma_adi.toUpperCase()} ŞANTİYESİ GÜN İNŞAAT</th>
                <th colSpan={10} className="px-2 py-1.5 text-center text-[10px] font-bold border border-gray-700">İNOVASYON ORTAK SAĞLIK VE GÜVENLİK BİRİMİ<br/>İNOVASYON İSG BELGE TAKİP ÇİZELGESİ FORMU</th>
                <th colSpan={1} className="px-2 py-1.5 text-center text-[9px] font-medium border border-gray-700">DİĞER<br/>Renk Anlamları<br/>(Bilinmiyor/ Belge Verilmedi - Mavi | Diploma - Turuncu)</th>
                <th colSpan={3} className="px-2 py-1.5 text-center text-[9px] font-medium border border-gray-700">TARİH RENK ANLAMLARI<br/>+91 Gün ve Üzeri Yeşil | Yenileme Tarihi Geçmiş Gün Sayısı Kırmızı</th>
                <th colSpan={1} className="px-2 py-1.5 text-center text-[10px] font-bold border border-gray-700">EXPORT TARİHİ<br/>{getTodayStr()}</th>
              </tr>

              {/* Row 2: Sub group descriptions */}
              <tr className="bg-gray-700 text-gray-200">
                <th colSpan={1} className="px-1 py-1 text-[9px] font-medium border border-gray-600">Sıra</th>
                <th colSpan={6} className="px-1 py-1 text-[9px] font-medium border border-gray-600">FİRMA UNVANI</th>
                <th colSpan={10} className="px-1 py-1 text-[9px] font-medium border border-gray-600">YETKİNLİK / BELGELENDİRME</th>
                <th colSpan={1} className="px-1 py-1 text-[9px] font-medium border border-gray-600">RENK</th>
                <th colSpan={3} className="px-1 py-1 text-[9px] font-medium border border-gray-600">KALAN GÜN HESABI</th>
                <th colSpan={1} className="px-1 py-1 text-[9px] font-medium border border-gray-600">TARİH</th>
              </tr>

              {/* Row 3: Column headers */}
              <tr className="bg-gray-100">
                {COLUMNS.map(col => (
                  <th key={col} className="px-1.5 py-1 text-[9px] font-semibold text-gray-700 border border-gray-300 whitespace-nowrap text-center">{COL_LABELS[col]}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {employees.map((emp, idx) => {
                const mykKayit = empMykMap[emp.id]?.[0] || null;
                const mykAd = mykKayit?.egitimAd || "-";
                const mykAlmaTarih = mykKayit?.alisTarih || null;
                const mykBitisTarih = mykKayit?.expiry || null;
                const mykVar = mykKayit !== null;
                const mykDurumDeger = mykVar ? "VAR" : "YOK";
                const mykDiploma = mykKayit?.egitimAd?.toLowerCase().includes("lisans") || mykKayit?.egitimAd?.toLowerCase().includes("önlisans") || mykKayit?.egitimAd?.toLowerCase().includes("lise") ? "DİPLOMA" : null;
                const mykIzmeDeger = mykDiploma || mykDurumDeger;
                const mykIzmeRenk = durumRenk(mykIzmeDeger, "myk");

                const sigDurum = emp.sgk_tarihi ? "AKTİF" : "PASİF";
                const sigRenk = durumRenk(sigDurum, "sigorta");

                const docKkd = empDocsMap[emp.id]?.["kkd"] || null;
                const isgZimmetDeger = docKkd ? "VAR" : "YOK";
                const isgZimmetRenk = durumRenk(isgZimmetDeger, "zimmet");

                const docTalimat = empDocsMap[emp.id]?.["talimat"] || null;
                const talimatDeger = docTalimat ? "VAR" : "YOK";
                const talimatRenk = durumRenk(talimatDeger, "talimat");

                const docIsMakinesi = empDocsMap[emp.id]?.["operator_belgesi"] || null;
                const isMakDeger = docIsMakinesi ? "KULLANABİLİR" : "KULLANAMAZ";
                const isMakRenk = durumRenk(isMakDeger, "makine");

                const docYuksekte = empDocsMap[emp.id]?.["yuksekte_calisma"] || null;
                const docSaglik = empDocsMap[emp.id]?.["saglik_raporu"] || null;
                const docIsg = empDocsMap[emp.id]?.["isg_egitim"] || null;

                const yuksekteTarih = docYuksekte?.son_gecerlilik_tarihi || null;
                const saglikTarih = docSaglik?.son_gecerlilik_tarihi || null;
                const isgTarih = docIsg?.son_gecerlilik_tarihi || null;

                const mykKalan = kalanGunHesapla(mykBitisTarih);
                const yuksekteKalan = kalanGunHesapla(yuksekteTarih);
                const saglikKalan = kalanGunHesapla(saglikTarih);
                const isgKalan = kalanGunHesapla(isgTarih);

                return (
                  <tr key={emp.id} className="hover:bg-blue-50/40">
                    <td className="px-1.5 py-1 text-center text-gray-600 border border-gray-200">{idx + 1}</td>
                    <td className="px-1.5 py-1 text-left text-gray-800 font-medium border border-gray-200 whitespace-nowrap">{emp.ad} {emp.soyad}</td>
                    <td className={`px-1.5 py-1 text-center border border-gray-200 ${sigRenk.bg} ${sigRenk.text}`}>{sigDurum}</td>
                    <td className="px-1.5 py-1 text-center text-gray-600 border border-gray-200">{emp.hat || emp.ekip_adi || emp.meslek_kodu || "-"}</td>
                    <td className="px-1.5 py-1 text-center text-gray-600 border border-gray-200">{displayDate(emp.ise_giris_tarihi)}</td>
                    <td className="px-1.5 py-1 text-center text-gray-600 border border-gray-200">{emp.kimlik_no || "-"}</td>
                    <td className="px-1.5 py-1 text-center text-gray-600 border border-gray-200">{emp.telefon || "-"}</td>
                    <td className="px-1.5 py-1 text-center text-gray-600 border border-gray-200">{emp.meslek_kodu || "-"}</td>
                    <td className={`px-1.5 py-1 text-center border border-gray-200 ${mykIzmeRenk.bg} ${mykIzmeRenk.text}`}>{mykIzmeDeger}</td>
                    <td className="px-1.5 py-1 text-center text-gray-600 border border-gray-200">{mykAd}</td>
                    <td className="px-1.5 py-1 text-center text-gray-600 border border-gray-200">{displayDate(mykBitisTarih)}</td>
                    <td className={`px-1.5 py-1 text-center border border-gray-200 ${isMakRenk.bg} ${isMakRenk.text}`}>{isMakDeger}</td>
                    <td className={`px-1.5 py-1 text-center border border-gray-200 ${isgZimmetRenk.bg} ${isgZimmetRenk.text}`}>{isgZimmetDeger}</td>
                    <td className={`px-1.5 py-1 text-center border border-gray-200 ${talimatRenk.bg} ${talimatRenk.text}`}>{talimatDeger}</td>
                    <td className="px-1.5 py-1 text-center text-gray-600 border border-gray-200">{displayDate(yuksekteTarih)}</td>
                    <td className="px-1.5 py-1 text-center text-gray-600 border border-gray-200">{displayDate(saglikTarih)}</td>
                    <td className="px-1.5 py-1 text-center text-gray-600 border border-gray-200">{displayDate(isgTarih)}</td>
                    <td className={`px-1.5 py-1 text-center border border-gray-200 ${mykKalan.bgCls} ${mykKalan.textCls}`}>{mykKalan.text}</td>
                    <td className={`px-1.5 py-1 text-center border border-gray-200 ${yuksekteKalan.bgCls} ${yuksekteKalan.textCls}`}>{yuksekteKalan.text}</td>
                    <td className={`px-1.5 py-1 text-center border border-gray-200 ${saglikKalan.bgCls} ${saglikKalan.textCls}`}>{saglikKalan.text}</td>
                    <td className={`px-1.5 py-1 text-center border border-gray-200 ${isgKalan.bgCls} ${isgKalan.textCls}`}>{isgKalan.text}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Link Existing Personnel Modal */}
      {showAddEmp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Personel Bağla — {selectedTaseron?.firma_adi}</h3>
              <button onClick={() => setShowAddEmp(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={personelSearch} onChange={e => setPersonelSearch(e.target.value)} className="w-full p-2 pl-9 border rounded-lg text-sm" placeholder="Personel ara (ad, soyad, TC)..."/>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 min-h-0 border rounded-lg p-2">
              {allPersonel
                .filter(p => !personelSearch || `${p.ad} ${p.soyad} ${p.kimlik_no || ""}`.toLocaleLowerCase("tr").includes(personelSearch.toLocaleLowerCase("tr")))
                .map(p => {
                  const checked = selectedPersonelIds.has(p.id);
                  return (
                    <label key={p.id} className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition ${checked ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50 border border-transparent"}`}>
                      <input type="checkbox" checked={checked} onChange={() => setSelectedPersonelIds(prev => { const n = new Set(prev); if (checked) n.delete(p.id); else n.add(p.id); return n; })} className="rounded border-gray-300" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-800">{p.ad} {p.soyad}</span>
                        {p.kimlik_no && <span className="text-xs text-gray-400 ml-2">({p.kimlik_no})</span>}
                      </div>
                      {p.telefon && <span className="text-xs text-gray-400 flex-shrink-0">{p.telefon}</span>}
                    </label>
                  );
                })}
              {allPersonel.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Bu taşerona bağlanacak personel kalmadı</p>}
            </div>
            <div className="flex items-center justify-between pt-3 border-t mt-3">
              <span className="text-xs text-gray-500">{selectedPersonelIds.size} personel seçildi</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAddEmp(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">İptal</button>
                <button onClick={handleLinkPersonel} disabled={linkSaving || selectedPersonelIds.size === 0} className="px-4 py-2 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 flex items-center gap-1">
                  <Save className="w-4 h-4" />{linkSaving ? "Bağlanıyor..." : "Bağla"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
