import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import nodemailer from 'nodemailer';

// Define proper types
type ScheduleWithPet = {
  id: string;
  meal_time: string;
  meal_type: string;
  portion_size: number;
  portion_unit: string;
  food_type: string;
  reminder_sent: boolean;
  pet_id: string;
};

type PetInfo = {
  name: string;
  user_id: string;
};

type ProfileInfo = {
  email: string;
};

export async function GET() {
  try {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 8); // HH:MM:SS
    
    console.log("=== CRON CHECK ===");
    console.log("Current time:", currentTime);
    
    // Get schedules that need reminders
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
        pet_id
      `)
      .eq('is_active', true)
      .eq('reminder_sent', false)
      .eq('confirmed', false)
      .eq('skipped', false)
      .lte('meal_time', currentTime);

    if (error) {
      console.error("DB Error:", error);
      return NextResponse.json({ remindersSent: 0, error: error.message });
    }

    if (!schedules || schedules.length === 0) {
      console.log("No pending schedules found");
      return NextResponse.json({ remindersSent: 0, message: "No pending schedules" });
    }

    console.log(`Found ${schedules.length} pending schedules`);

    // Email config
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let remindersSent = 0;

    for (const schedule of schedules as ScheduleWithPet[]) {
      console.log(`Processing schedule: ${schedule.id}`);
      
      // Get pet info
      const { data: pet, error: petError } = await supabase
        .from('pets')
        .select('name, user_id')
        .eq('id', schedule.pet_id)
        .single();
      
      if (petError || !pet) {
        console.log(`Pet not found for schedule ${schedule.id}`);
        continue;
      }
      
      const petData = pet as PetInfo;
      
      // Get user email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', petData.user_id)
        .single();
      
      if (profileError || !profile?.email) {
        console.log(`No email for user ${petData.user_id}`);
        continue;
      }
      
      const profileData = profile as ProfileInfo;
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const confirmUrl = `${baseUrl}/feeding-confirm?scheduleId=${schedule.id}&petName=${encodeURIComponent(petData.name)}`;
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #2f4454, #da7b93); padding: 20px; text-align: center;">
            <h1 style="color: white;">🐾 Time to Feed ${petData.name}!</h1>
          </div>
          <div style="padding: 20px;">
            <p>Hello Pet Parent,</p>
            <p>It's time to feed <strong>${petData.name}</strong>!</p>
            <div style="background: #f5f0e8; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p><strong>🍽️ Meal:</strong> ${schedule.meal_type}</p>
              <p><strong>⏰ Time:</strong> ${schedule.meal_time}</p>
              <p><strong>📦 Portion:</strong> ${schedule.portion_size} ${schedule.portion_unit || 'grams'}</p>
            </div>
            <p style="text-align: center;">
              <a href="${confirmUrl}" style="background: linear-gradient(135deg, #2f4454, #da7b93); color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">✅ Confirm Feeding</a>
            </p>
          </div>
        </div>
      `;

      try {
        await transporter.sendMail({
          from: `"Smart Animal System" <${process.env.EMAIL_USER}>`,
          to: profileData.email,
          subject: `🐾 Feeding Reminder: Time to feed ${petData.name}`,
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
        console.log(`✅ Email sent to ${profileData.email} for ${petData.name}`);
        
      } catch (emailError) {
        console.error(`❌ Failed to send to ${profileData.email}:`, emailError);
      }
    }

    console.log(`=== COMPLETE: ${remindersSent} emails sent ===`);
    return NextResponse.json({ remindersSent });
    
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ remindersSent: 0, error: String(error) });
  }
}