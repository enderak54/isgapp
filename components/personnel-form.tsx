"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  User, Users, Calendar, Briefcase, Phone, Building2, Shield, Heart, FileText, Save, CheckCircle, AlertCircle,
  Upload, X, Paperclip, Eye, Trash2, Image as ImageIcon, FileText as FileDoc, Award
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { sanitize, validateTC } from "@/lib/security";
import { logAudit } from "@/lib/audit";
import { validateFile, validateFileServer, sanitizeFileName, loadFileSizeExemptAreas } from "@/lib/file-validation";
import Link from "next/link";

const toDisplay = (d: string) => d ? d.split("-").reverse().join(".") : "";
const toDb = (d: string) => d ? d.split(".").reverse().join("-") : "";

const BELGE_TIPLERI: Record<string, string> = {
  isgEgitimTarihi: "isg_egitim",
  yuksekteCalisma: "yuksekte_calisma",
  myk: "myk",
  operatorBelgesi: "operator_belgesi",
  kkd: "kkd",
  oryantasyon: "oryantasyon",
  sgkTarihi: "ssk",
  saglikRaporuTarihi: "saglik_raporu",
  sertifika: "sertifika",
  yuksekteCalisamaz: "yuksekte_calisamaz",
  geceCalisamaz: "gece_calisamaz",
  vardiyaliCalisamaz: "vardiyali_calisamaz",
  adliSicil: "adli_sicil",
  gorevlendirme: "gorevlendirme",
  diploma: "diploma",
};

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];

function getFileExt(name: string) { return name.split(".").pop()?.toLowerCase() || ""; }
function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024; const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

interface PendingFile {
  field: string;
  file: File;
  preview?: string;
  label?: string;
}

export default function PersonnelForm() {
  const [form, setForm] = useState({
        kimlikNo: "", ad: "", soyad: "", iseGirisTarihi: "", meslekKodu: "", sgkTarihi: "", telefon: "", hat: "", email: "", ogrenimDurumu: "",
    santiyeAdi: "", ekipId: "", taseronId: "", yuksekteCalisma: "", myk: "", operatorBelgesi: "", kkd: "", oryantasyon: "", isgEgitimTarihi: "",
    sertifika: "", kanGrubu: "", saglikRaporuTarihi: "", kronikRahatsizlik: "", yuksekteCalisir: false, yuksekteCalisamaz: false, geceCalisir: false, geceCalisamaz: false,
    vardiyaliCalisir: false, vardiyaliCalisamaz: false, notlar: ["", "", ""],
    isgEgitimSuresi: "", yuksekteSure: "", mykSure: "", sertifikaSure: "", operatorSure: "", kkdSure: "", oryantasyonSure: "", saglikRaporuSuresi: "",
    adres: "", acilDurumIrtibat: "", acilDurumTelefon: "",
    adliSicil: "", adliSicilTarihi: "", gorevlendirme: "", gorevlendirmeSure: "",
    isAkdiDurumu: "normal",
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [tcError, setTcError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploadModalField, setUploadModalField] = useState<string | null>(null);
  const [uploadDragOver, setUploadDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mykEgitimListesi, setMykEgitimListesi] = useState<any[]>([]);
  const [mykZorunluIds, setMykZorunluIds] = useState<string[]>([]);
  const [mykKayitlar, setMykKayitlar] = useState<{ myk_egitim_id: string; alis_tarihi: string; gecerlilik_suresi: string }[]>([]);
  const [mykSecim, setMykSecim] = useState("");
  const [mykSecimTarih, setMykSecimTarih] = useState("");
  const [mykSecimSure, setMykSecimSure] = useState("");
  const [mykShowAll, setMykShowAll] = useState(false);
  const [diplomaAd, setDiplomaAd] = useState("");
  const [zorunluAlanlar, setZorunluAlanlar] = useState<string[]>(["kimlikNo", "ad", "soyad", "myk"]);
  const [taseronPersonelZorunlu, setTaseronPersonelZorunlu] = useState<string[]>([]);
  const [activeZorunluAlanlar, setActiveZorunluAlanlar] = useState<string[]>([]);
  const [sadeceZorunlu, setSadeceZorunlu] = useState(false);
  const [notModu, setNotModu] = useState<"per_personnel" | "sabit">("per_personnel");
  const [sabitNot, setSabitNot] = useState("");
  const [ekipler, setEkipler] = useState<any[]>([]);
  const [santiyeler, setSantiyeler] = useState<any[]>([]);
  const [selectedSantiyeler, setSelectedSantiyeler] = useState<string[]>([]);
  const [taseronlar, setTaseronlar] = useState<any[]>([]);
  const [hatList, setHatList] = useState<string[]>([]);
  const DEFAULT_HATS = ["Turkcell", "Vodafone", "Türk Telekom", "Netgsm", "Bimcell", "Teknosacell", "Pttcell", "Diğer"];

  const fetchEkipler = async () => {
    const { data } = await supabase.from("ekipler").select("id, ad").eq("aktif", true).order("ad");
    if (data) setEkipler(data);
  };

  const fetchSantiyeler = async () => {
    const { data } = await supabase.from("santiyeler").select("id, ad").order("ad");
    if (data) setSantiyeler(data);
  };

  const fetchTaseronlar = async () => {
    const { data } = await supabase.from("taseronlar").select("id, firma_adi").order("firma_adi");
    if (data) setTaseronlar(data);
  };

  useEffect(() => {
    loadFileSizeExemptAreas();
    fetchEkipler();
    fetchSantiyeler();
    fetchTaseronlar();
    fetchEkipler();
    Promise.all([
      supabase.from("myk_egitim_listesi").select("id, ad").eq("aktif", true),
      supabase.from("ayarlar").select("value").eq("key", "myk_zorunlu_ids").single(),
      supabase.from("ayarlar").select("value").eq("key", "personel_zorunlu_alanalar").single(),
      supabase.from("ayarlar").select("value").eq("key", "taseron_personel_zorunlu_alanlar").single(),
      supabase.from("ayarlar").select("value").eq("key", "hat_listesi").single(),
      supabase.from("ayarlar").select("value").eq("key", "personel_sadece_zorunlu").single(),
      supabase.from("ayarlar").select("value").eq("key", "personel_not_modu").single(),
      supabase.from("ayarlar").select("value").eq("key", "personel_sabit_not").single(),
    ]).then(([egitimRes, ayarRes, zorunluRes, taseronRes, hatRes, sadeceRes, notModuRes, sabitNotRes]) => {
      if (egitimRes.data) setMykEgitimListesi(egitimRes.data);
      if (ayarRes.data?.value) {
        try { setMykZorunluIds(JSON.parse(ayarRes.data.value)); } catch {}
      }
      if (zorunluRes.data?.value) {
        try { setZorunluAlanlar(JSON.parse(zorunluRes.data.value)); } catch {}
      }
      if (taseronRes.data?.value) {
        try { const v = JSON.parse(taseronRes.data.value); if (Array.isArray(v)) setTaseronPersonelZorunlu(v); } catch {}
      }
      if (hatRes.data?.value) {
        try { const v = JSON.parse(hatRes.data.value); if (Array.isArray(v) && v.length > 0) setHatList(v); } catch {}
      }
      if (sadeceRes.data?.value) {
        try { setSadeceZorunlu(JSON.parse(sadeceRes.data.value) === true); } catch {}
      }
      let loadedModu: "per_personnel" | "sabit" = "per_personnel";
      let loadedSabitNot = "";
      if (notModuRes.data?.value) {
        try { const v = JSON.parse(notModuRes.data.value); if (v === "per_personnel" || v === "sabit") { loadedModu = v; setNotModu(v); } } catch {}
      }
      if (sabitNotRes.data?.value) {
        try { loadedSabitNot = JSON.parse(sabitNotRes.data.value); setSabitNot(loadedSabitNot); } catch {}
      }
      if (loadedModu === "sabit" && loadedSabitNot) {
        setForm(prev => ({ ...prev, notlar: [loadedSabitNot] }));
      }
    });
  }, []);

  useEffect(() => {
    const loadActive = async () => {
      let active = [...zorunluAlanlar];
      if (form.taseronId) {
        if (taseronPersonelZorunlu.length > 0) {
          active = [...taseronPersonelZorunlu];
        }
        const { data: taseron } = await supabase.from("taseronlar").select("personel_zorunlu_alanlar").eq("id", form.taseronId).single();
        if (taseron?.personel_zorunlu_alanlar && Array.isArray(taseron.personel_zorunlu_alanlar) && taseron.personel_zorunlu_alanlar.length > 0) {
          active = taseron.personel_zorunlu_alanlar;
        }
      }
      setActiveZorunluAlanlar(active);
    };
    loadActive();
  }, [form.taseronId, taseronPersonelZorunlu, zorunluAlanlar]);

  const mykEkle = () => {
    if (!mykSecim || !mykSecimTarih || !mykSecimSure) return;
    setMykKayitlar(prev => [...prev, { myk_egitim_id: mykSecim, alis_tarihi: mykSecimTarih, gecerlilik_suresi: mykSecimSure }]);
    setMykSecim(""); setMykSecimTarih(""); setMykSecimSure("");
  };

  const mykKaldir = (idx: number) => {
    setMykKayitlar(prev => prev.filter((_, i) => i !== idx));
  };

  const handleTcChange = (value: string) => {
    const numericOnly = value.replace(/\D/g, "").slice(0, 11);
    setForm((prev) => ({ ...prev, kimlikNo: numericOnly }));
    if (numericOnly.length > 0 && numericOnly.length < 11) {
      setTcError("TC Kimlik No 11 haneli olmalıdır");
    } else if (numericOnly.length === 11 && !validateTC(numericOnly)) {
      setTcError("Geçersiz TC Kimlik No");
    } else {
      setTcError("");
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (activeZorunluAlanlar.includes("kimlikNo")) {
      if (form.kimlikNo.length !== 11) newErrors.kimlikNo = "TC Kimlik No 11 haneli olmalıdır";
      else if (!validateTC(form.kimlikNo)) newErrors.kimlikNo = "Geçersiz TC Kimlik No";
    }
    if (activeZorunluAlanlar.includes("ad") && !form.ad.trim()) newErrors.ad = "Ad zorunludur";
    if (activeZorunluAlanlar.includes("soyad") && !form.soyad.trim()) newErrors.soyad = "Soyad zorunludur";
    if (activeZorunluAlanlar.includes("isgEgitimTarihi")) {
      if (!form.isgEgitimTarihi) newErrors.isgEgitimTarihi = "Zorunludur";
      else if (!form.isgEgitimSuresi) newErrors.isgEgitimSuresi = "Süre seçiniz";
    }
    if (activeZorunluAlanlar.includes("yuksekteCalisma")) {
      if (!form.yuksekteCalisma) newErrors.yuksekteCalisma = "Zorunludur";
      else if (!form.yuksekteSure) newErrors.yuksekteSure = "Süre seçiniz";
    }
    if (activeZorunluAlanlar.includes("myk")) {
      const hasMyk = mykKayitlar.length > 0 || !!form.myk || pendingFiles.some(f => f.field === "myk");
      if (!hasMyk) newErrors.myk = "En az bir MYK eğitimi ekleyin";
    }
    if (activeZorunluAlanlar.includes("sertifika")) {
      if (!form.sertifika) newErrors.sertifika = "Zorunludur";
      else if (!form.sertifikaSure) newErrors.sertifikaSure = "Süre seçiniz";
    }
    if (activeZorunluAlanlar.includes("operatorBelgesi")) {
      if (!form.operatorBelgesi) newErrors.operatorBelgesi = "Zorunludur";
      else if (!form.operatorSure) newErrors.operatorSure = "Süre seçiniz";
    }
    if (activeZorunluAlanlar.includes("kkd")) {
      if (!form.kkd) newErrors.kkd = "Zorunludur";
      else if (!form.kkdSure) newErrors.kkdSure = "Süre seçiniz";
    }
    if (activeZorunluAlanlar.includes("oryantasyon")) {
      if (!form.oryantasyon) newErrors.oryantasyon = "Zorunludur";
      else if (!form.oryantasyonSure) newErrors.oryantasyonSure = "Süre seçiniz";
    }
    if (activeZorunluAlanlar.includes("saglikRaporuTarihi")) {
      if (!form.saglikRaporuTarihi) newErrors.saglikRaporuTarihi = "Zorunludur";
      else if (!form.saglikRaporuSuresi) newErrors.saglikRaporuSuresi = "Süre seçiniz";
    }
    if (activeZorunluAlanlar.includes("adliSicil")) {
      const hasFile = pendingFiles.some(f => f.field === "adliSicil");
      if (!hasFile && !form.adliSicilTarihi) newErrors.adliSicilTarihi = "Adli sicil belgesi yükleyin";
    }
    if (activeZorunluAlanlar.includes("gorevlendirme")) {
      const hasFile = pendingFiles.some(f => f.field === "gorevlendirme");
      if (!hasFile && !form.gorevlendirme) newErrors.gorevlendirme = "Görevlendirme belgesi yükleyin";
      else if (form.gorevlendirme && !form.gorevlendirmeSure) newErrors.gorevlendirmeSure = "Süre seçiniz";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleNoteChange = (index: number, value: string) => {
    const newNotes = [...form.notlar];
    newNotes[index] = value;
    setForm((prev) => ({ ...prev, notlar: newNotes }));
  };

  const addFiles = (field: string, files: File[]) => {
    const validated = files.map(f => validateFile(f, "personel-belgeleri")).filter(v => v.valid);
    const validFiles = files.filter((_, i) => validated[i]?.valid);
    if (validated.length !== files.length) {
      setStatus({ type: "error", message: "Bazı dosyalar boyut veya tür nedeniyle reddedildi." });
    }
    if (field === "diploma" && !diplomaAd.trim()) {
      setStatus({ type: "error", message: "Önce evrak adını yazın." });
      return;
    }
    const newFiles: PendingFile[] = validFiles.map(f => ({
      field,
      file: f,
      preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
      label: field === "diploma" ? diplomaAd.trim() : undefined,
    }));
    setPendingFiles(prev => [...prev, ...newFiles]);
    if (field === "diploma") setDiplomaAd("");
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => {
      const f = prev[index];
      if (f?.preview) URL.revokeObjectURL(f.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setUploadDragOver(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setUploadDragOver(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setUploadDragOver(false);
    if (uploadModalField) addFiles(uploadModalField, Array.from(e.dataTransfer.files));
  }, [uploadModalField]);

  const uploadFilesForPersonel = async (personelId: string) => {
    const filesForUpload = pendingFiles.filter(f => f.field && BELGE_TIPLERI[f.field]);
    if (filesForUpload.length === 0) return;
    for (const pf of filesForUpload) {
      const serverValidation = await validateFileServer(pf.file, "personel-belgeleri");
      if (!serverValidation.valid) { console.error(serverValidation.error || "Sunucu doğrulaması başarısız"); continue; }
      const fileExt = getFileExt(pf.file.name);
      const fileName = `${personelId}/${Date.now()}_${sanitizeFileName(pf.file.name)}`;
      const { error: uploadError } = await supabase.storage.from("personel-belgeleri").upload(fileName, pf.file);
      if (uploadError) { console.error("Upload error:", uploadError); continue; }
      const { data: urlData } = supabase.storage.from("personel-belgeleri").getPublicUrl(fileName);
      let sonGecerlilik: string | null = null;
      if (pf.field === "gorevlendirme" && form.gorevlendirme && form.gorevlendirmeSure) {
        const d = new Date(form.gorevlendirme);
        d.setFullYear(d.getFullYear() + parseInt(form.gorevlendirmeSure));
        sonGecerlilik = d.toISOString().split("T")[0];
      }
      if (pf.field === "myk") {
        const mykKayit = mykKayitlar[0];
        if (mykKayit?.alis_tarihi && mykKayit.gecerlilik_suresi) {
          const d = new Date(mykKayit.alis_tarihi);
          d.setFullYear(d.getFullYear() + parseInt(mykKayit.gecerlilik_suresi));
          sonGecerlilik = d.toISOString().split("T")[0];
        } else if (form.myk && form.mykSure) {
          const d = new Date(form.myk);
          d.setFullYear(d.getFullYear() + parseInt(form.mykSure));
          sonGecerlilik = d.toISOString().split("T")[0];
        }
        // Dosya tek başına da geçerli — sonGecerlilik null ise belgesiz kaydedilir
      }
      const { data: belgeData } = await supabase.from("personel_belgeleri").insert({
        personel_id: personelId,
        belge_tipi: BELGE_TIPLERI[pf.field],
        dosya_url: urlData.publicUrl,
        dosya_adi: pf.file.name,
        dosya_uzantisi: fileExt,
        dosya_boyut: pf.file.size,
        son_gecerlilik_tarihi: sonGecerlilik,
        aciklama: pf.label || null,
      }).select();
      if (belgeData?.[0]) await logAudit("personel_belgeleri", "INSERT", belgeData[0].id, null, belgeData[0]);
    }
    setPendingFiles([]);
  };

  const saveMykEgitimler = async (personelId: string) => {
    if (mykKayitlar.length === 0) return;
    const inserts = mykKayitlar.map(k => ({
      personel_id: personelId,
      myk_egitim_id: k.myk_egitim_id,
      alis_tarihi: k.alis_tarihi || null,
      gecerlilik_suresi: k.gecerlilik_suresi ? parseInt(k.gecerlilik_suresi) : null,
    }));
    const { data: mykData } = await supabase.from("personel_myk_egitimleri").insert(inserts).select();
    if (mykData?.length) for (const row of mykData) await logAudit("personel_myk_egitimleri", "INSERT", row.id, null, row);
  };

  const savePersonelSantiyeler = async (personelId: string) => {
    if (selectedSantiyeler.length === 0) return;
    const inserts = selectedSantiyeler.map(santiye_id => ({ personel_id: personelId, santiye_id }));
    const { data: santiyeData } = await supabase.from("personel_santiyeler").insert(inserts).select();
    if (santiyeData?.length) for (const row of santiyeData) await logAudit("personel_santiyeler", "INSERT", row.id, null, row);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      setStatus({ type: "error", message: "Lütfen zorunlu alanları doldurun." });
      const firstErr = document.querySelector<HTMLElement>(".border-red-500");
      firstErr?.scrollIntoView({ behavior: "smooth", block: "center" });
      firstErr?.focus();
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      // Arşivde aynı TC var mı kontrol et
      const { data: arsivKayit } = await supabase.from("personel").select("id, ad, soyad").eq("kimlik_no", sanitize(form.kimlikNo)).eq("arsivde", true).maybeSingle();
      if (arsivKayit) {
        if (!confirm(`UYARI: Bu TC kimlik numarası arşivde "${arsivKayit.ad} ${arsivKayit.soyad}" adına kayıtlıdır. Yine de kaydetmek istiyor musunuz?`)) {
          setLoading(false); return;
        }
      }
      const payload = {
        kimlik_no: sanitize(form.kimlikNo), ad: sanitize(form.ad), soyad: sanitize(form.soyad), ise_giris_tarihi: form.iseGirisTarihi || null,
        meslek_kodu: sanitize(form.meslekKodu), sgk_tarihi: form.sgkTarihi || null, telefon: sanitize(form.telefon), hat: form.hat || null, email: form.email ? sanitize(form.email) : null, ogrenim_durumu: form.ogrenimDurumu ? sanitize(form.ogrenimDurumu) : null,
        santiye_adi: santiyeler.filter(s => selectedSantiyeler.includes(s.id)).map(s => s.ad).join(", ") || null, ekip_id: form.ekipId || null, ekip_adi: ekipler.find(e => e.id === form.ekipId)?.ad || null, taseron_id: form.taseronId || null,
        isg_egitim_tarihi: form.isgEgitimTarihi || null, yuksekte_calisma_tarihi: form.yuksekteCalisma || null, myk_tarihi: form.myk || null,
        operator_belgesi_tarihi: form.operatorBelgesi || null, kkd_tarihi: form.kkd || null,
        oryantasyon_tarihi: form.oryantasyon || null, sertifika_tarihi: form.sertifika || null,
        isg_egitim_gecerlilik_suresi: form.isgEgitimSuresi ? parseInt(form.isgEgitimSuresi) : null,
        yuksekte_calisma_gecerlilik_suresi: form.yuksekteSure ? parseInt(form.yuksekteSure) : null,
        myk_gecerlilik_suresi: form.mykSure ? parseInt(form.mykSure) : null,
        sertifika_gecerlilik_suresi: form.sertifikaSure ? parseInt(form.sertifikaSure) : null,
        operator_belgesi_gecerlilik_suresi: form.operatorSure ? parseInt(form.operatorSure) : null,
        kkd_gecerlilik_suresi: form.kkdSure ? parseInt(form.kkdSure) : null,
        oryantasyon_gecerlilik_suresi: form.oryantasyonSure ? parseInt(form.oryantasyonSure) : null,
        saglik_raporu_gecerlilik_suresi: form.saglikRaporuSuresi ? parseInt(form.saglikRaporuSuresi) : null,
        gorevlendirme_tarihi: form.gorevlendirme || null,
        gorevlendirme_gecerlilik_suresi: form.gorevlendirmeSure ? parseInt(form.gorevlendirmeSure) : null,
        gorevlendirme_gecerlilik_tarihi: form.gorevlendirme && form.gorevlendirmeSure ? (() => { const d = new Date(form.gorevlendirme); d.setFullYear(d.getFullYear() + parseInt(form.gorevlendirmeSure)); return d.toISOString().split("T")[0]; })() : null,
        adli_sicil_tarihi: form.adliSicilTarihi || null,
        kan_grubu: form.kanGrubu || null,
        saglik_raporu_tarihi: form.saglikRaporuTarihi || null, kronik_rahatlik: form.kronikRahatsizlik ? sanitize(form.kronikRahatsizlik) : null,
        yuksekte_calisir: !!form.yuksekteCalisir, yuksekte_calisamaz: !!form.yuksekteCalisamaz,
        gece_calisir: !!form.geceCalisir, gece_calisamaz: !!form.geceCalisamaz,
        vardiyali_calisir: !!form.vardiyaliCalisir, vardiyali_calisamaz: !!form.vardiyaliCalisamaz,
        notlar: form.notlar.map((n) => sanitize(n)).filter((n) => n).join(" | "),
        adres: form.adres ? sanitize(form.adres) : null,
        acil_durum_irtibat: form.acilDurumIrtibat ? sanitize(form.acilDurumIrtibat) : null,
        acil_durum_telefon: form.acilDurumTelefon ? sanitize(form.acilDurumTelefon) : null,
        is_akdi_durumu: form.isAkdiDurumu || "normal",

      };
      const { data, error } = await supabase.from("personel").insert(payload).select();
      if (error) throw error;
      if (data && data[0]) {
        await uploadFilesForPersonel(data[0].id);
        await saveMykEgitimler(data[0].id);
        await savePersonelSantiyeler(data[0].id);
        await logAudit("personel", "INSERT", data[0].id, null, payload);
      }
      setStatus({ type: "success", message: "Personel başarıyla kaydedildi!" });
      setForm({
        kimlikNo: "", ad: "", soyad: "", iseGirisTarihi: "", meslekKodu: "", sgkTarihi: "", telefon: "", hat: "", email: "", ogrenimDurumu: "",
        santiyeAdi: "", ekipId: "", taseronId: "", yuksekteCalisma: "", myk: "", operatorBelgesi: "", kkd: "", oryantasyon: "", isgEgitimTarihi: "",
    sertifika: "", kanGrubu: "", saglikRaporuTarihi: "", kronikRahatsizlik: "", yuksekteCalisir: false, yuksekteCalisamaz: false, geceCalisir: false, geceCalisamaz: false,
        vardiyaliCalisir: false, vardiyaliCalisamaz: false, notlar: ["", "", ""],
        isgEgitimSuresi: "", yuksekteSure: "", mykSure: "", sertifikaSure: "", operatorSure: "", kkdSure: "", oryantasyonSure: "", saglikRaporuSuresi: "",
        adres: "", acilDurumIrtibat: "", acilDurumTelefon: "",
        adliSicil: "", adliSicilTarihi: "", gorevlendirme: "", gorevlendirmeSure: "",
        isAkdiDurumu: "normal",
      });
      setMykKayitlar([]);
      setDiplomaAd("");
      setSelectedSantiyeler([]);
      pendingFiles.forEach(f => { if (f.preview) URL.revokeObjectURL(f.preview); });
      setPendingFiles([]);
    } catch (err: any) {
      setStatus({ type: "error", message: err.message || "Kayıt sırasında hata oluştu." });
    } finally {
      setLoading(false);
    }
  };

  const fieldFileCount = (field: string) => pendingFiles.filter(f => f.field === field).length;

  const belgeFields = [
    { label: "İSG Eğitim Tarihi", field: "isgEgitimTarihi", sureField: "isgEgitimSuresi" },
    { label: "Yüksekte Çalışma", field: "yuksekteCalisma", sureField: "yuksekteSure" },
    { label: "MYK", field: "myk", sureField: "mykSure" },
    { label: "Sertifika", field: "sertifika", sureField: "sertifikaSure" },
    { label: "Operatör Belgesi", field: "operatorBelgesi", sureField: "operatorSure" },
    { label: "KKD", field: "kkd", sureField: "kkdSure" },
    { label: "Oryantasyon", field: "oryantasyon", sureField: "oryantasyonSure" },
    { label: "Görevlendirme", field: "gorevlendirme", sureField: "gorevlendirmeSure" },
  ];

  const sureOptions = [1, 2, 3, 4, 5];
  const isReq = (key: string) => activeZorunluAlanlar.includes(key);

  return (
    <div className="flex-1 p-4 app-bg min-h-screen">
      {status && (
        <div className={`mb-3 p-3 rounded-lg flex items-center gap-2 text-sm ${status.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {status.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{status.message}</span>
        </div>
      )}

      {pendingFiles.length > 0 && (
        <div className="mb-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700 flex items-center gap-2"><Paperclip className="w-4 h-4" /> Bekleyen Dosyalar ({pendingFiles.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {pendingFiles.map((pf, i) => (
              <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-lg text-xs">
                {pf.preview ? <ImageIcon className="w-3 h-3 text-blue-500" /> : <FileDoc className="w-3 h-3 text-amber-500" />}
                <span className="text-gray-700 truncate max-w-32">{pf.file.name}</span>
                <span className="text-gray-400">({formatBytes(pf.file.size)})</span>
                <button onClick={() => removePendingFile(i)} className="text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="flex justify-end items-center gap-3 mb-4">
          <Link href="/personel" className="btn text-sm px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-100">
            <Users className="w-4 h-4" /> Personel Listesi
          </Link>
          <button type="submit" disabled={loading} className="btn btn-primary text-sm px-6 py-2">
            {loading ? "Kaydediliyor..." : "💾 Kaydet"}
          </button>
        </div>
        {form.taseronId && taseronPersonelZorunlu.length > 0 && (
          <div className="mb-3 p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
            ⚠ Taşeron personeli için zorunlu alanlar: {taseronPersonelZorunlu.join(", ")}
          </div>
        )}
        <div className="grid grid-cols-3 gap-4">
          {/* Personel */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              Personel Bilgileri
            </h3>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm text-gray-600 mb-1.5 block">TC Kimlik No{isReq("kimlikNo") && <span className="text-red-500 ml-1">*</span>}</label>
                  <input type="text" inputMode="numeric" value={form.kimlikNo} onChange={(e) => { handleTcChange(e.target.value); setErrors((p) => ({ ...p, kimlikNo: "" })); }} className={`input ${errors.kimlikNo || tcError ? "border-red-500 focus:ring-red-300" : ""}`} placeholder="11 haneli TC kimlik numarası" />
                  {(errors.kimlikNo || tcError) && <p className="text-xs text-red-500 mt-1">{errors.kimlikNo || tcError}</p>}
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1.5 block">İşe Giriş Tarihi</label>
                  <input type="date" value={form.iseGirisTarihi} onChange={(e) => handleChange("iseGirisTarihi", e.target.value)} className="input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Ad{isReq("ad") && <span className="text-red-500 ml-1">*</span>}</label>
                  <input type="text" value={form.ad} onChange={(e) => { handleChange("ad", e.target.value); setErrors((p) => ({ ...p, ad: "" })); }} className={`input ${errors.ad ? "border-red-500" : ""}`} placeholder="Ad" />
                  {errors.ad && <p className="text-xs text-red-500 mt-1">{errors.ad}</p>}
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Soyad{isReq("soyad") && <span className="text-red-500 ml-1">*</span>}</label>
                  <input type="text" value={form.soyad} onChange={(e) => { handleChange("soyad", e.target.value); setErrors((p) => ({ ...p, soyad: "" })); }} className={`input ${errors.soyad ? "border-red-500" : ""}`} placeholder="Soyad" />
                  {errors.soyad && <p className="text-xs text-red-500 mt-1">{errors.soyad}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm text-gray-600 mb-1.5 block">Meslek Kodu</label>
                  <input type="text" value={form.meslekKodu} onChange={(e) => handleChange("meslekKodu", e.target.value)} className="input" placeholder="Meslek Kodu" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1.5 block">SGK Tarihi</label>
                  <div className="flex items-center gap-1">
                    <input type="date" value={form.sgkTarihi} onChange={(e) => handleChange("sgkTarihi", e.target.value)} className="input flex-1" />
                    <button type="button" onClick={() => setUploadModalField("sgkTarihi")} className={`p-1.5 rounded transition relative flex-shrink-0 ${fieldFileCount("sgkTarihi") > 0 ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-gray-600"}`} title="Dosya Ekle">
                      <Paperclip className="w-3.5 h-3.5" />
                      {fieldFileCount("sgkTarihi") > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 text-white text-[8px] rounded-full flex items-center justify-center">{fieldFileCount("sgkTarihi")}</span>}
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-sm text-gray-600 mb-1.5 block">Telefon</label>
                  <input type="text" value={form.telefon} onChange={(e) => handleChange("telefon", e.target.value)} className="input" placeholder="05XX XXX XX XX" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1.5 block">Hat</label>
                  <select value={form.hat} onChange={(e) => handleChange("hat", e.target.value)} className="input text-xs">
                    <option value="">Seçin</option>
                    {(hatList.length > 0 ? hatList : DEFAULT_HATS).map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm text-gray-600 mb-1.5 block">Öğrenim Durumu</label>
                  <select value={form.ogrenimDurumu} onChange={(e) => handleChange("ogrenimDurumu", e.target.value)} className="input">
                    <option value="">Seçiniz...</option>
                    {["İlkokul", "Ortaokul", "Lise", "Önlisans", "Lisans", "Yüksek Lisans", "Doktora"].map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1.5 block">E-posta</label>
                  <input type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} className="input" placeholder="ornek@mail.com" />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1.5 block">Şantiyeler</label>
                <div className="flex flex-wrap gap-1.5">
                  {santiyeler.map(s => {
                    const checked = selectedSantiyeler.includes(s.id);
                    return (
                      <label key={s.id} className={`flex items-center gap-1 px-2.5 py-1.5 rounded border text-sm cursor-pointer transition ${checked ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                        <input type="checkbox" checked={checked} onChange={() => setSelectedSantiyeler(prev => checked ? prev.filter(id => id !== s.id) : [...prev, s.id])} className="sr-only" />
                        {checked ? "✓ " : ""}{s.ad}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1.5 block">Adres</label>
                <textarea value={form.adres} onChange={(e) => handleChange("adres", e.target.value)} className="input h-16 resize-none" placeholder="Ev adresi..." />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1.5 block">Taşeron</label>
                <select value={form.taseronId || ""} onChange={(e) => handleChange("taseronId", e.target.value)} className="input">
                  <option value="">Taşeron Seçin</option>
                  {taseronlar.map(t => <option key={t.id} value={t.id}>{t.firma_adi}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1.5 block">Ekip</label>
                <select value={form.ekipId || ""} onChange={(e) => handleChange("ekipId", e.target.value)} className="input">
                  <option value="">Ekip Seçin</option>
                  {ekipler.map(ek => <option key={ek.id} value={ek.id}>{ek.ad}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm text-gray-600 mb-1.5 block">Acil Durum İrtibat</label>
                  <input type="text" value={form.acilDurumIrtibat} onChange={(e) => handleChange("acilDurumIrtibat", e.target.value)} className="input" placeholder="Yakın akraba adı" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1.5 block">Acil Durum Telefon</label>
                  <input type="text" value={form.acilDurumTelefon} onChange={(e) => handleChange("acilDurumTelefon", e.target.value)} className="input" placeholder="05XX XXX XX XX" />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1.5 block">İş Akdi Durumu</label>
                <select value={form.isAkdiDurumu} onChange={(e) => handleChange("isAkdiDurumu", e.target.value)} className="input">
                  <option value="normal">Normal</option>
                  <option value="sonlandirma_surecinde">Sonlandırma Sürecinde</option>
                  <option value="sonlandi">Sonlandı</option>
                </select>
              </div>
            </div>
          </div>

          {/* İSG */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-gray-400" />
              İSG Eğitimler
            </h3>
            <div className="flex flex-col gap-0">
              {belgeFields.filter(item => !sadeceZorunlu || activeZorunluAlanlar.includes(item.field)).map((item, idx) => {
                const errField = item.field as keyof typeof errors;
                const hasErr = errors[errField as string];
                const fc = fieldFileCount(item.field);
                return item.field === "myk" ? (
                  <div key={item.field} className="px-3 py-2">
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-xs text-gray-700 w-20 shrink-0">{item.label}{isReq(item.field) && <span className="text-red-500 ml-0.5">*</span>}</span>
                      <div className="flex-1 min-w-0">
                        <select value={mykSecim} onChange={(e) => setMykSecim(e.target.value)} className="input text-xs w-full">
                          <option value="">Eğitim seçiniz</option>
                          {mykEgitimListesi.filter(eg => mykZorunluIds.includes(eg.id)).map(eg => <option key={eg.id} value={eg.id}>{eg.ad}</option>)}
                          {mykShowAll && mykEgitimListesi.filter(eg => !mykZorunluIds.includes(eg.id)).length > 0 && <option disabled>──────────</option>}
                          {mykShowAll && mykEgitimListesi.filter(eg => !mykZorunluIds.includes(eg.id)).map(eg => <option key={eg.id} value={eg.id}>{eg.ad}</option>)}
                        </select>
                        {!mykShowAll && mykEgitimListesi.length > mykZorunluIds.length && (
                          <button type="button" onClick={() => setMykShowAll(true)} className="text-[10px] text-blue-500 hover:text-blue-700 mt-0.5">Tümünü Göster ({mykEgitimListesi.length})</button>
                        )}
                        {mykShowAll && (
                          <button type="button" onClick={() => setMykShowAll(false)} className="text-[10px] text-blue-500 hover:text-blue-700 mt-0.5">Sadece Zorunlu Göster</button>
                        )}
                      </div>
                      <input type="date" value={mykSecimTarih} onChange={(e) => setMykSecimTarih(e.target.value)} className="input text-xs" style={{ width: "4.5rem" }} />
                      <select value={mykSecimSure} onChange={(e) => setMykSecimSure(e.target.value)} className="input text-xs" style={{ width: "2.5rem" }}>
                        <option value="">y</option>
                        {sureOptions.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <button type="button" onClick={mykEkle} className="text-blue-600 hover:text-blue-800 p-0.5" title="Ekle"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg></button>
                      <button type="button" onClick={() => setUploadModalField("myk")} className={`p-1 rounded transition relative ${fieldFileCount("myk") > 0 ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-blue-600"}`} title="Dosya Ekle">
                        <Paperclip className="w-3.5 h-3.5" />
                        {fieldFileCount("myk") > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 text-white text-[8px] rounded-full flex items-center justify-center">{fieldFileCount("myk")}</span>}
                      </button>
                    </div>
                    {mykKayitlar.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {mykKayitlar.map((k, i) => {
                          const eg = mykEgitimListesi.find(e => e.id === k.myk_egitim_id);
                          return (
                            <div key={i} className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 border border-blue-100 rounded text-[10px]">
                              <span className="text-blue-700 truncate max-w-24">{eg?.ad || k.myk_egitim_id}</span>
                              <span className="text-blue-400">|</span>
                              <span className="text-blue-600">{k.alis_tarihi || "?"}</span>
                              <span className="text-blue-400">|</span>
                              <span className="text-blue-600">{k.gecerlilik_suresi}y</span>
                              <button type="button" onClick={() => mykKaldir(i)} className="text-red-400 hover:text-red-600 ml-0.5"><X className="w-2.5 h-2.5" /></button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {errors.myk && <p className="text-xs text-red-500 mt-1">{errors.myk}</p>}
                  </div>
                ) : (
                <div className={`flex items-center justify-between px-3 py-2 ${idx % 2 === 0 ? "bg-gray-100" : "bg-white"}`}>
                  <span className="text-xs text-gray-700 w-28">{item.label}{isReq(item.field) && <span className="text-red-500 ml-0.5">*</span>}</span>
                  <div className="flex items-center gap-0.5">
                    <input type="text" inputMode="numeric" placeholder="gg.aa.yyyy" maxLength={10} value={toDisplay(form[item.field as keyof typeof form] as string)} onChange={(e) => { const v = e.target.value.replace(/[^0-9.]/g, ""); handleChange(item.field, toDb(v)); setErrors((p) => ({ ...p, [item.field]: "" })); }} className={`input text-xs ${hasErr ? "border-red-500" : ""}`} style={{ width: "5rem" }} />
                    <button type="button" onClick={() => { const picker = document.getElementById(`dp-${item.field}`) as HTMLInputElement; if (!picker) return; const rect = (document.getElementById(`dp-btn-${item.field}`) as HTMLElement).getBoundingClientRect(); picker.style.position = "fixed"; picker.style.left = rect.left + "px"; picker.style.top = rect.top + "px"; picker.style.width = "1px"; picker.style.height = "1px"; picker.style.opacity = "0"; picker.style.display = "block"; picker.focus(); picker.showPicker(); }} id={`dp-btn-${item.field}`} className="text-gray-400 hover:text-gray-600 p-0.5"><Calendar className="w-3.5 h-3.5" /></button>
                    <input id={`dp-${item.field}`} type="date" className="hidden" value={form[item.field as keyof typeof form] as string} onChange={(e) => { handleChange(item.field, e.target.value); }} onBlur={(e) => { e.currentTarget.style.display = "none"; }} />
                    <select value={form[item.sureField as keyof typeof form] as string} onChange={(e) => { handleChange(item.sureField, e.target.value); setErrors((p) => ({ ...p, [item.sureField]: "" })); }} className={`input text-xs ${errors[item.sureField] ? "border-red-500" : ""}`} style={{ width: "3.5rem" }}>
                      <option value="">yıl</option>
                      {sureOptions.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <button type="button" onClick={() => setUploadModalField(item.field)} className={`p-1 rounded transition relative ${fc > 0 ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-gray-600"}`} title="Dosya Ekle">
                      <Paperclip className="w-3.5 h-3.5" />
                      {fc > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 text-white text-[8px] rounded-full flex items-center justify-center">{fc}</span>}
                    </button>
                  </div>
                  {hasErr && <p className="text-xs text-red-500">{hasErr}</p>}
                </div>
                );
              })}
            </div>

            {/* Belge Alanları */}
            {["adliSicil"].filter(field => !sadeceZorunlu || activeZorunluAlanlar.includes(field)).map(field => {
              const fc = fieldFileCount(field);
              return (
                <div key={field} className="flex items-center justify-between px-3 py-2">
                  <span className="text-xs text-gray-700 w-28">Adli Sicil{isReq("adliSicil") && <span className="text-red-500 ml-0.5">*</span>}</span>
                  <div className="flex items-center gap-0.5">
                    <input type="text" inputMode="numeric" placeholder="gg.aa.yyyy" maxLength={10} value={toDisplay(form.adliSicilTarihi)} onChange={(e) => { const v = e.target.value.replace(/[^0-9.]/g, ""); handleChange("adliSicilTarihi", toDb(v)); setErrors((p) => ({ ...p, adliSicilTarihi: "" })); }} className={`input text-xs ${(errors as any).adliSicilTarihi ? "border-red-500" : ""}`} style={{ width: "5rem" }} title="Evrak Tarihi" />
                    <button type="button" onClick={() => { const picker = document.getElementById("dp-adliSicil") as HTMLInputElement; if (!picker) return; const rect = (document.getElementById("dp-btn-adliSicil") as HTMLElement).getBoundingClientRect(); picker.style.position = "fixed"; picker.style.left = rect.left + "px"; picker.style.top = rect.top + "px"; picker.style.width = "1px"; picker.style.height = "1px"; picker.style.opacity = "0"; picker.style.display = "block"; picker.focus(); picker.showPicker(); }} id="dp-btn-adliSicil" className="text-gray-400 hover:text-gray-600 p-0.5"><Calendar className="w-3.5 h-3.5" /></button>
                    <input id="dp-adliSicil" type="date" className="hidden" value={form.adliSicilTarihi} onChange={(e) => handleChange("adliSicilTarihi", e.target.value)} onBlur={(e) => { e.currentTarget.style.display = "none"; }} />
                    <button type="button" onClick={() => setUploadModalField(field)} className={`p-1.5 rounded transition relative ${fc > 0 ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-gray-600"}`} title="Dosya Ekle">
                      <Paperclip className="w-3.5 h-3.5" />
                      {fc > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 text-white text-[8px] rounded-full flex items-center justify-center">{fc}</span>}
                    </button>
                  </div>
                  {(errors as any).adliSicilTarihi && <p className="text-xs text-red-500">{(errors as any).adliSicilTarihi}</p>}
                </div>
              );
            })}
            {/* İSG Dosya Grid — diploma hariç (ayrı kartta gösterilir) */}
            {pendingFiles.filter(f => BELGE_TIPLERI[f.field] && BELGE_TIPLERI[f.field] !== "saglik_raporu" && f.field !== "diploma").length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h4 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1"><Paperclip className="w-3 h-3" /> Eklenen Belgeler</h4>
                <div className="grid grid-cols-2 gap-2">
                  {pendingFiles.filter(f => BELGE_TIPLERI[f.field] && BELGE_TIPLERI[f.field] !== "saglik_raporu" && f.field !== "diploma").map((pf, i) => {
                    const globalIdx = pendingFiles.indexOf(pf);
                    const label = belgeFields.find(b => b.field === pf.field)?.label || pf.field;
                    return (
                      <div key={i} className="card p-2 flex items-center gap-2">
                        {pf.preview ? <img src={pf.preview} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" /> : <div className="w-10 h-10 rounded bg-amber-50 flex items-center justify-center flex-shrink-0"><FileDoc className="w-5 h-5 text-amber-500" /></div>}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">{pf.file.name}</p>
                          <p className="text-[10px] text-gray-400">{label} • {formatBytes(pf.file.size)}</p>
                        </div>
                        <button type="button" onClick={() => removePendingFile(globalIdx)} className="text-red-400 hover:text-red-600 flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
              {/* Diploma ve Diğer Sertifikalar — orta alan altında (kaydırmasız) */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2"><Award className="w-3 h-3 text-gray-400" />Diploma/Sertifika (Süresiz)</h4>
                <div className="flex items-center gap-1.5">
                  <input type="text" value={diplomaAd} onChange={(e) => setDiplomaAd(e.target.value)} placeholder="Evrak adı (ör. Lise Diploması, Forklift Sertifikası)" className="input text-xs flex-1" />
                  <button type="button" onClick={() => setUploadModalField("diploma")} className="p-1.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100" title="PDF Ekle"><Paperclip className="w-3.5 h-3.5" /></button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Evrak adını yazıp PDF ekleyin. Süre istenmez.</p>
                {pendingFiles.filter(f => f.field === "diploma").length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {pendingFiles.filter(f => f.field === "diploma").map((pf) => {
                      const globalIdx = pendingFiles.indexOf(pf);
                      return (
                        <div key={globalIdx} className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 border border-amber-100 rounded text-xs">
                          <FileDoc className="w-3 h-3 text-amber-500" />
                          <span className="font-medium text-gray-700">{pf.label || pf.file.name}</span>
                          <span className="text-gray-400">({pf.file.name})</span>
                          <button type="button" onClick={() => removePendingFile(globalIdx)} className="text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
          </div>

          {/* Sağlık */}
          <div className={`card p-4 ${sadeceZorunlu && !activeZorunluAlanlar.includes("saglikRaporuTarihi") ? "hidden" : ""}`}>
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Heart className="w-4 h-4 text-gray-400" />
              Sağlık Durumu
            </h3>
            <div className="space-y-2">
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Sağlık Raporu Tarihi{isReq("saglikRaporuTarihi") && <span className="text-red-500 ml-1">*</span>}</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-0.5">
                    <input type="text" inputMode="numeric" placeholder="gg.aa.yyyy" maxLength={10} value={toDisplay(form.saglikRaporuTarihi)} onChange={(e) => { const v = e.target.value.replace(/[^0-9.]/g, ""); handleChange("saglikRaporuTarihi", toDb(v)); setErrors((p) => ({ ...p, saglikRaporuTarihi: "" })); }} className={`input text-xs ${errors.saglikRaporuTarihi ? "border-red-500" : ""}`} style={{ width: "5rem" }} />
                    <button type="button" onClick={() => { const picker = document.getElementById("dp-saglikRaporu") as HTMLInputElement; if (!picker) return; const rect = (document.getElementById("dp-btn-saglikRaporu") as HTMLElement).getBoundingClientRect(); picker.style.position = "fixed"; picker.style.left = rect.left + "px"; picker.style.top = rect.top + "px"; picker.style.width = "1px"; picker.style.height = "1px"; picker.style.opacity = "0"; picker.style.display = "block"; picker.focus(); picker.showPicker(); }} id="dp-btn-saglikRaporu" className="text-gray-400 hover:text-gray-600 p-0.5"><Calendar className="w-3.5 h-3.5" /></button>
                    <input id="dp-saglikRaporu" type="date" className="hidden" value={form.saglikRaporuTarihi} onChange={(e) => handleChange("saglikRaporuTarihi", e.target.value)} onBlur={(e) => { e.currentTarget.style.display = "none"; }} />
                    <select value={form.saglikRaporuSuresi} onChange={(e) => { handleChange("saglikRaporuSuresi", e.target.value); setErrors((p) => ({ ...p, saglikRaporuSuresi: "" })); }} className={`input text-xs ${errors.saglikRaporuSuresi ? "border-red-500" : ""}`} style={{ width: "3.5rem" }}>
                      <option value="">yıl</option>
                      {sureOptions.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <button type="button" onClick={() => setUploadModalField("saglikRaporuTarihi")} className={`p-1 rounded transition relative ${fieldFileCount("saglikRaporuTarihi") > 0 ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-gray-600"}`} title="Dosya Ekle">
                      <Paperclip className="w-3.5 h-3.5" />
                      {fieldFileCount("saglikRaporuTarihi") > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 text-white text-[8px] rounded-full flex items-center justify-center">{fieldFileCount("saglikRaporuTarihi")}</span>}
                    </button>
                  </div>
                  {errors.saglikRaporuTarihi && <p className="text-xs text-red-500">{errors.saglikRaporuTarihi}</p>}

                  {/* Sağlık Raporu Dosya Grid */}
                  {pendingFiles.filter(f => f.field === "saglikRaporuTarihi").length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-[10px] font-semibold text-gray-400 mb-1.5">Sağlık Raporu Dosyaları</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {pendingFiles.filter(f => f.field === "saglikRaporuTarihi").map((pf, i) => {
                          const globalIdx = pendingFiles.indexOf(pf);
                          return (
                            <div key={i} className="card p-1.5 flex items-center gap-1.5">
                              {pf.preview ? <img src={pf.preview} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" /> : <div className="w-8 h-8 rounded bg-amber-50 flex items-center justify-center flex-shrink-0"><FileDoc className="w-4 h-4 text-amber-500" /></div>}
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-medium text-gray-800 truncate">{pf.file.name}</p>
                                <p className="text-[9px] text-gray-400">{formatBytes(pf.file.size)}</p>
                              </div>
                              <button type="button" onClick={() => removePendingFile(globalIdx)} className="text-red-400 hover:text-red-600 flex-shrink-0"><X className="w-3 h-3" /></button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {[
                    { label: "Yüksekte", canWork: "yuksekteCalisir", cannotWork: "yuksekteCalisamaz", uploadField: "yuksekteCalisamaz" },
                    { label: "Gece", canWork: "geceCalisir", cannotWork: "geceCalisamaz", uploadField: "geceCalisamaz" },
                    { label: "Vardiyalı", canWork: "vardiyaliCalisir", cannotWork: "vardiyaliCalisamaz", uploadField: "vardiyaliCalisamaz" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-4 text-sm">
                      <span className="text-xs text-gray-700 w-20">{item.label}</span>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name={item.label} checked={form[item.canWork as keyof typeof form] as boolean} onChange={() => { handleChange(item.canWork, true); handleChange(item.cannotWork, false); }} className="w-4 h-4 accent-gray-600" />
                        <span className="text-gray-600">Çalışır</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name={item.label} checked={form[item.cannotWork as keyof typeof form] as boolean} onChange={() => { handleChange(item.cannotWork, true); handleChange(item.canWork, false); }} className="w-4 h-4 accent-gray-600" />
                        <span className="text-gray-600">Çalışamaz</span>
                      </label>
                      <button type="button" onClick={() => setUploadModalField(item.uploadField)} className={`p-1 rounded transition relative ${fieldFileCount(item.uploadField) > 0 ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-gray-600"}`} title="Dosya Ekle">
                        <Paperclip className="w-3.5 h-3.5" />
                        {fieldFileCount(item.uploadField) > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 text-white text-[8px] rounded-full flex items-center justify-center">{fieldFileCount(item.uploadField)}</span>}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1.5 block">Kan Grubu</label>
                <select value={form.kanGrubu} onChange={(e) => handleChange("kanGrubu", e.target.value)} className="input">
                  <option value="">Seçiniz...</option>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "0+", "0-"].map((kg) => <option key={kg} value={kg}>{kg}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1.5 block">Kronik Rahatsızlık</label>
                <textarea value={form.kronikRahatsizlik} onChange={(e) => handleChange("kronikRahatsizlik", e.target.value)} className="input h-20 resize-none" placeholder="Varsa kronik rahatsızlıkları yazınız..." />
              </div>
            </div>
          </div>
        </div>

        {/* Notlar */}
        <div className="card p-3 mt-3">
          <button type="button" onClick={() => setShowNotes(!showNotes)} className="w-full flex items-center justify-between text-sm font-semibold text-gray-800">
            <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-gray-400" /> Notlar</div>
            <span className="text-gray-400">{showNotes ? "▼" : "▶"}</span>
          </button>
          {showNotes && (
            <div className={notModu === "sabit" ? "" : "grid grid-cols-3 gap-2 mt-2"}>
              {notModu === "sabit" ? (
                <textarea value={form.notlar[0] || sabitNot} onChange={(e) => {
                  const newNotes = [e.target.value];
                  setForm((prev) => ({ ...prev, notlar: newNotes }));
                }} placeholder="Not..." className="input h-16 resize-none text-xs mt-2" />
              ) : (
                form.notlar.map((note, index) => (
                  <textarea key={index} value={note} onChange={(e) => handleNoteChange(index, e.target.value)} placeholder="Not ekle..." className="input h-16 resize-none text-xs" />
                ))
              )}
            </div>
          )}
        </div>
      </form>

      {/* Dosya Yükleme Modal */}
      {uploadModalField && (
        <div className="modal-overlay" onClick={() => { setUploadModalField(null); setUploadDragOver(false); }}>
          <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Dosya Ekle — {belgeFields.find(b => b.field === uploadModalField)?.label || ({ yuksekteCalisamaz: "Yüksekte Çalışamaz", geceCalisamaz: "Gece Çalışamaz", vardiyaliCalisamaz: "Vardiyalı Çalışamaz" } as Record<string, string>)[uploadModalField] || "Sağlık Raporu"}</h3>
              <button onClick={() => { setUploadModalField(null); setUploadDragOver(false); }}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="modal-body">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${uploadDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"}`}
              >
                <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf" onChange={(e) => { if (e.target.files) addFiles(uploadModalField, Array.from(e.target.files)); e.target.value = ""; }} className="hidden" />
                <Upload className={`w-10 h-10 mx-auto mb-2 ${uploadDragOver ? "text-blue-500" : "text-gray-400"}`} />
                <p className="text-sm text-gray-600 font-medium">Sürükle-bırak veya tıklayarak seç</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF, WebP, PDF</p>
              </div>
              {pendingFiles.filter(f => f.field === uploadModalField).length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium text-gray-500">Seçili dosyalar:</p>
                  {pendingFiles.filter(f => f.field === uploadModalField).map((pf, i) => {
                    const globalIdx = pendingFiles.indexOf(pf);
                    return (
                      <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        {pf.preview ? <img src={pf.preview} alt="" className="w-8 h-8 rounded object-cover" /> : <FileDoc className="w-6 h-6 text-amber-500" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">{pf.file.name}</p>
                          <p className="text-[10px] text-gray-400">{formatBytes(pf.file.size)}</p>
                        </div>
                        <button onClick={() => removePendingFile(globalIdx)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-3">💾 Dosyalar personel kaydedildiğinde otomatik yüklenecek</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
