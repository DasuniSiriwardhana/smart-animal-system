// components/back-Button.tsx
"use client";

import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface BackButtonProps {
  label?: string;
  fallbackPath?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export function BackButton({ label = "Back", fallbackPath = "/dashboard", variant = "ghost" }: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 2) {
      router.back();
      setTimeout(() => router.refresh(), 50);
    } else {
      router.push(fallbackPath);
      router.refresh();
    }
  };

  return (
    <Button variant={variant} size="sm" onClick={handleBack} className="gap-2">
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}


