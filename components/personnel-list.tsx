"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Search, Edit, Trash2, UserPlus, Eye, X } from "lucide-react";
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
    <main className="flex-1 p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Personel Listesi</h2>
          <p className="text-gray-500 mt-1">Toplam {personnel.length} personel</p>
        </div>
        <Link
          href="/"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <UserPlus className="w-5 h-5" />
          Yeni Personel
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Personel ara (ad, kimlik no, şantiye)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Ad Soyad</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Kimlik No</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Şantiye</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Telefon</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">İş Giriş</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{p.ad_soyad || "-"}</td>
                  <td className="px-4 py-3 text-sm">{p.kimlik_no}</td>
                  <td className="px-4 py-3 text-sm">{p.santiye_adi || "-"}</td>
                  <td className="px-4 py-3 text-sm">{p.telefon || "-"}</td>
                  <td className="px-4 py-3 text-sm">{p.ise_giris_tarihi || "-"}</td>
                  <td className="px-4 py-3 flex justify-center gap-2">
                    <button
                      onClick={() => setSelectedPerson(p)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="Detay"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-green-600 hover:bg-green-50 rounded" title="Düzenle">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deletePerson(p.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-8 text-gray-500">Personel bulunamadı</div>
          )}
        </div>
      )}

      {selectedPerson && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Personel Detayı</h3>
              <button onClick={() => setSelectedPerson(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-gray-500">Ad Soyad:</span>
                <span>{selectedPerson.ad_soyad || "-"}</span>
                <span className="text-gray-500">Kimlik No:</span>
                <span>{selectedPerson.kimlik_no}</span>
                <span className="text-gray-500">Telefon:</span>
                <span>{selectedPerson.telefon || "-"}</span>
                <span className="text-gray-500">Email:</span>
                <span>{selectedPerson.email || "-"}</span>
                <span className="text-gray-500">Şantiye:</span>
                <span>{selectedPerson.santiye_adi || "-"}</span>
                <span className="text-gray-500">Ekip:</span>
                <span>{selectedPerson.ekip_adi || "-"}</span>
                <span className="text-gray-500">Meslek Kodu:</span>
                <span>{selectedPerson.meslek_kodu || "-"}</span>
                <span className="text-gray-500">İş Giriş:</span>
                <span>{selectedPerson.ise_giris_tarihi || "-"}</span>
                <span className="text-gray-500">Kan Grubu:</span>
                <span>{selectedPerson.kan_grubu || "-"}</span>
              </div>
              <div className="border-t pt-3">
                <h4 className="font-medium mb-2">İSG Belgeleri</h4>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-gray-500">Yüksekte Çalışma:</span>
                  <span>{selectedPerson.yuksekte_calisma_tarihi || "-"}</span>
                  <span className="text-gray-500">MYK:</span>
                  <span>{selectedPerson.myk_tarihi || "-"}</span>
                  <span className="text-gray-500">Operatör Belgesi:</span>
                  <span>{selectedPerson.operator_belgesi_tarihi || "-"}</span>
                  <span className="text-gray-500">KKD:</span>
                  <span>{selectedPerson.kkd_tarihi || "-"}</span>
                  <span className="text-gray-500">Oryantasyon:</span>
                  <span>{selectedPerson.oryantasyon_tarihi || "-"}</span>
                </div>
              </div>
              <div className="border-t pt-3">
                <h4 className="font-medium mb-2">Sağlık Durumu</h4>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-gray-500">Yüksekte:</span>
                  <span className={selectedPerson.yuksekte_calisamaz ? "text-red-600" : "text-green-600"}>
                    {selectedPerson.yuksekte_calisamaz ? "Çalışamaz" : "Çalışır"}
                  </span>
                  <span className="text-gray-500">Gece:</span>
                  <span className={selectedPerson.gece_calisamaz ? "text-red-600" : "text-green-600"}>
                    {selectedPerson.gece_calisamaz ? "Çalışamaz" : "Çalışır"}
                  </span>
                  <span className="text-gray-500">Vardiyalı:</span>
                  <span className={selectedPerson.vardiyali_calisamaz ? "text-red-600" : "text-green-600"}>
                    {selectedPerson.vardiyali_calisamaz ? "Çalışamaz" : "Çalışır"}
                  </span>
                </div>
              </div>
              {selectedPerson.notlar && (
                <div className="border-t pt-3">
                  <h4 className="font-medium mb-2">Notlar</h4>
                  <p className="text-gray-600">{selectedPerson.notlar}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
