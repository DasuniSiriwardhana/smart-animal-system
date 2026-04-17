import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('pricing_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, plans: data });
  } catch (error) {
    console.error('Error fetching pricing plans:', error);
    return NextResponse.json({ error: 'Failed to fetch pricing plans' }, { status: 500 });
  }
}