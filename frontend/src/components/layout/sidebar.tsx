"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Landmark,
  Building2,
  Users,
  FileText,
  Receipt,
  CreditCard,
  BookOpen,
  FolderOpen,
  TrendingUp,
  BarChart3,
  Coins,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
import { EntitySwitcher } from "@/components/layout/entity-switcher";
import { useCurrentEntity } from "@/hooks/use-current-entity";
import { useUnpaidRentCalls } from "@/hooks/use-unpaid-rent-calls";

const navItems = [
  { label: "Tableau de bord", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Entités", icon: Landmark, href: "/entities" },
  { label: "Biens", icon: Building2, href: "/properties" },
  { label: "Locataires", icon: Users, href: "/tenants" },
  { label: "Baux", icon: FileText, href: "/leases" },
  { label: "Appels de loyer", icon: Receipt, href: "/rent-calls" },
  { label: "Paiements", icon: CreditCard, href: "/payments" },
  { label: "Comptabilité", icon: BookOpen, href: "/accounting" },
  { label: "Documents", icon: FolderOpen, href: "/documents" },
  { label: "Indices", icon: TrendingUp, href: "/indices" },
  { label: "Révisions", icon: BarChart3, href: "/revisions" },
  { label: "Charges", icon: Coins, href: "/charges" },
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
  const { entityId } = useCurrentEntity();
  const { data: unpaidRentCalls } = useUnpaidRentCalls(entityId ?? undefined);
  const unpaidCount = unpaidRentCalls?.length ?? 0;

  return (
    <nav aria-label="Navigation principale" className="flex flex-1 flex-col">
      <ScrollArea className="flex-1 px-3 py-4">
        <ul role="list" className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const showBadge = item.href === "/rent-calls" && unpaidCount > 0;
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
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {showBadge && (
                      <Badge variant="destructive" className="ml-auto text-xs">
                        {unpaidCount}
                      </Badge>
                    )}
                  </>
                )}
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
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
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
        <TooltipProvider delayDuration={0}>
          <SidebarBrand />
          <Separator className="bg-sidebar-border" />
          <EntitySwitcher />
          <Separator className="bg-sidebar-border" />
          <SidebarNav />
        </TooltipProvider>
      </aside>

      {/* Tablet: collapsed sidebar (md) */}
      <aside
        className="hidden md:flex md:w-16 md:flex-col lg:hidden bg-sidebar text-sidebar-foreground"
        aria-label="Barre latérale"
      >
        <TooltipProvider delayDuration={0}>
          <SidebarBrand collapsed />
          <Separator className="bg-sidebar-border" />
          <EntitySwitcher collapsed />
          <Separator className="bg-sidebar-border" />
          <SidebarNav collapsed />
        </TooltipProvider>
      </aside>

      {/* Mobile: Sheet overlay */}
      <Sheet open={mobileOpen} onOpenChange={(open) => !open && onMobileClose()}>
        <SheetContent
          side="left"
          className="w-60 p-0 bg-sidebar text-sidebar-foreground"
        >
          <TooltipProvider delayDuration={0}>
            <SheetHeader className="sr-only">
              <SheetTitle>Menu de navigation</SheetTitle>
            </SheetHeader>
            <SidebarBrand />
            <Separator className="bg-sidebar-border" />
            <EntitySwitcher onNavigate={onMobileClose} />
            <Separator className="bg-sidebar-border" />
            <SidebarNav onNavigate={onMobileClose} />
          </TooltipProvider>
        </SheetContent>
      </Sheet>
    </>
  );
}
