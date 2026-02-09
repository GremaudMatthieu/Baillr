"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { SkipLink } from "@/components/layout/skip-link";
import { QueryProvider } from "@/components/providers/query-provider";
import { useState } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden">
      <SkipLink />
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMobileMenuToggle={() => setMobileOpen((prev) => !prev)} />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto"
        >
          <div className="mx-auto w-full max-w-[1280px] p-6">
            <QueryProvider>{children}</QueryProvider>
          </div>
        </main>
      </div>
    </div>
  );
}
