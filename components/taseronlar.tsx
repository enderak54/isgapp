"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeForm, maskTC } from "@/lib/security";
import { logAudit } from "@/lib/audit";
import { displayDate } from "@/lib/tarih";
import { validateFile, validateFileServer, sanitizeFileName } from "@/lib/file-validation";
import Link from "next/link";
import { Building, Plus, Edit, Trash2, Search, X, Save, Lock, Unlock, ArrowLeft, Users, CheckSquare, Upload } from "lucide-react";

function kalanGunHesapla(tarih: string): { text: string; bgCls: string; textCls: string } {
  if (!tarih) return { text: "-", bgCls: "bg-gray-50", textCls: "text-gray-400" };
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const t = new Date(tarih); t.setHours(0, 0, 0, 0);
  const diff = Math.ceil((t.getTime() - now.getTime()) / 86400000);
  if (diff < 0) return { text: `${diff}`, bgCls: "bg-red-200", textCls: "text-red-800 font-semibold" };
  if (diff >= 91) return { text: `${diff}`, bgCls: "bg-green-200", textCls: "text-green-800 font-semibold" };
  return { text: `${diff}`, bgCls: "bg-yellow-100", textCls: "text-yellow-700" };
}

function durumRenk(deger: string): { bg: string; text: string } {
  const yesil = ["AKTİF", "VAR", "KULLANABİLİR"];
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

const PERSONEL_ZORUNLU_ALANLAR = [
  { key: "kimlikNo", label: "TC Kimlik No" },
  { key: "ad", label: "Ad" },
  { key: "soyad", label: "Soyad" },
  { key: "isgEgitimTarihi", label: "İSG Eğitim Tarihi (tarih + süre)" },
  { key: "yuksekteCalisma", label: "Yüksekte Çalışma (tarih + süre)" },
  { key: "myk", label: "MYK (en az bir eğitim kaydı)" },
  { key: "sertifika", label: "Sertifika (tarih + süre)" },
  { key: "operatorBelgesi", label: "Operatör Belgesi (tarih + süre)" },
  { key: "kkd", label: "KKD (tarih + süre)" },
  { key: "oryantasyon", label: "Oryantasyon (tarih + süre)" },
  { key: "saglikRaporuTarihi", label: "Sağlık Raporu (tarih + süre)" },
  { key: "adliSicil", label: "Adli Sicil (belge)" },
  { key: "gorevlendirme", label: "Görevlendirme (belge)" },
];

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
  const [empOperatorMap, setEmpOperatorMap] = useState<Record<string, any[]>>({});
  const [empLoading, setEmpLoading] = useState(false);

  const [showAddEmp, setShowAddEmp] = useState(false);
  const [allPersonel, setAllPersonel] = useState<any[]>([]);
  const [personelSearch, setPersonelSearch] = useState("");
  const [selectedPersonelIds, setSelectedPersonelIds] = useState<Set<string>>(new Set());
  const [linkSaving, setLinkSaving] = useState(false);

  const [mykEgitimListesi, setMykEgitimListesi] = useState<any[]>([]);
  const [mykSecim, setMykSecim] = useState("");
  const [mykSecimTarih, setMykSecimTarih] = useState("");
  const [mykSecimSure, setMykSecimSure] = useState("");

  // Edit modal
  const [editingPerson, setEditingPerson] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    hat: "", meslek_kodu: "", mykEgitimler: [] as any[],
    yuksekteTarih: "", saglikTarih: "", isgTarih: "", gorevlendirmeTarih: "", kkdTarih: "",
    operatorSertifikalar: [] as Array<{id?: string; tip: string; tarih: string; dosyaAdi?: string}>,
  });
  const [opTip, setOpTip] = useState("");
  const [opTarih, setOpTarih] = useState("");
  const OP_SERTIFIKA_TIPLERI = ["Forklift", "Manlift", "Tavan Vinci", "Mobil Vinç", "Ekskavatör", "Köprülü Vinç", "Mekanize Kazı", "Kırma Eleme Tesisi", "Diğer"];
  const [fileUploads, setFileUploads] = useState<Record<string, File>>({});
  const [editSaving, setEditSaving] = useState(false);

  // Per-taşeron zorunlu alanlar
  const [showZorunluModal, setShowZorunluModal] = useState(false);
  const [taseronZorunluAlanlar, setTaseronZorunluAlanlar] = useState<string[]>([]);
  const [taseronZorunluSaving, setTaseronZorunluSaving] = useState(false);

  // Yeni personel hızlı ekleme
  const [showNewPerson, setShowNewPerson] = useState(false);
  const [newPersonForm, setNewPersonForm] = useState({ ad: "", soyad: "", kimlik_no: "", telefon: "", meslek_kodu: "" });
  const [newPersonSaving, setNewPersonSaving] = useState(false);

  const COLUMNS = ["sayi", "adi_soyadi", "sigorta", "gorev_alani", "ise_giris", "tc_kimlik", "telefon", "gorev", "myk_izme", "myk_icerik", "myk_yenileme", "is_makinesi", "isg_zimmet", "talimat", "yuksekte_yenileme", "saglik_yenileme", "isg_egitim_yenileme", "gorevlendirme", "myk_kalan", "yuksekte_kalan", "saglik_kalan", "isg_egitim_kalan"];

  const COL_LABELS: Record<string, string> = {
    sayi: "SAYI", adi_soyadi: "ADI SOYADI", sigorta: "SİGORTA DURUMU", gorev_alani: "GÖREVİ/ALANI",
    ise_giris: "İŞE GİRİŞ", tc_kimlik: "T.C. KİMLİK", telefon: "TELEFON", gorev: "GÖREV",
    myk_izme: "MYK İZME", myk_icerik: "MYK/DİPLOMA İÇERİĞİ", myk_yenileme: "MYK YENİLEME TARİHİ",
    is_makinesi: "İŞ MAKİNESİ KULLANIM DURUMU", isg_zimmet: "KKD ZİMMET", talimat: "TALİMAT",
    yuksekte_yenileme: "YÜKSEKTE ÇALIŞMA YENİLEME TARİHİ",
    saglik_yenileme: "SAĞLIK RAPORU YENİLEME TARİHİ",
    isg_egitim_yenileme: "İSG EĞİTİMİ YENİLEME TARİHİ", gorevlendirme: "GÖREVLENDİRME",
    myk_kalan: "MYK YENİLEME KALAN", yuksekte_kalan: "YÜKSEKTE ÇALIŞMA YENİLEME KALAN",
    saglik_kalan: "SAĞLIK RAPORU YENİLEME KALAN", isg_egitim_kalan: "İSG EĞİTİMİ YENİLEME KALAN",
  };

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

  useEffect(() => {
    if (mykEgitimListesi.length === 0) {
      supabase.from("myk_egitim_listesi").select("id, ad").eq("aktif", true).order("ad").then(({ data }) => { if (data) setMykEgitimListesi(data); });
    }
  }, [mykEgitimListesi.length]);

  const toggleLock = (id: string) => {
    setLocked(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const loadEmployeeData = async (ids: string[]) => {
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
    const opMap: Record<string, any[]> = {};
    for (const e of employees.length > 0 ? employees.filter(emp => ids.includes(emp.id)) : []) {
      const latest: Record<string, any> = {};
      const empDocs = allDocs.filter(d => d.personel_id === e.id);
      for (const d of empDocs) {
        if (!latest[d.belge_tipi]) latest[d.belge_tipi] = d;
      }
      docMap[e.id] = latest;
      opMap[e.id] = allDocs.filter(d => d.personel_id === e.id && d.belge_tipi === "operator_belgesi");
    }
    if (Object.keys(docMap).length > 0) setEmpDocsMap(docMap);
    if (Object.keys(opMap).length > 0) setEmpOperatorMap(opMap);
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
        const opMap: Record<string, any[]> = {};
        for (const e of emp) {
          const latest: Record<string, any> = {};
          const empDocs = allDocs.filter(d => d.personel_id === e.id);
          for (const d of empDocs) {
            if (!latest[d.belge_tipi]) latest[d.belge_tipi] = d;
          }
          docMap[e.id] = latest;
          opMap[e.id] = allDocs.filter(d => d.personel_id === e.id && d.belge_tipi === "operator_belgesi");
        }
        setEmpDocsMap(docMap);
        setEmpOperatorMap(opMap);
      }
    }
    supabase.from("taseron_sorumlulari").select("ad_soyad, telefon, email, pozisyon").eq("taseron_id", t.id).then(({ data }) => { if (data) setSorumlular(data); });
    if (t.personel_zorunlu_alanlar && Array.isArray(t.personel_zorunlu_alanlar)) {
      setTaseronZorunluAlanlar(t.personel_zorunlu_alanlar);
    } else {
      setTaseronZorunluAlanlar([]);
    }
    setEmpLoading(false);
  };

  const closeCompany = () => { setSelectedTaseron(null); setEmployees([]); setEmpMykMap({}); setEmpDocsMap({}); setEmpOperatorMap({}); setSorumlular([]); setEditingPerson(null); setTaseronZorunluAlanlar([]); setShowZorunluModal(false); };

  const openEditPersonel = async (emp: any) => {
    setEditingPerson(emp);
    setOpTip(""); setOpTarih("");
    const { data: opDocs } = await supabase.from("personel_belgeleri").select("*").eq("personel_id", emp.id).eq("belge_tipi", "operator_belgesi");
    setEditForm({
      hat: emp.hat || "", meslek_kodu: emp.meslek_kodu || "",
      mykEgitimler: (empMykMap[emp.id] || []).map((m: any) => ({ id: m.id, myk_egitim_id: m.myk_egitim_id, alis_tarihi: m.alisTarih || "", gecerlilik_suresi: m.gecerlilik_suresi ? String(m.gecerlilik_suresi) : "" })),
      yuksekteTarih: empDocsMap[emp.id]?.["yuksekte_calisma"]?.son_gecerlilik_tarihi || "",
      saglikTarih: empDocsMap[emp.id]?.["saglik_raporu"]?.son_gecerlilik_tarihi || "",
      isgTarih: empDocsMap[emp.id]?.["isg_egitim"]?.son_gecerlilik_tarihi || "",
      gorevlendirmeTarih: empDocsMap[emp.id]?.["gorevlendirme"]?.son_gecerlilik_tarihi || "",
      kkdTarih: empDocsMap[emp.id]?.["kkd"]?.son_gecerlilik_tarihi || "",
      operatorSertifikalar: (opDocs || []).map(d => ({ id: d.id, tip: d.dosya_adi || "Diğer", tarih: d.son_gecerlilik_tarihi || "", dosyaAdi: d.dosya_adi })),
    });
    setFileUploads({}); setMykSecim(""); setMykSecimTarih(""); setMykSecimSure("");
  };

  const handleEditSave = async () => {
    if (!editingPerson) return;
    setEditSaving(true);
    try {
      await supabase.from("personel").update({ hat: editForm.hat || null, meslek_kodu: editForm.meslek_kodu || null }).eq("id", editingPerson.id);
      await logAudit("personel", "UPDATE", editingPerson.id, null, { hat: editForm.hat, meslek_kodu: editForm.meslek_kodu });
      const { data: oldMyk } = await supabase.from("personel_myk_egitimleri").select("*").eq("personel_id", editingPerson.id);
      await supabase.from("personel_myk_egitimleri").delete().eq("personel_id", editingPerson.id);
      if (oldMyk?.length) for (const row of oldMyk) await logAudit("personel_myk_egitimleri", "DELETE", row.id, row, null);
      if (editForm.mykEgitimler.length > 0) {
        const inserts = editForm.mykEgitimler.map((m: any) => ({
          personel_id: editingPerson.id, myk_egitim_id: m.myk_egitim_id,
          alis_tarihi: m.alis_tarihi || null, gecerlilik_suresi: m.gecerlilik_suresi ? parseInt(m.gecerlilik_suresi) : null,
        }));
        const { data: mykData, error } = await supabase.from("personel_myk_egitimleri").insert(inserts).select();
        if (error) throw error;
        if (mykData?.length) for (const row of mykData) await logAudit("personel_myk_egitimleri", "INSERT", row.id, null, row);
      }

      const docUpdates: { tip: string; tarih: string }[] = [
        { tip: "yuksekte_calisma", tarih: editForm.yuksekteTarih },
        { tip: "saglik_raporu", tarih: editForm.saglikTarih },
        { tip: "isg_egitim", tarih: editForm.isgTarih },
        { tip: "gorevlendirme", tarih: editForm.gorevlendirmeTarih },
        { tip: "kkd", tarih: editForm.kkdTarih },
      ];
      for (const du of docUpdates) {
        let dosyaUrl: string | null = null;
        let dosyaAdi: string | null = null;
        let dosyaUzantisi: string | null = null;
        let dosyaBoyut: number | null = null;
        const file = fileUploads[du.tip];
        if (file) {
          const serverValidation = await validateFileServer(file);
          if (!serverValidation.valid) { alert(serverValidation.error || "Sunucu doğrulaması başarısız"); continue; }
          const ext = file.name.split(".").pop() || "";
          const fileName = `${editingPerson.id}/${Date.now()}_${sanitizeFileName(file.name)}`;
          const { error: upErr } = await supabase.storage.from("personel-belgeleri").upload(fileName, file);
          if (!upErr) {
            const { data: urlData } = supabase.storage.from("personel-belgeleri").getPublicUrl(fileName);
            dosyaUrl = urlData.publicUrl;
            dosyaAdi = file.name;
            dosyaUzantisi = ext;
            dosyaBoyut = file.size;
          }
        }
        const existing = empDocsMap[editingPerson.id]?.[du.tip] || null;
        if (existing) {
          const updateFields: Record<string, any> = {};
          if (du.tarih) updateFields.son_gecerlilik_tarihi = du.tarih;
          if (dosyaUrl) { updateFields.dosya_url = dosyaUrl; updateFields.dosya_adi = dosyaAdi; updateFields.dosya_uzantisi = dosyaUzantisi; updateFields.dosya_boyut = dosyaBoyut; }
          if (Object.keys(updateFields).length > 0) {
            const { data: updDoc } = await supabase.from("personel_belgeleri").update(updateFields).eq("id", existing.id).select();
            if (updDoc?.[0]) await logAudit("personel_belgeleri", "UPDATE", updDoc[0].id, existing, updDoc[0]);
          } else if (!du.tarih && !dosyaUrl) {
            await supabase.from("personel_belgeleri").delete().eq("id", existing.id);
            await logAudit("personel_belgeleri", "DELETE", existing.id, existing, null);
          }
        } else if (du.tarih || dosyaUrl) {
          const { data: newBelge } = await supabase.from("personel_belgeleri").insert({
            personel_id: editingPerson.id, belge_tipi: du.tip,
            dosya_url: dosyaUrl, dosya_adi: dosyaAdi || du.tip,
            dosya_uzantisi: dosyaUzantisi, dosya_boyut: dosyaBoyut,
            onay_durumu: "onaylandi", son_gecerlilik_tarihi: du.tarih || null,
          }).select();
          if (newBelge?.[0]) await logAudit("personel_belgeleri", "INSERT", newBelge[0].id, null, newBelge[0]);
        }
      }
      // Operator sertifikaları (delete + insert)
      const { data: oldOpDocs } = await supabase.from("personel_belgeleri").select("*").eq("personel_id", editingPerson.id).eq("belge_tipi", "operator_belgesi");
      await supabase.from("personel_belgeleri").delete().eq("personel_id", editingPerson.id).eq("belge_tipi", "operator_belgesi");
      if (oldOpDocs?.length) for (const row of oldOpDocs) await logAudit("personel_belgeleri", "DELETE", row.id, row, null);
      for (let i = 0; i < editForm.operatorSertifikalar.length; i++) {
        const s = editForm.operatorSertifikalar[i];
        let dosyaUrl: string | null = null;
        let dosyaUzantisi: string | null = null;
        let dosyaBoyut: number | null = null;
        const file = fileUploads[`operator_${i}`];
        if (file) {
          const serverValidation = await validateFileServer(file);
          if (!serverValidation.valid) { alert(serverValidation.error || "Sunucu doğrulaması başarısız"); continue; }
          const ext = file.name.split(".").pop() || "";
          const fileName = `${editingPerson.id}/${Date.now()}_${sanitizeFileName(file.name)}`;
          const { error: upErr } = await supabase.storage.from("personel-belgeleri").upload(fileName, file);
          if (!upErr) {
            const { data: urlData } = supabase.storage.from("personel-belgeleri").getPublicUrl(fileName);
            dosyaUrl = urlData.publicUrl; dosyaUzantisi = ext; dosyaBoyut = file.size;
          }
        }
        const { data: opBelge } = await supabase.from("personel_belgeleri").insert({
          personel_id: editingPerson.id, belge_tipi: "operator_belgesi",
          dosya_url: dosyaUrl, dosya_adi: s.tip, dosya_uzantisi: dosyaUzantisi, dosya_boyut: dosyaBoyut,
          onay_durumu: "onaylandi", son_gecerlilik_tarihi: s.tarih || null,
        }).select();
        if (opBelge?.[0]) await logAudit("personel_belgeleri", "INSERT", opBelge[0].id, null, opBelge[0]);
      }
      setFileUploads({});
      setEditingPerson(null);
      if (selectedTaseron) openCompany(selectedTaseron);
    } catch (e: any) { alert(e.message); }
    finally { setEditSaving(false); }
  };

  const addMykToEdit = () => {
    if (!mykSecim) return;
    setEditForm(prev => ({
      ...prev, mykEgitimler: [...prev.mykEgitimler, { myk_egitim_id: mykSecim, alis_tarihi: mykSecimTarih, gecerlilik_suresi: mykSecimSure }],
    }));
    setMykSecim(""); setMykSecimTarih(""); setMykSecimSure("");
  };

  const removeMykFromEdit = (idx: number) => {
    setEditForm(prev => ({ ...prev, mykEgitimler: prev.mykEgitimler.filter((_, i) => i !== idx) }));
  };

  const addOperatorCert = () => {
    if (!opTip) return;
    setEditForm(prev => ({ ...prev, operatorSertifikalar: [...prev.operatorSertifikalar, { tip: opTip, tarih: opTarih }] }));
    setOpTip(""); setOpTarih("");
  };
  const removeOperatorCert = (idx: number) => {
    setEditForm(prev => ({ ...prev, operatorSertifikalar: prev.operatorSertifikalar.filter((_, i) => i !== idx) }));
  };

  const toggleTaseronZorunlu = (alanKey: string) => {
    setTaseronZorunluAlanlar(prev => prev.includes(alanKey) ? prev.filter(k => k !== alanKey) : [...prev, alanKey]);
  };

  const saveTaseronZorunlu = async () => {
    if (!selectedTaseron) return;
    setTaseronZorunluSaving(true);
    try {
      const val = taseronZorunluAlanlar.length > 0 ? taseronZorunluAlanlar : null;
      await supabase.from("taseronlar").update({ personel_zorunlu_alanlar: val }).eq("id", selectedTaseron.id);
      await logAudit("taseronlar", "UPDATE", selectedTaseron.id, null, { personel_zorunlu_alanlar: val });
      setSelectedTaseron({ ...selectedTaseron, personel_zorunlu_alanlar: val });
      setShowZorunluModal(false);
    } catch (e: any) { alert(e.message); }
    finally { setTaseronZorunluSaving(false); }
  };

  const handleNewPersonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaseron || !newPersonForm.ad.trim() || !newPersonForm.soyad.trim()) return;
    setNewPersonSaving(true);
    try {
      const payload = sanitizeForm({
        ...newPersonForm, taseron_id: selectedTaseron.id, arsivde: false,
      });
      const { data, error } = await supabase.from("personel").insert(payload).select();
      if (error) throw error;
      await logAudit("personel", "INSERT", data?.[0]?.id || null, null, payload);
      setShowNewPerson(false);
      setNewPersonForm({ ad: "", soyad: "", kimlik_no: "", telefon: "", meslek_kodu: "" });
      openCompany(selectedTaseron);
    } catch (e: any) { alert(e.message); }
    finally { setNewPersonSaving(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.durum === "aktif" && !form.santiye_id) {
      const onay = confirm("Aktif taşeron şantiyeye bağlı olmalıdır. Şantiye seçilmedi.\n\nYine de kaydedilsin mi?");
      if (!onay) return;
    }
    const payload = sanitizeForm({ ...form, santiye_id: form.santiye_id || null });
    try {
      if (editing) {
        const oldVals = { ...editing };
        const { error } = await supabase.from("taseronlar").update(payload).eq("id", editing.id);
        if (error) throw error;
        await logAudit("taseronlar", "UPDATE", editing.id, oldVals, payload);
        await saveSorumlular(editing.id);
      } else {
        const { data, error } = await supabase.from("taseronlar").insert(payload).select();
        if (error) throw error;
        if (data?.[0]) {
          await logAudit("taseronlar", "INSERT", data[0].id, null, payload);
          await saveSorumlular(data[0].id);
        }
      }
      setShowForm(false); setEditing(null); setForm({ firma_adi: "", yetkili: "", telefon: "", email: "", adres: "", vergi_no: "", santiye_id: "", durum: "aktif", notlar: "" });
      setSorumlular([]);
      closeCompany();
      fetchTaseronlar();
    } catch (e: any) { alert(e.message); }
  };

  const saveSorumlular = async (taseronId: string) => {
    const { data: oldSorumlular } = await supabase.from("taseron_sorumlulari").select("*").eq("taseron_id", taseronId);
    await supabase.from("taseron_sorumlulari").delete().eq("taseron_id", taseronId);
    if (oldSorumlular?.length) for (const row of oldSorumlular) await logAudit("taseron_sorumlulari", "DELETE", row.id, row, null);
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
            <button onClick={() => { setShowForm(true); setEditing(null); setForm({ firma_adi: "", yetkili: "", telefon: "", email: "", adres: "", vergi_no: "", santiye_id: "", durum: "aktif", notlar: "" }); setSorumlular([]); }} className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Yeni Firma
            </button>
            <button onClick={() => setShowZorunluModal(true)} className="text-xs bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded flex items-center gap-1">
              <CheckSquare className="w-3.5 h-3.5" /> Zorunlu Alanlar
            </button>
            <button onClick={() => setShowNewPerson(true)} className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Yeni Personel
            </button>
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
              <tr className="bg-gray-700 text-gray-200">
                <th colSpan={1} className="px-1 py-1 text-[9px] font-medium border border-gray-600">Sıra</th>
                <th colSpan={6} className="px-1 py-1 text-[9px] font-medium border border-gray-600">FİRMA UNVANI</th>
                <th colSpan={11} className="px-1 py-1 text-[9px] font-medium border border-gray-600">YETKİNLİK / BELGELENDİRME</th>
                <th colSpan={1} className="px-1 py-1 text-[9px] font-medium border border-gray-600">RENK</th>
                <th colSpan={3} className="px-1 py-1 text-[9px] font-medium border border-gray-600">KALAN GÜN HESABI</th>
              </tr>
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
                const mykBitisTarih = mykKayit?.expiry || null;
                const mykVar = mykKayit !== null;
                const mykDurumDeger = mykVar ? "VAR" : "YOK";
                const mykDiploma = mykKayit?.egitimAd?.toLowerCase().includes("lisans") || mykKayit?.egitimAd?.toLowerCase().includes("önlisans") || mykKayit?.egitimAd?.toLowerCase().includes("lise") ? "DİPLOMA" : null;
                const mykIzmeDeger = mykDiploma || mykDurumDeger;
                const sigDurum = emp.sgk_tarihi ? "AKTİF" : "PASİF";
                const docKkd = empDocsMap[emp.id]?.["kkd"] || null;
                const isgZimmetDeger = docKkd ? "VAR" : "YOK";
                const docTalimat = empDocsMap[emp.id]?.["talimat"] || null;
                const talimatDeger = docTalimat ? "VAR" : "YOK";
                const operatorDocs = empOperatorMap[emp.id] || [];
                const opEquipmentNames = operatorDocs.map((d: any) => d.dosya_adi).filter(Boolean);
                const mykOpNames = (empMykMap[emp.id] || []).filter((m: any) => (m.egitimAd || "").toLowerCase().includes("operatör") || (m.egitimAd || "").toLowerCase().includes("iş makinesi") || (m.egitimAd || "").toLowerCase().includes("iş makineleri")).map((m: any) => m.egitimAd);
                const isMakDeger = operatorDocs.length > 0 || mykOpNames.length > 0 ? [...new Set([...opEquipmentNames, ...mykOpNames])].join(", ") : "KULLANAMAZ";
                const docYuksekte = empDocsMap[emp.id]?.["yuksekte_calisma"] || null;
                const docSaglik = empDocsMap[emp.id]?.["saglik_raporu"] || null;
                const docIsg = empDocsMap[emp.id]?.["isg_egitim"] || null;
                const docGorevlendirme = empDocsMap[emp.id]?.["gorevlendirme"] || null;
                const yuksekteTarih = docYuksekte?.son_gecerlilik_tarihi || null;
                const saglikTarih = docSaglik?.son_gecerlilik_tarihi || null;
                const isgTarih = docIsg?.son_gecerlilik_tarihi || null;
                const gorevlendirmeTarih = docGorevlendirme?.son_gecerlilik_tarihi || null;

                return (
                  <tr key={emp.id} className="hover:bg-blue-50/40 cursor-pointer" onClick={() => openEditPersonel(emp)}>
                    <td className="px-1.5 py-1 text-center text-gray-600 border border-gray-200">{idx + 1}</td>
                    <td className="px-1.5 py-1 text-left text-gray-800 font-medium border border-gray-200 whitespace-nowrap">{emp.ad} {emp.soyad}</td>
                    <td className={`px-1.5 py-1 text-center border border-gray-200 ${durumRenk(sigDurum).bg} ${durumRenk(sigDurum).text}`}>{sigDurum}</td>
                    <td className="px-1.5 py-1 text-center text-gray-600 border border-gray-200">{emp.hat || emp.ekip_adi || emp.meslek_kodu || "-"}</td>
                    <td className="px-1.5 py-1 text-center text-gray-600 border border-gray-200">{displayDate(emp.ise_giris_tarihi)}</td>
                    <td className="px-1.5 py-1 text-center text-gray-600 border border-gray-200">{maskTC(emp.kimlik_no || "")}</td>
                    <td className="px-1.5 py-1 text-center text-gray-600 border border-gray-200">{emp.telefon || "-"}</td>
                    <td className="px-1.5 py-1 text-center text-gray-600 border border-gray-200">{emp.meslek_kodu || "-"}</td>
                    <td className={`px-1.5 py-1 text-center border border-gray-200 ${durumRenk(mykIzmeDeger).bg} ${durumRenk(mykIzmeDeger).text}`}>{mykIzmeDeger}</td>
                    <td className="px-1.5 py-1 text-center text-gray-600 border border-gray-200">{mykAd}</td>
                    <td className="px-1.5 py-1 text-center text-gray-600 border border-gray-200">{displayDate(mykBitisTarih)}</td>
                    <td className={`px-1.5 py-1 text-center border border-gray-200 ${durumRenk(isMakDeger).bg} ${durumRenk(isMakDeger).text}`}>{isMakDeger}</td>
                    <td className={`px-1.5 py-1 text-center border border-gray-200 ${durumRenk(isgZimmetDeger).bg} ${durumRenk(isgZimmetDeger).text}`}>{isgZimmetDeger}</td>
                    <td className={`px-1.5 py-1 text-center border border-gray-200 ${durumRenk(talimatDeger).bg} ${durumRenk(talimatDeger).text}`}>{talimatDeger}</td>
                    <td className="px-1.5 py-1 text-center text-gray-600 border border-gray-200">{displayDate(yuksekteTarih)}</td>
                    <td className="px-1.5 py-1 text-center text-gray-600 border border-gray-200">{displayDate(saglikTarih)}</td>
                    <td className="px-1.5 py-1 text-center text-gray-600 border border-gray-200">{displayDate(isgTarih)}</td>
                    <td className="px-1.5 py-1 text-center text-gray-600 border border-gray-200">{displayDate(gorevlendirmeTarih)}</td>
                    <td className={`px-1.5 py-1 text-center border border-gray-200 ${kalanGunHesapla(mykBitisTarih).bgCls} ${kalanGunHesapla(mykBitisTarih).textCls}`}>{kalanGunHesapla(mykBitisTarih).text}</td>
                    <td className={`px-1.5 py-1 text-center border border-gray-200 ${kalanGunHesapla(yuksekteTarih).bgCls} ${kalanGunHesapla(yuksekteTarih).textCls}`}>{kalanGunHesapla(yuksekteTarih).text}</td>
                    <td className={`px-1.5 py-1 text-center border border-gray-200 ${kalanGunHesapla(saglikTarih).bgCls} ${kalanGunHesapla(saglikTarih).textCls}`}>{kalanGunHesapla(saglikTarih).text}</td>
                    <td className={`px-1.5 py-1 text-center border border-gray-200 ${kalanGunHesapla(isgTarih).bgCls} ${kalanGunHesapla(isgTarih).textCls}`}>{kalanGunHesapla(isgTarih).text}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Personel Modal */}
      {editingPerson && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{editingPerson.ad} {editingPerson.soyad}</h3>
              <button onClick={() => setEditingPerson(null)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Personel Bilgileri</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-500">GÖREVİ/ALANI</label>
                    <input value={editForm.hat} onChange={e => setEditForm({ ...editForm, hat: e.target.value })} className="w-full p-1.5 border rounded text-xs" placeholder="hat / alan" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500">GÖREV</label>
                    <input value={editForm.meslek_kodu} onChange={e => setEditForm({ ...editForm, meslek_kodu: e.target.value })} className="w-full p-1.5 border rounded text-xs" placeholder="meslek kodu" />
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">MYK Eğitimleri</h4>
                <div className="flex items-center gap-1.5 mb-2">
                  <select value={mykSecim} onChange={e => setMykSecim(e.target.value)} className="flex-1 p-1.5 border rounded text-xs">
                    <option value="">Eğitim seçiniz</option>
                    {mykEgitimListesi.map(eg => <option key={eg.id} value={eg.id}>{eg.ad}</option>)}
                  </select>
                  <input type="date" value={mykSecimTarih} onChange={e => setMykSecimTarih(e.target.value)} className="w-[130px] p-1.5 border rounded text-xs" title="Alma Tarihi" />
                  <select value={mykSecimSure} onChange={e => setMykSecimSure(e.target.value)} className="w-[70px] p-1.5 border rounded text-xs">
                    <option value="">Yıl</option>{[1,2,3,4,5].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <button onClick={addMykToEdit} disabled={!mykSecim} className="bg-blue-600 text-white px-2 py-1.5 rounded text-xs disabled:opacity-50">Ekle</button>
                </div>
                {editForm.mykEgitimler.length === 0 ? <p className="text-xs text-gray-400">Henüz MYK eğitimi eklenmemiş</p> : (
                  <div className="space-y-1">
                    {editForm.mykEgitimler.map((m, i) => {
                      const eg = mykEgitimListesi.find(e => e.id === m.myk_egitim_id);
                      return (
                        <div key={i} className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded">
                          <span className="text-xs">{eg?.ad || m.myk_egitim_id} {m.alis_tarihi && `(${displayDate(m.alis_tarihi)})`} {m.gecerlilik_suresi && `${m.gecerlilik_suresi}y`}</span>
                          <button onClick={() => removeMykFromEdit(i)} className="text-red-500 hover:text-red-700 text-xs">Sil</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t pt-3">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Operatör Sertifikaları (Forklift, Manlift, Vinç vb.)</h4>
                <div className="flex items-center gap-1.5 mb-2">
                  <select value={opTip} onChange={e => setOpTip(e.target.value)} className="flex-1 p-1.5 border rounded text-xs">
                    <option value="">Ekipman seçiniz</option>
                    {OP_SERTIFIKA_TIPLERI.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input type="date" value={opTarih} onChange={e => setOpTarih(e.target.value)} className="w-[130px] p-1.5 border rounded text-xs" title="Geçerlilik Tarihi" />
                  <button onClick={addOperatorCert} disabled={!opTip} className="bg-blue-600 text-white px-2 py-1.5 rounded text-xs disabled:opacity-50">Ekle</button>
                </div>
                {editForm.operatorSertifikalar.length === 0 ? <p className="text-xs text-gray-400">Henüz sertifika eklenmemiş</p> : (
                  <div className="space-y-1">
                    {editForm.operatorSertifikalar.map((s, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded">
                        <span className="text-xs"><strong>{s.tip}</strong> {s.tarih && `(${displayDate(s.tarih)})`}</span>
                        <div className="flex items-center gap-1">
                          <div className="relative">
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="absolute inset-0 opacity-0 w-full cursor-pointer" title={fileUploads[`operator_${i}`]?.name || "Dosya seç"} onChange={e => { const f = e.target.files?.[0]; if (f) { const v = validateFile(f); if (!v.valid) { alert(v.error); return; } setFileUploads(prev => ({ ...prev, [`operator_${i}`]: f })); } }} />
                            <div className="flex items-center gap-1 p-1 border rounded text-xs bg-gray-50 min-w-[80px]">
                              <Upload className="w-3 h-3 text-gray-400" />
                              <span className="truncate text-gray-500 max-w-[60px]">{fileUploads[`operator_${i}`]?.name || "Dosya"}</span>
                            </div>
                          </div>
                          <button onClick={() => removeOperatorCert(i)} className="text-red-500 hover:text-red-700 text-xs">Sil</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t pt-3">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Belge Geçerlilik Tarihleri</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: "yuksekte_calisma", label: "Yüksekte Çalışma", tarih: editForm.yuksekteTarih, setTarih: (v: string) => setEditForm({ ...editForm, yuksekteTarih: v }) },
                    { key: "saglik_raporu", label: "Sağlık Raporu", tarih: editForm.saglikTarih, setTarih: (v: string) => setEditForm({ ...editForm, saglikTarih: v }) },
                    { key: "isg_egitim", label: "İSG Eğitimi", tarih: editForm.isgTarih, setTarih: (v: string) => setEditForm({ ...editForm, isgTarih: v }) },
                    { key: "gorevlendirme", label: "Görevlendirme", tarih: editForm.gorevlendirmeTarih, setTarih: (v: string) => setEditForm({ ...editForm, gorevlendirmeTarih: v }) },
                    { key: "kkd", label: "KKD Zimmet", tarih: editForm.kkdTarih, setTarih: (v: string) => setEditForm({ ...editForm, kkdTarih: v }) },
                  ].map(({ key, label, tarih, setTarih }) => (
                    <div key={key} className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] text-gray-500">{label}</label>
                        <input type="date" value={tarih} onChange={e => setTarih(e.target.value)} className="w-full p-1.5 border rounded text-xs" />
                      </div>
                      <div className="flex-shrink-0">
                        <label className="text-[10px] text-gray-500 block">Dosya</label>
                        <div className="relative">
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="absolute inset-0 opacity-0 w-full cursor-pointer" title={fileUploads[key]?.name || "Dosya seç"} onChange={e => { const f = e.target.files?.[0]; if (f) { const v = validateFile(f); if (!v.valid) { alert(v.error); return; } setFileUploads(prev => ({ ...prev, [key]: f })); } }} />
                          <div className="flex items-center gap-1 p-1.5 border rounded text-xs bg-gray-50 min-w-[100px]">
                            <Upload className="w-3 h-3 text-gray-400" />
                            <span className="truncate text-gray-500 max-w-[80px]">{fileUploads[key]?.name || "Seç"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t">
                <button onClick={() => setEditingPerson(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">İptal</button>
                <button onClick={handleEditSave} disabled={editSaving} className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-1">
                  <Save className="w-4 h-4" />{editSaving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Per-Taşeron Zorunlu Alanlar Modal */}
      {showZorunluModal && selectedTaseron && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Zorunlu Alanlar — {selectedTaseron.firma_adi}</h3>
              <button onClick={() => setShowZorunluModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-gray-500 mb-3">Bu taşerona bağlı personel için zorunlu alanları seçin. Boş bırakılırsa genel ayarlar kullanılır.</p>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {PERSONEL_ZORUNLU_ALANLAR.map((alan) => (
                <label key={alan.key} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" checked={taseronZorunluAlanlar.includes(alan.key)} onChange={() => toggleTaseronZorunlu(alan.key)} className="rounded border-gray-300" />
                  <span className="text-sm text-gray-700">{alan.label}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t mt-4">
              <button onClick={() => setShowZorunluModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">İptal</button>
              <button onClick={saveTaseronZorunlu} disabled={taseronZorunluSaving} className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-1">
                <Save className="w-4 h-4" />{taseronZorunluSaving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Yeni Personel Hızlı Ekleme Modal */}
      {showNewPerson && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Yeni Personel — {selectedTaseron?.firma_adi}</h3>
              <button onClick={() => setShowNewPerson(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleNewPersonSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input required placeholder="Ad" value={newPersonForm.ad} onChange={e => setNewPersonForm({ ...newPersonForm, ad: e.target.value })} className="w-full p-2 border rounded-lg text-sm" />
                <input required placeholder="Soyad" value={newPersonForm.soyad} onChange={e => setNewPersonForm({ ...newPersonForm, soyad: e.target.value })} className="w-full p-2 border rounded-lg text-sm" />
              </div>
              <input placeholder="TC Kimlik No" value={newPersonForm.kimlik_no} onChange={e => setNewPersonForm({ ...newPersonForm, kimlik_no: e.target.value })} className="w-full p-2 border rounded-lg text-sm" />
              <input placeholder="Telefon" value={newPersonForm.telefon} onChange={e => setNewPersonForm({ ...newPersonForm, telefon: e.target.value })} className="w-full p-2 border rounded-lg text-sm" />
              <input placeholder="Meslek Kodu / Görev" value={newPersonForm.meslek_kodu} onChange={e => setNewPersonForm({ ...newPersonForm, meslek_kodu: e.target.value })} className="w-full p-2 border rounded-lg text-sm" />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowNewPerson(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">İptal</button>
                <button type="submit" disabled={newPersonSaving} className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-1">
                  <Save className="w-4 h-4" />{newPersonSaving ? "Ekleniyor..." : "Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Yeni Firma Modal (detail view) */}
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
                        {p.kimlik_no && <span className="text-xs text-gray-400 ml-2">({maskTC(p.kimlik_no)})</span>}
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
