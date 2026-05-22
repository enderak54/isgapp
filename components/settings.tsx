"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeForm } from "@/lib/security";
import { Settings, Save, CheckCircle, AlertCircle, AlertTriangle, Sun, Moon, Palette, ChevronDown, ChevronRight, GitBranch, Plus, X, Tag, Calendar, User, Clock, Menu, GripVertical, Cpu, ExternalLink, Code, Brain } from "lucide-react";
import { EGITIM_FIELDS } from "@/lib/egitim-uyari";

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
  { key: "talimatlar", label: "Talimat Takibi", description: "İş talimatları" },
  { key: "santiyeler", label: "Şantiyeler", description: "Şantiye yönetimi" },
  { key: "taseronlar", label: "Taşeronlar", description: "Taşeron firma takibi" },
  { key: "sorumlular", label: "Saha Sorumluları", description: "Sorumlu yönetimi" },
  { key: "ekipmanlar", label: "İş Ekipmanları", description: "Ekipman takibi" },
  { key: "kazalar", label: "İş Kazaları", description: "Kaza kaydı ve istatistik" },
  { key: "egitimler", label: "Eğitimler", description: "Eğitim takibi" },
  { key: "ihtar", label: "İhtar Tutanağı", description: "Personel ihtar ve uyarı kayıtları" },
  { key: "risk", label: "Risk Değerlendirme", description: "Tehlike tanımlama ve risk analizi" },
  { key: "yasal", label: "Yasal Uygunluk", description: "Yasal gereklilikler ve uyum takibi" },
  { key: "denetim", label: "İç Denetim", description: "Denetim planlama ve bulgu takibi" },
  { key: "acil", label: "Acil Durum", description: "Acil durum senaryoları ve tatbikat" },
  { key: "duzeltici", label: "Düzeltici Faaliyet", description: "Kök neden analizi ve CAPA" },
  { key: "ygg", label: "Yönetim Gözden Geçirme", description: "Üst yönetim değerlendirme" },
  { key: "dokuman", label: "Doküman Kontrol", description: "Doküman versiyon ve onay takibi" },
  { key: "yetkinlik", label: "Yetkinlik Matrisi", description: "Personel yetkinlik ve sertifika" },
  { key: "performans", label: "Performans İzleme", description: "İSG performans göstergeleri" },
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
  const [showVersion, setShowVersion] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiEntries, setAiEntries] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [commits, setCommits] = useState<any[]>([]);
  const [commitsLoading, setCommitsLoading] = useState(false);
  const [menuItems, setMenuItems] = useState<{ key: string; label: string; grup: "main" | "ek" }[]>([]);
  const [menuSaving, setMenuSaving] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [showAddVersion, setShowAddVersion] = useState(false);
  const [newVersion, setNewVersion] = useState({ versiyon: "", tip: "minor" as string, aciklama: "", detaylar: "", yazar: "" });
  const [showUyari, setShowUyari] = useState(false);
  const [uyariAyarlari, setUyariAyarlari] = useState<Record<string, string>>({});
  const [uyariSaving, setUyariSaving] = useState(false);

  useEffect(() => {
    setupDatabase();
    fetchSettings();
    fetchVersions();
    fetchCommits();
    fetchMenuOrder();
    fetchAIEntries();
    fetchUyariAyarlari();
    const saved = JSON.parse(localStorage.getItem("isg_theme") || "{}");
    if (saved.mode) setThemeMode(saved.mode);
    if (saved.color) setThemeColor(saved.color);
    if (saved.font) setThemeFont(saved.font);
    if (saved.size) setThemeSize(saved.size);
  }, []);

  const fetchUyariAyarlari = async () => {
    const { data } = await supabase.from("ayarlar").select("*").eq("type", "egitim_uyari");
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((d: any) => { map[d.key] = d.value; });
      setUyariAyarlari(map);
    }
  };

  const fetchVersions = async () => {
    const { data } = await supabase.from("versiyonlar").select("*").order("tarih", { ascending: false });
    if (data) setVersions(data);
  };

  const fetchCommits = async () => {
    setCommitsLoading(true);
    try {
      const res = await fetch("/api/commits");
      const data = await res.json();
      if (Array.isArray(data)) setCommits(data);
    } catch {}
    setCommitsLoading(false);
  };

  const allMenuLabels: Record<string, string> = {
    dashboard: "ISG Takip", personel: "Personel", myk: "MYK", operator: "Operator",
    dosya: "Dosya", talimatlar: "Talimat Takibi", santiyeler: "Santiyeler",
    taseronlar: "Taseronlar", sorumlular: "Sorumlular", ekipmanlar: "Ekipmanlar",
    kazalar: "Is Kazalari", egitimler: "Egitimler", ihtar: "Ihtar Tutanagi",
    risk: "Risk Degerlendirme", yasal: "Yasal Uygunluk", denetim: "Ic Denetim",
    acil: "Acil Durum", duzeltici: "Duzeltici Faaliyet", ygg: "Yonetim Gozden Gecirme",
    dokuman: "Dokuman Kontrol", yetkinlik: "Yetkinlik Matrisi", performans: "Performans Izleme",
  };

  const fetchMenuOrder = async () => {
    const { data } = await supabase.from("ayarlar").select("key, value").in("key", ["menu_order_main", "menu_order_ek"]);
    if (!data) return;
    const allItems: { key: string; label: string; grup: "main" | "ek" }[] = [];
    for (const d of data) {
      try {
        const keys = JSON.parse(d.value);
        const grup = d.key === "menu_order_main" ? "main" : "ek";
        keys.forEach((k: string) => {
          if (allMenuLabels[k]) allItems.push({ key: k, label: allMenuLabels[k], grup });
        });
      } catch {}
    }
    setMenuItems(allItems);
  };

  const saveMenuOrder = async () => {
    setMenuSaving(true);
    const mainKeys = menuItems.filter(i => i.grup === "main").map(i => i.key);
    const ekKeys = menuItems.filter(i => i.grup === "ek").map(i => i.key);
    await supabase.from("ayarlar").upsert({ key: "menu_order_main", value: JSON.stringify(mainKeys), type: "menu_order" }, { onConflict: "key" });
    await supabase.from("ayarlar").upsert({ key: "menu_order_ek", value: JSON.stringify(ekKeys), type: "menu_order" }, { onConflict: "key" });
    setMenuSaving(false);
    setStatus({ type: "success", message: "Menü sırası kaydedildi!" });
  };

  const fetchAIEntries = async () => {
    const { data } = await supabase.from("ayarlar").select("value").eq("key", "ai_entries").single();
    if (data?.value) {
      try { setAiEntries(JSON.parse(data.value)); } catch { setAiEntries([]); }
    }
  };

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

  const saveUyari = async () => {
    setUyariSaving(true);
    for (const field of EGITIM_FIELDS) {
      const val = uyariAyarlari[field.ayarKey];
      if (val) {
        await supabase.from("ayarlar").upsert(sanitizeForm({ key: field.ayarKey, value: val, type: "egitim_uyari", description: field.label + " - bitiş uyarı günü" }), { onConflict: "key" });
      }
    }
    setUyariSaving(false);
    setStatus({ type: "success", message: "Uyarı süreleri kaydedildi!" });
  };

  const saveVersion = async () => {
    if (!newVersion.versiyon || !newVersion.aciklama) return;
    const payload = sanitizeForm({
      ...newVersion,
      tarih: new Date().toISOString().split("T")[0],
      detaylar: newVersion.detaylar ? newVersion.detaylar.split("\n").filter((d: string) => d.trim()) : [],
    });
    await supabase.from("versiyonlar").insert(payload);
    setShowAddVersion(false);
    setNewVersion({ versiyon: "", tip: "minor", aciklama: "", detaylar: "", yazar: "" });
    fetchVersions();
    setStatus({ type: "success", message: "Yeni sürüm kaydedildi!" });
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

        <div className="card p-6 mt-6">
          <button
            onClick={() => setShowUyari(!showUyari)}
            className="w-full flex items-center justify-between"
          >
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-800">Uyarı Süreleri</h3>
              <p className="text-sm text-gray-500">Her ISG eğitimi için bitiş uyarı süresi (gün)</p>
            </div>
            <div className="flex items-center gap-3">
              {showUyari && (
                <button onClick={(e) => { e.stopPropagation(); saveUyari(); }} disabled={uyariSaving} className="btn btn-primary text-sm">
                  {uyariSaving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              )}
              {showUyari ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
            </div>
          </button>

          {showUyari && (
            <div className="space-y-3 mt-4">
              {EGITIM_FIELDS.map((field) => (
                <div key={field.ayarKey} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-800">{field.label}</p>
                      <p className="text-xs text-gray-400">{field.ayarKey}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" min={1} max={365} value={uyariAyarlari[field.ayarKey] || "7"} onChange={(e) => setUyariAyarlari((prev) => ({ ...prev, [field.ayarKey]: e.target.value }))} className="input text-xs text-center" style={{ width: "4rem" }} />
                    <span className="text-xs text-gray-500">gün</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6 mt-6">
          <button onClick={() => setShowMenu(!showMenu)} className="w-full flex items-center justify-between">
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-800">Menü Düzenle</h3>
              <p className="text-sm text-gray-500">Sol menü öğelerini sürükleyip sıralayın</p>
            </div>
            {showMenu ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
          </button>
          {showMenu && (
            <div className="mt-4">
              <div className="space-y-1">
                {menuItems.map((item, idx) => (
                  <div key={item.key}
                    draggable
                    onDragStart={() => setDragIdx(idx)}
                    onDragOver={(e) => { e.preventDefault(); if (dragIdx === null || dragIdx === idx) return; const items = [...menuItems]; const [moved] = items.splice(dragIdx, 1); items.splice(idx, 0, moved); setMenuItems(items); setDragIdx(idx); }}
                    onDragEnd={() => setDragIdx(null)}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-grab active:cursor-grabbing transition-colors ${item.grup === "main" ? "bg-white border-gray-200" : "bg-gray-50 border-gray-100"} ${dragIdx === idx ? "opacity-50" : ""}`}
                  >
                    <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    <span className="text-xs px-1.5 py-0.5 rounded font-medium uppercase tracking-wider text-gray-400 flex-shrink-0">{item.grup === "main" ? "Ana" : "Ek"}</span>
                    <span className="text-sm text-gray-700 flex-1">{item.label}</span>
                    <span className="text-[10px] text-gray-300 font-mono">{item.key}</span>
                  </div>
                ))}
              </div>
              {menuItems.length === 0 && <p className="text-center py-6 text-gray-400">Menü bilgisi yüklenmedi</p>}
              <div className="flex justify-end mt-4">
                <button onClick={saveMenuOrder} disabled={menuSaving} className="btn btn-primary text-sm flex items-center gap-2">
                  <Save className="w-4 h-4" /> {menuSaving ? "Kaydediliyor..." : "Sırayı Kaydet"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="card p-6 mt-6">
          <button onClick={() => setShowAI(!showAI)} className="w-full flex items-center justify-between">
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-800">Yapay Zeka Entegrasyonları</h3>
              <p className="text-sm text-gray-500">Projeye katkı sağlayan YZ sistemleri</p>
            </div>
            {showAI ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
          </button>
          {showAI && (
            <div className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {aiEntries.map((ai: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 bg-white">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center flex-shrink-0 border border-blue-100">
                      {idx % 2 === 0 ? <Brain className="w-5 h-5 text-indigo-500" /> : <Cpu className="w-5 h-5 text-blue-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-800 text-sm">{ai.name}</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-mono">{ai.model}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{ai.role}</p>
                      {ai.url && (
                        <a href={ai.url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 mt-1.5">
                          <ExternalLink className="w-3 h-3" /> {new URL(ai.url).hostname}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {aiEntries.length === 0 && <p className="text-center py-6 text-gray-400">AI kaydı bulunamadı</p>}
            </div>
          )}
        </div>

          <div className="card p-6 mt-6">
            <button onClick={() => setShowVersion(!showVersion)} className="w-full flex items-center justify-between">
              <div className="text-left">
                <h3 className="text-lg font-semibold text-gray-800">Sürüm Takip</h3>
                <p className="text-sm text-gray-500">GitHub commit geçmişi</p>
              </div>
              {showVersion ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
            </button>
            {showVersion && (
              <div className="space-y-1 max-h-80 overflow-y-auto mt-4">
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-2 px-2">
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>enderak54/isgapp — son {commits.length} commit</span>
                </div>
                {commitsLoading ? (
                  <p className="text-xs text-gray-400 text-center py-6">Yükleniyor...</p>
                ) : commits.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">Commit bilgisi alınamadı</p>
                ) : (
                  commits.map((c: any) => (
                    <div key={c.sha} className="flex items-start gap-2 py-2 px-2 rounded hover:bg-gray-50 text-xs">
                      <span className="font-mono text-gray-400 flex-shrink-0 w-16">{c.sha.substring(0, 7)}</span>
                      <span className="text-gray-700 flex-1 min-w-0">{c.commit.message.split("\n")[0]}</span>
                      <span className="text-gray-400 flex-shrink-0 whitespace-nowrap">{new Date(c.commit.author.date).toLocaleDateString("tr-TR")}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

        {showAddVersion && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowAddVersion(false)}>
            <div className="bg-white rounded-2xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Yeni Sürüm Ekle</h3>
                <button onClick={() => setShowAddVersion(false)}><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600 mb-1.5 block">Versiyon *</label>
                    <input type="text" value={newVersion.versiyon} onChange={e => setNewVersion({ ...newVersion, versiyon: e.target.value })} placeholder="Örn: 0.2.0" className="input" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1.5 block">Tip</label>
                    <select value={newVersion.tip} onChange={e => setNewVersion({ ...newVersion, tip: e.target.value })} className="input">
                      <option value="major">Major</option>
                      <option value="minor">Minor</option>
                      <option value="patch">Patch</option>
                      <option value="hotfix">Hotfix</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1.5 block">Açıklama *</label>
                  <input type="text" value={newVersion.aciklama} onChange={e => setNewVersion({ ...newVersion, aciklama: e.target.value })} placeholder="Bu sürümün kısa özeti" className="input" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1.5 block">Değişiklikler (her satıra bir madde)</label>
                  <textarea value={newVersion.detaylar} onChange={e => setNewVersion({ ...newVersion, detaylar: e.target.value })} className="input h-32 resize-none" placeholder="Yeni özellik: İhtar modülü&#10;Düzeltme: TC maskeleme&#10;İyileştirme: Performans artışı" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1.5 block">Yazar</label>
                  <input type="text" value={newVersion.yazar} onChange={e => setNewVersion({ ...newVersion, yazar: e.target.value })} placeholder="Kim tarafından yapıldı" className="input" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setShowAddVersion(false)} className="btn text-sm" style={{ background: "#f3f4f6", color: "#374151" }}>İptal</button>
                  <button onClick={saveVersion} className="btn btn-primary text-sm">Kaydet</button>
                </div>
              </div>
            </div>
          </div>
        )}


      </div>
    </main>
  );
}