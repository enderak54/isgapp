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
          <p className="text-xs text-gray-500 text-center">© 2026 ISG Takip</p>
        </div>
      </div>
    </aside>
  );
}