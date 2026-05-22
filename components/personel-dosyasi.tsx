"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { displayDate } from "@/lib/tarih";
import { Search, FolderOpen, File, FileText, Eye, Download, ChevronRight, User, Folder, Image as ImageIcon, FileText as FileDoc } from "lucide-react";

const FOLDER_CATEGORIES = [
  { key: "isg_egitim", label: "İSG Eğitimleri", icon: FileText, color: "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100" },
  { key: "saglik", label: "Sağlık", icon: FolderOpen, color: "bg-green-50 text-green-600 border-green-200 hover:bg-green-100" },
  { key: "kimlik", label: "Kimlik", icon: File, color: "bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100" },
  { key: "ssk", label: "SSK Belgeleri", icon: FileDoc, color: "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100" },
  { key: "is_guvenligi", label: "İş Güvenliği", icon: Folder, color: "bg-red-50 text-red-600 border-red-200 hover:bg-red-100" },
  { key: "talimat", label: "Talimatlar", icon: FileText, color: "bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100" },
  { key: "diger", label: "Diğer", icon: Folder, color: "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100" },
];

const BELGE_TIPI_TO_FOLDER: Record<string, string> = {
  isg_egitim: "isg_egitim",
  yuksekte_calisma: "isg_egitim",
  myk: "isg_egitim",
  operator_belgesi: "isg_egitim",
  kkd: "isg_egitim",
  oryantasyon: "isg_egitim",
  sertifika: "isg_egitim",
  saglik_raporu: "saglik",
  yuksekte_calisamaz: "saglik",
  gece_calisamaz: "saglik",
  vardiyali_calisamaz: "saglik",
};

const BELGE_TURU_TO_FOLDER: Record<string, string> = {
  saglik_raporu: "saglik",
  egitim_belgesi: "isg_egitim",
  kimlik: "kimlik",
  sss_belgesi: "ssk",
  is_guvenligi: "is_guvenligi",
  diger: "diger",
};

export default function PersonelDosyasi() {
  const [personel, setPersonel] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [belgeler, setBelgeler] = useState<any[]>([]);
  const [dosyalar, setDosyalar] = useState<any[]>([]);
  const [talimatlar, setTalimatlar] = useState<any[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    supabase.from("personel").select("id, kimlik_no, ad, soyad").eq("arsivde", false).order("ad", { ascending: true }).then(({ data }) => {
      if (data) setPersonel(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedPerson) return;
    setFilesLoading(true);
    setSelectedFolder(null);
    setBelgeler([]);
    setDosyalar([]);
    setTalimatlar([]);
    Promise.all([
      supabase.from("personel_belgeleri").select("*").eq("personel_id", selectedPerson.id).is("silinme_tarihi", null),
      supabase.from("personel_dosyasi").select("*").eq("personel_id", selectedPerson.id),
      supabase.from("personel_talimat_matrisi").select("*").eq("personel_id", selectedPerson.id),
    ]).then(([belgelerRes, dosyalarRes, talimatRes]) => {
      if (belgelerRes.data) setBelgeler(belgelerRes.data);
      if (dosyalarRes.data) setDosyalar(dosyalarRes.data);
      if (talimatRes.data) setTalimatlar(talimatRes.data);
      setFilesLoading(false);
    });
  }, [selectedPerson]);

  const filteredPersonel = personel.filter(p =>
    `${p.ad} ${p.soyad}`.toLowerCase().includes(search.toLowerCase()) ||
    (p.kimlik_no || "").includes(search)
  );

  const getFolderFiles = (folderKey: string): any[] => {
    if (folderKey === "talimat") return talimatlar;
    const fromBelgeler = belgeler.filter(b => BELGE_TIPI_TO_FOLDER[b.belge_tipi] === folderKey);
    const fromDosyalar = dosyalar.filter(d => BELGE_TURU_TO_FOLDER[d.belge_turu] === folderKey);
    const merged = [
      ...fromBelgeler.map(b => ({ ...b, _source: "belge", _name: b.dosya_adi || b.belge_tipi, _url: b.dosya_url, _tarih: b.eklenme_tarihi })),
      ...fromDosyalar.map(d => ({ ...d, _source: "dosya", _name: d.belge_adi, _url: d.dosya_url, _tarih: d.tarih })),
    ];
    return merged.sort((a, b) => new Date(b._tarih || 0).getTime() - new Date(a._tarih || 0).getTime());
  };

  const folderFileCount = (folderKey: string): number => {
    if (folderKey === "talimat") return talimatlar.length;
    return belgeler.filter(b => BELGE_TIPI_TO_FOLDER[b.belge_tipi] === folderKey).length +
      dosyalar.filter(d => BELGE_TURU_TO_FOLDER[d.belge_turu] === folderKey).length;
  };

  const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  const getFileIcon = (item: any) => {
    if (item._url && isImage(item._url)) return <ImageIcon className="w-4 h-4 text-blue-500" />;
    return <FileDoc className="w-4 h-4 text-amber-500" />;
  };

  const currentFiles = selectedFolder ? getFolderFiles(selectedFolder) : [];

  return (
    <main className="flex-1 min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-bold text-gray-800 tracking-tight">Personel Dosyası</h1>
      </div>

      {/* Step 1: Personel Seçimi */}
      <div className="px-6 py-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">1</div>
            <span className="text-sm font-semibold text-gray-700">Personel Seçimi</span>
          </div>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Personel adı veya TC kimlik no ile ara..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); setSelectedPerson(null); setSelectedFolder(null); }}
              onFocus={() => setShowDropdown(true)}
              className="input pl-10 pr-4"
            />
            {showDropdown && search && filteredPersonel.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-30">
                {filteredPersonel.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedPerson(p); setSearch(`${p.ad} ${p.soyad}`); setShowDropdown(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 text-left border-b border-gray-50 last:border-0"
                  >
                    <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="font-medium text-gray-800">{p.ad} {p.soyad}</span>
                    <span className="text-xs text-gray-400 ml-auto">{p.kimlik_no}</span>
                  </button>
                ))}
              </div>
            )}
            {showDropdown && search && filteredPersonel.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-sm text-gray-400 z-30">Personel bulunamadı</div>
            )}
          </div>
          {selectedPerson && (
            <div className="mt-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
              <User className="w-4 h-4" /> <span className="font-medium">{selectedPerson.ad} {selectedPerson.soyad}</span> <span className="text-green-500">|</span> <span className="text-green-600">{selectedPerson.kimlik_no}</span>
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Klasör Seçimi */}
      {selectedPerson && (
        <div className="px-6 pb-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">2</div>
              <span className="text-sm font-semibold text-gray-700">Klasör Seçimi</span>
            </div>
            {filesLoading ? (
              <div className="text-center py-6 text-gray-400 text-sm">Yükleniyor...</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {FOLDER_CATEGORIES.map((folder) => {
                  const count = folderFileCount(folder.key);
                  const Icon = folder.icon;
                  return (
                    <button
                      key={folder.key}
                      onClick={() => setSelectedFolder(folder.key)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${selectedFolder === folder.key ? "border-green-500 bg-green-50" : folder.color}`}
                    >
                      <Icon className="w-8 h-8" />
                      <span className="text-xs font-medium text-gray-700 text-center">{folder.label}</span>
                      <span className="text-[10px] text-gray-400">{count} dosya</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Dosyaların Gösterilmesi */}
      {selectedPerson && selectedFolder && (
        <div className="px-6 pb-6 flex-1">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">3</div>
              <span className="text-sm font-semibold text-gray-700">
                {FOLDER_CATEGORIES.find(f => f.key === selectedFolder)?.label || selectedFolder}
              </span>
              <span className="text-xs text-gray-400 ml-auto">{currentFiles.length} dosya bulundu</span>
            </div>
            {currentFiles.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">Bu klasörde henüz dosya bulunmamaktadır.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentFiles.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-sm transition-all">
                    <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                      {getFileIcon(item)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{item._name || "Adsız"}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{item._tarih ? displayDate(item._tarih) : ""}</p>
                    </div>
                    <div className="flex gap-1">
                      {item._url ? (
                        <a href={item._url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded text-blue-600 hover:bg-blue-50 transition" title="Görüntüle">
                          <Eye className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="p-1.5 text-gray-300" title="Dosya yok"><Eye className="w-3.5 h-3.5" /></span>
                      )}
                      {item._url && (
                        <a href={item._url} download className="p-1.5 rounded text-green-600 hover:bg-green-50 transition" title="İndir">
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
