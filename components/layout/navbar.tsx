// components/layout/navbar.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PawPrint, Shield } from "lucide-react"

export function Navbar() {
  const pathname = usePathname()

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/pets", label: "Pets" },
    { href: "/analytics", label: "Analytics" },
    { href: "/insights", label: "Insights" },
    { href: "/admin", label: "Admin", icon: Shield }, // Optional admin link
  ]

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <PawPrint className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Smart Animal System</span>
          </Link>
          
          <div className="flex items-center gap-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button 
                  variant={pathname === item.href ? "default" : "ghost"} 
                  size="sm"
                  className="transition-all gap-2"
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}