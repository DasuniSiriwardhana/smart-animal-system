// components/navigation-wrapper.tsx
"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Prefetch all important routes on page load
  useEffect(() => {
    const routes = [
      "/",
      "/dashboard",
      "/pets",
      "/pets/new",
      "/appointments",
      "/insights",
      "/pricing",
      "/profile",
      "/settings",
      "/admin",
      "/login",
      "/signup",
    ];
    
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


