export type UserPlan = "basic" | "standard" | "premium";

export type PlanFeature = {
  name: string;
  description: string;
  basic: boolean;
  standard: boolean;
  premium: boolean;
};

export const PLAN_LIMITS = {
  basic: {
    maxPets: 2,
    maxFeedingSchedules: 3,
    maxRecommendations: 2,
    maxAnomalies: 1,
    historyDays: 7,
    chatbotLimit: 10,
    maxStorageGB: 0,
    hasSensorData: false,
    hasImageRecognition: false,
    hasLSTM: false,
  },
  standard: {
    maxPets: 10,
    maxFeedingSchedules: 10,
    maxRecommendations: 10,
    maxAnomalies: 3,
    historyDays: 30,
    chatbotLimit: 999,
    maxStorageGB: 10,
    hasSensorData: false,
    hasImageRecognition: false,
    hasLSTM: false,
  },
  premium: {
    maxPets: 999,
    maxFeedingSchedules: 999,
    maxRecommendations: 999,
    maxAnomalies: 10,
    historyDays: 90,
    chatbotLimit: 999,
    maxStorageGB: 50,
    hasSensorData: true,
    hasImageRecognition: true,
    hasLSTM: true,
  },
};

export const FEATURES: PlanFeature[] = [
  {
    name: "ai_insights",
    description: "AI-powered health predictions",
    basic: true,
    standard: true,
    premium: true,
  },
  {
    name: "sensor_data",
    description: "Real-time sensor data monitoring",
    basic: false,
    standard: false,
    premium: true,
  },
  {
    name: "image_recognition",
    description: "AI disease detection from photos",
    basic: false,
    standard: false,
    premium: true,
  },
  {
    name: "lstm_predictions",
    description: "Advanced LSTM health predictions",
    basic: false,
    standard: false,
    premium: true,
  },
  {
    name: "document_storage",
    description: "Document storage for vet records",
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
    name: "advanced_analytics",
    description: "Advanced analytics & charts",
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

export function hasFeature(plan: UserPlan, featureName: string): boolean {
  const feature = FEATURES.find(f => f.name === featureName);
  if (!feature) return false;
  
  switch (plan) {
    case "basic": return feature.basic;
    case "standard": return feature.standard;
    case "premium": return feature.premium;
    default: return false;
  }
}

export function getPlanLimit(plan: UserPlan, limitName: keyof typeof PLAN_LIMITS.basic) {
  return PLAN_LIMITS[plan][limitName];
}

export function canAddMorePets(plan: UserPlan, currentPetCount: number): boolean {
  const maxPets = PLAN_LIMITS[plan].maxPets;
  return currentPetCount < maxPets;
}

export function canAddMoreFeedingSchedules(plan: UserPlan, currentCount: number): boolean {
  const max = PLAN_LIMITS[plan].maxFeedingSchedules;
  return currentCount < max;
}

export function getRemainingPetSlots(plan: UserPlan, currentPetCount: number): number {
  const maxPets = PLAN_LIMITS[plan].maxPets;
  if (maxPets === 999) return Infinity;
  return Math.max(0, maxPets - currentPetCount);
}

export function getMaxRecommendations(plan: UserPlan): number {
  return PLAN_LIMITS[plan].maxRecommendations;
}