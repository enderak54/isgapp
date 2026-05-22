"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Search, Archive, Calendar, AlertTriangle, Trash2, Lock, Unlock, UserX } from "lucide-react";

export default function Arsiv() {
  const [kayitlar, setKayitlar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [lockedItems, setLockedItems] = useState<Set<string>>(new Set());

  useEffect(() => { fetchArsiv(); }, []);

  const fetchArsiv = async () => {
    const { data } = await supabase.from("personel").select("*").eq("arsivde", true).order("ayrilis_tarihi", { ascending: false });
    if (data) setKayitlar(data);
    setLoading(false);
  };

  const toggleLock = (id: string) => {
    setLockedItems(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const kaliciSil = async (id: string) => {
    if (!confirm("Bu kaydı tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) return;
    await supabase.from("personel").delete().eq("id", id);
    setLockedItems(prev => { const n = new Set(prev); n.delete(id); return n; });
    fetchArsiv();
  };

  const geriYukle = async (id: string) => {
    await supabase.from("personel").update({ arsivde: false, ayrilis_tarihi: null, ayrilis_nedeni: null }).eq("id", id);
    fetchArsiv();
  };

  const filtered = kayitlar.filter(k =>
    !search ||
    `${k.ad || ""} ${k.soyad || ""}`.toLowerCase().includes(search.toLowerCase()) ||
    (k.kimlik_no || "").includes(search)
  );

  return (
    <main className="flex-1 p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-2 mb-6">
        <Archive className="w-6 h-6 text-amber-600" />
        <h2 className="text-2xl font-bold text-gray-800">Arşiv</h2>
        <span className="text-sm text-gray-400 ml-2">{kayitlar.length} kayıt</span>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="İsim veya TC ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-4 pr-10 py-2 border rounded-lg" />
        </div>
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">Yükleniyor...</div> : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Ad Soyad</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">TC Kimlik</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Ayrılış Tarihi</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Ayrılış Nedeni</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((k) => (
                <tr key={k.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{k.ad} {k.soyad}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{k.kimlik_no}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 flex items-center gap-1"><Calendar className="w-3 h-3" />{k.ayrilis_tarihi || "-"}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${k.ayrilis_nedeni === "istirak_ayrilis" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                      {k.ayrilis_nedeni === "istirak_ayrilis" ? <UserX className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {k.ayrilis_nedeni === "istirak_ayrilis" ? "İşten Ayrılış" : "Hatalı Kayıt"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => geriYukle(k.id)} className="p-1 text-green-600 hover:bg-green-50 rounded border border-green-200" title="Geri yükle">
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => toggleLock(k.id)} className={`p-1 rounded border transition ${lockedItems.has(k.id) ? "border-amber-400 bg-amber-50 text-amber-600 hover:bg-amber-100" : "border-gray-200 bg-gray-50 text-gray-400 hover:bg-gray-100"}`} title={lockedItems.has(k.id) ? "Kilidi aç" : "Kilitli"}>
                        {lockedItems.has(k.id) ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      </button>
                      {lockedItems.has(k.id) && (
                        <button onClick={() => kaliciSil(k.id)} className="p-1 text-red-600 hover:bg-red-50 rounded border border-red-200"><Trash2 className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">Arşivde kayıt bulunamadı</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
