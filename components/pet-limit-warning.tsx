"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { getRemainingPetSlots, getPlanLimit } from "@/lib/plan-config";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { AlertCircle, Crown } from "lucide-react";

type PetLimitWarningProps = {
  currentPetCount: number;
};

export function PetLimitWarning({ currentPetCount }: PetLimitWarningProps) {
  const { user } = useAuth();
  const userPlan = user?.plan || "basic";
  const remainingSlots = getRemainingPetSlots(userPlan, currentPetCount);
  const maxPets = getPlanLimit(userPlan, "maxPets");
  const isAtLimit = remainingSlots <= 0;

  if (!isAtLimit) return null;

  return (
    <Alert variant="destructive" className="bg-yellow-50 border-yellow-200">
      <AlertCircle className="h-4 w-4 text-yellow-600" />
      <AlertTitle className="text-yellow-800">Pet Limit Reached</AlertTitle>
      <AlertDescription className="text-yellow-700">
        {userPlan === "basic" && (
          <div className="space-y-2">
            <p>You have reached the limit of {maxPets} pets on the Basic plan.</p>
            <Link href="/pricing/upgrade">
              <Button size="sm" className="gap-2 bg-gradient-to-r from-primary to-accent">
                <Crown className="h-3 w-3" />
                Upgrade to add more pets
              </Button>
            </Link>
          </div>
        )}
        {userPlan === "standard" && (
          <div className="space-y-2">
            <p>You have reached the limit of {maxPets} pets on the Standard plan.</p>
            <Link href="/pricing/upgrade?plan=premium">
              <Button size="sm" className="gap-2 bg-gradient-to-r from-primary to-accent">
                <Crown className="h-3 w-3" />
                Upgrade to Premium for unlimited pets
              </Button>
            </Link>
          </div>
        )}
        {userPlan === "premium" && (
          <p>You have unlimited pets on Premium plan! 🎉</p>
        )}
      </AlertDescription>
    </Alert>
  );
}