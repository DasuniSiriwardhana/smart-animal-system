import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const scheduleId = request.nextUrl.searchParams.get('scheduleId');
    
    if (!scheduleId) {
      return NextResponse.json({ error: 'Missing scheduleId' }, { status: 400 });
    }
    
    const { data: schedule, error } = await supabase
      .from('feeding_schedules')
      .select('meal_type, portion_size, portion_unit, food_type')
      .eq('id', scheduleId)
      .single();
    
    if (error || !schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, schedule });
    
  } catch (error) {
    console.error('Error fetching schedule details:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}