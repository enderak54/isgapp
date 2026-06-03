import type { Metadata } from "next";
import Sidebar from "@/components/sidebar";
import ThemeProvider from "@/components/theme-provider";
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
    <html lang="tr" suppressHydrationWarning>
      <head />
      <body className="min-h-full flex flex-col">
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