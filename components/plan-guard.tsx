"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { hasFeature } from "@/lib/plan-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Crown, Lock } from "lucide-react";

type PlanGuardProps = {
  children: React.ReactNode;
  requiredFeature: string;
  showUpgradePrompt?: boolean;
  fallbackMessage?: string;
};

export function PlanGuard({ 
  children, 
  requiredFeature, 
  showUpgradePrompt = true, 
  fallbackMessage 
}: PlanGuardProps) {
  const { user, isLoading } = useAuth();
  const userPlan = user?.plan || "basic";
  const hasAccess = hasFeature(userPlan, requiredFeature);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasAccess) {
    if (!showUpgradePrompt) return null;

    return (
      <Card className="border-dashed border-primary/30 bg-primary/5">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-lg">Premium Feature</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            {fallbackMessage || `This feature requires an upgraded plan. Upgrade to ${requiredFeature === "ai_insights" ? "Standard or Premium" : "Premium"} to unlock this feature.`}
          </p>
          <Link href="/pricing/upgrade">
            <Button className="gap-2 bg-gradient-to-r from-primary to-accent">
              <Crown className="h-4 w-4" />
              Upgrade Now
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}