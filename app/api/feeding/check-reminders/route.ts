import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import nodemailer from 'nodemailer';

export async function GET() {
  try {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    
    console.log("Checking reminders at:", currentTime);
    
    // Get all feeding schedules that need reminders
    const { data: schedules, error } = await supabase
      .from('feeding_schedules')
      .select(`
        *,
        pets!inner (
          id,
          name,
          user_id
        )
      `)
      .eq('is_active', true)
      .eq('reminder_sent', false)
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
      // Get user email from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', schedule.pets?.user_id)
        .single();

      const userEmail = profile?.email;
      const petName = schedule.pets?.name;

      if (userEmail) {
        const emailContent = `
🐾 Feeding Reminder for ${petName} 🐾

Time to feed your pet!

Meal Details:
• Meal Type: ${schedule.meal_type}
• Time: ${schedule.meal_time}
• Portion: ${schedule.portion_size} grams
• Food Type: ${schedule.food_type}

Don't forget to log the feeding after completion!

Best regards,
Smart Animal System Team
`;

        try {
          await transporter.sendMail({
            from: `"Smart Animal System" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: `🐾 Feeding Reminder: Time to feed ${petName}`,
            text: emailContent,
          });

          // Mark reminder as sent
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