"use client";

// ==============================================================================
// OpenDX-Lab Dashboard - Header (Enterprise Redesign)
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "@/lib/i18n";
import type { DictionaryKey } from "@/lib/i18n-dictionaries";

// ---------------------------------------------------------------------------
// Route → Page title & breadcrumb mapping
// ---------------------------------------------------------------------------
interface PageMeta {
  titleKey: DictionaryKey;
  breadcrumbKey: DictionaryKey;
}

const routeMeta: Record<string, PageMeta> = {
  "/": { titleKey: "home.title", breadcrumbKey: "breadcrumb.home" },
  "/employees": { titleKey: "employees.title", breadcrumbKey: "breadcrumb.employees" },
  "/workflows": { titleKey: "workflows.title", breadcrumbKey: "breadcrumb.workflows" },
  "/analytics": { titleKey: "analytics.title", breadcrumbKey: "breadcrumb.analytics" },
  "/ai-chat": { titleKey: "aiChat.title", breadcrumbKey: "breadcrumb.aiChat" },
  "/services": { titleKey: "services.title", breadcrumbKey: "breadcrumb.services" },
};

function getPageMeta(pathname: string): PageMeta {
  return routeMeta[pathname] ?? routeMeta["/"];
}

// ---------------------------------------------------------------------------
// Role badge
// ---------------------------------------------------------------------------
function getRoleBadge(roles: string[], t: (key: DictionaryKey) => string) {
  if (roles.includes("admin")) return { label: t("role.admin"), variant: "destructive" as const };
  if (roles.includes("manager")) return { label: t("role.manager"), variant: "secondary" as const };
  if (roles.includes("staff")) return { label: "Staff", variant: "outline" as const };
  if (roles.includes("viewer")) return { label: "Viewer", variant: "outline" as const };
  return { label: t("role.employee"), variant: "outline" as const };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function AppHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { t } = useTranslation();

  const pageMeta = getPageMeta(pathname);

  const initials = (session?.user?.name ?? "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const roleBadge = getRoleBadge(session?.user?.roles ?? [], t);

  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left: Page title + breadcrumb */}
      <div>
        <h1 className="text-sm font-semibold text-foreground">
          {t(pageMeta.titleKey)}
        </h1>
        {pathname !== "/" && (
          <nav className="text-xs text-muted-foreground">
            {t("breadcrumb.home")}
            <span className="mx-1.5 text-border">/</span>
            <span className="text-foreground/70">{t(pageMeta.breadcrumbKey)}</span>
          </nav>
        )}
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeSwitcher />

        <div className="w-px h-5 bg-border mx-1" />

        {session?.user && (
          <div className="flex items-center gap-2">
            <Badge variant={roleBadge.variant} className="text-[10px] px-1.5">
              {roleBadge.label}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger render={
                <button className="flex items-center gap-2 rounded-full hover:ring-2 ring-border transition-all cursor-pointer">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-[10px] font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              } />
              <DropdownMenuContent align="end" className="w-44">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-sm font-medium text-foreground">{session.user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                </div>
                <DropdownMenuItem className="cursor-pointer text-sm">
                  {t("header.profile")}
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer text-sm">
                  {t("header.settings")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer text-sm"
                >
                  {t("header.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
}
