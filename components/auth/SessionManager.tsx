"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export function SessionManager() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Define public routes that don't require authentication
    const publicRoutes = [
      '/',
      '/login',
      '/signup',
      '/about',
      '/reviews',
      '/contact',
      '/pricing',
      '/forgot-password',
      '/verify-password',  
      '/feedback'
    ];
    
    const isPublicRoute = publicRoutes.includes(pathname);

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event);
        
        // Only redirect to home if NOT on a public route
        if ((event === 'SIGNED_OUT' || (!session && event !== 'SIGNED_IN')) && !isPublicRoute) {
          router.push('/');
        }
      }
    );

    // Check session periodically (every 5 minutes)
    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      // Only redirect if NOT on a public route
      if (!session && !isPublicRoute) {
        router.push('/');
      }
    }, 5 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [router, pathname]);

  return null;
}