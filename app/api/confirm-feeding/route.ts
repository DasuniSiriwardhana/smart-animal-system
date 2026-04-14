import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: NextRequest) {
  try {
    const scheduleId = req.nextUrl.searchParams.get('scheduleId');
    
    if (!scheduleId) {
      return NextResponse.json({ error: 'Missing scheduleId' }, { status: 400 });
    }

    console.log("Confirming feeding from email link:", scheduleId);

    const { data: schedule, error: fetchError } = await supabase
      .from('feeding_schedules')
      .select('*')
      .eq('id', scheduleId)
      .single();

    if (fetchError || !schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    await supabase
      .from('feeding_schedules')
      .update({
        confirmed: true,
        confirmed_at: new Date().toISOString(),
        reminder_sent: true
      })
      .eq('id', scheduleId);

    await supabase
      .from('feeding_logs')
      .insert({
        schedule_id: scheduleId,
        pet_id: schedule.pet_id,
        feeding_time: new Date().toISOString(),
        meal_type: schedule.meal_type,
        confirmed: true,
        actual_portion: schedule.portion_size,
        portion_unit: schedule.portion_unit
      });

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?feeding=confirmed`);
    
  } catch (error) {
    console.error('Error confirming feeding:', error);
    return NextResponse.json({ error: 'Failed to confirm feeding' }, { status: 500 });
  }
}