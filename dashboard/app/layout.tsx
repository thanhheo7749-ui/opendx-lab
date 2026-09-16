// ==============================================================================
// ShopWise — Decision Intelligence for Shop Owners
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { TooltipProvider } from "@/components/ui/tooltip";

const comicRelief = localFont({
  src: [
    {
      path: "../public/fonts/ComicRelief-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/ComicRelief-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-comic-relief",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ShopWise — Trí tuệ hỗ trợ quyết định kinh doanh",
  description: "Hỗ trợ chủ shop ra quyết định nhập hàng, định giá, quảng cáo, nhà cung cấp — dựa trên dữ liệu thực tế",
};

import { cookies } from "next/headers";
import type { Locale } from "@/lib/i18n-dictionaries";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = cookieStore.get("opendx-locale")?.value === "en" ? "en" : "vi";

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${comicRelief.variable} font-sans antialiased bg-background text-foreground`}>
        <Providers initialLocale={locale as Locale}>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
