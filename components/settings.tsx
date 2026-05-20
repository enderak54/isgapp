"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Settings, Save, CheckCircle, AlertCircle, Module, Eye, EyeOff } from "lucide-react";

interface ModuleSettings {
  id: string;
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  icon: string;
}

const defaultModules: Omit<ModuleSettings, "id" | "enabled">[] = [
  { key: "dashboard", label: "İSG Takip", description: "Ana sayfa ve istatistikler", icon: "LayoutDashboard" },
  { key: "personel", label: "Personel", description: "Personel kayıt ve listeleme", icon: "Users" },
  { key: "myk", label: "MYK Belgeleri", description: "Mesleki yeterlilik belgeleri", icon: "GraduationCap" },
  { key: "operator", label: "Operatör Belgeleri", description: "Operatör sertifikaları", icon: "Shield" },
  { key: "dosya", label: "Personel Dosyası", description: "Personel belgeleri", icon: "FolderOpen" },
  { key: "talimatlar", label: "Talimatlar", description: "İş talimatları", icon: "FileText" },
  { key: "santiyeler", label: "Şantiyeler", description: "Şantiye yönetimi", icon: "Building2" },
  { key: "taseronlar", label: "Taşeronlar", description: "Taşeron firma takibi", icon: "HardHat" },
  { key: "sorumlular", label: "Saha Sorumluları", description: "Sorumlu yönetimi", icon: "UserCog" },
  { key: "ekipmanlar", label: "İş Ekipmanları", description: "Ekipman takibi", icon: "Wrench" },
  { key: "kazalar", label: "İş Kazaları", description: "Kaza kaydı ve istatistik", icon: "AlertTriangle" },
  { key: "egitimler", label: "Eğitimler", description: "Eğitim takibi", icon: "GraduationCap" },
];

export default function SettingsPage() {
  const [modules, setModules] = useState<ModuleSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
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
          icon: def.icon,
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
        icon: def.icon,
      }));
      setModules(newModules);
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
      
      const { data: cacheData } = await supabase.from("ayarlar").select("key, value").eq("type", "module");
      localStorage.setItem("isg_modules", JSON.stringify(cacheData?.reduce((acc: any, d: any) => ({ ...acc, [d.key]: d.value === "true" }), {})));
      
      setStatus({ type: "success", message: "Ayarlar başarıyla kaydedildi!" });
    } catch (err: any) {
      setStatus({ type: "error", message: err.message || "Kayıt sırasında hata oluştu" });
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
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${status.type === "success" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
            {status.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{status.message}</span>
          </div>
        )}

        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Modül Ayarları</h3>
              <p className="text-sm text-gray-500">Hang modüllerin aktif olacağını belirleyin</p>
            </div>
            <button onClick={saveSettings} disabled={saving} className="btn btn-primary">
              {saving ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Kaydediliyor</>
              ) : (
                <><Save className="w-4 h-4" />Kaydet</>
              )}
            </button>
          </div>

          <div className="space-y-3">
            {modules.map((mod) => (
              <div key={mod.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${mod.enabled ? "bg-blue-50" : "bg-gray-200"}`}>
                    <Module className={`w-5 h-5 ${mod.enabled ? "text-blue-500" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{mod.label}</p>
                    <p className="text-sm text-gray-500">{mod.description}</p>
                  </div>
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

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Sistem Bilgileri</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p><span className="font-medium">Versiyon:</span> 1.0.0</p>
            <p><span className="font-medium">Veritabanı:</span> Supabase</p>
            <p><span className="font-medium">Son Güncelleme:</span> {new Date().toLocaleDateString("tr-TR")}</p>
          </div>
        </div>
      </div>
    </main>
  );
}