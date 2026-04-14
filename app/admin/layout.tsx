"use client";

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/lib/supabaseClient';
import { 
  LayoutDashboard, 
  Star, 
  TrendingUp, 
  Users, 
  Shield,
  LogOut,
  Menu,
  X,
  FileSpreadsheet
} from 'lucide-react';

// Inner component with the actual layout
function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/reviews', label: 'Review Moderation', icon: Star },
    { href: '/admin/market', label: 'Market Analysis', icon: TrendingUp },
    { href: '/admin/users', label: 'User Management', icon: Users },
    { href: '/admin/churn', label: 'Churn Analysis', icon: Users }, 
      { href: '/admin/reports', label: 'Reports', icon: FileSpreadsheet },   
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">Admin Panel</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{user?.email}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = '/';
              }}
              className="flex items-center gap-2 w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Admin</span>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

// Main export with role protection
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      // If no user, redirect to login
      if (!user) {
        router.replace('/login');
        setIsChecking(false);
        return;
      }

      // Check if user has admin role
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error || profile?.role !== 'admin') {
        // Not an admin - redirect to regular dashboard
        router.replace('/dashboard');
        setIsChecking(false);
        return;
      }

      // User is admin
      setIsAdmin(true);
      setIsChecking(false);
    };

    if (!isLoading) {
      checkAdminAccess();
    }
  }, [user, isLoading, router]);

  // Show loading while checking admin status
  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not admin, don't render anything (redirect will happen)
  if (!isAdmin) {
    return null;
  }

  return <AdminLayoutContent>{children}</AdminLayoutContent>;
}