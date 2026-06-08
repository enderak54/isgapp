import type { Metadata } from "next";
import Sidebar from "@/components/sidebar";
import ThemeProvider from "@/components/theme-provider";
import SkipLink from "@/components/skip-link";
import "./globals.css";

export const metadata: Metadata = {
  title: "ISG Takip",
  description: "İş Sağlığı ve Güvenliği Yönetim Sistemi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning className="h-full">
      <head />
      <body className="h-full flex flex-col">
        <SkipLink />
        <ThemeProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main id="main-content" className="flex-1 min-w-0 p-4 md:p-6">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}