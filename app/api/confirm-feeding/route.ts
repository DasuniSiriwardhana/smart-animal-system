import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: NextRequest) {
  try {
    const scheduleId = req.nextUrl.searchParams.get('scheduleId');
    if (!scheduleId) return NextResponse.json({ error: 'Missing scheduleId' }, { status: 400 });

    // Update feeding_logs with confirmed = true (or insert if not exist)
    await supabase.from('feeding_logs').insert({
      schedule_id: scheduleId,
      confirmed: true,
      feeding_time: new Date(),
    });

    return NextResponse.redirect('/dashboard?confirmed=true');
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to confirm feeding' }, { status: 500 });
  }
}