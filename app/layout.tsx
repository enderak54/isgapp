import type { Metadata } from "next";
import ThemeProvider from "@/components/theme-provider";
import AppShell from "@/components/app-shell";
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
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}