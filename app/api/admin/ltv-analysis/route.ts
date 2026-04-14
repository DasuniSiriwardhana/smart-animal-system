import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    // Get all subscriptions with user data
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select(`
        *,
        profiles:user_id (email, created_at)
      `);
    
    // Get all invoices
    const { data: invoices } = await supabase
      .from('invoices')
      .select('*')
      .eq('status', 'paid');
    
    // Calculate LTV per user
    const userLTV = new Map();
    const userFirstPurchase = new Map();
    const userLastPurchase = new Map();
    
    invoices?.forEach(invoice => {
      const userId = invoice.user_id;
      const amount = invoice.amount || 0;
      const date = new Date(invoice.invoice_date);
      
      // Track total spent
      userLTV.set(userId, (userLTV.get(userId) || 0) + amount);
      
      // Track first purchase
      if (!userFirstPurchase.has(userId) || date < userFirstPurchase.get(userId)) {
        userFirstPurchase.set(userId, date);
      }
      
      // Track last purchase
      if (!userLastPurchase.has(userId) || date > userLastPurchase.get(userId)) {
        userLastPurchase.set(userId, date);
      }
    });
    
    // Build LTV segments
    const ltvData = Array.from(userLTV.entries()).map(([userId, totalSpent]) => {
      const firstDate = userFirstPurchase.get(userId);
      const lastDate = userLastPurchase.get(userId);
      const customerLifetimeMonths = firstDate && lastDate 
        ? (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
        : 0;
      
      const monthlyValue = customerLifetimeMonths > 0 
        ? totalSpent / customerLifetimeMonths 
        : totalSpent;
      
      const subscription = subscriptions?.find(s => s.user_id === userId);
      
      return {
        userId,
        email: subscription?.profiles?.email || 'Unknown',
        totalSpent,
        customerLifetimeMonths: Math.round(customerLifetimeMonths * 10) / 10,
        monthlyValue: Math.round(monthlyValue),
        currentPlan: subscription?.plan_type || 'basic',
        status: subscription?.status || 'inactive',
        predictedLTV: predictLTV(monthlyValue, customerLifetimeMonths, subscription?.plan_type)
      };
    });
    
    // Sort by LTV
    ltvData.sort((a, b) => b.totalSpent - a.totalSpent);
    
    // Calculate aggregate metrics
    const avgLTV = ltvData.length > 0 
      ? ltvData.reduce((sum, u) => sum + u.totalSpent, 0) / ltvData.length 
      : 0;
    
    const top10Percent = ltvData.slice(0, Math.max(1, Math.floor(ltvData.length * 0.1)));
    const bottom10Percent = ltvData.slice(-Math.max(1, Math.floor(ltvData.length * 0.1)));
    
    // LTV by plan
    const ltvByPlan = {
      basic: ltvData.filter(u => u.currentPlan === 'basic').reduce((sum, u) => sum + u.totalSpent, 0),
      standard: ltvData.filter(u => u.currentPlan === 'standard').reduce((sum, u) => sum + u.totalSpent, 0),
      premium: ltvData.filter(u => u.currentPlan === 'premium').reduce((sum, u) => sum + u.totalSpent, 0),
    };
    
    // LTV distribution buckets
    const distribution = {
      '0-1k': ltvData.filter(u => u.totalSpent < 1000).length,
      '1k-5k': ltvData.filter(u => u.totalSpent >= 1000 && u.totalSpent < 5000).length,
      '5k-10k': ltvData.filter(u => u.totalSpent >= 5000 && u.totalSpent < 10000).length,
      '10k-25k': ltvData.filter(u => u.totalSpent >= 10000 && u.totalSpent < 25000).length,
      '25k+': ltvData.filter(u => u.totalSpent >= 25000).length,
    };
    
    return NextResponse.json({
      users: ltvData.slice(0, 50), // Top 50 by LTV
      summary: {
        totalCustomers: ltvData.length,
        averageLTV: Math.round(avgLTV),
        medianLTV: ltvData[Math.floor(ltvData.length / 2)]?.totalSpent || 0,
        top10PercentAvg: top10Percent.reduce((sum, u) => sum + u.totalSpent, 0) / top10Percent.length,
        bottom10PercentAvg: bottom10Percent.reduce((sum, u) => sum + u.totalSpent, 0) / bottom10Percent.length,
      },
      ltvByPlan,
      distribution,
      // CAC to LTV ratio (assuming CAC = marketing spend / new customers)
      cacToLtvRatio: avgLTV > 0 ? avgLTV / 500 : 0 // Assuming $500 CAC
    });
    
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch LTV data' }, { status: 500 });
  }
}

// Simple LTV prediction model
function predictLTV(monthlyValue: number, monthsActive: number, plan: string): number {
  const baseMultiplier = plan === 'premium' ? 18 : plan === 'standard' ? 14 : 10;
  const activityFactor = Math.min(monthsActive / 6, 1.5);
  return Math.round(monthlyValue * baseMultiplier * activityFactor);
}