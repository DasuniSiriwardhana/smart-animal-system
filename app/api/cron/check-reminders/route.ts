import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    
    // Find schedules that need reminders
    const { data: schedules, error } = await supabase
      .from('feeding_schedules')
      .select(`
        id,
        meal_time,
        meal_type,
        reminder_sent,
        pet_id,
        pets (
          name,
          user_id
        )
      `)
      .eq('is_active', true)
      .eq('confirmed', false)
      .eq('skipped', false)
      .eq('reminder_sent', false)
      .lte('meal_time', currentTime);

    if (error) {
      console.error("Error fetching schedules:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!schedules || schedules.length === 0) {
      return NextResponse.json({ success: true, remindersSent: 0, message: "No pending schedules" });
    }

    let sentCount = 0;

    for (const schedule of schedules) {
      // Get pet info - handle the nested structure
      const petData = schedule.pets as unknown as { name: string; user_id: string };
      
      if (!petData || !petData.user_id) {
        console.log(`No pet data for schedule ${schedule.id}`);
        continue;
      }

      // Get user email
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(petData.user_id);
      
      if (userError || !userData?.user?.email) {
        console.log(`No email for user ${petData.user_id}`);
        continue;
      }

      const userEmail = userData.user.email;

      // Send email via our API
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/sendReminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          scheduleId: schedule.id,
          petName: petData.name,
          mealType: schedule.meal_type,
          time: schedule.meal_time,
        }),
      });

      if (response.ok) {
        // Mark reminder as sent
        await supabase
          .from('feeding_schedules')
          .update({ reminder_sent: true, last_reminder_sent: new Date().toISOString() })
          .eq('id', schedule.id);
        sentCount++;
        console.log(`Reminder sent for schedule ${schedule.id} to ${userEmail}`);
      } else {
        console.log(`Failed to send reminder for schedule ${schedule.id}`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      remindersSent: sentCount,
      totalSchedules: schedules.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Cron error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}