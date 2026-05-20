"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
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
  LogOut,
} from "lucide-react";

const allMenuItems = [
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
  { icon: Settings, label: "Ayarlar", href: "/ayarlar", key: "settings" },
];

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [visibleModules, setVisibleModules] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadModuleSettings();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
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
        
        Object.keys(allMenuItems).forEach(key => {
          if (modules[key] === undefined) modules[key] = true;
        });
        
        localStorage.setItem("isg_modules", JSON.stringify(modules));
        setVisibleModules(modules);
      }
    } catch (e) {
      const defaultModules: Record<string, boolean> = {};
      allMenuItems.forEach(item => { defaultModules[item.key || ""] = true; });
      setVisibleModules(defaultModules);
    }
  };

  const menuItems = allMenuItems.filter(item => 
    item.key === "settings" || item.key === "dashboard" || visibleModules[item.key || ""] !== false
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
        {menuItems.map((item, index) => (
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
      </nav>
      
      <div className="p-2 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-1 px-2 py-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="text-xs font-medium">Çıkış</span>}
        </button>
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