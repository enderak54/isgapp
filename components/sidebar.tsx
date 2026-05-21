"use client";

import { useState } from "react";
import {
  Briefcase,
  Users,
  GraduationCap,
  Shield,
  FolderOpen,
  FileText,
  Building2,
  HardHat,
  UserCog,
  Wrench,
  AlertTriangle,
  LayoutDashboard,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Scale,
  ClipboardCheck,
  Siren,
  RotateCcw,
  Eye,
  FileCheck,
  Award,
  TrendingUp,
} from "lucide-react";

const mainMenuItems = [
  { icon: LayoutDashboard, label: "İSG Takip", href: "/dashboard", key: "dashboard" },
  { icon: Users, label: "Personel", href: "/personel", key: "personel" },
  { icon: GraduationCap, label: "MYK", href: "/myk", key: "myk" },
  { icon: Shield, label: "Operatör", href: "/operator", key: "operator" },
  { icon: FolderOpen, label: "Dosya", href: "/dosya", key: "dosya" },
  { icon: FileText, label: "Talimatlar", href: "/talimatlar", key: "talimatlar" },
  { icon: Building2, label: "Şantiyeler", href: "/santiyeler", key: "santiyeler" },
  { icon: HardHat, label: "Taşeronlar", href: "/taseronlar", key: "taseronlar" },
  { icon: UserCog, label: "Sorumlular", href: "/sorumlular", key: "sorumlular" },
  { icon: Wrench, label: "Ekipmanlar", href: "/ekipmanlar", key: "ekipmanlar" },
  { icon: AlertTriangle, label: "İş Kazaları", href: "/kazalar", key: "kazalar" },
  { icon: GraduationCap, label: "Eğitimler", href: "/egitimler", key: "egitimler" },
];

const ekModulItems = [
  { icon: ShieldCheck, label: "Risk Değerlendirme", href: "/risk", key: "risk" },
  { icon: Scale, label: "Yasal Uygunluk", href: "/yasal", key: "yasal" },
  { icon: ClipboardCheck, label: "İç Denetim", href: "/denetim", key: "denetim" },
  { icon: Siren, label: "Acil Durum", href: "/acil", key: "acil" },
  { icon: RotateCcw, label: "Düzeltici Faaliyet", href: "/duzeltici", key: "duzeltici" },
  { icon: Eye, label: "Yönetim Gözden Geçirme", href: "/ygg", key: "ygg" },
  { icon: FileCheck, label: "Doküman Kontrol", href: "/dokuman", key: "dokuman" },
  { icon: Award, label: "Yetkinlik Matrisi", href: "/yetkinlik", key: "yetkinlik" },
  { icon: TrendingUp, label: "Performans İzleme", href: "/performans", key: "performans" },
];

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [ekModulOpen, setEkModulOpen] = useState(false);
  const [visibleModules, setVisibleModules] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadModuleSettings();
  }, []);

  const loadModuleSettings = async () => {
    try {
      const cached = localStorage.getItem("isg_modules");
      if (cached) {
        setVisibleModules(JSON.parse(cached));
      } else {
        const { data } = await supabase.from("ayarlar").select("key, value").eq("type", "module");
        const modules = data?.reduce((acc: Record<string, boolean>, d: any) => {
          acc[d.key] = d.value === "true";
          return acc;
        }, {} as Record<string, boolean>) || {};
        
        mainMenuItems.forEach(item => {
          if (modules[item.key] === undefined) modules[item.key] = true;
        });
        ekModulItems.forEach(item => {
          if (modules[item.key] === undefined) modules[item.key] = true;
        });
        
        localStorage.setItem("isg_modules", JSON.stringify(modules));
        setVisibleModules(modules);
      }
    } catch (e) {
      const defaultModules: Record<string, boolean> = {};
      mainMenuItems.forEach(item => { defaultModules[item.key || ""] = true; });
      ekModulItems.forEach(item => { defaultModules[item.key || ""] = true; });
      setVisibleModules(defaultModules);
    }
  };

  const filteredMain = mainMenuItems.filter(item => 
    item.key === "dashboard" || visibleModules[item.key || ""] !== false
  );
  const filteredEk = ekModulItems.filter(item => 
    visibleModules[item.key || ""] !== false
  );

  return (
    <aside className={`bg-white min-h-screen border-r border-gray-100 flex flex-col transition-all duration-300 ${collapsed ? "w-16" : "w-56"}`}>
      <div className="p-3 border-b border-gray-100">
        <Link href="/" className="flex items-center justify-between group">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            {!collapsed && <span className="text-sm font-semibold text-gray-800">İSG Takip</span>}
          </div>
        </Link>
      </div>
      
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {filteredMain.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className={`flex items-center gap-1 px-2 py-2 rounded-lg transition-colors ${
              pathname === item.href 
                ? "bg-gray-200 text-gray-900" 
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="text-xs font-medium">{item.label}</span>}
          </Link>
        ))}

        {!collapsed && filteredEk.length > 0 && (
          <div className="pt-2">
            <button
              onClick={() => setEkModulOpen(!ekModulOpen)}
              className="w-full flex items-center justify-between px-2 py-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <span className="text-xs font-semibold uppercase tracking-wider">Ek Modüller</span>
              {ekModulOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {ekModulOpen && (
              <div className="ml-2 mt-1 space-y-0.5 border-l-2 border-gray-100 pl-2">
                {filteredEk.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    className={`flex items-center gap-1 px-2 py-2 rounded-lg transition-colors ${
                      pathname === item.href 
                        ? "bg-gray-200 text-gray-900" 
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {collapsed && filteredEk.some(item => pathname === item.href) && (
          <div className="pt-1">
            <div className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Ek</div>
            {filteredEk.map((item, index) => (
              pathname === item.href && (
                <Link
                  key={index}
                  href={item.href}
                  className="flex items-center gap-1 px-2 py-2 rounded-lg bg-gray-200 text-gray-900 transition-colors"
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                </Link>
              )
            ))}
          </div>
        )}
      </nav>
      
      <div className="p-2 border-t border-gray-100">
        <Link
          href="/ayarlar"
          className={`flex items-center gap-1 px-2 py-2 rounded-lg transition-colors ${
            pathname === "/ayarlar" 
              ? "bg-gray-200 text-gray-900" 
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="text-xs font-medium">Ayarlar</span>}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 text-gray-500 mt-1"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}