"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  BookOpen,
  FolderOpen,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { label: "Tableau de bord", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Biens", icon: Building2, href: "/properties" },
  { label: "Locataires", icon: Users, href: "/tenants" },
  { label: "Baux", icon: FileText, href: "/leases" },
  { label: "Comptabilité", icon: BookOpen, href: "/accounting" },
  { label: "Documents", icon: FolderOpen, href: "/documents" },
] as const;

const settingsItem = {
  label: "Réglages",
  icon: Settings,
  href: "/settings",
} as const;

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function SidebarNav({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={0}>
      <nav aria-label="Navigation principale" className="flex flex-1 flex-col">
        <ScrollArea className="flex-1 px-3 py-4">
          <ul role="list" className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const linkContent = (
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    collapsed && "justify-center px-2",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold"
                      : "text-sidebar-foreground hover:bg-slate-700"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );

              if (collapsed) {
                return (
                  <li key={item.href}>
                    <Tooltip>
                      <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                      <TooltipContent side="right" sideOffset={8}>
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  </li>
                );
              }

              return <li key={item.href}>{linkContent}</li>;
            })}
          </ul>
        </ScrollArea>

        <Separator className="bg-sidebar-border" />

        <div className="px-3 py-4">
          {(() => {
            const isActive = pathname === settingsItem.href || pathname.startsWith(settingsItem.href + "/");
            const linkContent = (
              <Link
                href={settingsItem.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  collapsed && "justify-center px-2",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold"
                    : "text-sidebar-foreground hover:bg-slate-700"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <settingsItem.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {!collapsed && <span>{settingsItem.label}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {settingsItem.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return linkContent;
          })()}
        </div>
      </nav>
    </TooltipProvider>
  );
}

function SidebarBrand({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className={cn("flex h-16 items-center px-4", collapsed && "justify-center px-2")}>
      <Link
        href="/dashboard"
        className="flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span className="text-xl font-bold text-sidebar-accent-foreground">
          {collapsed ? "B" : "Baillr"}
        </span>
      </Link>
    </div>
  );
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      {/* Desktop: full sidebar (lg+) */}
      <aside
        className="hidden lg:flex lg:w-60 lg:flex-col bg-sidebar text-sidebar-foreground"
        aria-label="Barre latérale"
      >
        <SidebarBrand />
        <Separator className="bg-sidebar-border" />
        <SidebarNav />
      </aside>

      {/* Tablet: collapsed sidebar (md) */}
      <aside
        className="hidden md:flex md:w-16 md:flex-col lg:hidden bg-sidebar text-sidebar-foreground"
        aria-label="Barre latérale"
      >
        <SidebarBrand collapsed />
        <Separator className="bg-sidebar-border" />
        <SidebarNav collapsed />
      </aside>

      {/* Mobile: Sheet overlay */}
      <Sheet open={mobileOpen} onOpenChange={(open) => !open && onMobileClose()}>
        <SheetContent
          side="left"
          className="w-60 p-0 bg-sidebar text-sidebar-foreground"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Menu de navigation</SheetTitle>
          </SheetHeader>
          <SidebarBrand />
          <Separator className="bg-sidebar-border" />
          <SidebarNav onNavigate={onMobileClose} />
        </SheetContent>
      </Sheet>
    </>
  );
}
