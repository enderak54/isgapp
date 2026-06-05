"use client";

import { useEffect, useState } from "react";
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
  const [employeeDocs, setEmployeeDocs] = useState<Record<string, any[]>>({});
  const [empLoading, setEmpLoading] = useState(false);
  const [expandedEmp, setExpandedEmp] = useState<string | null>(null);

  // Upload
  const [uploadEmp, setUploadEmp] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTip, setUploadTip] = useState("isg_egitim");
  const [uploadExpiry, setUploadExpiry] = useState("");
  const [uploading, setUploading] = useState(false);

  // Reject
  const [rejectDoc, setRejectDoc] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");

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
    const { data: emp } = await supabase.from("personel").select("id, ad, soyad, kimlik_no, telefon").eq("taseron_id", t.id).eq("arsivde", false).order("ad");
    if (emp) {
      setEmployees(emp);
      const docMap: Record<string, any[]> = {};
      for (const e of emp) {
        const { data: docs } = await supabase.from("personel_belgeleri").select("*").eq("personel_id", e.id).order("eklenme_tarihi", { ascending: false });
        if (docs) docMap[e.id] = docs;
      }
      setEmployeeDocs(docMap);
    }
    setEmpLoading(false);
  };

  const closeCompany = () => { setSelectedTaseron(null); setEmployees([]); setEmployeeDocs({}); setExpandedEmp(null); };

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

  const handleUpload = async () => {
    if (!uploadEmp || !uploadFile) return;
    const v = validateFile(uploadFile);
    if (!v.valid) { alert(v.error); return; }
    setUploading(true);
    try {
      const fileName = `${Date.now()}_${sanitizeFileName(uploadFile.name)}`;
      const { error: upErr } = await supabase.storage.from("personel-belgeleri").upload(fileName, uploadFile);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("personel-belgeleri").getPublicUrl(fileName);
      const { error: dbErr } = await supabase.from("personel_belgeleri").insert({
        personel_id: uploadEmp, belge_tipi: uploadTip, dosya_url: urlData.publicUrl,
        dosya_adi: uploadFile.name, dosya_uzantisi: uploadFile.name.split(".").pop(),
        dosya_boyut: uploadFile.size, onay_durumu: "beklemede", son_gecerlilik_tarihi: uploadExpiry || null,
      });
      if (dbErr) throw dbErr;
      await logAudit("personel_belgeleri", "INSERT", uploadEmp, null, { belge_tipi: uploadTip, dosya_adi: uploadFile.name });
      setUploadEmp(null); setUploadFile(null); setUploadTip("isg_egitim"); setUploadExpiry("");
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

      {/* Employees Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Personel</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">TC</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Telefon</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-600">Dökümanlar</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-600">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {employees.map((emp) => {
                const docs = employeeDocs[emp.id] || [];
                const onayli = docs.filter(d => d.onay_durumu === "onaylandi").length;
                const bekle = docs.filter(d => d.onay_durumu === "beklemede").length;
                const red = docs.filter(d => d.onay_durumu === "reddedildi").length;
                const expanded = expandedEmp === emp.id;
                return (
                  <>
                    <tr key={emp.id} className="hover:bg-gray-50 transition">
                      <td className="px-3 py-2.5 text-sm font-medium">{emp.ad} {emp.soyad}</td>
                      <td className="px-3 py-2.5 text-sm text-gray-500">{emp.kimlik_no}</td>
                      <td className="px-3 py-2.5 text-sm text-gray-500">{emp.telefon || "-"}</td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-2 text-xs">
                          {onayli > 0 && <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded">{onayli} Onaylı</span>}
                          {bekle > 0 && <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">{bekle} Bekl.</span>}
                          {red > 0 && <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded">{red} Red</span>}
                          {docs.length === 0 && <span className="text-gray-400">-</span>}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <button onClick={() => setExpandedEmp(expanded ? null : emp.id)} className="text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded flex items-center gap-1 mx-auto">
                          <Eye className="w-3.5 h-3.5" /> {expanded ? "Gizle" : "Dökümanlar"}
                        </button>
                      </td>
                    </tr>
                    {expanded && (
                      <tr key={`${emp.id}-docs`}>
                        <td colSpan={5} className="px-4 py-3 bg-gray-50">
                          {/* Upload Button */}
                          <button onClick={() => setUploadEmp(emp.id)} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 flex items-center gap-1 mb-3">
                            <Upload className="w-3.5 h-3.5" /> Döküman Yükle
                          </button>

                          {/* Upload Modal */}
                          {uploadEmp === emp.id && (
                            <div className="mb-3 p-3 bg-white border rounded-lg">
                              <div className="flex items-center gap-3 mb-2">
                                <input type="file" onChange={e => setUploadFile(e.target.files?.[0] || null)} className="text-xs flex-1" />
                              </div>
                              <div className="flex items-center gap-2">
                                <select value={uploadTip} onChange={e => setUploadTip(e.target.value)} className="text-xs p-1 border rounded flex-1">
                                  <option value="isg_egitim">İSG Eğitim</option>
                                  <option value="yuksekte_calisma">Yüksekte Çalışma</option>
                                  <option value="myk">MYK</option>
                                  <option value="operator_belgesi">Operatör Belgesi</option>
                                  <option value="kkd">KKD</option>
                                  <option value="oryantasyon">Oryantasyon</option>
                                  <option value="saglik_raporu">Sağlık Raporu</option>
                                  <option value="sertifika">Sertifika</option>
                                  <option value="diger">Diğer</option>
                                </select>
                                <input type="date" value={uploadExpiry} onChange={e => setUploadExpiry(e.target.value)} className="text-xs p-1 border rounded" title="Son Geçerlilik Tarihi" />
                                <button onClick={handleUpload} disabled={!uploadFile || uploading} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 disabled:opacity-50">{uploading ? "Yükleniyor..." : "Yükle"}</button>
                                <button onClick={() => { setUploadEmp(null); setUploadFile(null); }} className="text-xs text-gray-500 hover:text-gray-700 p-1"><X className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>
                          )}

                          {/* Documents Table */}
                          {docs.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-3">Henüz döküman yüklenmemiş</p>
                          ) : (
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-gray-500">
                                  <th className="text-left py-1 pr-2">Dosya</th>
                                  <th className="text-left py-1 pr-2">Tür</th>
                                  <th className="text-left py-1 pr-2">Yüklenme</th>
                                  <th className="text-center py-1 pr-2">Durum</th>
                                  <th className="text-center py-1 pr-2">Geçerlilik</th>
                                  <th className="text-center py-1">İşlem</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {docs.map((doc) => {
                                  const kg = kalanGun(doc.son_gecerlilik_tarihi);
                                  return (
                                    <tr key={doc.id}>
                                      <td className="py-1.5 pr-2">
                                        <div className="flex items-center gap-1">
                                          <FileText className="w-3 h-3 text-gray-400" />
                                          <span className="truncate max-w-[140px] block" title={doc.dosya_adi}>{doc.dosya_adi}</span>
                                          <a href={doc.dosya_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700"><ExternalLink className="w-3 h-3" /></a>
                                        </div>
                                      </td>
                                      <td className="py-1.5 pr-2 text-gray-500">{doc.belge_tipi}</td>
                                      <td className="py-1.5 pr-2 text-gray-500">{displayDate(doc.eklenme_tarihi?.split("T")[0])}</td>
                                      <td className="py-1.5 pr-2 text-center">
                                        <span className={`px-1.5 py-0.5 rounded ${DURUM_RENK[doc.onay_durumu] || "bg-gray-100 text-gray-600"}`}>
                                          {doc.onay_durumu === "reddedildi" && doc.red_aciklama ? (
                                            <span title={doc.red_aciklama} className="cursor-help">{doc.onay_durumu}</span>
                                          ) : doc.onay_durumu}
                                        </span>
                                      </td>
                                      <td className={`py-1.5 pr-2 text-center ${kg.cls}`}>{kg.text}</td>
                                      <td className="py-1.5 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                          {doc.onay_durumu === "beklemede" && (
                                            <>
                                              <button onClick={() => handleApprove(doc)} className="text-green-600 hover:bg-green-50 p-0.5 rounded" title="Onayla"><CheckCircle className="w-3.5 h-3.5" /></button>
                                              <button onClick={() => setRejectDoc(doc)} className="text-red-600 hover:bg-red-50 p-0.5 rounded" title="Reddet"><X className="w-3.5 h-3.5" /></button>
                                            </>
                                          )}
                                          <button onClick={() => handleDeleteDoc(doc)} className="text-gray-400 hover:text-red-600 p-0.5 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

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
