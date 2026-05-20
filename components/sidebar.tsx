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
} from "lucide-react";

const menuItems = [
  { icon: Briefcase, label: "İSG Takip", active: true },
  { icon: Users, label: "EKİP Takip" },
  { icon: GraduationCap, label: "Personel" },
  { icon: GraduationCap, label: "MYK" },
  { icon: Shield, label: "Operatör Belgeleri" },
  { icon: FolderOpen, label: "Personel Dosyası" },
  { icon: FileText, label: "Talimatlar" },
  { icon: Building2, label: "Şantiyeler" },
  { icon: HardHat, label: "Taşeronlar" },
  { icon: UserCog, label: "Saha Sorumluları" },
  { icon: Wrench, label: "İş Ekipmanları" },
  { icon: AlertTriangle, label: "İş Kazaları" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gradient-to-b from-blue-50 to-blue-100 min-h-screen p-4">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-blue-900 flex items-center gap-2">
          <Briefcase className="w-6 h-6" />
          İSG Takip
        </h1>
      </div>
      <nav className="space-y-1">
        {menuItems.map((item, index) => (
          <button
            key={index}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
              item.active
                ? "bg-blue-500 text-white shadow-md"
                : "text-gray-700 hover:bg-blue-200"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
