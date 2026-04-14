"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Crown, Sparkles, Circle } from "lucide-react";

export function PlanBadge() {
  const { user } = useAuth();
  const userPlan = user?.plan || "basic";

  const planConfig = {
    basic: {
      label: "Basic Plan",
      icon: Circle,
      color: "bg-gray-500",
      textColor: "text-gray-700",
      bgColor: "bg-gray-100",
    },
    standard: {
      label: "Standard Plan",
      icon: Sparkles,
      color: "bg-blue-500",
      textColor: "text-blue-700",
      bgColor: "bg-blue-100",
    },
    premium: {
      label: "Premium Plan",
      icon: Crown,
      color: "bg-yellow-500",
      textColor: "text-yellow-700",
      bgColor: "bg-yellow-100",
    },
  };

  const config = planConfig[userPlan];
  const Icon = config.icon;

  return (
    <Badge className={`${config.bgColor} ${config.textColor} px-3 py-1 gap-1`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}