"use client";

import { useEffect, useState } from "react";
import { logAudit } from "@/lib/audit";
import { supabase } from "@/lib/supabase";
import { Search, Grid3X3, List, Check, Minus, Trash2, Calendar, Lock, Unlock, ArrowUp, ArrowDown, Download, Eye, CheckCircle, AlertCircle } from "lucide-react";
import { isExpired, isWarningNeeded, daysUntil } from "@/lib/egitim-uyari";
import { displayDate, kalanSureText } from "@/lib/tarih";
import * as XLSX from "xlsx";

type SortDir = "asc" | "desc";

export default function MykBelgeleri() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "matrix">("list");
  const [mykEgitimListesi, setMykEgitimListesi] = useState<any[]>([]);
  const [personel, setPersonel] = useState<any[]>([]);
  const [kayitlar, setKayitlar] = useState<any[]>([]);
  const [personelMykEgitimler, setPersonelMykEgitimler] = useState<Record<string, Set<string>>>({});
  const [mykBelgeByPersonel, setMykBelgeByPersonel] = useState<Record<string, any[]>>({});
  const [lockedKayitlar, setLockedKayitlar] = useState<Set<string>>(new Set());
  const [sortCol, setSortCol] = useState<string>("alis_tarihi");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [saving, setSaving] = useState(false);
  const [editStatus, setEditStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [egitimRes, personelRes, kayitRes, matrixRes, mykBelgeRes] = await Promise.all([
      supabase.from("myk_egitim_listesi").select("id, ad").eq("aktif", true).order("ad", { ascending: true }),
      supabase.from("personel").select("id, kimlik_no, ad, soyad").eq("arsivde", false).order("ad", { ascending: true }),
      supabase.from("personel_myk_egitimleri").select("*").order("alis_tarihi", { ascending: false }),
      supabase.from("personel_myk_egitimleri").select("personel_id, myk_egitim_id"),
      supabase.from("personel_belgeleri").select("*").eq("belge_tipi", "myk").is("silinme_tarihi", null),
    ]);
    if (egitimRes.data) setMykEgitimListesi(egitimRes.data);
    if (personelRes.data) setPersonel(personelRes.data);

    const mykBelgeByPersonel: Record<string, any[]> = {};
    mykBelgeRes.data?.forEach((b: any) => {
      if (!mykBelgeByPersonel[b.personel_id]) mykBelgeByPersonel[b.personel_id] = [];
      mykBelgeByPersonel[b.personel_id].push(b);
    });
    setMykBelgeByPersonel(mykBelgeByPersonel);

    if (kayitRes.data) {
      const personelMap = new Map(personelRes.data?.map((p: any) => [p.id, p]) || []);
      const egitimMap = new Map(egitimRes.data?.map((e: any) => [e.id, e]) || []);
      const joined = kayitRes.data.map((k: any) => ({
        ...k,
        personel: personelMap.get(k.personel_id) || null,
        myk_egitim_listesi: egitimMap.get(k.myk_egitim_id) || null,
      }));
      setKayitlar(joined);

      const kayitliPersonelIds = new Set(kayitRes.data.map((k: any) => k.personel_id));
      const belgesiOlupKaydiOlmayan = Object.keys(mykBelgeByPersonel)
        .filter(pid => !kayitliPersonelIds.has(pid))
        .map(pid => ({
          id: `belge_${pid}`,
          personel_id: pid,
          personel: personelMap.get(pid) || null,
          myk_egitim_id: null,
          myk_egitim_listesi: null,
          alis_tarihi: null,
          gecerlilik_suresi: null,
          sadeceBelge: true as const,
        }));
      if (belgesiOlupKaydiOlmayan.length > 0) {
        setKayitlar(prev => [...belgesiOlupKaydiOlmayan, ...prev]);
      }
    }

    if (matrixRes.data) {
      const map: Record<string, Set<string>> = {};
      matrixRes.data.forEach((r: any) => {
        if (!map[r.personel_id]) map[r.personel_id] = new Set();
        map[r.personel_id].add(r.myk_egitim_id);
      });
      setPersonelMykEgitimler(map);
    }
    setLoading(false);
  };

  const toggleSort = (col: string) => {
    if (sortCol === col) setSortDir(prev => prev === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  const sortArrow = (col: string) => {
    if (sortCol !== col) return null;
    return sortDir === "asc" ? <ArrowUp className="w-3 h-3 inline ml-1" /> : <ArrowDown className="w-3 h-3 inline ml-1" />;
  };

  const toggleLock = (id: string) => {
    setLockedKayitlar(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const exportListToExcel = () => {
    const data = sorted.map(k => {
      const belgeler = mykBelgeByPersonel[k.personel_id] || [];
      return {
        Personel: k.personel ? `${k.personel.ad || ""} ${k.personel.soyad || ""}`.trim() : "-",
        "MYK Eğitim": k.myk_egitim_listesi?.ad || "-",
        "Alış Tarihi": k.alis_tarihi || "",
        "Geçerlilik (yıl)": k.gecerlilik_suresi || "",
        "Bitiş Tarihi": k.alis_tarihi && k.gecerlilik_suresi ? new Date(new Date(k.alis_tarihi).setFullYear(new Date(k.alis_tarihi).getFullYear() + k.gecerlilik_suresi)).toISOString().split("T")[0] : "",
        "Sertifika": belgeler.map((b: any) => b.dosya_adi || "").filter(Boolean).join(", ") || "",
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "MYK Listesi");
    XLSX.writeFile(wb, `myk_listesi_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportMatrixToExcel = () => {
    const header = ["Personel", ...mykEgitimListesi.map(e => e.ad)];
    const rows = personel.map(p => {
      const egitimler = personelMykEgitimler[p.id] || new Set();
      return [`${p.ad} ${p.soyad}`, ...mykEgitimListesi.map(e => egitimler.has(e.id) ? "X" : "")];
    });
    const data = [header, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "MYK Matrisi");
    XLSX.writeFile(wb, `myk_matrisi_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu kaydı silmek istediğinize emin misiniz?")) return;
    setEditStatus(null);
    try {
      const { error } = await supabase.from("personel_myk_egitimleri").delete().eq("id", id);
      if (error) throw error;
      await logAudit("personel_myk_egitimleri", "DELETE", id, null, null);
      setEditStatus({ type: "success", message: "Kayıt silindi" });
      setLockedKayitlar(prev => { const n = new Set(prev); n.delete(id); return n; });
      fetchData();
    } catch (e: any) {
      setEditStatus({ type: "error", message: e.message || "Silme işlemi başarısız" });
    }
  };

  const sorted = [...kayitlar]
    .filter((k) => {
      if (!search) return true;
      const q = search.toLowerCase();
      const belgeler = mykBelgeByPersonel[k.personel_id] || [];
      return (
        `${k.personel?.ad || ""} ${k.personel?.soyad || ""}`.toLowerCase().includes(q) ||
        k.myk_egitim_listesi?.ad?.toLowerCase().includes(q) ||
        belgeler.some((b: any) => (b.dosya_adi || "").toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      let va = "", vb = "";
      if (sortCol === "alis_tarihi") { va = a.alis_tarihi || ""; vb = b.alis_tarihi || ""; }
      else if (sortCol === "bitis_tarihi") {
        const ea = a.alis_tarihi && a.gecerlilik_suresi ? new Date(new Date(a.alis_tarihi).setFullYear(new Date(a.alis_tarihi).getFullYear() + a.gecerlilik_suresi)).toISOString().split("T")[0] : "";
        const eb = b.alis_tarihi && b.gecerlilik_suresi ? new Date(new Date(b.alis_tarihi).setFullYear(new Date(b.alis_tarihi).getFullYear() + b.gecerlilik_suresi)).toISOString().split("T")[0] : "";
        va = ea; vb = eb;
      }
      const cmp = va.localeCompare(vb);
      return sortDir === "asc" ? cmp : -cmp;
    });

  return (
    <div className="flex-1 p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-800">MYK Belgeleri</h2>
          <div className="flex items-center gap-2">
            <button onClick={viewMode === "list" ? exportListToExcel : exportMatrixToExcel} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 transition">
              <Download className="w-3.5 h-3.5" /> Excel Aktar
            </button>
            <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
            <button onClick={() => setViewMode("list")} className={`px-3 py-1.5 text-xs flex items-center gap-1 transition ${viewMode === "list" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}>
              <List className="w-3.5 h-3.5" /> Liste
            </button>
            <button onClick={() => setViewMode("matrix")} className={`px-3 py-1.5 text-xs flex items-center gap-1 transition ${viewMode === "matrix" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}>
              <Grid3X3 className="w-3.5 h-3.5" /> Matris
            </button>
          </div>
        </div>
      </div>
      </div>

      {editStatus && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm border ${editStatus.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          {editStatus.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {editStatus.message}
        </div>
      )}

      {viewMode === "list" ? (
        <>
          <div className="card p-4 mb-6">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Personel veya eğitim adı ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pr-12" />
            </div>
          </div>

          {loading ? <div className="text-center py-12 text-gray-400">Yükleniyor...</div> : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Personel</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">MYK Eğitim</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 cursor-pointer hover:text-gray-800 select-none" onClick={() => toggleSort("alis_tarihi")}>Alış Tarihi{sortArrow("alis_tarihi")}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Geçerlilik Süresi</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 cursor-pointer hover:text-gray-800 select-none" onClick={() => toggleSort("bitis_tarihi")}>Bitiş Tarihi{sortArrow("bitis_tarihi")}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Kalan Süre</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Sertifika</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sorted.map((k) => {
                    const expiryDate = k.alis_tarihi && k.gecerlilik_suresi
                      ? new Date(new Date(k.alis_tarihi).setFullYear(new Date(k.alis_tarihi).getFullYear() + k.gecerlilik_suresi)).toISOString().split("T")[0]
                      : null;
                    const expired = expiryDate ? isExpired(k.alis_tarihi, k.gecerlilik_suresi) : false;
                    const warning = expiryDate && !expired ? isWarningNeeded(k.alis_tarihi, k.gecerlilik_suresi, 30) : false;
                    const kalanText = expiryDate ? kalanSureText(expiryDate) : null;
                    return (
                      <tr key={k.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{k.personel ? `${k.personel.ad || ""} ${k.personel.soyad || ""}`.trim() : "-"}</td>
                        <td className="px-4 py-3 text-sm">{k.myk_egitim_listesi?.ad || (k.sadeceBelge ? "MYK Sertifikası" : "-")}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{displayDate(k.alis_tarihi)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{k.gecerlilik_suresi ? `${k.gecerlilik_suresi} yıl` : "-"}</td>
                        <td className={`px-4 py-3 text-sm ${expired ? "text-red-600 font-medium" : warning ? "text-amber-600 font-medium" : "text-gray-600"}`}>
                          {expiryDate ? <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{displayDate(expiryDate)}</span> : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {kalanText ? (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${kalanText === "Süre doldu" ? "bg-red-100 text-red-700" : (expiryDate && daysUntil(new Date(expiryDate)) <= 30) ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                              {kalanText}
                            </span>
                          ) : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {(mykBelgeByPersonel[k.personel_id] || []).map((b: any) => (
                            b.dosya_url ? (
                              <span key={b.id} className="inline-flex items-center gap-1 mr-2">
                                <a href={b.dosya_url} target="_blank" rel="noopener noreferrer" title={b.dosya_adi || "Sertifika"}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-blue-600 hover:bg-blue-50 border border-blue-200 transition">
                                  <Eye className="w-3 h-3" /> {b.dosya_adi || "Sertifika"}
                                </a>
                              </span>
                            ) : null
                          ))}
                          {(mykBelgeByPersonel[k.personel_id] || []).length === 0 && <span className="text-gray-400">-</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {!k.sadeceBelge ? (
                          <div className="flex items-center justify-center gap-1">
                            <button type="button" onClick={() => toggleLock(k.id)} className={`p-1 rounded border transition ${lockedKayitlar.has(k.id) ? "border-amber-400 bg-amber-50 text-amber-600 hover:bg-amber-100" : "border-gray-200 bg-gray-50 text-gray-400 hover:bg-gray-100"}`} title={lockedKayitlar.has(k.id) ? "Kilidi aç" : "Kilitli"}>
                              {lockedKayitlar.has(k.id) ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                            </button>
                            {lockedKayitlar.has(k.id) && (
                              <button onClick={() => handleDelete(k.id)} className="p-1 text-red-600 hover:bg-red-50 rounded border border-red-200"><Trash2 className="w-4 h-4" /></button>
                            )}
                          </div>
                          ) : <span className="text-gray-300">-</span>}
                        </td>
                      </tr>
                    );
                  })}
                  {sorted.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-gray-400">Kayıt bulunamadı</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-auto">
          {mykEgitimListesi.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Henüz MYK eğitim tanımı yapılmamış</div>
          ) : (
            <table className="w-full min-w-max">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 sticky left-0 bg-gray-50 z-10">Personel</th>
                  {mykEgitimListesi.map((eg) => (
                    <th key={eg.id} className="px-3 py-3 text-center text-xs font-medium text-gray-600 min-w-[100px] max-w-[140px]">{eg.ad}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {personel.map((p) => {
                  const personelEgitimler = personelMykEgitimler[p.id] || new Set();
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-sm text-gray-800 font-medium sticky left-0 bg-white z-10">{p.ad} {p.soyad}</td>
                      {mykEgitimListesi.map((eg) => (
                        <td key={eg.id} className="px-3 py-2.5 text-center">
                          {personelEgitimler.has(eg.id) ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 rounded-full">
                              <Check className="w-3.5 h-3.5 text-green-600" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 text-gray-300">
                              <Minus className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                {personel.length === 0 && (
                  <tr>
                    <td colSpan={mykEgitimListesi.length + 1} className="text-center py-12 text-gray-400">Kayıtlı personel bulunamadı</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
