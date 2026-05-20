"use client";

import { useState } from "react";
import {
  User, Users, Calendar, Briefcase, Phone, Building2, Shield, Heart, FileText, Save, CheckCircle, AlertCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const toDisplay = (d: string) => d ? d.split("-").reverse().join(".") : "";
const toDb = (d: string) => d ? d.split(".").reverse().join("-") : "";

export default function PersonnelForm() {
  const [form, setForm] = useState({
    kimlikNo: "", ad: "", soyad: "", iseGirisTarihi: "", meslekKodu: "", telefon: "", email: "",
    santiyeAdi: "", ekipAdi: "", yuksekteCalisma: "", myk: "", operatorBelgesi: "", kkd: "", oryantasyon: "", isgEgitimTarihi: "",
    kanGrubu: "", saglikRaporuTarihi: "", yuksekteCalisir: false, yuksekteCalisamaz: false, geceCalisir: false, geceCalisamaz: false,
    vardiyaliCalisir: false, vardiyaliCalisamaz: false, notlar: ["", "", ""],
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [tcError, setTcError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    const newErrors: Record<string, string> = {};
    if (form.kimlikNo.length !== 11) newErrors.kimlikNo = "TC Kimlik No 11 haneli olmalıdır";
    if (!form.ad.trim()) newErrors.ad = "Ad zorunludur";
    if (!form.soyad.trim()) newErrors.soyad = "Soyad zorunludur";
    if (!form.isgEgitimTarihi) newErrors.isgEgitimTarihi = "Zorunludur";
    if (!form.yuksekteCalisma) newErrors.yuksekteCalisma = "Zorunludur";
    if (!form.myk) newErrors.myk = "Zorunludur";
    if (!form.kkd) newErrors.kkd = "Zorunludur";
    if (!form.saglikRaporuTarihi) newErrors.saglikRaporuTarihi = "Zorunludur";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
        kimlik_no: form.kimlikNo, ad_soyad: (form.ad + " " + form.soyad).trim(), ise_giris_tarihi: form.iseGirisTarihi || null,
        meslek_kodu: form.meslekKodu, telefon: form.telefon, email: form.email || null, santiye_adi: form.santiyeAdi, ekip_adi: form.ekipAdi,
        isg_egitim_tarihi: form.isgEgitimTarihi || null, yuksekte_calisma_tarihi: form.yuksekteCalisma || null, myk_tarihi: form.myk || null,
        operator_belgesi_tarihi: form.operatorBelgesi || null, kkd_tarihi: form.kkd || null,
        oryantasyon_tarihi: form.oryantasyon || null, kan_grubu: form.kanGrubu || null, saglik_raporu_tarihi: form.saglikRaporuTarihi || null,
        yuksekte_calisir: form.yuksekteCalisir, yuksekte_calisamaz: form.yuksekteCalisamaz,
        gece_calisir: form.geceCalisir, gece_calisamaz: form.geceCalisamaz,
        vardiyali_calisir: form.vardiyaliCalisir, vardiyali_calisamaz: form.vardiyaliCalisamaz,
        notlar: form.notlar.filter((n) => n.trim()).join(" | "),
      });
      if (error) throw error;
      setStatus({ type: "success", message: "Personel başarıyla kaydedildi!" });
      setForm({
        kimlikNo: "", ad: "", soyad: "", iseGirisTarihi: "", meslekKodu: "", telefon: "", email: "",
    santiyeAdi: "", ekipAdi: "", yuksekteCalisma: "", myk: "", operatorBelgesi: "", kkd: "", oryantasyon: "", isgEgitimTarihi: "",
        kanGrubu: "", saglikRaporuTarihi: "", yuksekteCalisir: false, yuksekteCalisamaz: false, geceCalisir: false, geceCalisamaz: false,
        vardiyaliCalisir: false, vardiyaliCalisamaz: false, notlar: ["", "", ""],
      });
    } catch (err: any) {
      setStatus({ type: "error", message: err.message || "Kayıt sırasında hata oluştu." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 p-4 app-bg min-h-screen">
      {status && (
        <div className={`mb-3 p-3 rounded-lg flex items-center gap-2 text-sm ${status.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {status.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{status.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="flex justify-end items-center gap-3 mb-4">
          <Link href="/personel" className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2">
            📋 Liste
          </Link>
          <button type="submit" disabled={loading} className="btn btn-primary text-sm px-6 py-2">
            {loading ? "Kaydediliyor..." : "💾 Kaydet"}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {/* Personel */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              Personel Bilgileri
            </h3>
            <div className="space-y-2">
              <div>
                <label className="text-sm text-gray-600 mb-1.5 block">TC Kimlik No</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.kimlikNo}
                  onChange={(e) => { handleTcChange(e.target.value); setErrors((p) => ({ ...p, kimlikNo: "" })); }}
                  className={`input ${errors.kimlikNo || tcError ? "border-red-500 focus:ring-red-300" : ""}`}
                  placeholder="11 haneli TC kimlik numarası"
                />
                {(errors.kimlikNo || tcError) && <p className="text-xs text-red-500 mt-1">{errors.kimlikNo || tcError}</p>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Ad</label>
                    <input
                      type="text"
                      value={form.ad}
                      onChange={(e) => { handleChange("ad", e.target.value); setErrors((p) => ({ ...p, ad: "" })); }}
                      className={`input ${errors.ad ? "border-red-500" : ""}`}
                      placeholder="Ad"
                    />
                    {errors.ad && <p className="text-xs text-red-500 mt-1">{errors.ad}</p>}
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Soyad</label>
                    <input
                      type="text"
                      value={form.soyad}
                      onChange={(e) => { handleChange("soyad", e.target.value); setErrors((p) => ({ ...p, soyad: "" })); }}
                      className={`input ${errors.soyad ? "border-red-500" : ""}`}
                      placeholder="Soyad"
                    />
                    {errors.soyad && <p className="text-xs text-red-500 mt-1">{errors.soyad}</p>}
                </div>
              </div>
              {[
                { label: "İşe Giriş Tarihi", icon: Calendar, field: "iseGirisTarihi", type: "date" },
                { label: "Meslek Kodu", icon: Briefcase, field: "meslekKodu", placeholder: "Meslek Kodu" },
                { label: "Telefon", icon: Phone, field: "telefon", placeholder: "05XX XXX XX XX" },
                { label: "Email", field: "email", placeholder: "ornek@mail.com" },
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
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-gray-400" />
              İSG Eğitimler
            </h3>
            <div className="flex flex-col gap-0">
              {[
                { label: "İSG Eğitim Tarihi", field: "isgEgitimTarihi" },
                { label: "Yüksekte Çalışma", field: "yuksekteCalisma" },
                { label: "MYK", field: "myk" },
                { label: "Operatör Belgesi", field: "operatorBelgesi" },
                { label: "KKD", field: "kkd" },
                { label: "Oryantasyon", field: "oryantasyon" },
              ].map((item, idx) => {
                const errField = item.field as keyof typeof errors;
                const hasErr = errors[errField as string];
                return (
                <div 
                  key={item.field} 
                  className={`flex items-center justify-between px-3 py-2 ${idx % 2 === 0 ? "bg-gray-100" : "bg-white"}`}
                >
                  <span className="text-xs text-gray-700 w-40">{item.label}</span>
                  <div className="flex items-center gap-0.5">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="gg.aa.yyyy"
                      maxLength={10}
                      value={toDisplay(form[item.field as keyof typeof form] as string)}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9.]/g, "");
                        handleChange(item.field, toDb(v));
                        setErrors((p) => ({ ...p, [item.field]: "" }));
                      }}
                      className={`input text-xs ${hasErr ? "border-red-500" : ""}`}
                      style={{ width: "5.5rem" }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const picker = document.getElementById(`dp-${item.field}`) as HTMLInputElement;
                        if (!picker) return;
                        const rect = (document.getElementById(`dp-btn-${item.field}`) as HTMLElement).getBoundingClientRect();
                        picker.style.position = "fixed";
                        picker.style.left = rect.left + "px";
                        picker.style.top = rect.top + "px";
                        picker.style.width = "1px";
                        picker.style.height = "1px";
                        picker.style.opacity = "0";
                        picker.style.display = "block";
                        picker.focus();
                        picker.showPicker();
                      }}
                      id={`dp-btn-${item.field}`}
                      className="text-gray-400 hover:text-gray-600 p-0.5"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                    </button>
                    <input
                      id={`dp-${item.field}`}
                      type="date"
                      className="hidden"
                      value={form[item.field as keyof typeof form] as string}
                      onChange={(e) => { handleChange(item.field, e.target.value); }}
                      onBlur={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  </div>
                  {hasErr && <p className="text-xs text-red-500">{hasErr}</p>}
                </div>
              );
              })}
            </div>
          </div>

          {/* Sağlık */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Heart className="w-4 h-4 text-gray-400" />
              Sağlık Durumu
            </h3>
            <div className="space-y-2">
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Sağlık Raporu Tarihi</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-0.5">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="gg.aa.yyyy"
                      maxLength={10}
                      value={toDisplay(form.saglikRaporuTarihi)}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9.]/g, "");
                        handleChange("saglikRaporuTarihi", toDb(v));
                        setErrors((p) => ({ ...p, saglikRaporuTarihi: "" }));
                      }}
                      className={`input text-xs ${errors.saglikRaporuTarihi ? "border-red-500" : ""}`}
                      style={{ width: "5.5rem" }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const picker = document.getElementById("dp-saglikRaporu") as HTMLInputElement;
                        if (!picker) return;
                        const rect = (document.getElementById("dp-btn-saglikRaporu") as HTMLElement).getBoundingClientRect();
                        picker.style.position = "fixed";
                        picker.style.left = rect.left + "px";
                        picker.style.top = rect.top + "px";
                        picker.style.width = "1px";
                        picker.style.height = "1px";
                        picker.style.opacity = "0";
                        picker.style.display = "block";
                        picker.focus();
                        picker.showPicker();
                      }}
                      id="dp-btn-saglikRaporu"
                      className="text-gray-400 hover:text-gray-600 p-0.5"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                    </button>
                    <input
                      id="dp-saglikRaporu"
                      type="date"
                      className="hidden"
                      value={form.saglikRaporuTarihi}
                      onChange={(e) => handleChange("saglikRaporuTarihi", e.target.value)}
                      onBlur={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  </div>
                  {errors.saglikRaporuTarihi && <p className="text-xs text-red-500">{errors.saglikRaporuTarihi}</p>}
                  {[
                    { label: "Yüksekte", canWork: "yuksekteCalisir", cannotWork: "yuksekteCalisamaz" },
                    { label: "Gece", canWork: "geceCalisir", cannotWork: "geceCalisamaz" },
                    { label: "Vardiyalı", canWork: "vardiyaliCalisir", cannotWork: "vardiyaliCalisamaz" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-4 text-sm">
                      <span className="text-xs text-gray-700 w-20">{item.label}</span>
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
        <div className="card p-3 mt-3">
          <button 
            type="button"
            onClick={() => setShowNotes(!showNotes)} 
            className="w-full flex items-center justify-between text-sm font-semibold text-gray-800"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              Notlar
            </div>
            <span className="text-gray-400">{showNotes ? "▼" : "▶"}</span>
          </button>
          {showNotes && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {form.notlar.map((note, index) => (
                <textarea key={index} value={note} onChange={(e) => handleNoteChange(index, e.target.value)}
                  placeholder="Not ekle..." className="input h-16 resize-none text-xs" />
              ))}
            </div>
          )}
        </div>
      </form>
    </main>
  );
}