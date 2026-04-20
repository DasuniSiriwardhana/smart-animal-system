import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { schedule_id, food_brand, food_product, actual_portion } = body;
    
    console.log("Confirming feeding:", schedule_id);
    
    const { data: schedule, error: fetchError } = await supabase
      .from('feeding_schedules')
      .select('*')
      .eq('id', schedule_id)
      .single();

    if (fetchError || !schedule) {
      console.error("Error fetching schedule:", fetchError);
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }
    
    const { error: updateError } = await supabase
      .from('feeding_schedules')
      .update({
        confirmed: true,
        confirmed_at: new Date().toISOString(),
        actual_portion: actual_portion || schedule.portion_size,
        food_brand: food_brand,
        food_product: food_product,
        reminder_sent: true
      })
      .eq('id', schedule_id);

    if (updateError) {
      console.error("Supabase update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

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
        actual_portion: actual_portion || schedule.portion_size,
        portion_unit: schedule.portion_unit
      });

    console.log("✅ Feeding confirmed successfully");
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error confirming feeding:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}