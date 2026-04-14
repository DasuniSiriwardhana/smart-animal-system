import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(
  request: Request,
  { params }: { params: { scheduleId: string } }
) {
  try {
    const scheduleId = params.scheduleId;
    
    console.log("Skipping feeding:", scheduleId);
    
    const { error } = await supabase
      .from('feeding_schedules')
      .update({
        skipped: true,
        confirmed_at: new Date().toISOString()
      })
      .eq('id', scheduleId);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error skipping feeding:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}