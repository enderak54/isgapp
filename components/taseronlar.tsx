"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeForm } from "@/lib/security";
import { validateFile, sanitizeFileName } from "@/lib/file-validation";
import { logAudit } from "@/lib/audit";
import { displayDate } from "@/lib/tarih";
import Link from "next/link";
import { HardHat, Plus, Edit, Trash2, Search, X, Save, Lock, Unlock, ArrowLeft, Users, Upload, FileText, CheckCircle, ExternalLink, Eye } from "lucide-react";

const DURUM_RENK: Record<string, string> = {
  beklemede: "bg-yellow-100 text-yellow-700",
  onaylandi: "bg-green-100 text-green-700",
  reddedildi: "bg-red-100 text-red-700",
};

function kalanGun(tarih: string): { text: string; cls: string } {
  if (!tarih) return { text: "-", cls: "text-gray-400" };
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const t = new Date(tarih); t.setHours(0, 0, 0, 0);
  const diff = Math.ceil((t.getTime() - now.getTime()) / 86400000);
  if (diff < 0) return { text: `${Math.abs(diff)} gün geçmiş`, cls: "text-red-600 font-semibold" };
  if (diff === 0) return { text: "Son gün", cls: "text-red-500 font-semibold" };
  if (diff <= 30) return { text: `${diff} gün`, cls: "text-amber-600" };
  return { text: `${diff} gün`, cls: "text-green-600" };
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

  // Detail view
  const [selectedTaseron, setSelectedTaseron] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [docsByEmp, setDocsByEmp] = useState<Record<string, Record<string, any>>>({});
  const [allDocs, setAllDocs] = useState<Record<string, any[]>>({});
  const [empLoading, setEmpLoading] = useState(false);

  // Cell modal (click on a cell to view/manage documents for that type)
  const [cellModal, setCellModal] = useState<{ emp: any; tip: string; docs: any[] } | null>(null);

  // Upload inside cell modal
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadExpiry, setUploadExpiry] = useState("");
  const [uploading, setUploading] = useState(false);

  // Reject
  const [rejectDoc, setRejectDoc] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");

  const SUTUNLAR = [
    { key: "myk", label: "MYK" },
    { key: "saglik_raporu", label: "Sağlık Raporu" },
    { key: "isg_egitim", label: "İSG Eğitimi" },
    { key: "yuksekte_calisma", label: "Yüksekte Çalışma" },
    { key: "kkd", label: "KKD Zimmet" },
    { key: "adli_sicil", label: "Adli Sicil" },
    { key: "gorevlendirme", label: "Görevlendirme" },
  ] as const;

  useEffect(() => { fetchTaseronlar(); fetchSantiyeler(); }, []);

  const toggleLock = (id: string) => {
    setLocked(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
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

  const openCompany = async (t: any) => {
    setSelectedTaseron(t);
    setEmpLoading(true);
    const { data: emp } = await supabase.from("personel")
      .select("id, ad, soyad, kimlik_no, telefon, sgk_tarihi, ise_giris_tarihi")
      .eq("taseron_id", t.id).eq("arsivde", false).order("ad");
    if (emp) {
      setEmployees(emp);
      if (emp.length > 0) {
        const ids = emp.map(e => e.id);
        const { data: allDocs } = await supabase.from("personel_belgeleri")
          .select("*").in("personel_id", ids).order("eklenme_tarihi", { ascending: false });
        const grouped: Record<string, Record<string, any>> = {};
        const allGrouped: Record<string, any[]> = {};
        for (const e of emp) {
          const latestMap: Record<string, any> = {};
          const empDocs = (allDocs || []).filter(d => d.personel_id === e.id);
          allGrouped[e.id] = empDocs;
          for (const d of empDocs) {
            if (!latestMap[d.belge_tipi]) latestMap[d.belge_tipi] = d;
          }
          grouped[e.id] = latestMap;
        }
        setDocsByEmp(grouped);
        setAllDocs(allGrouped);
      }
    }
    setEmpLoading(false);
  };

  const closeCompany = () => { setSelectedTaseron(null); setEmployees([]); setDocsByEmp({}); setAllDocs({}); setCellModal(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) await supabase.from("taseronlar").update(sanitizeForm(form)).eq("id", editing.id);
    else await supabase.from("taseronlar").insert(sanitizeForm(form));
    setShowForm(false); setEditing(null); setForm({ firma_adi: "", yetkili: "", telefon: "", email: "", adres: "", vergi_no: "", santiye_id: "", durum: "aktif", notlar: "" });
    fetchTaseronlar();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu taşeronu silmek istediğinize emin misiniz?")) return;
    await supabase.from("taseronlar").delete().eq("id", id);
    fetchTaseronlar();
  };

  const handleUpload = async (empId: string, tip: string) => {
    if (!uploadFile) return;
    const v = validateFile(uploadFile);
    if (!v.valid) { alert(v.error); return; }
    setUploading(true);
    try {
      const fileName = `${Date.now()}_${sanitizeFileName(uploadFile.name)}`;
      const { error: upErr } = await supabase.storage.from("personel-belgeleri").upload(fileName, uploadFile);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("personel-belgeleri").getPublicUrl(fileName);
      const { error: dbErr } = await supabase.from("personel_belgeleri").insert({
        personel_id: empId, belge_tipi: tip, dosya_url: urlData.publicUrl,
        dosya_adi: uploadFile.name, dosya_uzantisi: uploadFile.name.split(".").pop(),
        dosya_boyut: uploadFile.size, onay_durumu: "beklemede", son_gecerlilik_tarihi: uploadExpiry || null,
      });
      if (dbErr) throw dbErr;
      await logAudit("personel_belgeleri", "INSERT", empId, null, { belge_tipi: tip, dosya_adi: uploadFile.name });
      setUploadFile(null); setUploadExpiry("");
      if (selectedTaseron) openCompany(selectedTaseron);
    } catch (e: any) { alert(e.message); }
    finally { setUploading(false); }
  };

  const handleApprove = async (doc: any) => {
    await supabase.from("personel_belgeleri").update({ onay_durumu: "onaylandi", onay_tarihi: new Date().toISOString() }).eq("id", doc.id);
    await logAudit("personel_belgeleri", "UPDATE", doc.id, doc, { onay_durumu: "onaylandi" });
    if (selectedTaseron) openCompany(selectedTaseron);
  };

  const handleReject = async () => {
    if (!rejectDoc) return;
    await supabase.from("personel_belgeleri").update({ onay_durumu: "reddedildi", red_aciklama: rejectReason }).eq("id", rejectDoc.id);
    await logAudit("personel_belgeleri", "UPDATE", rejectDoc.id, rejectDoc, { onay_durumu: "reddedildi", red_aciklama: rejectReason });
    setRejectDoc(null); setRejectReason("");
    if (selectedTaseron) openCompany(selectedTaseron);
  };

  const handleDeleteDoc = async (doc: any) => {
    if (!confirm("Bu dökümanı silmek istediğinize emin misiniz?")) return;
    await supabase.from("personel_belgeleri").delete().eq("id", doc.id);
    await logAudit("personel_belgeleri", "DELETE", doc.id, doc, null);
    if (selectedTaseron) openCompany(selectedTaseron);
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
          <button onClick={() => { setShowForm(true); setEditing(null); setForm({ firma_adi: "", yetkili: "", telefon: "", email: "", adres: "", vergi_no: "", santiye_id: "", durum: "aktif", notlar: "" }); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
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
                    <HardHat className="w-5 h-5 text-orange-600" />
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
                  <button onClick={() => { setEditing(t); setForm({ firma_adi: t.firma_adi, yetkili: t.yetkili || "", telefon: t.telefon || "", email: t.email || "", adres: t.adres || "", vergi_no: t.vergi_no || "", santiye_id: t.santiye_id || "", durum: t.durum, notlar: t.notlar || "" }); setShowForm(true); }} className="text-green-600 hover:bg-green-50 py-1 px-2 rounded text-sm"><Edit className="w-4 h-4" /></button>
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

  /** Render a cell value for a document type */
  function cellContent(empId: string, tip: string) {
    const doc = docsByEmp[empId]?.[tip];
    if (!doc) return <span className="text-gray-300">-</span>;
    const kg = doc.son_gecerlilik_tarihi ? kalanGun(doc.son_gecerlilik_tarihi) : null;
    if (doc.onay_durumu === "onaylandi") {
      return (
        <div className="flex flex-col items-center gap-0.5">
          {doc.son_gecerlilik_tarihi && <span className={`text-xs font-medium ${kg?.cls || "text-gray-600"}`}>{displayDate(doc.son_gecerlilik_tarihi)}</span>}
          {kg && <span className={`text-[10px] ${kg.cls}`}>{kg.text}</span>}
        </div>
      );
    }
    if (doc.onay_durumu === "beklemede") {
      return <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">Bekliyor</span>;
    }
    if (doc.onay_durumu === "reddedildi") {
      return <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded" title={doc.red_aciklama || ""}>Red</span>;
    }
    return <span className="text-gray-300">-</span>;
  }

  // Company Detail View
  return (
    <div className="flex-1 p-6 bg-gray-50 min-h-screen">
      <button onClick={closeCompany} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Firma Listesine Dön
      </button>

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center gap-3">
          <HardHat className="w-8 h-8 text-orange-600" />
          <div>
            <h2 className="text-xl font-bold">{selectedTaseron.firma_adi}</h2>
            <p className="text-sm text-gray-500">{selectedTaseron.yetkili} • {selectedTaseron.telefon} • {selectedTaseron.email}</p>
          </div>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <div className="px-4 py-3 border-b flex justify-between items-center">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2"><Users className="w-5 h-5" /> Çalışanlar ({employees.length})</h3>
          <Link href="/personel" className="text-xs text-blue-600 hover:underline">Personel Yönetimi</Link>
        </div>

        {empLoading ? (
          <div className="text-center py-8 text-gray-400">Yükleniyor...</div>
        ) : employees.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Bu firmaya ait personel bulunmuyor</p>
            <p className="text-xs mt-1">Personel eklemek için Personel sayfasından Taşeron seçin</p>
          </div>
        ) : (
          <table className="w-full min-w-[1200px]">
            <thead>
              <tr>
                <th rowSpan={2} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 bg-gray-50 border-r whitespace-nowrap sticky left-0 z-10">Adı Soyadı</th>
                <th rowSpan={2} className="px-3 py-2 text-center text-xs font-semibold text-gray-700 bg-gray-50 border-r whitespace-nowrap">SGK Girişi</th>
                {SUTUNLAR.map(s => (
                  <th key={s.key} colSpan={2} className="px-3 py-2 text-center text-xs font-semibold text-gray-700 bg-gray-50 border-r whitespace-nowrap">{s.label}</th>
                ))}
                <th rowSpan={2} className="px-3 py-2 text-center text-xs font-semibold text-gray-700 bg-gray-50 whitespace-nowrap">Giriş Durumu</th>
              </tr>
              <tr>
                {SUTUNLAR.map(s => (
                  <React.Fragment key={s.key}>
                    <th className="px-1 py-1 text-[10px] text-gray-400 bg-gray-50 border-r font-normal">Tarih / Durum</th>
                    <th className="px-1 py-1 text-[10px] text-gray-400 bg-gray-50 border-r font-normal">Dosya</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employees.map((emp) => {
                const empDocs = docsByEmp[emp.id] || {};
                return (
                  <tr key={emp.id} className="hover:bg-blue-50/40 transition">
                    <td className="px-3 py-2 text-sm font-medium text-gray-800 border-r sticky left-0 bg-white whitespace-nowrap">{emp.ad} {emp.soyad}</td>
                    <td className="px-3 py-2 text-center text-xs text-gray-600 border-r">{displayDate(emp.sgk_tarihi)}</td>
                    {SUTUNLAR.map(s => {
                      const doc = empDocs[s.key];
                      return (
                        <React.Fragment key={s.key}>
                          <td className="px-2 py-2 text-center border-r cursor-pointer hover:bg-blue-100/50" onClick={() => setCellModal({ emp, tip: s.key, docs: (allDocs[emp.id] || []).filter(d => d.belge_tipi === s.key) })}>
                            {cellContent(emp.id, s.key)}
                          </td>
                          <td className="px-2 py-2 text-center border-r">
                            {doc ? (
                              <a href={doc.dosya_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 inline-flex" title={doc.dosya_adi}>
                                <FileText className="w-3.5 h-3.5" />
                              </a>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        </React.Fragment>
                      );
                    })}
                    <td className="px-3 py-2 text-center text-xs text-gray-600">{displayDate(emp.ise_giris_tarihi)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Cell Modal - document detail/upload for a specific employee+type */}
      {cellModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{cellModal.emp.ad} {cellModal.emp.soyad} - {SUTUNLAR.find(s => s.key === cellModal.tip)?.label || cellModal.tip}</h3>
              <button onClick={() => setCellModal(null)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>

            {/* Upload */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 flex-wrap">
                <input type="file" onChange={e => setUploadFile(e.target.files?.[0] || null)} className="text-xs flex-1 min-w-[200px]" />
                <input type="date" value={uploadExpiry} onChange={e => setUploadExpiry(e.target.value)} className="text-xs p-1 border rounded" title="Son Geçerlilik Tarihi" />
                <button onClick={() => handleUpload(cellModal.emp.id, cellModal.tip)} disabled={!uploadFile || uploading} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"><Upload className="w-3.5 h-3.5" />{uploading ? "Yükleniyor..." : "Yükle"}</button>
              </div>
            </div>

            {/* Document list */}
            {cellModal.docs.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-6">Henüz döküman yüklenmemiş</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b">
                    <th className="text-left py-1.5">Dosya</th>
                    <th className="text-left py-1.5">Yüklenme</th>
                    <th className="text-center py-1.5">Durum</th>
                    <th className="text-center py-1.5">Geçerlilik</th>
                    <th className="text-center py-1.5">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cellModal.docs.map((doc: any) => {
                    const kg = kalanGun(doc.son_gecerlilik_tarihi);
                    return (
                      <tr key={doc.id}>
                        <td className="py-1.5 pr-2">
                          <div className="flex items-center gap-1">
                            <FileText className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="truncate max-w-[180px] block" title={doc.dosya_adi}>{doc.dosya_adi}</span>
                            <a href={doc.dosya_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 shrink-0"><ExternalLink className="w-3 h-3" /></a>
                          </div>
                        </td>
                        <td className="py-1.5 text-gray-500">{displayDate(doc.eklenme_tarihi?.split("T")[0])}</td>
                        <td className="py-1.5 text-center">
                          <span className={`px-1.5 py-0.5 rounded ${DURUM_RENK[doc.onay_durumu] || "bg-gray-100 text-gray-600"}`}>
                            {doc.onay_durumu === "reddedildi" && doc.red_aciklama ? (
                              <span title={doc.red_aciklama} className="cursor-help">{doc.onay_durumu}</span>
                            ) : doc.onay_durumu}
                          </span>
                        </td>
                        <td className={`py-1.5 text-center ${kg.cls}`}>{kg.text}</td>
                        <td className="py-1.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {doc.onay_durumu === "beklemede" && (
                              <>
                                <button onClick={() => { handleApprove(doc); setCellModal(null); }} className="text-green-600 hover:bg-green-50 p-0.5 rounded" title="Onayla"><CheckCircle className="w-3.5 h-3.5" /></button>
                                <button onClick={() => setRejectDoc(doc)} className="text-red-600 hover:bg-red-50 p-0.5 rounded" title="Reddet"><X className="w-3.5 h-3.5" /></button>
                              </>
                            )}
                            <button onClick={() => { handleDeleteDoc(doc); setCellModal(null); }} className="text-gray-400 hover:text-red-600 p-0.5 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Döküman Reddet</h3>
            <p className="text-sm text-gray-600 mb-2">Dosya: {rejectDoc.dosya_adi}</p>
            <textarea placeholder="Reddetme nedeni..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="w-full p-2 border rounded-lg h-24 text-sm" />
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => setRejectDoc(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">İptal</button>
              <button onClick={handleReject} disabled={!rejectReason.trim()} className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50">Reddet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
