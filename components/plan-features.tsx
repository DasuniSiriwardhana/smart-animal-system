"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export function PlanFeatures() {
  const { user } = useAuth();
  const currentPlan = user?.plan || "basic";

  const getPlanColor = () => {
    switch(currentPlan) {
      case "premium": return "from-yellow-500 to-amber-500";
      case "standard": return "from-blue-500 to-cyan-500";
      default: return "from-gray-500 to-slate-500";
    }
  };

  const getPlanIcon = () => {
    switch(currentPlan) {
      case "premium": return <Crown className="h-5 w-5 text-yellow-500" />;
      case "standard": return <Sparkles className="h-5 w-5 text-blue-500" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const features = {
    basic: [
      "Up to 3 pets",
      "Basic health tracking",
      "7-day history",
      "Email support",
    ],
    standard: [
      "Up to 10 pets",
      "AI Insights & predictions",
      "Advanced analytics",
      "10GB document storage",
      "Priority support",
      "Vet chat consultations",
    ],
    premium: [
      "Unlimited pets",
      "Advanced AI predictions",
      "Video vet consultations",
      "50GB document storage",
      "24/7 phone support",
      "API access",
    ],
  };

  return (
    <Card className={`bg-gradient-to-r ${getPlanColor()} text-white`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getPlanIcon()}
            <CardTitle className="text-white">Current Plan: {currentPlan.toUpperCase()}</CardTitle>
          </div>
          {currentPlan !== "premium" && (
            <Link href="/pricing/upgrade">
              <Button variant="secondary" size="sm">
                Upgrade
              </Button>
            </Link>
          )}
        </div>
        <CardDescription className="text-white/80">
          {currentPlan === "basic" && "Upgrade to Standard or Premium for more features"}
          {currentPlan === "standard" && "You have access to AI insights and analytics"}
          {currentPlan === "premium" && "You have access to all premium features"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {features[currentPlan].map((feature, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-white/90">
              <div className="h-1.5 w-1.5 rounded-full bg-white/50" />
              {feature}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}