import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "MarketPlace RU — каталог объявлений",
  description:
    "Онлайн-платформа объявлений с каталогами, подкаталогами, поиском, публикацией и API на Next.js + PostgreSQL.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-[#f5f5fa] font-sans text-slate-900 antialiased">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
