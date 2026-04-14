// components/client-wrapper.tsx
"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Prefetch common routes
  useEffect(() => {
    const routes = ["/dashboard", "/pets", "/appointments", "/insights", "/pricing", "/profile", "/settings"];
    routes.forEach((route) => {
      router.prefetch(route);
    });
  }, [router]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return <>{children}</>;
}


