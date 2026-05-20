"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Settings, Save, CheckCircle, AlertCircle, Module, AlertTriangle } from "lucide-react";

interface ModuleSettings {
  id: string;
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

const defaultModules = [
  { key: "dashboard", label: "İSG Takip", description: "Ana sayfa ve istatistikler" },
  { key: "personel", label: "Personel", description: "Personel kayıt ve listeleme" },
  { key: "myk", label: "MYK Belgeleri", description: "Mesleki yeterlilik belgeleri" },
  { key: "operator", label: "Operatör Belgeleri", description: "Operatör sertifikaları" },
  { key: "dosya", label: "Personel Dosyası", description: "Personel belgeleri" },
  { key: "talimatlar", label: "Talimatlar", description: "İş talimatları" },
  { key: "santiyeler", label: "Şantiyeler", description: "Şantiye yönetimi" },
  { key: "taseronlar", label: "Taşeronlar", description: "Taşeron firma takibi" },
  { key: "sorumlular", label: "Saha Sorumluları", description: "Sorumlu yönetimi" },
  { key: "ekipmanlar", label: "İş Ekipmanları", description: "Ekipman takibi" },
  { key: "kazalar", label: "İş Kazaları", description: "Kaza kaydı ve istatistik" },
  { key: "egitimler", label: "Eğitimler", description: "Eğitim takibi" },
];

async function setupDatabase() {
  try {
    const { error } = await supabase.from("ayarlar").select("id").limit(1);
    if (error?.message?.includes("relation") || error?.message?.includes("does not exist")) {
      const { error: insertError } = await supabase.from("ayarlar").insert({
        key: "setup_check",
        value: "true",
        type: "system",
        description: "Database setup"
      });
      if (insertError && !insertError.message.includes("duplicate")) {
        console.log("Database setup needed - please run SQL in Supabase");
      }
    }
  } catch (e) {
    console.log("Setup check skipped");
  }
}

export default function SettingsPage() {
  const [modules, setModules] = useState<ModuleSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  useEffect(() => {
    setupDatabase();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase.from("ayarlar").select("*").eq("type", "module");
      
      if (data && data.length > 0) {
        const savedModules = defaultModules.map(def => {
          const saved = data.find((d: any) => d.key === def.key);
          return {
            id: saved?.id || "",
            key: def.key,
            label: def.label,
            description: def.description,
            enabled: saved?.value === "true",
          };
        });
        setModules(savedModules);
      } else {
        const newModules = defaultModules.map(def => ({
          id: "",
          key: def.key,
          label: def.label,
          description: def.description,
          enabled: true,
        }));
        setModules(newModules);
        
        for (const mod of newModules) {
          await supabase.from("ayarlar").insert({
            key: mod.key,
            value: "true",
            type: "module",
            description: mod.description,
          });
        }
      }
    } catch (e: any) {
      setStatus({ type: "info", message: "Ayarlar tablosu henüz yok. Lütfen Supabase SQL'de ayarları oluşturun." });
    }
    setLoading(false);
  };

  const toggleModule = (key: string) => {
    setModules(prev => prev.map(m => 
      m.key === key ? { ...m, enabled: !m.enabled } : m
    ));
  };

  const saveSettings = async () => {
    setSaving(true);
    setStatus(null);

    try {
      for (const mod of modules) {
        if (mod.id) {
          await supabase.from("ayarlar").update({ value: mod.enabled.toString() }).eq("id", mod.id);
        } else {
          await supabase.from("ayarlar").insert({
            key: mod.key,
            value: mod.enabled.toString(),
            type: "module",
            description: mod.description,
          });
        }
      }
      
      localStorage.setItem("isg_modules", JSON.stringify(
        modules.reduce((acc, m) => ({ ...acc, [m.key]: m.enabled }), {})
      ));
      
      setStatus({ type: "success", message: "Ayarlar kaydedildi!" });
    } catch (err: any) {
      setStatus({ type: "error", message: "Hata: " + err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex-1 p-8 flex items-center justify-center text-gray-400">Yükleniyor...</div>;

  return (
    <main className="flex-1 p-8 bg-[#f8f7f4] min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
            <Settings className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Ayarlar</h2>
            <p className="text-gray-500">Modül ve sistem ayarları</p>
          </div>
        </div>

        {status && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            status.type === "success" ? "bg-green-50 text-green-700 border border-green-100" : 
            status.type === "info" ? "bg-blue-50 text-blue-700 border border-blue-100" :
            "bg-red-50 text-red-700 border border-red-100"
          }`}>
            {status.type === "success" ? <CheckCircle className="w-5 h-5" /> : 
             status.type === "info" ? <AlertTriangle className="w-5 h-5" /> :
             <AlertCircle className="w-5 h-5" />}
            <span>{status.message}</span>
          </div>
        )}

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Modül Ayarları</h3>
              <p className="text-sm text-gray-500">Hangı modüller aktif olsun</p>
            </div>
            <button onClick={saveSettings} disabled={saving} className="btn btn-primary">
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>

          <div className="space-y-3">
            {modules.map((mod) => (
              <div key={mod.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{mod.label}</p>
                  <p className="text-sm text-gray-500">{mod.description}</p>
                </div>
                <button
                  onClick={() => toggleModule(mod.key)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${mod.enabled ? "bg-green-500" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${mod.enabled ? "left-7" : "left-1"}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Kurulum</h3>
          <p className="text-sm text-gray-600 mb-4">
            Eğer ayarlar çalışmıyorsa, Supabase SQL Editor'da şunu çalıştır:
          </p>
          <pre className="bg-gray-800 text-green-400 p-4 rounded-lg text-xs overflow-x-auto">
{`CREATE TABLE IF NOT EXISTS ayarlar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(50) NOT NULL UNIQUE,
  value TEXT,
  type VARCHAR(50) DEFAULT 'general',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE ayarlar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "okuma" ON ayarlar FOR SELECT USING (true);
CREATE POLICY "yazma" ON ayarlar FOR ALL USING (true);`}
          </pre>
        </div>
      </div>
    </main>
  );
}