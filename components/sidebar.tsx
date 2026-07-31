"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Briefcase, Users, GraduationCap, Shield, FolderOpen, FileText,
  Building2, Building, UserCog, Wrench, AlertTriangle, LayoutDashboard,
  Settings, ChevronLeft, ChevronRight, ChevronDown, ShieldCheck, Scale,
  ClipboardCheck, Siren, RotateCcw, Eye, FileCheck, Award, TrendingUp,
  AlertOctagon, ScrollText, Menu, X, Target, MessageCircle, Lock, Brain, Monitor, Activity,
} from "lucide-react";

const mainMenuItems = [
  { icon: LayoutDashboard, label: "İSG Takip", href: "/dashboard", key: "dashboard" },
  { icon: Users, label: "Personel", href: "/personel", key: "personel" },
  { icon: GraduationCap, label: "MYK", href: "/myk", key: "myk" },
  { icon: Shield, label: "Operatör", href: "/operator", key: "operator" },
  { icon: FolderOpen, label: "Dosya", href: "/dosya", key: "dosya" },
  { icon: FileText, label: "Talimat Takibi", href: "/talimatlar", key: "talimatlar" },
  { icon: Building2, label: "Şantiyeler", href: "/santiyeler", key: "santiyeler" },
  { icon: Building, label: "Taşeronlar", href: "/taseronlar", key: "taseronlar" },
  { icon: UserCog, label: "Sorumlular", href: "/sorumlular", key: "sorumlular" },
  { icon: Wrench, label: "Ekipmanlar", href: "/ekipmanlar", key: "ekipmanlar" },
  { icon: AlertTriangle, label: "İş Kazaları", href: "/kazalar", key: "kazalar" },
  { icon: GraduationCap, label: "Eğitimler", href: "/egitimler", key: "egitimler" },
  { icon: AlertOctagon, label: "İhtar Tutanağı", href: "/ihtar", key: "ihtar" },
  { icon: ScrollText, label: "Denetim Günlüğü", href: "/audit-log", key: "audit-log" },
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
  { icon: Building2, label: "Bağlam Analizi", href: "/baglam", key: "baglam" },
  { icon: Users, label: "İşçi Katılımı", href: "/katilim", key: "katilim" },
  { icon: Target, label: "OHS Hedefleri", href: "/hedefler", key: "hedefler" },
  { icon: MessageCircle, label: "İletişim Kaydı", href: "/iletisim", key: "iletisim" },
  { icon: ScrollText, label: "Politika Yönetimi", href: "/politika", key: "politika" },
  { icon: Lock, label: "KVKK Onayları", href: "/kvkk-consents", key: "kvkk-consents" },
  { icon: Brain, label: "Psikososyal Risk", href: "/psikososyal-risk", key: "psikososyal-risk" },
  { icon: Monitor, label: "Hibrit Calisma Ergonomi", href: "/hibrit-calisma-ergonomi", key: "hibrit-calisma-ergonomi" },
  { icon: Activity, label: "AI Dashboard", href: "/ai-dashboard", key: "ai-dashboard" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [ekModulOpen, setEkModulOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [version, setVersion] = useState("");
  const [visibleModules, setVisibleModules] = useState<Record<string, boolean>>({});
  const [menuOrderMain, setMenuOrderMain] = useState<string[]>(() => mainMenuItems.map(i => i.key).filter(Boolean) as string[]);
  const [menuOrderEk, setMenuOrderEk] = useState<string[]>(() => ekModulItems.map(i => i.key).filter(Boolean) as string[]);

  useEffect(() => {
    loadModuleSettings();
    loadMenuOrder();
    loadVersion();
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const loadVersion = async () => {
    try {
      const res = await fetch("/api/version");
      const data = await res.json();
      if (data?.version) setVersion("v" + data.version);
    } catch {}
  };

  const loadMenuOrder = async () => {
    const { data } = await supabase.from("ayarlar").select("key, value").in("key", ["menu_order_main", "menu_order_ek"]);
    data?.forEach((d: any) => {
      try {
        const arr = JSON.parse(d.value);
        if (d.key === "menu_order_main" && Array.isArray(arr)) { setMenuOrderMain(arr); localStorage.setItem("isg_menu_main", JSON.stringify(arr)); }
        if (d.key === "menu_order_ek" && Array.isArray(arr)) { setMenuOrderEk(arr); localStorage.setItem("isg_menu_ek", JSON.stringify(arr)); }
      } catch {}
    });
  };

  const applyOrder = (items: typeof mainMenuItems, order: string[]) => {
    const ordered = order.map(k => items.find(i => i.key === k)).filter(Boolean) as typeof mainMenuItems;
    const remaining = items.filter(i => !order.includes(i.key));
    return [...ordered, ...remaining];
  };

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

  const filteredMain = applyOrder(mainMenuItems, menuOrderMain).filter(item => 
    item.key === "dashboard" || visibleModules[item.key || ""] !== false
  );
  const filteredEk = applyOrder(ekModulItems, menuOrderEk).filter(item => 
    visibleModules[item.key || ""] !== false
  );

  const menuContent = (mobile: boolean) => (
    <>
      <div className="p-3 border-b border-gray-100">
        <Link href="/" className="flex items-center justify-between group" onClick={() => mobile && setMobileOpen(false)}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            {(!collapsed || mobile) && (
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-800">İSG Takip</span>
                {version && <span className="text-[10px] text-gray-400 font-mono">{version}</span>}
              </div>
            )}
          </div>
        </Link>
      </div>
      
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto" style={{ scrollbarGutter: "stable" }}>
        {filteredMain.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            onClick={() => mobile && setMobileOpen(false)}
            className={`flex items-center gap-1 px-2 py-2 rounded-lg transition-colors ${
              pathname === item.href ? "bg-gray-200 text-gray-900" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {(!collapsed || mobile) && <span className="text-xs font-medium">{item.label}</span>}
          </Link>
        ))}

        {(!collapsed || mobile) && filteredEk.length > 0 && (
          <div className={`pt-2 ${collapsed && !mobile ? "hidden" : ""}`}>
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
                    onClick={() => mobile && setMobileOpen(false)}
                    className={`flex items-center gap-1 px-2 py-2 rounded-lg transition-colors ${
                      pathname === item.href ? "bg-gray-200 text-gray-900" : "text-gray-600 hover:bg-gray-100"
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
      </nav>
      
      <div className="p-2 border-t border-gray-100">
        <Link
          href="/ayarlar"
          onClick={() => mobile && setMobileOpen(false)}
          className={`flex items-center gap-1 px-2 py-2 rounded-lg transition-colors ${
            pathname === "/ayarlar" ? "bg-gray-200 text-gray-900" : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          {(!collapsed || mobile) && <span className="text-xs font-medium">Ayarlar</span>}
        </Link>
        {!mobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 text-gray-500 mt-1"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      {isMobile && (
        <button aria-label="Menuyu ac"
          onClick={() => setMobileOpen(true)}
          className="fixed top-3 left-3 z-50 w-9 h-9 bg-white border border-gray-200 rounded-lg shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Mobile drawer backdrop */}
      {isMobile && mobileOpen && (
        <div aria-hidden="true" className="fixed inset-0 bg-black/40 z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      {isMobile && (
        <aside role="dialog" aria-modal="true" aria-label="Navigasyon menusu"
          className={`fixed top-0 left-0 z-50 h-full bg-gray-50 border-r border-gray-100 flex flex-col transition-transform duration-300 w-64 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="absolute top-3 right-3">
            <button aria-label="Menuyu kapat" onClick={() => setMobileOpen(false)} className="p-1 rounded hover:bg-gray-100 text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>
          {menuContent(true)}
        </aside>
      )}

      {/* Desktop sidebar */}
      {!isMobile && (
        <aside role="navigation" aria-label="Ana navigasyon" className={`bg-gray-50 h-screen sticky top-0 border-r border-gray-100 flex flex-col transition-all duration-300 ${collapsed ? "w-16" : "w-56"}`}>
          {menuContent(false)}
        </aside>
      )}
    </>
  );
}
