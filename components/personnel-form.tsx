"use client";

import { useState } from "react";
import {
  User,
  Users,
  Calendar,
  Briefcase,
  Phone,
  Building2,
  Shield,
  Heart,
  FileText,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function PersonnelForm() {
  const [form, setForm] = useState({
    kimlikNo: "",
    adSoyad: "",
    iseGirisTarihi: "",
    meslekKodu: "",
    telefon: "",
    santiyeAdi: "",
    ekipAdi: "",
    yuksekteCalisma: "",
    myk: "",
    operatorBelgesi: "",
    kkd: "",
    oryantasyon: "",
    kanGrubu: "",
    yuksekteCalisir: false,
    yuksekteCalisamaz: false,
    geceCalisir: false,
    geceCalisamaz: false,
    vardiyaliCalisir: false,
    vardiyaliCalisamaz: false,
    notlar: ["", "", ""],
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleNoteChange = (index: number, value: string) => {
    const newNotes = [...form.notlar];
    newNotes[index] = value;
    setForm((prev) => ({ ...prev, notlar: newNotes }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const { data, error } = await supabase.from("personel").insert({
        kimlik_no: form.kimlikNo,
        ad_soyad: form.adSoyad,
        ise_giris_tarihi: form.iseGirisTarihi || null,
        meslek_kodu: form.meslekKodu,
        telefon: form.telefon,
        santiye_adi: form.santiyeAdi,
        ekip_adi: form.ekipAdi,
        yuksekte_calisma_tarihi: form.yuksekteCalisma || null,
        myk_tarihi: form.myk || null,
        operator_belgesi_tarihi: form.operatorBelgesi || null,
        kkd_tarihi: form.kkd || null,
        oryantasyon_tarihi: form.oryantasyon || null,
        kan_grubu: form.kanGrubu || null,
        yuksekte_calisir: form.yuksekteCalisir,
        yuksekte_calisamaz: form.yuksekteCalisamaz,
        gece_calisir: form.geceCalisir,
        gece_calisamaz: form.geceCalisamaz,
        vardiyali_calisir: form.vardiyaliCalisir,
        vardiyali_calisamaz: form.vardiyaliCalisamaz,
        notlar: form.notlar.filter((n) => n.trim()).join(" | "),
      }).select();

      if (error) throw error;

      setStatus({ type: "success", message: "Personel başarıyla kaydedildi!" });
      setForm({
        kimlikNo: "",
        adSoyad: "",
        iseGirisTarihi: "",
        meslekKodu: "",
        telefon: "",
        santiyeAdi: "",
        ekipAdi: "",
        yuksekteCalisma: "",
        myk: "",
        operatorBelgesi: "",
        kkd: "",
        oryantasyon: "",
        kanGrubu: "",
        yuksekteCalisir: false,
        yuksekteCalisamaz: false,
        geceCalisir: false,
        geceCalisamaz: false,
        vardiyaliCalisir: false,
        vardiyaliCalisamaz: false,
        notlar: ["", "", ""],
      });
    } catch (err: any) {
      setStatus({ type: "error", message: err.message || "Kayıt sırasında hata oluştu." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 p-6 bg-gray-50 min-h-screen">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Personel Kayıt</h2>
        <p className="text-gray-500 mt-1">
          Personel bilgilerini kaydetmek için formu doldurun.
        </p>
      </header>

      {status && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            status.type === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}
        >
          {status.type === "success" ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{status.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personel Kayıt */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              Personel Kayıt
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                  <User className="w-4 h-4" />
                  Kimlik Numarası
                </label>
                <input
                  type="text"
                  value={form.kimlikNo}
                  onChange={(e) => handleChange("kimlikNo", e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="TC Kimlik No"
                  required
                  maxLength={11}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                  <User className="w-4 h-4" />
                  Ad Soyad
                </label>
                <input
                  type="text"
                  value={form.adSoyad}
                  onChange={(e) => handleChange("adSoyad", e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ad Soyad"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4" />
                  İşe Giriş Tarihi
                </label>
                <input
                  type="date"
                  value={form.iseGirisTarihi}
                  onChange={(e) => handleChange("iseGirisTarihi", e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                  <Briefcase className="w-4 h-4" />
                  Meslek Kodu
                </label>
                <input
                  type="text"
                  value={form.meslekKodu}
                  onChange={(e) => handleChange("meslekKodu", e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Meslek Kodu"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                  <Phone className="w-4 h-4" />
                  Telefon Numarası
                </label>
                <input
                  type="tel"
                  value={form.telefon}
                  onChange={(e) => handleChange("telefon", e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="05XX XXX XX XX"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                  <Building2 className="w-4 h-4" />
                  Şantiye Adı
                </label>
                <input
                  type="text"
                  value={form.santiyeAdi}
                  onChange={(e) => handleChange("santiyeAdi", e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Şantiye Adı"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4" />
                  Ekip Adı
                </label>
                <input
                  type="text"
                  value={form.ekipAdi}
                  onChange={(e) => handleChange("ekipAdi", e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ekip Adı"
                />
              </div>
            </div>
          </div>

          {/* İSG */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center justify-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              İSG
            </h3>
            <div className="space-y-4">
              {[
                { label: "Yüksekte Çalışma Eğitimi", field: "yuksekteCalisma" },
                { label: "MYK", field: "myk" },
                { label: "Operatör Belgesi", field: "operatorBelgesi" },
                { label: "KKD", field: "kkd" },
                { label: "Oryantasyon", field: "oryantasyon" },
              ].map((item) => (
                <div key={item.field} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gray-400" />
                    {item.label}
                  </span>
                  <input
                    type="date"
                    value={form[item.field as keyof typeof form] as string}
                    onChange={(e) => handleChange(item.field, e.target.value)}
                    className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Sağlık */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center justify-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              Sağlık
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="font-medium">Sağlık Raporu</span>
              </div>

              {[
                { label: "Yüksekte", canWork: "yuksekteCalisir", cannotWork: "yuksekteCalisamaz" },
                { label: "Gece", canWork: "geceCalisir", cannotWork: "geceCalisamaz" },
                { label: "Vardiyalı", canWork: "vardiyaliCalisir", cannotWork: "vardiyaliCalisamaz" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-4 text-sm">
                  <span className="w-20 text-gray-600">{item.label}</span>
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name={item.label}
                      checked={form[item.canWork as keyof typeof form] as boolean}
                      onChange={() => {
                        handleChange(item.canWork, true);
                        handleChange(item.cannotWork, false);
                      }}
                      className="accent-green-600"
                    />
                    <span>Çalışır</span>
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name={item.label}
                      checked={form[item.cannotWork as keyof typeof form] as boolean}
                      onChange={() => {
                        handleChange(item.cannotWork, true);
                        handleChange(item.canWork, false);
                      }}
                      className="accent-red-600"
                    />
                    <span>Çalışamaz</span>
                  </label>
                </div>
              ))}

              <div>
                <label className="text-sm text-gray-600 mb-1 block">
                  Kan Grubu
                </label>
                <select
                  value={form.kanGrubu}
                  onChange={(e) => handleChange("kanGrubu", e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Kan Grubu...</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="0+">0+</option>
                  <option value="0-">0-</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Notlar */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            Notlar
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {form.notlar.map((note, index) => (
              <textarea
                key={index}
                value={note}
                onChange={(e) => handleNoteChange(index, e.target.value)}
                placeholder="Not ekle..."
                className="h-32 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-yellow-50"
              />
            ))}
          </div>
        </div>

        {/* Kaydet Butonu */}
        <div className="mt-6 flex justify-center">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white py-3 px-8 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Kaydet
              </>
            )}
          </button>
        </div>
      </form>
    </main>
  );
}
