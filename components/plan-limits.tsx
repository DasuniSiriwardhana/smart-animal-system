"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { getPlanLimit } from "@/lib/plan-config";
import { Progress } from "@/components/ui/progress";

interface PlanLimitsProps {
  currentPetCount: number;
  currentStorageMB?: number;
}

export function PlanLimits({ currentPetCount, currentStorageMB = 0 }: PlanLimitsProps) {
  const { user } = useAuth();
  const userPlan = (user?.plan || "basic") as "basic" | "standard" | "premium";
  const maxPets = getPlanLimit(userPlan, "maxPets");
  const maxStorageGB = getPlanLimit(userPlan, "maxStorageGB");

  const petPercentage = (currentPetCount / (maxPets === 999999 ? currentPetCount + 1 : maxPets)) * 100;
  const storagePercentage = (currentStorageMB / (maxStorageGB * 1024)) * 100;

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="font-semibold">Plan Usage</h3>
      
      {/* Pet Limit */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span>Pets</span>
          <span>{currentPetCount} / {maxPets === 999999 ? "Unlimited" : maxPets}</span>
        </div>
        {maxPets !== 999999 && (
          <Progress value={Math.min(petPercentage, 100)} className="h-2" />
        )}
      </div>

      {/* Storage Limit (for Standard/Premium) */}
      {maxStorageGB > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Storage</span>
            <span>{currentStorageMB} MB / {maxStorageGB} GB</span>
          </div>
          <Progress value={Math.min(storagePercentage, 100)} className="h-2" />
        </div>
      )}
    </div>
  );
}