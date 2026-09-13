// ==============================================================================
// ShopWise — Decision Intelligence for Shop Owners
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ShopWise — Trí tuệ hỗ trợ quyết định kinh doanh",
  description: "Hỗ trợ chủ shop ra quyết định nhập hàng, định giá, quảng cáo, nhà cung cấp — dựa trên dữ liệu thực tế",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <Providers>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
