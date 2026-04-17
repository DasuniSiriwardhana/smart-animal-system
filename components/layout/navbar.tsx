"use client";

import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/Button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  PawPrint, 
  Shield, 
  User,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Home,
  LayoutDashboard,
  Heart,
  Info,
  Star,
  Mail,
  Brain,
  MessageCircle
} from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

export function Navbar() {
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      if (user?.id) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        setIsAdmin(data?.role === 'admin')
      }
    }
    checkAdmin()
  }, [user])

  // Debug log to check if user exists
  useEffect(() => {
    console.log("Navbar - User:", user?.email, "Admin:", isAdmin)
  }, [user, isAdmin])

  const getInitials = (name?: string) => {
    if (!name || name === "") return "U"
    return name.slice(0, 2).toUpperCase()
  }

  const handleLogout = async () => {
    console.log("Logging out...")
    await signOut()
    router.push('/')
  }

  // Navigation items for regular users
  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/about", label: "About", icon: Info },
    { href: "/reviews", label: "Reviews", icon: Star },
  ]

  const authNavItems = user ? [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/pets", label: "Pets", icon: Heart },
    { href: "/insights", label: "AI Insights", icon: Brain },  
  ] : []

  const supportItems = [
    { href: "/contact", label: "Contact Us", icon: Mail },
    { href: "/feedback", label: "Feedback", icon: MessageCircle },
  ]

  // Different nav items for admin vs regular users
  const getNavItems = () => {
    if (isAdmin) {
      return [
        { href: "/", label: "Home", icon: Home },
        { href: "/admin", label: "Admin Panel", icon: Shield },
        { href: "/admin/reviews", label: "Reviews", icon: Star },
      ]
    }
    return [...navItems, ...authNavItems, { href: "/pricing", label: "Pricing", icon: null }]
  }

  const allNavItems = getNavItems()

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href={isAdmin ? "/admin" : "/"} className="flex items-center gap-2 shrink-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <PawPrint className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg hidden sm:inline-block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {isAdmin ? "Admin Panel" : "PawHealth"}
            </span>
          </Link>

          {/* Desktop Navigation - Center */}
          <div className="hidden md:flex items-center gap-1">
            {allNavItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href}>
                  <Button 
                    variant={isActive ? "secondary" : "ghost"} 
                    size="sm"
                    className={`gap-2 ${isActive ? 'bg-accent/10 text-accent' : ''}`}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    {item.label}
                  </Button>
                </Link>
              )
            })}
            
            {/* Support Dropdown - only for non-admin users */}
            {!isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1">
                    Support
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-48">
                  {supportItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link href={item.href} className="flex items-center gap-2 cursor-pointer">
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Right Side - Auth Buttons / User Menu */}
          <div className="flex items-center gap-2 shrink-0">
            <LanguageSwitcher />
            
            {user ? (
              // FIXED: Simplified dropdown with better styling
              <div className="relative">
                <button
                  onClick={() => {
                    console.log("Avatar clicked - toggling dropdown")
                    setDropdownOpen(!dropdownOpen)
                  }}
                  className="flex items-center gap-2 cursor-pointer hover:opacity-80 focus:outline-none"
                >
                  <Avatar className="h-8 w-8 ring-2 ring-accent/20">
                    <AvatarImage src={user?.avatar_url || ''} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-sm">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden lg:inline-block text-sm font-medium">
                    {user.name || user.email?.split('@')[0]}
                  </span>
                  <ChevronDown className={`h-4 w-4 opacity-50 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {dropdownOpen && (
                  <>
                    {/* Backdrop to close dropdown when clicking outside */}
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border z-50">
                      <div className="p-3 border-b">
                        <p className="text-sm font-medium">{user.name || user.email}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <Link 
                        href="/profile" 
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                      <Link 
                        href="/settings" 
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                      <div className="border-t my-1"></div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="bg-gradient-to-r from-primary to-accent text-white">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 hover:bg-accent/10 rounded-lg"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t py-4 space-y-2">
            <div className="px-4 py-2">
              <LanguageSwitcher />
            </div>
            
            {allNavItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 py-2 px-4 hover:bg-accent/10 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  <span>{item.label}</span>
                </Link>
              )
            })}
            
            {!isAdmin && (
              <div className="pt-2">
                <p className="px-4 py-1 text-xs font-semibold text-muted-foreground">Support</p>
                {supportItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 py-2 px-4 hover:bg-accent/10 rounded-lg"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            )}

            {!user && (
              <div className="border-t pt-4 mt-2 flex flex-col gap-2 px-4">
                <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full bg-gradient-to-r from-primary to-accent text-white">
                    Sign Up
                  </Button>
                </Link>
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
              </div> 
            )}
          </div>
        )}
      </div>
    </nav>
  )
}