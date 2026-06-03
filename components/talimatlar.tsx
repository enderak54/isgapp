"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeForm, maskTC } from "@/lib/security";
import { displayDate } from "@/lib/tarih";
import { Search, Plus, Calendar, Pin, X, ChevronDown, Lock, Unlock } from "lucide-react";

const DEFAULT_SUTUNLAR = [
  "Vinç Kullanımı",
  "Oryantasyon Eğitimi",
  "Taahhüt",
  "KKD Zimmet Tutanağı",
  "Fabrika İSG Talimatı",
  "Şantiye İSG Talimatı",
  "Yüksekte Çalışma Talimatı",
  "Plazma Kesim Güvenli Çalışma Talimatı",
];

export default function Talimatlar() {
  const [personel, setPersonel] = useState<any[]>([]);
  const [cellData, setCellData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sutunlar, setSutunlar] = useState<string[]>(DEFAULT_SUTUNLAR);
  const [showYeniSutun, setShowYeniSutun] = useState(false);
  const [yeniSutunAdi, setYeniSutunAdi] = useState("");
  const [notlar, setNotlar] = useState<string[]>(["", "", ""]);
  const [lockedNotes, setLockedNotes] = useState<Set<number>>(new Set());
  const [seciliHucre, setSeciliHucre] = useState<{ personel_id: string; talimat_adi: string } | null>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
    loadNotlar();
  }, []);

  useEffect(() => {
    if (seciliHucre && dateInputRef.current) dateInputRef.current.showPicker?.();
  }, [seciliHucre]);

  const fetchData = async () => {
    const [personelRes, matrisRes, ayarRes] = await Promise.all([
      supabase.from("personel").select("id, kimlik_no, ad, soyad, meslek_kodu").eq("arsivde", false).order("ad", { ascending: true }),
      supabase.from("personel_talimat_matrisi").select("*"),
      supabase.from("ayarlar").select("value").eq("key", "talimat_sutunlari").single(),
    ]);
    if (personelRes.data) setPersonel(personelRes.data);
    if (matrisRes.data) {
      const map: Record<string, string> = {};
      matrisRes.data.forEach((r: any) => { map[`${r.personel_id}_${r.talimat_adi}`] = r.tarih || ""; });
      setCellData(map);
    }
    if (ayarRes.data?.value) {
      try { const arr = JSON.parse(ayarRes.data.value); if (Array.isArray(arr) && arr.length > 0) setSutunlar(arr); }
      catch {}
    }
    setLoading(false);
  };

  const loadNotlar = () => {
    try {
      const saved = localStorage.getItem("isg_talimat_notlar");
      if (saved) setNotlar(JSON.parse(saved));
    } catch {}
  };

  const saveNotlar = (notes: string[]) => {
    setNotlar(notes);
    localStorage.setItem("isg_talimat_notlar", JSON.stringify(notes));
  };

  const sutunEkle = async () => {
    const name = yeniSutunAdi.trim();
    if (!name || sutunlar.includes(name)) return;
    const yeni = [...sutunlar, name];
    setSutunlar(yeni);
    setYeniSutunAdi("");
    setShowYeniSutun(false);
    await supabase.from("ayarlar").upsert({ key: "talimat_sutunlari", value: JSON.stringify(yeni), type: "talimat" }, { onConflict: "key" });
  };

  const sutunSil = async (ad: string) => {
    if (!confirm(`"${ad}" sütununu sil?`)) return;
    const yeni = sutunlar.filter(s => s !== ad);
    setSutunlar(yeni);
    const updated = { ...cellData };
    Object.keys(updated).forEach(k => { if (k.endsWith(`_${ad}`)) delete updated[k]; });
    setCellData(updated);
    await supabase.from("ayarlar").upsert({ key: "talimat_sutunlari", value: JSON.stringify(yeni), type: "talimat" }, { onConflict: "key" });
    await supabase.from("personel_talimat_matrisi").delete().eq("talimat_adi", ad);
    setSeciliHucre(null);
  };

  const tarihGuncelle = async (personel_id: string, talimat_adi: string, tarih: string) => {
    const key = `${personel_id}_${talimat_adi}`;
    setCellData(prev => ({ ...prev, [key]: tarih }));
    if (tarih) {
      await supabase.from("personel_talimat_matrisi").upsert(
        { personel_id, talimat_adi, tarih },
        { onConflict: "personel_id, talimat_adi" }
      );
    } else {
      await supabase.from("personel_talimat_matrisi").delete().match({ personel_id, talimat_adi });
    }
    setSeciliHucre(null);
  };

  const filteredPersonel = personel.filter(p =>
    !search ||
    `${p.ad} ${p.soyad}`.toLowerCase().includes(search.toLowerCase()) ||
    (p.kimlik_no || "").includes(search)
  );

  const cellKey = (pid: string, tad: string) => `${pid}_${tad}`;
  const formatCellDate = (val: string) => val ? displayDate(val) : "";

  return (
    <div className="flex-1 min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">Personel Talimat Takibi Matrisi</h1>
          <button onClick={() => setShowYeniSutun(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-green-700 transition">
            <Plus className="w-4 h-4" /> Yeni Talimat Sütunu Ekle
          </button>
        </div>
      </div>

      <div className="px-6 py-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Personel ara (ad, TC)..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pr-12" />
          </div>
        </div>
      </div>

      {/* Matrix Table */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Yükleniyor...</div>
      ) : (
        <div className="flex-1 overflow-auto px-6">
          <div className="overflow-x-auto pb-4">
            <table className="w-full border-collapse" style={{ minWidth: sutunlar.length * 100 + 320 }}>
              <thead>
                <tr className="bg-gray-100">
                  <th className="sticky left-0 z-20 bg-gray-100 px-2 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider border-r border-gray-200" style={{ minWidth: 90 }}>Kimlik No</th>
                  <th className="sticky left-[90px] z-20 bg-gray-100 px-2 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider border-r border-gray-200" style={{ minWidth: 130 }}>Ad Soyad</th>
                  <th className="sticky left-[220px] z-20 bg-gray-100 px-2 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider border-r border-gray-200" style={{ minWidth: 80 }}>Görev</th>
                  {sutunlar.map((ad) => (
                    <th key={ad} className="px-2 py-2 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider border-r border-gray-200 relative group" style={{ minWidth: 100 }}>
                      <div className="flex items-start justify-center gap-0.5">
                        <span className="text-center leading-tight whitespace-normal">{ad}</span>
                        <button onClick={() => sutunSil(ad)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition p-0.5 flex-shrink-0 mt-0.5" title="Sütunu Sil">
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPersonel.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition">
                    <td className="sticky left-0 z-10 bg-white px-2 py-2 text-xs text-gray-600 font-mono border-r border-gray-200">{p.kimlik_no ? maskTC(p.kimlik_no) : "-"}</td>
                    <td className="sticky left-[90px] z-10 bg-white px-2 py-2 text-xs font-medium text-gray-800 border-r border-gray-200">{p.ad} {p.soyad}</td>
                    <td className="sticky left-[220px] z-10 bg-white px-2 py-2 text-xs text-gray-500 border-r border-gray-200">{p.meslek_kodu || "-"}</td>
                    {sutunlar.map((ad) => {
                      const key = cellKey(p.id, ad);
                      const val = cellData[key] || "";
                      const isSecili = seciliHucre?.personel_id === p.id && seciliHucre?.talimat_adi === ad;
                      return (
                        <td key={ad} className="px-2 py-1.5 border-r border-gray-100 text-center relative">
                          {isSecili ? (
                            <input
                              ref={dateInputRef}
                              type="date"
                              value={val}
                              onChange={(e) => tarihGuncelle(p.id, ad, e.target.value)}
                              onBlur={() => setSeciliHucre(null)}
                              className="w-full text-xs text-center border border-green-400 rounded px-1 py-1 outline-none focus:ring-1 focus:ring-green-500"
                              autoFocus
                            />
                          ) : (
                            <button
                              onClick={() => setSeciliHucre({ personel_id: p.id, talimat_adi: ad })}
                              className={`w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded border text-xs transition ${
                                val ? "bg-green-50 border-green-200 text-green-700" : "bg-white border-gray-200 text-gray-400 hover:border-gray-300"
                              }`}
                            >
                              {val ? <span>{formatCellDate(val)}</span> : <span className="text-gray-300">—</span>}
                              <Calendar className={`w-3 h-3 ${val ? "text-green-500" : "text-gray-300"}`} />
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPersonel.length === 0 && (
              <div className="text-center py-16 text-gray-400 text-sm">
                {search ? "Aramanızla eşleşen personel bulunamadı." : "Henüz personel kaydı yok."}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sticky Notes Footer */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex flex-wrap gap-4">
          {notlar.map((note, idx) => (
            <div key={idx} className="relative bg-amber-50 border border-amber-200 rounded-lg p-3 w-56 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <Pin className="w-3 h-3 text-amber-400 fill-amber-400" />
                <div className="flex items-center gap-1">
                  <button onClick={() => setLockedNotes(prev => { const n = new Set(prev); if (n.has(idx)) n.delete(idx); else n.add(idx); return n; })} className={`p-0.5 rounded transition ${lockedNotes.has(idx) ? "text-amber-500" : "text-gray-300 hover:text-gray-500"}`}>
                    {lockedNotes.has(idx) ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  </button>
                  {lockedNotes.has(idx) && (
                    <button onClick={() => { const yeni = notlar.filter((_, i) => i !== idx); saveNotlar(yeni); }} className="text-red-300 hover:text-red-500 p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              <textarea
                value={note}
                onChange={(e) => {
                  const yeni = [...notlar];
                  yeni[idx] = e.target.value;
                  saveNotlar(yeni);
                }}
                placeholder="Not ekle..."
                className="w-full bg-transparent text-xs text-gray-700 resize-none outline-none placeholder-gray-300"
                rows={3}
              />
            </div>
          ))}
          <button onClick={() => saveNotlar([...notlar, ""])} className="border-2 border-dashed border-gray-200 rounded-lg p-3 w-56 flex items-center justify-center text-gray-300 hover:text-gray-500 hover:border-gray-300 transition">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Yeni Sütun Modal */}
      {showYeniSutun && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => { setShowYeniSutun(false); setYeniSutunAdi(""); }}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Yeni Talimat Sütunu</h3>
              <button onClick={() => { setShowYeniSutun(false); setYeniSutunAdi(""); }}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <input
              type="text"
              value={yeniSutunAdi}
              onChange={(e) => setYeniSutunAdi(e.target.value)}
              placeholder="Talimat adı (Örn: İlk Yardım Eğitimi)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-1 focus:ring-green-500"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") sutunEkle(); }}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowYeniSutun(false); setYeniSutunAdi(""); }} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg">İptal</button>
              <button onClick={sutunEkle} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition">Ekle</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
