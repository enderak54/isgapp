"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeForm } from "@/lib/security";
import { Settings, Save, CheckCircle, AlertCircle, AlertTriangle, Sun, Moon, Palette, ChevronDown, ChevronRight } from "lucide-react";

const colorOptions = [
  { key: "", label: "Gri", class: "", bg: "#6b7280" },
  { key: "blue", label: "Mavi", class: "theme-blue", bg: "#3b82f6" },
  { key: "green", label: "Yeşil", class: "theme-green", bg: "#10b981" },
  { key: "purple", label: "Mor", class: "theme-purple", bg: "#8b5cf6" },
  { key: "orange", label: "Turuncu", class: "theme-orange", bg: "#f59e0b" },
  { key: "teal", label: "Teal", class: "theme-teal", bg: "#14b8a6" },
  { key: "pink", label: "Pembe", class: "theme-pink", bg: "#ec4899" },
  { key: "red", label: "Kırmızı", class: "theme-red", bg: "#ef4444" },
];

const fontOptions = [
  { key: "", label: "Varsayılan", class: "" },
  { key: "serif", label: "Serif", class: "font-serif" },
  { key: "mono", label: "Monospace", class: "font-mono" },
  { key: "arial", label: "Arial", class: "font-arial" },
  { key: "tahoma", label: "Tahoma", class: "font-tahoma" },
  { key: "verdana", label: "Verdana", class: "font-verdana" },
  { key: "georgia", label: "Georgia", class: "font-georgia" },
  { key: "trebuchet", label: "Trebuchet MS", class: "font-trebuchet" },
];

const sizeOptions = [
  { key: "small", label: "Küçük" },
  { key: "normal", label: "Normal" },
  { key: "large", label: "Büyük" },
  { key: "xlarge", label: "Çok Büyük" },
];

function applyTheme(theme: { mode?: string; color?: string; font?: string; size?: string }) {
  const root = document.documentElement;
  root.classList.remove("theme-dark", ...colorOptions.map(c => c.class), ...fontOptions.map(f => f.class), ...sizeOptions.map(s => "size-" + s.key));
  if (theme.mode === "dark") root.classList.add("theme-dark");
  if (theme.color) root.classList.add("theme-" + theme.color);
  if (theme.font) root.classList.add("font-" + theme.font);
  if (theme.size && theme.size !== "normal") root.classList.add("size-" + theme.size);
}

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
      const { error: insertError } = await supabase.from("ayarlar").insert(sanitizeForm({
        key: "setup_check",
        value: "true",
        type: "system",
        description: "Database setup"
      }));
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
  const [showModules, setShowModules] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [themeMode, setThemeMode] = useState("light");
  const [themeColor, setThemeColor] = useState("");
  const [themeFont, setThemeFont] = useState("");
  const [themeSize, setThemeSize] = useState("normal");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  useEffect(() => {
    setupDatabase();
    fetchSettings();
    const saved = JSON.parse(localStorage.getItem("isg_theme") || "{}");
    if (saved.mode) setThemeMode(saved.mode);
    if (saved.color) setThemeColor(saved.color);
    if (saved.font) setThemeFont(saved.font);
    if (saved.size) setThemeSize(saved.size);
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
          await supabase.from("ayarlar").insert(sanitizeForm({
            key: mod.key,
            value: "true",
            type: "module",
            description: mod.description,
          }));
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
          await supabase.from("ayarlar").update(sanitizeForm({ value: mod.enabled.toString() })).eq("id", mod.id);
        } else {
          await supabase.from("ayarlar").insert(sanitizeForm({
            key: mod.key,
            value: mod.enabled.toString(),
            type: "module",
            description: mod.description,
          }));
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

  const saveTheme = async () => {
    const theme = { mode: themeMode, color: themeColor, font: themeFont, size: themeSize };
    localStorage.setItem("isg_theme", JSON.stringify(theme));
    applyTheme(theme);
    try {
      await supabase.from("ayarlar").upsert(sanitizeForm({ key: "theme", value: JSON.stringify(theme), type: "theme" }), { onConflict: "key" });
    } catch {}
    setStatus({ type: "success", message: "Tema kaydedildi!" });
  };

  if (loading) return <div className="flex-1 p-8 flex items-center justify-center text-gray-400">Yükleniyor...</div>;

  return (
    <main className="flex-1 p-8 app-bg min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
            <Settings className="w-6 h-6 text-gray-600" />
          </div>
          <div>
              <h2 className="text-2xl font-semibold text-gray-800">Ayarlar</h2>
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
          <button
            onClick={() => setShowModules(!showModules)}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-800">Modül Ayarları</h3>
              <p className="text-sm text-gray-500">Hangi modüller aktif olsun</p>
            </div>
            <div className="flex items-center gap-3">
              {showModules && (
                <button onClick={(e) => { e.stopPropagation(); saveSettings(); }} disabled={saving} className="btn btn-primary text-sm">
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              )}
              {showModules ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
            </div>
          </button>

          {showModules && (
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
              <div className="flex justify-end pt-2">
                <button onClick={saveSettings} disabled={saving} className="btn btn-primary text-sm">
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="card p-6 mt-6">
          <button
            onClick={() => setShowTheme(!showTheme)}
            className="w-full flex items-center justify-between"
          >
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-800">Tema</h3>
              <p className="text-sm text-gray-500">Görünüm ve renk ayarları</p>
            </div>
            <div className="flex items-center gap-3">
              {showTheme && (
                <button onClick={(e) => { e.stopPropagation(); saveTheme(); }} className="btn btn-primary text-sm">Kaydet</button>
              )}
              {showTheme ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
            </div>
          </button>

          {showTheme && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {themeMode === "dark" ? <Moon className="w-5 h-5 text-gray-600" /> : <Sun className="w-5 h-5 text-gray-600" />}
                  <div>
                    <p className="font-medium text-gray-800">Tema Modu</p>
                    <p className="text-sm text-gray-500">{themeMode === "dark" ? "Koyu tema" : "Açık tema"}</p>
                  </div>
                </div>
                <button
                  onClick={() => setThemeMode(themeMode === "dark" ? "light" : "dark")}
                  className={`relative w-12 h-6 rounded-full transition-colors ${themeMode === "dark" ? "bg-gray-700" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${themeMode === "dark" ? "left-7" : "left-1"}`} />
                </button>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Palette className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-800">Renk</p>
                    <p className="text-sm text-gray-500">Vurgu rengini seç</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map((c) => (
                    <button
                      key={c.key || "default"}
                      onClick={() => setThemeColor(c.key)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${themeColor === c.key ? "border-gray-800 scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c.bg }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-800 mb-2">Yazı Tipi</p>
                <select
                  value={themeFont}
                  onChange={(e) => setThemeFont(e.target.value)}
                  className="input"
                >
                  {fontOptions.map((f) => (
                    <option key={f.key || "default"} value={f.key}>{f.label}</option>
                  ))}
                </select>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-800 mb-2">Yazı Boyutu</p>
                <div className="flex gap-2">
                  {sizeOptions.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setThemeSize(s.key)}
                      className={`px-4 py-2 rounded-lg text-sm transition-all ${
                        themeSize === s.key
                          ? "bg-gray-800 text-white"
                          : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>


      </div>
    </main>
  );
}