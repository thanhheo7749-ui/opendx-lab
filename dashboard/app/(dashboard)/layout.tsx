// ==============================================================================
// OpenDX-Lab Dashboard - Dashboard Layout (Sidebar + Header)
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { AppSidebar } from "@/components/Sidebar";
import { AppHeader } from "@/components/Header";
import { ChatProvider } from "@/components/ai/ChatProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChatProvider>
      <div className="flex min-h-screen bg-background">
        <AppSidebar />
        {/* ml-60 matches sidebar w-60, transition syncs with sidebar animation */}
        <div className="flex-1 ml-60 transition-all duration-200">
          <AppHeader />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </ChatProvider>
  );
}
