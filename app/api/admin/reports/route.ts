import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Define proper types
type Invoice = {
  id: string;
  user_id: string;
  amount: number;
  invoice_date: string;
  status: string;
  plan_type?: string;
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

    // Fetch all required data with proper typing
    const [
      { data: users, error: usersError },
      { data: invoices, error: invoicesError },
      { data: subscriptions, error: subscriptionsError },
      { data: pets, error: petsError },
      { data: feedingLogs, error: feedingError }
    ] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('invoices').select('*').eq('status', 'paid'),
      supabase.from('subscriptions').select('*'),
      supabase.from('pets').select('*'),
      supabase.from('feeding_logs').select('*')
    ]);

    // Log any errors
    if (usersError) console.error('❌ Users error:', usersError);
    if (invoicesError) console.error('❌ Invoices error:', invoicesError);
    if (subscriptionsError) console.error('❌ Subscriptions error:', subscriptionsError);
    if (petsError) console.error('❌ Pets error:', petsError);
    if (feedingError) console.error('❌ Feeding logs error:', feedingError);

    // Detailed pets debugging
    console.log('🐾 DEBUG: Raw pets data:', pets);
    console.log('🐾 DEBUG: Pets count:', pets?.length || 0);

    if (pets && pets.length > 0) {
      console.log('🐾 DEBUG: First pet:', pets[0]);
      console.log('🐾 DEBUG: All species values:', pets.map((p: Pet) => p.species));
      console.log('🐾 DEBUG: Unique species:', [...new Set(pets.map((p: Pet) => p.species))]);
    } else {
      console.log('🐾 DEBUG: No pets found in database!');
    }

    const typedUsers = (users || []) as User[];
    const typedInvoices = (invoices || []) as Invoice[];
    const typedSubscriptions = (subscriptions || []) as Subscription[];
    const typedPets = (pets || []) as Pet[];
    const typedFeedingLogs = (feedingLogs || []) as FeedingLog[];

    console.log('📊 Typed Pets Count:', typedPets.length);

    // Filter by date range
    const filteredInvoices = typedInvoices.filter(inv => {
      const d = new Date(inv.invoice_date);
      return d >= new Date(startDate) && d <= new Date(endDate);
    });

    const filteredUsers = typedUsers.filter(u => {
      const d = new Date(u.created_at);
      return d >= new Date(startDate) && d <= new Date(endDate);
    });

    // Calculate summary metrics
    const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const activeSubscriptions = typedSubscriptions.filter(s => s.status === 'active').length;
    const cancelledSubscriptions = typedSubscriptions.filter(s => s.status === 'cancelled' || s.status === 'expired').length;
    const totalSubs = typedSubscriptions.length || 1;
    const churnRate = Math.round((cancelledSubscriptions / totalSubs) * 1000) / 10;

    // Revenue trend
    const revenueTrend = generateRevenueTrend(filteredInvoices, startDate, endDate);
    
    // User growth trend
    const userGrowth = generateUserGrowth(typedUsers, startDate, endDate);
    
    // Plan distribution
    const planDistribution = [
      { name: 'Basic', value: typedUsers.filter(u => u.plan === 'basic').length, color: '#6b7280' },
      { name: 'Standard', value: typedUsers.filter(u => u.plan === 'standard').length, color: '#3b82f6' },
      { name: 'Premium', value: typedUsers.filter(u => u.plan === 'premium').length, color: '#f59e0b' },
    ];

    // Top spending users
    const userSpending = new Map<string, { email: string; total: number; plan: string }>();
    filteredInvoices.forEach(inv => {
      const user = typedUsers.find(u => u.id === inv.user_id);
      if (user) {
        const existing = userSpending.get(inv.user_id) || { 
          email: user.email, 
          total: 0, 
          plan: user.plan || 'basic' 
        };
        existing.total += inv.amount || 0;
        userSpending.set(inv.user_id, existing);
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

    
    // PET SPECIES DISTRIBUTION - FIXED VERSION
    
    
    console.log('🔍 Starting species distribution calculation...');
    console.log('🔍 Total pets to process:', typedPets.length);
    
    const speciesMap = new Map<string, number>();
    
    typedPets.forEach((pet, index) => {
      let species = pet.species;
      console.log(`🔍 Pet ${index + 1}: species = "${species}"`);
      
      // Handle empty, null, or undefined species
      if (!species || species.trim() === '') {
        species = 'Unknown';
      } else {
        // Clean and capitalize
        species = species.trim();
        species = species.charAt(0).toUpperCase() + species.slice(1).toLowerCase();
      }
      
      console.log(`🔍 Pet ${index + 1}: cleaned species = "${species}"`);
      
      const currentCount = speciesMap.get(species) || 0;
      speciesMap.set(species, currentCount + 1);
    });

    console.log('🔍 Species Map:', Object.fromEntries(speciesMap));

    // Convert to array and sort - WITHOUT percentage to avoid type error
    let petSpeciesDistribution: SpeciesDistribution[] = Array.from(speciesMap.entries())
      .map(([species, count]) => ({ species, count }))
      .sort((a, b) => b.count - a.count);

    console.log('🔍 Final Pet Species Distribution:', petSpeciesDistribution);
    console.log('🔍 Distribution length:', petSpeciesDistribution.length);

    // If empty but we have pets, something went wrong
    if (petSpeciesDistribution.length === 0 && typedPets.length > 0) {
      console.warn('⚠️ We have pets but species distribution is empty!');
      // Force at least one entry
      petSpeciesDistribution = [{ species: 'Unknown', count: typedPets.length }];
    }
    
    // If completely empty, provide placeholder
    if (petSpeciesDistribution.length === 0) {
      console.log('📭 No pets found, using placeholder data');
      petSpeciesDistribution = [
        { species: 'No pets yet', count: 0 },
      ];
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
        conversionRate: typedUsers.length ? Math.round((planDistribution[2].value / typedUsers.length) * 100) : 0,
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

    console.log('✅ Final Report Data Summary:', {
      totalPets: reportData.summary.totalPets,
      speciesDistribution: reportData.petSpeciesDistribution,
      speciesCount: reportData.petSpeciesDistribution.length
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

function generateRevenueTrend(invoices: Invoice[], startDate: string, endDate: string) {
  const trend = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const dayInvoices = invoices.filter(inv => inv.invoice_date === dateStr);
    
    trend.push({
      date: new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: dayInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0),
      subscriptions: dayInvoices.length,
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