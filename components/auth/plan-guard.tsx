"use client";

import { useAuth } from "./auth-provider";
import { useRouter } from "next/navigation";
import { hasFeature } from "@/lib/features";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Sparkles } from "lucide-react";

type PlanGuardProps = {
  children: React.ReactNode;
  requiredFeature: string;
  fallbackMessage?: string;
};

export function PlanGuard({ children, requiredFeature, fallbackMessage }: PlanGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const hasAccess = user && hasFeature(user.plan || "basic", requiredFeature);

  if (!hasAccess) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Premium Feature</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {fallbackMessage || "This feature requires an upgraded plan. Upgrade now to unlock AI insights, advanced analytics, and more!"}
            </p>
            <Button className="w-full">
              <Link href="/pricing/upgrade">Upgrade Plan</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}



