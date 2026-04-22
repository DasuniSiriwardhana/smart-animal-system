// lib/pet-limits.ts
import { supabase } from '@/lib/supabaseClient';

export const MAX_PETS_BY_PLAN = {
  basic: 2,
  standard: 10,
  premium: 999, // Unlimited
};

export async function checkPetLimit(userId: string, userPlan: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('pets')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    console.error('Error checking pet limit:', error);
    return false;
  }

  const maxPets = MAX_PETS_BY_PLAN[userPlan as keyof typeof MAX_PETS_BY_PLAN] || 2;
  
  if (count && count >= maxPets) {
    throw new Error(`You have reached the maximum limit of ${maxPets} pets on your ${userPlan} plan. Upgrade to add more pets.`);
  }
  
  return true;
}

export function getMaxPetsForPlan(plan: string): number {
  return MAX_PETS_BY_PLAN[plan as keyof typeof MAX_PETS_BY_PLAN] || 2;
}