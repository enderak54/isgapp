"use client";

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
} from "lucide-react";

const allMenuItems = [
  { icon: LayoutDashboard, label: "İSG Takip", href: "/", key: "dashboard" },
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
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Sidebar() {
  const pathname = usePathname();
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
    <aside className="w-64 bg-white min-h-screen border-r border-gray-100 flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl flex items-center justify-center shadow-sm">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-gray-800">İSG Takip</h1>
            <p className="text-xs text-gray-400">Yönetim Paneli</p>
          </div>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className={`nav-item ${pathname === item.href ? "active" : ""}`}
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-100">
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 text-center">© 2026 ISG Takip v1.0</p>
        </div>
      </div>
    </aside>
  );
}