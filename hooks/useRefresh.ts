"use client";

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export function useRefresh() {
  const router = useRouter();

  const refreshPage = useCallback(() => {
    router.refresh();
  }, [router]);

  const hardRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  return { refreshPage, hardRefresh };
}