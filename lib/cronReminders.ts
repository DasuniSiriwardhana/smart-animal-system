import cron from 'node-cron';
import { supabase } from './supabaseClient';
import fetch from 'node-fetch';

export function startReminderCron() {
  cron.schedule('*/5 * * * *', async () => {
    const { data: schedules } = await supabase
      .from('feeding_schedules')
      .select('id, user_id, pet_id, meal_time')
      .lte('meal_time', new Date(new Date().getTime() + 10 * 60 * 1000)) // 10 min ahead
      .eq('reminder_sent', false);

    if (!schedules) return;

    for (const s of schedules) {
      const { data: user } = await supabase
        .from('users')
        .select('email')
        .eq('id', s.user_id)
        .single();

      const { data: pet } = await supabase
        .from('pets')
        .select('name')
        .eq('id', s.pet_id)
        .single();

      // Skip if either is null
      if (!user || !pet || !user.email || !pet.name) continue;

      // Send email via our API
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/sendReminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          scheduleId: s.id,
          petName: pet.name,
          mealType: 'breakfast', // TODO: get dynamically from schedule if needed
          time: s.meal_time,
        }),
      });

      // Mark reminder_sent = true
      await supabase
        .from('feeding_schedules')
        .update({ reminder_sent: true })
        .eq('id', s.id);
    }
  });
}