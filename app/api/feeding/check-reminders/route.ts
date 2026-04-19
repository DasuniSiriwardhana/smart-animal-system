import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import nodemailer from 'nodemailer';

export async function GET() {
  try {
    console.log("=== CRON JOB STARTED ===");
    
    // Step 1: Get current time in minutes for comparison
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    console.log(`Current time: ${now.getHours()}:${now.getMinutes()} (${currentMinutes} minutes)`);
    
    // Step 2: Get ALL active unreminded schedules
    const { data: schedules, error } = await supabase
      .from('feeding_schedules')
      .select(`
        id,
        meal_time,
        meal_type,
        portion_size,
        portion_unit,
        food_type,
        reminder_sent,
        is_active,
        confirmed,
        skipped,
        pet_id
      `)
      .eq('is_active', true)
      .eq('reminder_sent', false)
      .eq('confirmed', false)
      .eq('skipped', false);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ remindersSent: 0, error: error.message });
    }

    console.log(`Found ${schedules?.length || 0} active schedules`);

    if (!schedules || schedules.length === 0) {
      return NextResponse.json({ remindersSent: 0, message: "No active schedules" });
    }

    // Step 3: Filter schedules that are due (time comparison in JavaScript)
    const dueSchedules = [];
    
    for (const schedule of schedules) {
      // Parse meal_time (format: "07:48:25.748127" or "08:00:00")
      let timeStr = schedule.meal_time;
      if (timeStr.includes('.')) {
        timeStr = timeStr.split('.')[0]; // Remove microseconds
      }
      const [hours, minutes] = timeStr.split(':').map(Number);
      const scheduleMinutes = hours * 60 + minutes;
      
      const isDue = scheduleMinutes <= currentMinutes;
      
      console.log(`Schedule ${schedule.id}: ${schedule.meal_time} -> ${scheduleMinutes} minutes, Due: ${isDue}`);
      
      if (isDue) {
        dueSchedules.push(schedule);
      }
    }

    console.log(`Found ${dueSchedules.length} due schedules`);

    if (dueSchedules.length === 0) {
      return NextResponse.json({ remindersSent: 0, message: "No due schedules at this time" });
    }

    // Step 4: Setup email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let remindersSent = 0;

    // Step 5: Send emails for due schedules
    for (const schedule of dueSchedules) {
      try {
        // Get pet info
        const { data: pet, error: petError } = await supabase
          .from('pets')
          .select('name, user_id')
          .eq('id', schedule.pet_id)
          .single();

        if (petError || !pet) {
          console.error(`Pet not found for schedule ${schedule.id}`);
          continue;
        }

        // Get user email
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', pet.user_id)
          .single();

        if (profileError || !profile?.email) {
          console.error(`No email for user ${pet.user_id}`);
          continue;
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const confirmUrl = `${baseUrl}/feeding-confirm?scheduleId=${schedule.id}&petName=${encodeURIComponent(pet.name)}`;

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #2f4454, #da7b93); padding: 20px; text-align: center;">
              <h1 style="color: white;">🐾 Time to Feed ${pet.name}!</h1>
            </div>
            <div style="padding: 20px;">
              <p>Hello Pet Parent,</p>
              <p>It's time to feed <strong>${pet.name}</strong>!</p>
              <div style="background: #f5f0e8; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p><strong>🍽️ Meal:</strong> ${schedule.meal_type}</p>
                <p><strong>⏰ Time:</strong> ${schedule.meal_time}</p>
                <p><strong>📦 Portion:</strong> ${schedule.portion_size} ${schedule.portion_unit || 'grams'}</p>
              </div>
              <p style="text-align: center;">
                <a href="${confirmUrl}" style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">✅ Confirm Feeding</a>
              </p>
              <p style="font-size: 12px; color: #666; text-align: center;">
                After confirming, you'll be able to log the brand and actual portion eaten.
              </p>
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: `"Smart Animal System" <${process.env.EMAIL_USER}>`,
          to: profile.email,
          subject: `🐾 Feeding Reminder: Time to feed ${pet.name}`,
          html: emailHtml,
        });

        // Mark as sent
        await supabase
          .from('feeding_schedules')
          .update({ 
            reminder_sent: true,
            last_reminder_sent: new Date().toISOString()
          })
          .eq('id', schedule.id);

        remindersSent++;
        console.log(`✅ Email sent to ${profile.email} for ${pet.name}`);
        
      } catch (emailError) {
        console.error(`❌ Failed to send for schedule ${schedule.id}:`, emailError);
      }
    }

    console.log(`=== COMPLETE: ${remindersSent} emails sent ===`);
    return NextResponse.json({ remindersSent });
    
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ remindersSent: 0, error: String(error) });
  }
}