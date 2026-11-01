import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import type { ReactNode } from "react";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main
        id="main"
        className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-6 py-10 sm:py-14"
      >
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
