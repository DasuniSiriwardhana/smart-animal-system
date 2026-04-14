import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ petId: string }> }
) {
  try {
    const { petId } = await params;
    const currentTime = new Date().toTimeString().slice(0, 5);
    
    console.log("Fetching pending meals for pet:", petId, "at", currentTime);
    
    const { data: schedules, error } = await supabase
      .from('feeding_schedules')
      .select('*')
      .eq('pet_id', petId)
      .eq('is_active', true)
      .eq('confirmed', false)
      .eq('skipped', false)
      .gte('meal_time', currentTime)
      .order('meal_time');

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ schedules: [], error: error.message });
    }

    return NextResponse.json({ 
      schedules: schedules || [], 
      date: new Date().toISOString().split('T')[0] 
    });
  } catch (error) {
    console.error('Error fetching today\'s schedule:', error);
    return NextResponse.json({ schedules: [], error: String(error) });
  }
}