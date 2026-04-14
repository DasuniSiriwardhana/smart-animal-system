import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    const today = new Date();
    
    // Get all users
    const { data: users } = await supabase
      .from('profiles')
      .select('id, email, created_at');
    
    // Get all invoices
    const { data: invoices } = await supabase
      .from('invoices')
      .select('*')
      .eq('status', 'paid');
    
    // Get all feeding logs (engagement proxy)
    const { data: activities } = await supabase
      .from('feeding_logs')
      .select('*');
    
    // Get pets with user mapping
    const { data: pets } = await supabase
      .from('pets')
      .select('id, user_id');
    
    // Calculate RFM for each user
    const rfmData = users?.map(user => {
      const userInvoices = invoices?.filter(inv => inv.user_id === user.id) || [];
      const userPets = pets?.filter(p => p.user_id === user.id) || [];
      const petIds = userPets.map(p => p.id);
      const userActivities = activities?.filter(a => petIds.includes(a.pet_id)) || [];
      
      // Recency: Days since last activity/purchase
      const lastInvoice = userInvoices.sort((a, b) => 
        new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime()
      )[0];
      
      const lastActivity = userActivities.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];
      
      const lastDate = lastInvoice 
        ? new Date(lastInvoice.invoice_date)
        : lastActivity 
          ? new Date(lastActivity.created_at)
          : new Date(user.created_at);
      
      const recencyDays = Math.ceil((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Recency Score (1-5, 5 being most recent)
      let recencyScore = 5;
      if (recencyDays > 180) recencyScore = 1;
      else if (recencyDays > 90) recencyScore = 2;
      else if (recencyDays > 30) recencyScore = 3;
      else if (recencyDays > 7) recencyScore = 4;
      
      // Frequency: Number of purchases/activities
      const frequency = userInvoices.length + (userActivities.length * 0.3); // Weight activities less
      
      // Frequency Score (1-5)
      let frequencyScore = 5;
      if (frequency < 2) frequencyScore = 1;
      else if (frequency < 5) frequencyScore = 2;
      else if (frequency < 10) frequencyScore = 3;
      else if (frequency < 20) frequencyScore = 4;
      
      // Monetary: Total spent
      const monetary = userInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      
      // Monetary Score (1-5)
      let monetaryScore = 5;
      if (monetary < 1000) monetaryScore = 1;
      else if (monetary < 5000) monetaryScore = 2;
      else if (monetary < 15000) monetaryScore = 3;
      else if (monetary < 30000) monetaryScore = 4;
      
      // RFM Score (concatenated)
      const rfmScore = `${recencyScore}${frequencyScore}${monetaryScore}`;
      const rfmTotal = recencyScore + frequencyScore + monetaryScore;
      
      // Segment determination
      let segment = '';
      let segmentColor = '';
      let action = '';
      
      if (rfmTotal >= 13) {
        segment = 'Champions';
        segmentColor = 'emerald';
        action = 'Reward with exclusive offers, ask for reviews';
      } else if (rfmTotal >= 11) {
        segment = 'Loyal Customers';
        segmentColor = 'green';
        action = 'Upsell premium features, referral programs';
      } else if (recencyScore >= 4 && frequencyScore >= 4) {
        segment = 'Potential Loyalists';
        segmentColor = 'blue';
        action = 'Offer membership, build relationship';
      } else if (recencyScore >= 4 && frequencyScore <= 2) {
        segment = 'New Customers';
        segmentColor = 'cyan';
        action = 'Welcome sequence, onboarding emails';
      } else if (recencyScore <= 2 && frequencyScore >= 4) {
        segment = 'At Risk';
        segmentColor = 'orange';
        action = 'Send re-activation offers, personalized emails';
      } else if (recencyScore <= 2 && frequencyScore <= 2 && monetaryScore <= 2) {
        segment = 'Lost';
        segmentColor = 'red';
        action = 'Win-back campaign, deep discounts';
      } else if (monetaryScore >= 4 && recencyScore <= 2) {
        segment = "Can't Lose Them";
        segmentColor = 'purple';
        action = 'Personal outreach, VIP treatment';
      } else {
        segment = 'Needs Attention';
        segmentColor = 'yellow';
        action = 'Targeted promotions, re-engagement';
      }
      
      return {
        userId: user.id,
        email: user.email,
        recencyDays,
        recencyScore,
        frequency: Math.round(frequency * 10) / 10,
        frequencyScore,
        monetary,
        monetaryScore,
        rfmScore,
        rfmTotal,
        segment,
        segmentColor,
        action,
        lastActivity: recencyDays
      };
    }) || [];
    
    // Sort by RFM total (best customers first)
    rfmData.sort((a, b) => b.rfmTotal - a.rfmTotal);
    
    // Segment counts
    const segmentCounts = rfmData.reduce((acc, user) => {
      acc[user.segment] = (acc[user.segment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Segment revenue
    const segmentRevenue = rfmData.reduce((acc, user) => {
      acc[user.segment] = (acc[user.segment] || 0) + user.monetary;
      return acc;
    }, {} as Record<string, number>);
    
    return NextResponse.json({
      users: rfmData,
      segmentCounts,
      segmentRevenue,
      actionableInsights: {
        champions: rfmData.filter(u => u.segment === 'Champions'),
        atRisk: rfmData.filter(u => u.segment === 'At Risk'),
        lost: rfmData.filter(u => u.segment === 'Lost'),
        cantLose: rfmData.filter(u => u.segment === "Can't Lose Them")
      },
      summary: {
        totalCustomers: rfmData.length,
        championsCount: segmentCounts['Champions'] || 0,
        atRiskCount: segmentCounts['At Risk'] || 0,
        lostCount: segmentCounts['Lost'] || 0,
        championsRevenue: segmentRevenue['Champions'] || 0,
        atRiskRevenue: segmentRevenue['At Risk'] || 0
      }
    });
    
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch RFM data' }, { status: 500 });
  }
}