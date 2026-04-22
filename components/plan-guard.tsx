"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Crown, Lock, Sparkles } from "lucide-react";

// Plan level mapping for feature checks
const PLAN_LEVEL: Record<string, number> = {
  basic: 0,
  standard: 1,
  premium: 2,
};

// Feature requirements mapping
const FEATURE_REQUIREMENTS: Record<string, { plan: string; minLevel: number }> = {
  // Basic features (available to all)
  "basic_pets": { plan: "basic", minLevel: 0 },
  "basic_health_tracking": { plan: "basic", minLevel: 0 },
  "basic_reminders": { plan: "basic", minLevel: 0 },
  
  // Standard features
  "ai_insights": { plan: "standard", minLevel: 1 },
  "advanced_analytics": { plan: "standard", minLevel: 1 },
  "priority_support": { plan: "standard", minLevel: 1 },
  "export_data": { plan: "standard", minLevel: 1 },
  "health_reports": { plan: "standard", minLevel: 1 },
  "nutrition_analysis": { plan: "standard", minLevel: 1 },
  "max_pets_10": { plan: "standard", minLevel: 1 },
  "feeding_schedules_10": { plan: "standard", minLevel: 1 },
  "anomaly_detection_3": { plan: "standard", minLevel: 1 },
  "recommendations_10": { plan: "standard", minLevel: 1 },
  "medical_docs_100": { plan: "standard", minLevel: 1 },
  "data_history_30": { plan: "standard", minLevel: 1 },
  
  // Premium features
  "sensor_data": { plan: "premium", minLevel: 2 },
  "lstm_predictions": { plan: "premium", minLevel: 2 },
  "disease_detection": { plan: "premium", minLevel: 2 },
  "risk_alerts": { plan: "premium", minLevel: 2 },
  "heart_rate_monitoring": { plan: "premium", minLevel: 2 },
  "temperature_monitoring": { plan: "premium", minLevel: 2 },
  "activity_tracking": { plan: "premium", minLevel: 2 },
  "unlimited_pets": { plan: "premium", minLevel: 2 },
  "unlimited_feeding_schedules": { plan: "premium", minLevel: 2 },
  "unlimited_recommendations": { plan: "premium", minLevel: 2 },
  "unlimited_anomalies": { plan: "premium", minLevel: 2 },
  "medical_docs_500": { plan: "premium", minLevel: 2 },
  "data_history_90": { plan: "premium", minLevel: 2 },
  "24_7_support": { plan: "premium", minLevel: 2 },
};

type PlanGuardProps = {
  children: React.ReactNode;
  requiredFeature: string;
  showUpgradePrompt?: boolean;
  fallbackMessage?: string;
  customUpgradePath?: string;
};

export function PlanGuard({ 
  children, 
  requiredFeature, 
  showUpgradePrompt = true, 
  fallbackMessage,
  customUpgradePath = "/pricing"
}: PlanGuardProps) {
  const { user, isLoading } = useAuth();
  const userPlan = user?.plan || "basic";
  
  // Check if user has access to the feature
  const hasAccess = (): boolean => {
    const requirement = FEATURE_REQUIREMENTS[requiredFeature];
    if (!requirement) {
      // If feature not defined in mapping, default to premium
      console.warn(`Feature "${requiredFeature}" not found in FEATURE_REQUIREMENTS. Defaulting to premium.`);
      return userPlan === "premium";
    }
    
    const userLevel = PLAN_LEVEL[userPlan] ?? 0;
    return userLevel >= requirement.minLevel;
  };

  const getRequiredPlanName = (): string => {
    const requirement = FEATURE_REQUIREMENTS[requiredFeature];
    if (!requirement) return "Premium";
    return requirement.plan.charAt(0).toUpperCase() + requirement.plan.slice(1);
  };

  const getUpgradeMessage = (): string => {
    if (fallbackMessage) return fallbackMessage;
    
    const requiredPlan = getRequiredPlanName();
    
    if (requiredPlan === "Standard") {
      return `This feature requires a Standard or Premium plan. Upgrade to Standard to unlock AI insights and advanced analytics.`;
    }
    
    return `This feature requires a Premium plan. Upgrade to Premium to unlock real-time sensor data, LSTM predictions, disease detection, and more.`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasAccess()) {
    if (!showUpgradePrompt) return null;

    const requiredPlan = getRequiredPlanName();
    const isStandardFeature = requiredPlan === "Standard";

    return (
      <Card className="border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mb-3">
            {isStandardFeature ? (
              <Sparkles className="h-8 w-8 text-primary" />
            ) : (
              <Crown className="h-8 w-8 text-yellow-500" />
            )}
          </div>
          <CardTitle className="text-xl">
            {isStandardFeature ? "Standard Feature" : "Premium Feature"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {getUpgradeMessage()}
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              <span>Your current plan: <span className="font-medium capitalize">{userPlan}</span></span>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <Link href={customUpgradePath}>
              <Button className="w-full gap-2 bg-gradient-to-r from-primary to-accent text-white shadow-md hover:shadow-lg transition-all">
                <Crown className="h-4 w-4" />
                Upgrade to {requiredPlan}
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground">
              {isStandardFeature 
                ? "Standard plan includes AI insights, advanced analytics, and priority support."
                : "Premium plan includes everything in Standard plus real-time sensor data, disease detection, and 24/7 support."
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}

// Helper hook for checking feature access without rendering a guard
export function useFeatureAccess(featureName: string): boolean {
  const { user } = useAuth();
  const userPlan = user?.plan || "basic";
  
  const requirement = FEATURE_REQUIREMENTS[featureName];
  if (!requirement) return false;
  
  const userLevel = PLAN_LEVEL[userPlan] ?? 0;
  return userLevel >= requirement.minLevel;
}

// Helper function to check if user can access a feature (for use in non-React contexts)
export function canAccessFeature(userPlan: string, featureName: string): boolean {
  const requirement = FEATURE_REQUIREMENTS[featureName];
  if (!requirement) return false;
  
  const userLevel = PLAN_LEVEL[userPlan] ?? 0;
  return userLevel >= requirement.minLevel;
}