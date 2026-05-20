"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { Shield, AlertCircle } from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setError("Kayıt başarılı! Giriş yapabilirsiniz.");
        setIsRegister(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4]">
      <div className="card p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center">
            <Shield className="w-8 h-8 text-gray-600" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-2">
          {isRegister ? "Kayıt Ol" : "Giriş Yap"}
        </h2>
        <p className="text-center text-gray-500 mb-6">
          {isRegister ? "Hesap oluştur" : "ISG Takip Sistemine giriş"}
        </p>

        {error && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${error.includes("başarılı") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="ornek@mail.com"
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1.5 block">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? "İşleniyor..." : isRegister ? "Kayıt Ol" : "Giriş Yap"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => { setIsRegister(!isRegister); setError(""); }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {isRegister ? "Zaten hesabın var mı? Giriş yap" : "Hesabın yok mu? Kayıt ol"}
          </button>
        </div>
      </div>
    </div>
  );
}
