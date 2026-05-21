"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Search, Edit, Trash2, UserPlus, Eye, X, Phone, Mail, Building2, Calendar } from "lucide-react";
import { maskTC } from "@/lib/security";
import Link from "next/link";

export default function PersonnelList() {
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<any>(null);

  useEffect(() => {
    fetchPersonnel();
  }, []);

  const fetchPersonnel = async () => {
    const { data } = await supabase.from("personel").select("*").order("created_at", { ascending: false });
    if (data) setPersonnel(data);
    setLoading(false);
  };

  const deletePerson = async (id: string) => {
    if (confirm("Bu personeli silmek istediğinize emin misiniz?")) {
      await supabase.from("personel").delete().eq("id", id);
      fetchPersonnel();
    }
  };

  const filtered = personnel.filter(
    (p) =>
      p.ad_soyad?.toLowerCase().includes(search.toLowerCase()) ||
      p.kimlik_no?.includes(search) ||
      p.santiye_adi?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="flex-1 p-8 app-bg min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Personel Listesi</h2>
          <p className="text-gray-500 mt-1">Toplam {personnel.length} kayıtlı personel</p>
        </div>
        <Link href="/" className="btn btn-primary">
          <UserPlus className="w-4 h-4" />
          Yeni Personel
        </Link>
      </div>

      <div className="card p-4 mb-6">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Personel ara (ad, TC, şantiye)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pr-12"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin mr-2"></div>
          Yükleniyor...
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Ad Soyad</th>
                  <th>TC Kimlik No</th>
                  <th>Şantiye</th>
                  <th>Telefon</th>
                  <th>E-posta</th>
                  <th>Öğrenim</th>
                  <th>İşe Giriş</th>
                  <th style={{ textAlign: "center" }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium text-gray-800">{p.ad_soyad || "-"}</td>
                    <td className="font-mono text-sm">{maskTC(p.kimlik_no)}</td>
                    <td className="text-gray-600">{p.santiye_adi || "-"}</td>
                    <td className="text-gray-600">{p.telefon || "-"}</td>
                    <td className="text-gray-600">{p.email || "-"}</td>
                    <td className="text-gray-600">{p.ogrenim_durumu || "-"}</td>
                    <td className="text-gray-500">{p.ise_giris_tarihi || "-"}</td>
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setSelectedPerson(p)} className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" /> Detay
                        </button>
                        <button className="text-xs text-green-600 hover:text-green-800 px-2 py-1 rounded hover:bg-green-50 transition flex items-center gap-1">
                          <Edit className="w-3.5 h-3.5" /> Düzenle
                        </button>
                        <button onClick={() => deletePerson(p.id)} className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50 transition flex items-center gap-1">
                          <Trash2 className="w-3.5 h-3.5" /> Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">Kayıt bulunamadı</div>
          )}
        </div>
      )}

      {selectedPerson && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-800">Personel Detayı</h3>
              <button onClick={() => setSelectedPerson(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-2xl font-medium text-gray-600">
                  {(selectedPerson.ad_soyad || "?").charAt(0)}
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-800">{selectedPerson.ad_soyad || "-"}</h4>
                  <p className="text-gray-500">{maskTC(selectedPerson.kimlik_no)}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{selectedPerson.telefon || "-"}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{selectedPerson.email || "-"}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{selectedPerson.santiye_adi || "-"}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{selectedPerson.ogrenim_durumu || "-"}</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                  <h5 className="text-sm font-medium text-gray-500 mb-3">İSG Belgeleri</h5>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 bg-gray-50 rounded"><span className="text-gray-500">Yüksekte:</span> {selectedPerson.yuksekte_calisma_tarihi || "-"}</div>
                    <div className="p-2 bg-gray-50 rounded"><span className="text-gray-500">MYK:</span> {selectedPerson.myk_tarihi || "-"}</div>
                    <div className="p-2 bg-gray-50 rounded"><span className="text-gray-500">KKD:</span> {selectedPerson.kkd_tarihi || "-"}</div>
                    <div className="p-2 bg-gray-50 rounded"><span className="text-gray-500">Oryantasyon:</span> {selectedPerson.oryantasyon_tarihi || "-"}</div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <h5 className="text-sm font-medium text-gray-500 mb-3">Sağlık Durumu</h5>
                  <div className="flex gap-2">
                    {selectedPerson.yuksekte_calisamaz ? (
                      <span className="badge bg-red-100 text-red-700">Yüksekte Çalışamaz</span>
                    ) : (
                      <span className="badge bg-green-100 text-green-700">Yüksekte Çalışır</span>
                    )}
                    {selectedPerson.kan_grubu && (
                      <span className="badge bg-gray-100 text-gray-600">Kan: {selectedPerson.kan_grubu}</span>
                    )}
                  </div>
                  {selectedPerson.kronik_rahatlik && (
                    <p className="text-sm text-gray-600 bg-red-50 p-3 rounded-lg mt-2"><strong>Kronik Rahatsızlık:</strong> {selectedPerson.kronik_rahatlik}</p>
                  )}
                </div>

                {selectedPerson.notlar && (
                  <div className="pt-4 border-t border-gray-100">
                    <h5 className="text-sm font-medium text-gray-500 mb-2">Notlar</h5>
                    <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">{selectedPerson.notlar}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}