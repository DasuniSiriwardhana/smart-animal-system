import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import nodemailer from 'nodemailer';

export async function GET() {
  try {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    
    console.log("Checking reminders at:", currentTime);
    
    const { data: schedules, error } = await supabase
      .from('feeding_schedules')
      .select(`
        id,
        meal_time,
        meal_type,
        portion_size,
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
      .lte('meal_time', currentTime);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ remindersSent: 0, error: error.message });
    }

    if (!schedules || schedules.length === 0) {
      return NextResponse.json({ remindersSent: 0 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let remindersSent = 0;

    for (const schedule of schedules) {
      // Fix: pets is an array, access first element
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
        const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/confirm-feeding?scheduleId=${schedule.id}`;
        
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #2f4454, #da7b93); padding: 20px; text-align: center;">
              <h1 style="color: white;">Time to Feed ${petName}!</h1>
            </div>
            <div style="padding: 20px;">
              <p>Hello Pet Parent,</p>
              <p>It's time to feed <strong>${petName}</strong>!</p>
              <div style="background: #f5f0e8; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p><strong>Meal:</strong> ${schedule.meal_type}</p>
                <p><strong>Time:</strong> ${schedule.meal_time}</p>
                <p><strong>Portion:</strong> ${schedule.portion_size} grams</p>
                <p><strong>Food Type:</strong> ${schedule.food_type}</p>
              </div>
              <p style="text-align: center;">
                <a href="${confirmUrl}" style="background: linear-gradient(135deg, #2f4454, #da7b93); color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Confirm Feeding</a>
              </p>
            </div>
          </div>
        `;

        try {
          await transporter.sendMail({
            from: `"Smart Animal System" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: `Feeding Reminder: Time to feed ${petName}`,
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
          console.log(`Sent reminder to ${userEmail} for ${petName}`);
        } catch (emailError) {
          console.error(`Failed to send email to ${userEmail}:`, emailError);
        }
      }
    }

    return NextResponse.json({ remindersSent });
  } catch (error) {
    console.error('Error in check-reminders:', error);
    return NextResponse.json({ remindersSent: 0, error: String(error) });
  }
}