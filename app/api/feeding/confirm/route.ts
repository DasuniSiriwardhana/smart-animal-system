import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================
// GET endpoint - For email link clicks
// ============================================
export async function GET(req: NextRequest) {
  try {
    const scheduleId = req.nextUrl.searchParams.get('scheduleId');
    
    if (!scheduleId) {
      return NextResponse.json({ error: 'Missing scheduleId' }, { status: 400 });
    }

    console.log("Confirming feeding from email link:", scheduleId);

    // Get the schedule
    const { data: schedule, error: fetchError } = await supabase
      .from('feeding_schedules')
      .select('*')
      .eq('id', scheduleId)
      .single();

    if (fetchError || !schedule) {
      console.error("Schedule not found:", fetchError);
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    // Update the feeding schedule
    const { error: updateError } = await supabase
      .from('feeding_schedules')
      .update({
        confirmed: true,
        confirmed_at: new Date().toISOString(),
        reminder_sent: true
      })
      .eq('id', scheduleId);

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Insert into feeding_logs
    const { error: insertError } = await supabase
      .from('feeding_logs')
      .insert({
        schedule_id: scheduleId,
        pet_id: schedule.pet_id,
        feeding_time: new Date().toISOString(),
        meal_type: schedule.meal_type,
        confirmed: true,
        skipped: false,
        food_brand: null,
        food_type: schedule.food_type,
        actual_portion: schedule.portion_size,
        portion_unit: schedule.portion_unit,
        notes: 'Confirmed via email link'
      });

    if (insertError) {
      console.error("Insert into feeding_logs error:", insertError);
    } else {
      console.log("Feeding log created for schedule:", scheduleId);
    }

    console.log("Successfully confirmed feeding from email link:", scheduleId);
    
    // Redirect to dashboard with success message
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?feeding=confirmed`);
    
  } catch (error) {
    console.error('Error confirming feeding from email link:', error);
    return NextResponse.json({ error: 'Failed to confirm feeding' }, { status: 500 });
  }
}

// ============================================
// POST endpoint - For web form submission
// ============================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { schedule_id, food_brand, food_product, actual_portion } = body;
    
    console.log("Confirming feeding from web form:", schedule_id);
    console.log("Food brand:", food_brand);
    console.log("Food product:", food_product);
    console.log("Actual portion:", actual_portion);
    
    if (!schedule_id) {
      return NextResponse.json({ error: 'Missing schedule_id' }, { status: 400 });
    }
    
    // Get the schedule first
    const { data: schedule, error: fetchError } = await supabase
      .from('feeding_schedules')
      .select('*')
      .eq('id', schedule_id)
      .single();

    if (fetchError || !schedule) {
      console.error("Schedule not found:", fetchError);
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }
    
    // Update the feeding schedule
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
      console.error("Update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Insert into feeding_logs
    const { data: logData, error: insertError } = await supabase
      .from('feeding_logs')
      .insert({
        schedule_id: schedule_id,
        pet_id: schedule.pet_id,
        feeding_time: new Date().toISOString(),
        meal_type: schedule.meal_type,
        confirmed: true,
        skipped: false,
        food_brand: food_brand,
        food_type: schedule.food_type,
        actual_portion: actual_portion || schedule.portion_size,
        portion_unit: schedule.portion_unit,
        notes: `Confirmed via web form. Product: ${food_product || 'N/A'}`
      })
      .select();

    if (insertError) {
      console.error("Insert into feeding_logs error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    } else {
      console.log("Feeding log created:", logData);
    }

    console.log("Successfully confirmed feeding from web form for schedule:", schedule_id);
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error confirming feeding from web form:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}