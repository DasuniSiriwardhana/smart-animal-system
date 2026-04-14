import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { schedule_id, food_brand, food_product, actual_portion } = body;
    
    console.log("Confirming feeding:", schedule_id);
    
    // First get the schedule to get pet_id and meal_type
    const { data: schedule, error: fetchError } = await supabase
      .from('feeding_schedules')
      .select('*')
      .eq('id', schedule_id)
      .single();

    if (fetchError) {
      console.error("Error fetching schedule:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }
    
    // Update the feeding schedule
    const { error: updateError } = await supabase
      .from('feeding_schedules')
      .update({
        confirmed: true,
        confirmed_at: new Date().toISOString(),
        actual_portion: actual_portion,
        food_brand: food_brand,
        food_product: food_product
      })
      .eq('id', schedule_id);

    if (updateError) {
      console.error("Supabase update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Also create a record in feeding_logs
    await supabase
      .from('feeding_logs')
      .insert({
        schedule_id: schedule_id,
        pet_id: schedule.pet_id,
        feeding_time: new Date().toISOString(),
        meal_type: schedule.meal_type,
        confirmed: true,
        food_brand: food_brand,
        food_product: food_product,
        actual_portion: actual_portion,
        portion_unit: schedule.portion_unit
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error confirming feeding:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}