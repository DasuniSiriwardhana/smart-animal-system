import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Define proper types
type SubscriptionPayment = {
  id: string;
  user_id: string;
  amount: number;
  payment_date: string;
  plan_type: string;
  status: string;
};

type User = {
  id: string;
  email: string;
  plan?: string;
  created_at: string;
};

type Subscription = {
  id: string;
  user_id: string;
  status: string;
  plan_type?: string;
};

type Pet = {
  id: string;
  user_id: string;
  species: string;
  created_at: string;
  name?: string;
};

type FeedingLog = {
  id: string;
  pet_id: string;
  created_at: string;
};

type SpeciesDistribution = {
  species: string;
  count: number;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0];

    console.log('📅 Date Range:', { startDate, endDate });

    // ✅ FETCH FROM SUBSCRIPTION_PAYMENTS TABLE (NOT invoices)
    const [
      { data: payments, error: paymentsError },
      { data: users, error: usersError },
      { data: subscriptions, error: subscriptionsError },
      { data: pets, error: petsError },
      { data: feedingLogs, error: feedingError }
    ] = await Promise.all([
      supabase.from('subscription_payments').select('*').eq('status', 'completed'),
      supabase.from('profiles').select('*'),
      supabase.from('subscriptions').select('*'),
      supabase.from('pets').select('*'),
      supabase.from('feeding_logs').select('*')
    ]);

    if (paymentsError) console.error('❌ Payments error:', paymentsError);
    if (usersError) console.error('❌ Users error:', usersError);
    if (subscriptionsError) console.error('❌ Subscriptions error:', subscriptionsError);
    if (petsError) console.error('❌ Pets error:', petsError);
    if (feedingError) console.error('❌ Feeding logs error:', feedingError);

    const typedPayments = (payments || []) as SubscriptionPayment[];
    const typedUsers = (users || []) as User[];
    const typedSubscriptions = (subscriptions || []) as Subscription[];
    const typedPets = (pets || []) as Pet[];
    const typedFeedingLogs = (feedingLogs || []) as FeedingLog[];

    // ✅ CALCULATE TOTAL REVENUE FROM SUBSCRIPTION_PAYMENTS
    let totalRevenue = 0;
    typedPayments.forEach(payment => {
      totalRevenue += payment.amount || 0;
    });

    // Filter users by date range
    const filteredUsers = typedUsers.filter(u => {
      const d = new Date(u.created_at);
      return d >= new Date(startDate) && d <= new Date(endDate);
    });

    // Calculate active subscriptions
    const activeSubscriptions = typedSubscriptions.filter(s => s.status === 'active').length;
    const cancelledSubscriptions = typedSubscriptions.filter(s => s.status === 'cancelled' || s.status === 'expired').length;
    const totalSubs = typedSubscriptions.length || 1;
    const churnRate = Math.round((cancelledSubscriptions / totalSubs) * 1000) / 10;

    // ✅ REVENUE TREND FROM SUBSCRIPTION_PAYMENTS
    const revenueTrend = generateRevenueTrend(typedPayments, startDate, endDate);
    
    // User growth trend
    const userGrowth = generateUserGrowth(typedUsers, startDate, endDate);
    
    // Plan distribution from subscriptions
    const planDistribution = [
      { name: 'Basic', value: typedSubscriptions.filter(s => s.plan_type === 'basic').length, color: '#6b7280' },
      { name: 'Standard', value: typedSubscriptions.filter(s => s.plan_type === 'standard').length, color: '#3b82f6' },
      { name: 'Premium', value: typedSubscriptions.filter(s => s.plan_type === 'premium').length, color: '#f59e0b' },
    ];

    // ✅ TOP SPENDING USERS FROM SUBSCRIPTION_PAYMENTS
    const userSpending = new Map<string, { email: string; total: number; plan: string }>();
    
    typedPayments.forEach(payment => {
      const user = typedUsers.find(u => u.id === payment.user_id);
      if (user) {
        const existing = userSpending.get(payment.user_id) || { 
          email: user.email, 
          total: 0, 
          plan: user.plan || 'basic' 
        };
        existing.total += payment.amount || 0;
        userSpending.set(payment.user_id, existing);
      }
    });
    
    const topSpendingUsers = Array.from(userSpending.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 20);

    // Activity metrics
    const filteredFeedings = typedFeedingLogs.filter(log => {
      const d = new Date(log.created_at);
      return d >= new Date(startDate) && d <= new Date(endDate);
    });

    const activePetIds = new Set(filteredFeedings.map(f => f.pet_id));
    const totalPets = typedPets.length || 1;

    // PET SPECIES DISTRIBUTION
    const speciesMap = new Map<string, number>();
    
    typedPets.forEach((pet) => {
      let species = pet.species;
      if (!species || species.trim() === '') {
        species = 'Unknown';
      } else {
        species = species.trim();
        species = species.charAt(0).toUpperCase() + species.slice(1).toLowerCase();
      }
      const currentCount = speciesMap.get(species) || 0;
      speciesMap.set(species, currentCount + 1);
    });

    let petSpeciesDistribution: SpeciesDistribution[] = Array.from(speciesMap.entries())
      .map(([species, count]) => ({ species, count }))
      .sort((a, b) => b.count - a.count);

    if (petSpeciesDistribution.length === 0 && typedPets.length > 0) {
      petSpeciesDistribution = [{ species: 'Unknown', count: typedPets.length }];
    }
    
    if (petSpeciesDistribution.length === 0) {
      petSpeciesDistribution = [{ species: 'No pets yet', count: 0 }];
    }

    const reportData = {
      summary: {
        totalRevenue,
        totalUsers: typedUsers.length,
        newUsers: filteredUsers.length,
        totalPets: typedPets.length,
        activeSubscriptions,
        churnRate,
        avgRevenuePerUser: typedUsers.length ? Math.round(totalRevenue / typedUsers.length) : 0,
        conversionRate: typedUsers.length ? Math.round((typedSubscriptions.filter(s => s.plan_type === 'premium').length / typedUsers.length) * 100) : 0,
      },
      revenueTrend,
      userGrowth,
      planDistribution,
      topSpendingUsers,
      activityMetrics: {
        totalFeedings: filteredFeedings.length,
        avgFeedingsPerPet: filteredFeedings.length / totalPets,
        activePets: activePetIds.size,
        inactivePets: totalPets - activePetIds.size,
      },
      petSpeciesDistribution,
    };

    console.log(' Final Report Data Summary:', {
      totalRevenue: reportData.summary.totalRevenue,
      totalUsers: reportData.summary.totalUsers,
    });

    return NextResponse.json(reportData);

  } catch (error) {
    console.error('❌ Reports API error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ✅ UPDATED to use SubscriptionPayment type
function generateRevenueTrend(payments: SubscriptionPayment[], startDate: string, endDate: string) {
  const trend = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const dayPayments = payments.filter(p => p.payment_date === dateStr);
    
    trend.push({
      date: new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: dayPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
      subscriptions: dayPayments.length,
    });
  }
  
  return trend;
}

function generateUserGrowth(users: User[], startDate: string, endDate: string) {
  const growth = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  let cumulative = users.filter(u => new Date(u.created_at) < start).length;
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const newUsers = users.filter(u => u.created_at?.startsWith(dateStr)).length;
    cumulative += newUsers;
    
    growth.push({
      date: new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      newUsers,
      totalUsers: cumulative,
    });
  }
  
  return growth;
}