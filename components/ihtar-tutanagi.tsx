"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeForm } from "@/lib/security";
import { AlertOctagon, Plus, Search, Edit, Trash2, X, Eye, Upload, FileText, Image as ImageIcon, Download, Calendar, FileQuestion, FolderOpen } from "lucide-react";

const ihtarTipleri = [
  { value: "yazili", label: "Yazılı İhtar" },
  { value: "kesin", label: "Kesin İhtar" },
  { value: "uyari", label: "Uyarı" },
  { value: "kinai", label: "Kınama" },
];
const durumlar = [
  { value: "duzenlendi", label: "Düzenlendi" },
  { value: "teblig edildi", label: "Tebliğ Edildi" },
  { value: "itiraz var", label: "İtiraz Var" },
  { value: "kapatildi", label: "Kapatıldı" },
];

const ALLOWED_IMAGES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_DOCS = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/plain"];

function getFileType(mime: string): "gorsel" | "belge" | null {
  if (ALLOWED_IMAGES.includes(mime)) return "gorsel";
  if (ALLOWED_DOCS.includes(mime)) return "belge";
  return null;
}

function getFileExtension(name: string): string {
  return name.split(".").pop()?.toLowerCase() || "";
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function IhtarTutanagi() {
  const [items, setItems] = useState<any[]>([]);
  const [personel, setPersonel] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ personel_id: "", ihtar_tipi: "uyari", tarih: "", yer: "", konu: "", aciklama: "", dayanak_madde: "", teblig_tarihi: "", personel_gorusu: "", durum: "duzenlendi" });

  const [selectedIhtar, setSelectedIhtar] = useState<any>(null);
  const [dosyalar, setDosyalar] = useState<any[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadNeden, setUploadNeden] = useState("");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [editingDosya, setEditingDosya] = useState<any>(null);
  const [editNeden, setEditNeden] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchItems(); fetchPersonel(); }, []);

  const fetchItems = async () => {
    const { data } = await supabase.from("ihtar_tutanagi").select("*, personel(ad, soyad, kimlik_no)").order("tarih", { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  const fetchPersonel = async () => {
    const { data } = await supabase.from("personel").select("id, ad, soyad").eq("arsivde", false);
    if (data) setPersonel(data);
  };

  const fetchDosyalar = async (ihtarId: string) => {
    const { data } = await supabase.from("ihtar_dosyalari").select("*").eq("ihtar_id", ihtarId).order("eklenme_tarihi", { ascending: false });
    if (data) setDosyalar(data);
  };

  const filtered = items.filter(i => i.konu.toLowerCase().includes(search.toLowerCase()) || (i.personel && `${i.personel.ad || ""} ${i.personel.soyad || ""}`.toLowerCase().includes(search.toLowerCase())));

  const handleSubmit = async () => {
    if (!form.konu || !form.personel_id || !form.tarih) return;
    const payload = sanitizeForm({ ...form, tarih: form.tarih || null, teblig_tarihi: form.teblig_tarihi || null });
    if (editing) {
      await supabase.from("ihtar_tutanagi").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("ihtar_tutanagi").insert(payload);
    }
    setShowForm(false);
    setEditing(null);
    setForm({ personel_id: "", ihtar_tipi: "uyari", tarih: "", yer: "", konu: "", aciklama: "", dayanak_madde: "", teblig_tarihi: "", personel_gorusu: "", durum: "duzenlendi" });
    fetchItems();
  };

  const handleEdit = (i: any) => {
    setEditing(i);
    setForm({ personel_id: i.personel_id, ihtar_tipi: i.ihtar_tipi, tarih: i.tarih.split("T")[0], yer: i.yer || "", konu: i.konu, aciklama: i.aciklama || "", dayanak_madde: i.dayanak_madde || "", teblig_tarihi: i.teblig_tarihi ? i.teblig_tarihi.split("T")[0] : "", personel_gorusu: i.personel_gorusu || "", durum: i.durum });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu ihtar tutanağını silmek istediğinize emin misiniz?")) return;
    await supabase.from("ihtar_tutanagi").delete().eq("id", id);
    fetchItems();
  };

  const handleOpenIhtar = (i: any) => {
    setSelectedIhtar(i);
    fetchDosyalar(i.id);
    setShowUpload(false);
    setUploadFiles([]);
    setUploadNeden("");
    setEditingDosya(null);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const valid = files.filter(f => getFileType(f.type) !== null);
    setUploadFiles(prev => [...prev, ...valid]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const valid = files.filter(f => getFileType(f.type) !== null);
      setUploadFiles(prev => [...prev, ...valid]);
    }
  };

  const removeUploadFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!selectedIhtar || uploadFiles.length === 0 || !uploadNeden.trim()) return;
    setUploading(true);
    try {
      for (const file of uploadFiles) {
        const fileExt = getFileExtension(file.name);
        const fileName = `${selectedIhtar.id}/${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from("ihtar-dosyalari").upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("ihtar-dosyalari").getPublicUrl(fileName);
        const fileType = getFileType(file.type);
        await supabase.from("ihtar_dosyalari").insert(sanitizeForm({
          ihtar_id: selectedIhtar.id,
          dosya_url: urlData.publicUrl,
          dosya_adi: file.name,
          dosya_turu: fileType,
          dosya_uzantisi: fileExt,
          dosya_boyut: file.size,
          neden: uploadNeden.trim(),
        }));
      }
      setUploadFiles([]);
      setUploadNeden("");
      fetchDosyalar(selectedIhtar.id);
    } catch (err: any) {
      alert("Yükleme hatası: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDosya = async (dosya: any) => {
    if (!confirm("Bu dosyayı silmek istediğinize emin misiniz?")) return;
    const urlParts = dosya.dosya_url.split("/ihtar-dosyalari/");
    if (urlParts.length > 1) {
      await supabase.storage.from("ihtar-dosyalari").remove([urlParts[1]]);
    }
    await supabase.from("ihtar_dosyalari").update({ silinme_tarihi: new Date().toISOString() }).eq("id", dosya.id);
    fetchDosyalar(selectedIhtar.id);
  };

  const handleEditDosya = async () => {
    if (!editingDosya || !editNeden.trim()) return;
    await supabase.from("ihtar_dosyalari").update(sanitizeForm({ neden: editNeden.trim(), guncelleme_tarihi: new Date().toISOString() })).eq("id", editingDosya.id);
    setEditingDosya(null);
    setEditNeden("");
    fetchDosyalar(selectedIhtar.id);
  };

  if (loading) return <div className="flex-1 p-8 flex items-center justify-center text-gray-400">Yükleniyor...</div>;

  const stats = { toplam: items.length, duzenlendi: items.filter(i => i.durum === "duzenlendi").length, teblig: items.filter(i => i.durum === "teblig edildi").length, kapatildi: items.filter(i => i.durum === "kapatildi").length };

  return (
    <main className="flex-1 p-8 app-bg min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="page-header">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center"><AlertOctagon className="w-6 h-6 text-gray-600" /></div>
            <div><h2 className="text-2xl font-semibold text-gray-800">İhtar Tutanağı</h2><p className="text-sm text-gray-500">Personel ihtar ve uyarı kayıtları</p></div>
          </div>
          <button onClick={() => { setShowForm(true); setEditing(null); setForm({ personel_id: "", ihtar_tipi: "uyari", tarih: "", yer: "", konu: "", aciklama: "", dayanak_madde: "", teblig_tarihi: "", personel_gorusu: "", durum: "duzenlendi" }); }} className="btn btn-primary"><Plus className="w-4 h-4" /> Yeni İhtar</button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card p-4"><p className="text-xs text-gray-500">Toplam</p><p className="text-2xl font-bold text-gray-800">{stats.toplam}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Düzenlendi</p><p className="text-2xl font-bold text-blue-600">{stats.duzenlendi}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Teblig Edildi</p><p className="text-2xl font-bold text-amber-600">{stats.teblig}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-500">Kapatıldı</p><p className="text-2xl font-bold text-green-600">{stats.kapatildi}</p></div>
        </div>

        <div className="card p-4 mb-6"><div className="relative"><Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" placeholder="İhtar ara..." value={search} onChange={e => setSearch(e.target.value)} className="input pr-12" /></div></div>

        <div className="card overflow-hidden">
          <table>
            <thead><tr><th>Personel</th><th>İhtar Tipi</th><th>Tarih</th><th>Yer</th><th>Konu</th><th>Teblig Tarihi</th><th>Durum</th><th>İşlem</th></tr></thead>
            <tbody>
              {filtered.map(i => (
                <tr key={i.id}>
                  <td className="font-medium">{i.personel ? `${i.personel.ad || ""} ${i.personel.soyad || ""}`.trim() || "-" : "-"}</td>
                  <td><span className={`badge ${i.ihtar_tipi === "kesin" ? "bg-red-100 text-red-700" : i.ihtar_tipi === "kinai" ? "bg-orange-100 text-orange-700" : i.ihtar_tipi === "yazili" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>{ihtarTipleri.find(t => t.value === i.ihtar_tipi)?.label}</span></td>
                  <td>{new Date(i.tarih).toLocaleDateString("tr-TR")}</td>
                  <td>{i.yer || "-"}</td>
                  <td className="max-w-xs truncate">{i.konu}</td>
                  <td>{i.teblig_tarihi ? new Date(i.teblig_tarihi).toLocaleDateString("tr-TR") : "-"}</td>
                  <td><span className={`badge ${i.durum === "kapatildi" ? "bg-green-100 text-green-700" : i.durum === "teblig edildi" ? "bg-amber-100 text-amber-700" : i.durum === "itiraz var" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>{durumlar.find(d => d.value === i.durum)?.label}</span></td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => handleOpenIhtar(i)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500" title="Dosyalar"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => handleEdit(i)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(i.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-gray-400">Henüz ihtar kaydı yok</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* İhtar Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{editing ? "İhtar Düzenle" : "Yeni İhtar Tutanağı"}</h3><button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button></div>
            <div className="modal-body space-y-4">
              <div><label>Personel *</label><select value={form.personel_id} onChange={e => setForm({ ...form, personel_id: e.target.value })}><option value="">Seçiniz</option>{personel.map(p => <option key={p.id} value={p.id}>{p.ad} {p.soyad}</option>)}</select></div>
              <div className="grid-2"><div><label>İhtar Tipi</label><select value={form.ihtar_tipi} onChange={e => setForm({ ...form, ihtar_tipi: e.target.value })}>{ihtarTipleri.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div><div><label>Tarih *</label><input type="date" value={form.tarih} onChange={e => setForm({ ...form, tarih: e.target.value })} /></div></div>
              <div><label>Yer</label><input type="text" value={form.yer} onChange={e => setForm({ ...form, yer: e.target.value })} placeholder="Olay yeri" /></div>
              <div><label>Konu *</label><input type="text" value={form.konu} onChange={e => setForm({ ...form, konu: e.target.value })} placeholder="İhtar konusu" /></div>
              <div><label>Açıklama</label><textarea value={form.aciklama} onChange={e => setForm({ ...form, aciklama: e.target.value })} rows={3} placeholder="Detaylı açıklama..." /></div>
              <div><label>Dayanak Madde</label><input type="text" value={form.dayanak_madde} onChange={e => setForm({ ...form, dayanak_madde: e.target.value })} placeholder="Örn: İş Kanunu Madde 25" /></div>
              <div><label>Tebliğ Tarihi</label><input type="date" value={form.teblig_tarihi} onChange={e => setForm({ ...form, teblig_tarihi: e.target.value })} /></div>
              <div><label>Personel Görüşü</label><textarea value={form.personel_gorusu} onChange={e => setForm({ ...form, personel_gorusu: e.target.value })} rows={2} placeholder="Personelin beyanı..." /></div>
              <div><label>Durum</label><select value={form.durum} onChange={e => setForm({ ...form, durum: e.target.value })}>{durumlar.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}</select></div>
              <div className="flex justify-end gap-2 pt-4"><button onClick={() => setShowForm(false)} className="btn" style={{ background: "#f3f4f6", color: "#374151" }}>İptal</button><button onClick={handleSubmit} className="btn btn-primary">{editing ? "Güncelle" : "Kaydet"}</button></div>
            </div>
          </div>
        </div>
      )}

      {/* İhtar Detay + Dosya Yönetimi Modal */}
      {selectedIhtar && (
        <div className="modal-overlay" onClick={() => { setSelectedIhtar(null); setShowUpload(false); setEditingDosya(null); }}>
          <div className="modal-content max-w-5xl" style={{ maxHeight: "90vh" }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>İhtar Detayı</h3>
                <p className="text-xs text-gray-500 mt-1">{selectedIhtar.personel ? `${selectedIhtar.personel.ad || ""} ${selectedIhtar.personel.soyad || ""}`.trim() : ""} — {selectedIhtar.konu}</p>
              </div>
              <button onClick={() => { setSelectedIhtar(null); setShowUpload(false); setEditingDosya(null); }}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="modal-body">
              {!showUpload && !editingDosya && (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-6 text-sm">
                    <div className="p-3 bg-gray-50 rounded-lg"><span className="text-gray-500">Tip:</span> <strong>{ihtarTipleri.find(t => t.value === selectedIhtar.ihtar_tipi)?.label}</strong></div>
                    <div className="p-3 bg-gray-50 rounded-lg"><span className="text-gray-500">Tarih:</span> <strong>{new Date(selectedIhtar.tarih).toLocaleDateString("tr-TR")}</strong></div>
                    <div className="p-3 bg-gray-50 rounded-lg"><span className="text-gray-500">Yer:</span> <strong>{selectedIhtar.yer || "-"}</strong></div>
                    <div className="p-3 bg-gray-50 rounded-lg"><span className="text-gray-500">Dayanak:</span> <strong>{selectedIhtar.dayanak_madde || "-"}</strong></div>
                    <div className="p-3 bg-gray-50 rounded-lg"><span className="text-gray-500">Teblig:</span> <strong>{selectedIhtar.teblig_tarihi ? new Date(selectedIhtar.teblig_tarihi).toLocaleDateString("tr-TR") : "-"}</strong></div>
                    <div className="p-3 bg-gray-50 rounded-lg"><span className="text-gray-500">Durum:</span> <strong>{durumlar.find(d => d.value === selectedIhtar.durum)?.label}</strong></div>
                  </div>
                  {selectedIhtar.aciklama && <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm"><strong>Açıklama:</strong> {selectedIhtar.aciklama}</div>}
                  {selectedIhtar.personel_gorusu && <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm"><strong>Personel Görüşü:</strong> {selectedIhtar.personel_gorusu}</div>}

                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-800">Ek Dosyalar ({dosyalar.filter(d => !d.silinme_tarihi).length})</h4>
                    <button onClick={() => setShowUpload(true)} className="btn btn-primary text-sm"><Upload className="w-4 h-4" /> Dosya Yükle</button>
                  </div>

                  {dosyalar.length === 0 && <div className="text-center py-8 text-gray-400"><FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>Henüz dosya eklenmemiş</p></div>}

                  {dosyalar.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {dosyalar.map(d => (
                        <div key={d.id} className={`card p-4 ${d.silinme_tarihi ? "opacity-50" : ""}`}>
                          <div className="flex items-start gap-3">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${d.dosya_turu === "gorsel" ? "bg-blue-100" : "bg-amber-100"}`}>
                              {d.dosya_turu === "gorsel" ? <ImageIcon className="w-6 h-6 text-blue-600" /> : <FileText className="w-6 h-6 text-amber-600" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{d.dosya_adi}</p>
                              <div className="flex gap-2 mt-1 text-xs text-gray-500">
                                <span className={`badge ${d.dosya_turu === "gorsel" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>{d.dosya_turu === "gorsel" ? "Görsel" : "Belge"}</span>
                                <span>.{d.dosya_uzantisi}</span>
                                {d.dosya_boyut && <span>{formatBytes(d.dosya_boyut)}</span>}
                              </div>
                              <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                                <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Eklendi: {new Date(d.eklenme_tarihi).toLocaleDateString("tr-TR")}</div>
                                {d.guncelleme_tarihi && <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Düzenlendi: {new Date(d.guncelleme_tarihi).toLocaleDateString("tr-TR")}</div>}
                                {d.silinme_tarihi && <div className="flex items-center gap-1 text-red-500"><Calendar className="w-3 h-3" /> Silindi: {new Date(d.silinme_tarihi).toLocaleDateString("tr-TR")}</div>}
                              </div>
                              {d.neden && <p className="mt-1 text-xs text-gray-600 bg-gray-50 p-1.5 rounded"><strong>Neden:</strong> {d.neden}</p>}
                            </div>
                          </div>
                          {!d.silinme_tarihi && (
                            <div className="flex gap-1 mt-3 pt-3 border-t border-gray-100">
                              <a href={d.dosya_url} target="_blank" rel="noopener noreferrer" className="flex-1 text-center text-xs px-2 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition flex items-center justify-center gap-1"><Eye className="w-3 h-3" /> Göster</a>
                              <button onClick={() => { setEditingDosya(d); setEditNeden(d.neden || ""); }} className="flex-1 text-center text-xs px-2 py-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition flex items-center justify-center gap-1"><Edit className="w-3 h-3" /> Düzenle</button>
                              <button onClick={() => handleDeleteDosya(d)} className="flex-1 text-center text-xs px-2 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition flex items-center justify-center gap-1"><Trash2 className="w-3 h-3" /> Sil</button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Dosya Yükleme Alanı */}
              {showUpload && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-800">Dosya Yükle</h4>
                    <button onClick={() => { setShowUpload(false); setUploadFiles([]); setUploadNeden(""); }} className="text-sm text-gray-500 hover:text-gray-700">← Geri</button>
                  </div>

                  <div
                    ref={dropRef}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"}`}
                  >
                    <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" onChange={handleFileSelect} className="hidden" />
                    <Upload className={`w-12 h-12 mx-auto mb-3 ${dragOver ? "text-blue-500" : "text-gray-400"}`} />
                    <p className="text-sm text-gray-600 font-medium">Dosyaları sürükleyip bırakın veya tıklayarak seçin</p>
                    <p className="text-xs text-gray-400 mt-1">Görsel: JPG, PNG, GIF, WebP | Belge: PDF, DOC, DOCX, XLS, XLSX, TXT</p>
                  </div>

                  {uploadFiles.length > 0 && (
                    <div className="mt-4">
                      <label className="text-sm text-gray-600 mb-1.5 block">Yükleme Nedeni *</label>
                      <textarea value={uploadNeden} onChange={e => setUploadNeden(e.target.value)} className="input h-16 resize-none text-sm mb-3" placeholder="Dosyaların eklenme nedenini yazınız..." />
                      <div className="space-y-2">
                        {uploadFiles.map((f, i) => {
                          const ft = getFileType(f.type);
                          return (
                            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <div className={`w-8 h-8 rounded flex items-center justify-center ${ft === "gorsel" ? "bg-blue-100" : "bg-amber-100"}`}>
                                {ft === "gorsel" ? <ImageIcon className="w-4 h-4 text-blue-600" /> : <FileText className="w-4 h-4 text-amber-600" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{f.name}</p>
                                <p className="text-xs text-gray-500">{formatBytes(f.size)} — {ft === "gorsel" ? "Görsel" : "Belge"}</p>
                              </div>
                              <button onClick={() => removeUploadFile(i)} className="p-1 rounded hover:bg-red-50 text-red-500"><X className="w-4 h-4" /></button>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <button onClick={() => { setShowUpload(false); setUploadFiles([]); setUploadNeden(""); }} className="btn text-sm" style={{ background: "#f3f4f6", color: "#374151" }}>İptal</button>
                        <button onClick={handleUpload} disabled={uploading || !uploadNeden.trim()} className="btn btn-primary text-sm">{uploading ? "Yükleniyor..." : `${uploadFiles.length} Dosya Yükle`}</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Dosya Düzenle Modal */}
              {editingDosya && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-800">Dosya Düzenle</h4>
                    <button onClick={() => { setEditingDosya(null); setEditNeden(""); }} className="text-sm text-gray-500 hover:text-gray-700">← Geri</button>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded flex items-center justify-center ${editingDosya.dosya_turu === "gorsel" ? "bg-blue-100" : "bg-amber-100"}`}>
                        {editingDosya.dosya_turu === "gorsel" ? <ImageIcon className="w-5 h-5 text-blue-600" /> : <FileText className="w-5 h-5 text-amber-600" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{editingDosya.dosya_adi}</p>
                        <p className="text-xs text-gray-500">.{editingDosya.dosya_uzantisi} — {editingDosya.dosya_boyut ? formatBytes(editingDosya.dosya_boyut) : "-"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-600 mb-1.5 block">Neden</label>
                      <textarea value={editNeden} onChange={e => setEditNeden(e.target.value)} className="input h-20 resize-none text-sm" placeholder="Dosyanın eklenme nedenini düzenleyin..." />
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p><strong>Dosya Türü:</strong> {editingDosya.dosya_turu === "gorsel" ? "Görsel" : "Belge"}</p>
                      <p><strong>Eklenme:</strong> {new Date(editingDosya.eklenme_tarihi).toLocaleString("tr-TR")}</p>
                      {editingDosya.guncelleme_tarihi && <p><strong>Son Düzenleme:</strong> {new Date(editingDosya.guncelleme_tarihi).toLocaleString("tr-TR")}</p>}
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button onClick={() => { setEditingDosya(null); setEditNeden(""); }} className="btn text-sm" style={{ background: "#f3f4f6", color: "#374151" }}>İptal</button>
                      <button onClick={handleEditDosya} className="btn btn-primary text-sm">Güncelle</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
