// hooks/use-navigation.ts
"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

export function useNavigation() {
  const router = useRouter();

  const navigateTo = useCallback((path: string) => {
    router.push(path);
    router.refresh();
  }, [router]);

  const goBack = useCallback(() => {
    router.back();
    router.refresh();
  }, [router]);

  const goToDashboard = useCallback(() => {
    router.push("/dashboard");
    router.refresh();
  }, [router]);

  const goToPets = useCallback(() => {
    router.push("/pets");
    router.refresh();
  }, [router]);

  const goToAppointments = useCallback(() => {
    router.push("/appointments");
    router.refresh();
  }, [router]);

  const goToInsights = useCallback(() => {
    router.push("/insights");
    router.refresh();
  }, [router]);

  const goToPricing = useCallback(() => {
    router.push("/pricing");
    router.refresh();
  }, [router]);

  const goToProfile = useCallback(() => {
    router.push("/profile");
    router.refresh();
  }, [router]);

  const goToSettings = useCallback(() => {
    router.push("/settings");
    router.refresh();
  }, [router]);

  const goToAdmin = useCallback(() => {
    router.push("/admin");
    router.refresh();
  }, [router]);

  return {
    navigateTo,
    goBack,
    goToDashboard,
    goToPets,
    goToAppointments,
    goToInsights,
    goToPricing,
    goToProfile,
    goToSettings,
    goToAdmin,
  };
}