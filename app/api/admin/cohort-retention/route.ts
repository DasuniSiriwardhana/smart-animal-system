import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    // Get all users with their signup date
    const { data: users } = await supabase
      .from('profiles')
      .select('id, created_at');
    
    // Get all user activities (feedings, logins, etc.)
    const { data: activities } = await supabase
      .from('feeding_logs')
      .select('pet_id, created_at');
    
    // Get pets with user mapping
    const { data: pets } = await supabase
      .from('pets')
      .select('id, user_id');
    
    // Create user activity map
    const userActivityMap = new Map<string, Set<string>>();
    activities?.forEach(activity => {
      const pet = pets?.find(p => p.id === activity.pet_id);
      if (pet) {
        const date = new Date(activity.created_at).toISOString().split('T')[0];
        if (!userActivityMap.has(pet.user_id)) {
          userActivityMap.set(pet.user_id, new Set());
        }
        userActivityMap.get(pet.user_id)?.add(date);
      }
    });
    
    // Build cohort data (last 6 months)
    const cohorts = [];
    const months = 6;
    
    for (let i = months - 1; i >= 0; i--) {
      const cohortDate = new Date();
      cohortDate.setMonth(cohortDate.getMonth() - i);
      const cohortMonth = cohortDate.toLocaleString('default', { month: 'short' });
      const cohortYear = cohortDate.getFullYear();
      
      // Users who signed up in this month
      const cohortUsers = users?.filter(u => {
        const signupDate = new Date(u.created_at);
        return signupDate.getMonth() === cohortDate.getMonth() &&
               signupDate.getFullYear() === cohortDate.getFullYear();
      }) || [];
      
      if (cohortUsers.length === 0) continue;
      
      const retentionRates = [];
      
      // Calculate retention for each subsequent month
      for (let j = 0; j <= i; j++) {
        const targetDate = new Date(cohortDate);
        targetDate.setMonth(targetDate.getMonth() + j);
        
        const activeUsers = cohortUsers.filter(user => {
          const activities = userActivityMap.get(user.id);
          if (!activities) return false;
          
          // Check if user was active in target month
          return Array.from(activities).some(dateStr => {
            const activityDate = new Date(dateStr);
            return activityDate.getMonth() === targetDate.getMonth() &&
                   activityDate.getFullYear() === targetDate.getFullYear();
          });
        });
        
        retentionRates.push({
          month: j,
          rate: (activeUsers.length / cohortUsers.length) * 100,
          active: activeUsers.length,
          total: cohortUsers.length
        });
      }
      
      cohorts.push({
        name: `${cohortMonth} ${cohortYear}`,
        size: cohortUsers.length,
        retention: retentionRates
      });
    }
    
    // Calculate average retention curve
    const maxMonths = Math.max(...cohorts.map(c => c.retention.length));
    const averageRetention = [];
    
    for (let i = 0; i < maxMonths; i++) {
      const rates = cohorts
        .filter(c => c.retention[i])
        .map(c => c.retention[i].rate);
      
      averageRetention.push({
        month: i,
        rate: rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0
      });
    }
    
    return NextResponse.json({
      cohorts,
      averageRetention,
      benchmark: {
        excellent: 40,
        good: 25,
        poor: 15
      }
    });
    
  } catch (err) {
    console.error('Cohort analysis error:', err);
    return NextResponse.json({ error: 'Failed to fetch cohort data' }, { status: 500 });
  }
}