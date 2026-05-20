"use client";

import { useState } from "react";
import {
  User, Users, Calendar, Briefcase, Phone, Building2, Shield, Heart, FileText, Save, CheckCircle, AlertCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function PersonnelForm() {
  const [form, setForm] = useState({
    kimlikNo: "", adSoyad: "", iseGirisTarihi: "", meslekKodu: "", telefon: "",
    santiyeAdi: "", ekipAdi: "", yuksekteCalisma: "", myk: "", operatorBelgesi: "", kkd: "", oryantasyon: "",
    kanGrubu: "", yuksekteCalisir: false, yuksekteCalisamaz: false, geceCalisir: false, geceCalisamaz: false,
    vardiyaliCalisir: false, vardiyaliCalisamaz: false, notlar: ["", "", ""],
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [tcError, setTcError] = useState("");

  const handleTcChange = (value: string) => {
    const numericOnly = value.replace(/\D/g, "").slice(0, 11);
    setForm((prev) => ({ ...prev, kimlikNo: numericOnly }));
    
    if (numericOnly.length > 0 && numericOnly.length < 11) {
      setTcError("TC Kimlik No 11 haneli olmalıdır");
    } else {
      setTcError("");
    }
  };

  const validateForm = () => {
    if (form.kimlikNo.length !== 11) {
      setTcError("TC Kimlik No 11 haneli olmalıdır");
      return false;
    }
    return true;
  };

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
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setStatus(null);
    try {
      const { error } = await supabase.from("personel").insert({
        kimlik_no: form.kimlikNo, ad_soyad: form.adSoyad, ise_giris_tarihi: form.iseGirisTarihi || null,
        meslek_kodu: form.meslekKodu, telefon: form.telefon, santiye_adi: form.santiyeAdi, ekip_adi: form.ekipAdi,
        yuksekte_calisma_tarihi: form.yuksekteCalisma || null, myk_tarihi: form.myk || null,
        operator_belgesi_tarihi: form.operatorBelgesi || null, kkd_tarihi: form.kkd || null,
        oryantasyon_tarihi: form.oryantasyon || null, kan_grubu: form.kanGrubu || null,
        yuksekte_calisir: form.yuksekteCalisir, yuksekte_calisamaz: form.yuksekteCalisamaz,
        gece_calisir: form.geceCalisir, gece_calisamaz: form.geceCalisamaz,
        vardiyali_calisir: form.vardiyaliCalisir, vardiyali_calisamaz: form.vardiyaliCalisamaz,
        notlar: form.notlar.filter((n) => n.trim()).join(" | "),
      });
      if (error) throw error;
      setStatus({ type: "success", message: "Personel başarıyla kaydedildi!" });
      setForm({
        kimlikNo: "", adSoyad: "", iseGirisTarihi: "", meslekKodu: "", telefon: "",
        santiyeAdi: "", ekipAdi: "", yuksekteCalisma: "", myk: "", operatorBelgesi: "", kkd: "", oryantasyon: "",
        kanGrubu: "", yuksekteCalisir: false, yuksekteCalisamaz: false, geceCalisir: false, geceCalisamaz: false,
        vardiyaliCalisir: false, vardiyaliCalisamaz: false, notlar: ["", "", ""],
      });
    } catch (err: any) {
      setStatus({ type: "error", message: err.message || "Kayıt sırasında hata oluştu." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 p-8 bg-[#f8f7f4] min-h-screen">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Personel Kayıt</h2>
          <p className="text-gray-500 mt-1">Yeni personel ekleme formu</p>
        </div>
        <Link href="/personel" className="text-gray-500 hover:text-gray-700 text-sm">
          ← Personel Listesi
        </Link>
      </header>

      {status && (
        <div className={`mb-4 p-4 rounded-xl flex items-center gap-3 ${status.type === "success" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
          {status.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{status.message}</span>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <div></div>
        <button type="submit" disabled={loading} className="btn btn-primary text-base px-8 py-2.5">
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-3 gap-6">
          {/* Personel */}
          <div className="card p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-5 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-400" />
              Personel Bilgileri
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1.5 block">TC Kimlik No</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.kimlikNo}
                  onChange={(e) => handleTcChange(e.target.value)}
                  className={`input ${tcError ? "border-red-500 focus:ring-red-300" : ""}`}
                  placeholder="11 haneli TC kimlik numarası"
                  required
                />
                {tcError && <p className="text-xs text-red-500 mt-1">{tcError}</p>}
              </div>
              {[
                { label: "Ad Soyad", icon: User, field: "adSoyad", placeholder: "Ad Soyad" },
                { label: "İşe Giriş Tarihi", icon: Calendar, field: "iseGirisTarihi", type: "date" },
                { label: "Meslek Kodu", icon: Briefcase, field: "meslekKodu", placeholder: "Meslek Kodu" },
                { label: "Telefon", icon: Phone, field: "telefon", placeholder: "05XX XXX XX XX" },
                { label: "Şantiye", icon: Building2, field: "santiyeAdi", placeholder: "Şantiye Adı" },
                { label: "Ekip", icon: Users, field: "ekipAdi", placeholder: "Ekip Adı" },
              ].map((item) => (
                <div key={item.field}>
                  <label className="text-sm text-gray-600 mb-1.5 block">{item.label}</label>
                  <input
                    type={item.type || "text"}
                    value={form[item.field as keyof typeof form] as string}
                    onChange={(e) => handleChange(item.field, e.target.value)}
                    className="input"
                    placeholder={item.placeholder}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* İSG */}
          <div className="card p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-5 flex items-center gap-2">
              <Shield className="w-5 h-5 text-gray-400" />
              İSG Eğitimler
            </h3>
            <div className="space-y-4">
              {[
                { label: "Yüksekte Çalışma", field: "yuksekteCalisma" },
                { label: "MYK", field: "myk" },
                { label: "Operatör Belgesi", field: "operatorBelgesi" },
                { label: "KKD", field: "kkd" },
                { label: "Oryantasyon", field: "oryantasyon" },
              ].map((item) => (
                <div key={item.field} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <input
                    type="date"
                    value={form[item.field as keyof typeof form] as string}
                    onChange={(e) => handleChange(item.field, e.target.value)}
                    className="input w-40"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Sağlık */}
          <div className="card p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-5 flex items-center gap-2">
              <Heart className="w-5 h-5 text-gray-400" />
              Sağlık Durumu
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Sağlık Raporu</label>
                <div className="space-y-2">
                  {[
                    { label: "Yüksekte", canWork: "yuksekteCalisir", cannotWork: "yuksekteCalisamaz" },
                    { label: "Gece", canWork: "geceCalisir", cannotWork: "geceCalisamaz" },
                    { label: "Vardiyalı", canWork: "vardiyaliCalisir", cannotWork: "vardiyaliCalisamaz" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-4 text-sm">
                      <span className="w-16 text-gray-500">{item.label}</span>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name={item.label} checked={form[item.canWork as keyof typeof form] as boolean}
                          onChange={() => { handleChange(item.canWork, true); handleChange(item.cannotWork, false); }}
                          className="w-4 h-4 accent-gray-600" />
                        <span className="text-gray-600">Çalışır</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name={item.label} checked={form[item.cannotWork as keyof typeof form] as boolean}
                          onChange={() => { handleChange(item.cannotWork, true); handleChange(item.canWork, false); }}
                          className="w-4 h-4 accent-gray-600" />
                        <span className="text-gray-600">Çalışamaz</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1.5 block">Kan Grubu</label>
                <select value={form.kanGrubu} onChange={(e) => handleChange("kanGrubu", e.target.value)} className="input">
                  <option value="">Seçiniz...</option>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "0+", "0-"].map((kg) => <option key={kg} value={kg}>{kg}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Notlar */}
        <div className="card p-6 mt-6">
          <h3 className="text-base font-semibold text-gray-800 mb-5 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-400" />
            Notlar
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {form.notlar.map((note, index) => (
              <textarea key={index} value={note} onChange={(e) => handleNoteChange(index, e.target.value)}
                placeholder="Not ekle..." className="input h-28 resize-none" />
            ))}
          </div>
        </div>
      </form>
    </main>
  );
}