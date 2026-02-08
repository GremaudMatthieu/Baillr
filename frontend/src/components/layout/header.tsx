"use client";

import { Menu } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  return (
    <header
      className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-background px-4 md:px-6"
    >
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMobileMenuToggle}
        aria-label="Ouvrir le menu de navigation"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </Button>

      {/* Breadcrumb area (placeholder) */}
      <div className="flex-1" />

      {/* Right side actions */}
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <UserButton
          afterSignOutUrl="/sign-in"
          appearance={{
            elements: {
              avatarBox: "h-8 w-8",
            },
          }}
        />
      </div>
    </header>
  );
}
