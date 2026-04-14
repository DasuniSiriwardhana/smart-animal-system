// lib/features.ts

export type UserPlan = "basic" | "standard" | "premium";
export type UserRole = "user" | "admin";

export type Feature = {
  name: string;
  description: string;
  basic: boolean;
  standard: boolean;
  premium: boolean;
};

export const FEATURES: Feature[] = [
  {
    name: "pets_limit",
    description: "Number of pets",
    basic: true,
    standard: true,
    premium: true,
  },
  {
    name: "health_tracking",
    description: "Basic health tracking",
    basic: true,
    standard: true,
    premium: true,
  },
  {
    name: "daily_logs",
    description: "Daily logs with AI analysis",
    basic: false,
    standard: true,
    premium: true,
  },
  {
    name: "ai_insights",
    description: "AI Insights & predictions",
    basic: false,
    standard: true,
    premium: true,
  },
  {
    name: "advanced_analytics",
    description: "Advanced analytics & charts",
    basic: false,
    standard: true,
    premium: true,
  },
  {
    name: "document_storage",
    description: "Document storage",
    basic: false,
    standard: true,
    premium: true,
  },
  {
    name: "vet_consultations",
    description: "Vet chat consultations",
    basic: false,
    standard: true,
    premium: true,
  },
  {
    name: "image_recognition",
    description: "Image recognition",
    basic: false,
    standard: true,
    premium: true,
  },
  {
    name: "sensor_integration",
    description: "Sensor data integration",
    basic: false,
    standard: true,
    premium: true,
  },
  {
    name: "export_reports",
    description: "Export reports",
    basic: false,
    standard: true,
    premium: true,
  },
  {
    name: "video_consultations",
    description: "Video vet consultations",
    basic: false,
    standard: false,
    premium: true,
  },
  {
    name: "multiple_users",
    description: "Multiple users per account",
    basic: false,
    standard: false,
    premium: true,
  },
  {
    name: "api_access",
    description: "API access",
    basic: false,
    standard: false,
    premium: true,
  },
];

export const PLAN_LIMITS = {
  basic: {
    maxPets: 3,
    maxStorageGB: 0,
    historyDays: 7,
    supportLevel: "email",
  },
  standard: {
    maxPets: 999,
    maxStorageGB: 10,
    historyDays: 365,
    supportLevel: "priority",
  },
  premium: {
    maxPets: 10,
    maxStorageGB: 50,
    historyDays: 1825,
    supportLevel: "24/7",
  },
};

export function hasFeature(plan: UserPlan, featureName: string): boolean {
  const feature = FEATURES.find(f => f.name === featureName);
  if (!feature) return false;
  
  switch (plan) {
    case "basic":
      return feature.basic;
    case "standard":
      return feature.standard;
    case "premium":
      return feature.premium;
    default:
      return false;
  }
}

export function getPlanLimit(plan: UserPlan, limitName: keyof typeof PLAN_LIMITS.basic) {
  return PLAN_LIMITS[plan][limitName];
}