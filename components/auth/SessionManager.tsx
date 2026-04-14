"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export function SessionManager() {
  const router = useRouter();

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event);
        
        // If user signs out or session expires
        if (event === 'SIGNED_OUT' || (!session && event !== 'SIGNED_IN')) {
          router.push('/');
          //router.refresh();
        }
      }
    );

    // Check session periodically (every 5 minutes)
    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        //router.refresh();
      }
    }, 5 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [router]);

  return null;
}