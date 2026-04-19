import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import nodemailer from 'nodemailer';

export async function GET() {
  try {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 8);  // Returns "07:52:30"
    
    console.log("Checking reminders at:", currentTime);
    
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
        pets!inner (
          id,
          name,
          user_id
        )
      `)
      .eq('is_active', true)
      .eq('reminder_sent', false)
      .eq('confirmed', false)
      .eq('skipped', false)
      .lte('meal_time', currentTime);  // Now compares "07:52:30" with "07:48:25.748127"

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ remindersSent: 0, error: error.message });
    }

    if (!schedules || schedules.length === 0) {
      console.log("No pending schedules found");
      return NextResponse.json({ remindersSent: 0 });
    }

    console.log(`Found ${schedules.length} pending schedules`);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let remindersSent = 0;

    for (const schedule of schedules) {
      const petData = schedule.pets as unknown as { id: string; name: string; user_id: string };
      
      if (!petData || !petData.user_id) {
        console.log("No pet data for schedule:", schedule.id);
        continue;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', petData.user_id)
        .single();

      const userEmail = profile?.email;
      const petName = petData.name;

      if (userEmail) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const confirmUrl = `${baseUrl}/feeding-confirm?scheduleId=${schedule.id}&petName=${encodeURIComponent(petName)}`;
        
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #2f4454, #da7b93); padding: 20px; text-align: center;">
              <h1 style="color: white;">🐾 Time to Feed ${petName}!</h1>
            </div>
            <div style="padding: 20px;">
              <p>Hello Pet Parent,</p>
              <p>It's time to feed <strong>${petName}</strong>!</p>
              <div style="background: #f5f0e8; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p><strong>🍽️ Meal:</strong> ${schedule.meal_type}</p>
                <p><strong>⏰ Time:</strong> ${schedule.meal_time}</p>
                <p><strong>📦 Portion:</strong> ${schedule.portion_size} ${schedule.portion_unit || 'grams'}</p>
                <p><strong>🥫 Food Type:</strong> ${schedule.food_type}</p>
              </div>
              <p style="text-align: center;">
                <a href="${confirmUrl}" style="background: linear-gradient(135deg, #2f4454, #da7b93); color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">✅ Confirm Feeding</a>
              </p>
              <p style="font-size: 12px; color: #666; text-align: center; margin-top: 15px;">
                After confirming, you'll be able to log the brand, product, and actual portion eaten.
              </p>
              <p style="font-size: 10px; color: #999; text-align: center;">
                If the button doesn't work, copy this link: ${confirmUrl}
              </p>
            </div>
            <div style="background: #f5f0e8; padding: 10px; text-align: center; font-size: 10px; color: #999;">
              <p>Smart Animal System - PawHealth Association</p>
            </div>
          </div>
        `;

        try {
          await transporter.sendMail({
            from: `"Smart Animal System" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: ` Feeding Reminder: Time to feed ${petName}`,
            html: emailHtml,
          });

          await supabase
            .from('feeding_schedules')
            .update({ 
              reminder_sent: true,
              last_reminder_sent: new Date().toISOString()
            })
            .eq('id', schedule.id);

          remindersSent++;
          console.log(` Sent reminder to ${userEmail} for ${petName}`);
        } catch (emailError) {
          console.error(` Failed to send email to ${userEmail}:`, emailError);
        }
      } else {
        console.log(`No email found for user ${petData.user_id}`);
      }
    }

    return NextResponse.json({ remindersSent });
  } catch (error) {
    console.error('Error in check-reminders:', error);
    return NextResponse.json({ remindersSent: 0, error: String(error) });
  }
}