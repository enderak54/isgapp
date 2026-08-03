"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/sidebar";
import AuthProvider from "@/components/auth-provider";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/giris";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <AuthProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main id="main-content" className="flex-1 min-w-0 p-4 md:p-6">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
