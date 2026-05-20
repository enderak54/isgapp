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
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "İSG Takip", href: "/" },
  { icon: Users, label: "Personel Listesi", href: "/personel" },
  { icon: GraduationCap, label: "MYK", href: "/myk" },
  { icon: Shield, label: "Operatör Belgeleri", href: "/operator" },
  { icon: FolderOpen, label: "Personel Dosyası", href: "/dosya" },
  { icon: FileText, label: "Talimatlar", href: "/talimatlar" },
  { icon: Building2, label: "Şantiyeler", href: "/santiyeler" },
  { icon: HardHat, label: "Taşeronlar", href: "/taseronlar" },
  { icon: UserCog, label: "Saha Sorumluları", href: "/sorumlular" },
  { icon: Wrench, label: "İş Ekipmanları", href: "/ekipmanlar" },
  { icon: AlertTriangle, label: "İş Kazaları", href: "/kazalar" },
  { icon: GraduationCap, label: "Eğitimler", href: "/egitimler" },
];

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-stone-50 min-h-screen border-r border-stone-200 p-4">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-stone-700 flex items-center gap-2">
          <Briefcase className="w-6 h-6" />
          İSG Takip
        </h1>
      </div>
      <nav className="space-y-1">
        {menuItems.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
              pathname === item.href
                ? "bg-stone-200 text-stone-800 font-medium"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}