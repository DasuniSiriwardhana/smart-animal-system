import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import nodemailer from 'nodemailer';

export async function GET() {
  try {
    console.log("=== CRON JOB STARTED ===");
    
    // Get ALL active, unconfirmed, unsent schedules - NO TIME FILTER
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

    if (!schedules || schedules.length === 0) {
      return NextResponse.json({ remindersSent: 0, message: "No active schedules" });
    }

    console.log(`Found ${schedules.length} active schedules`);

    // Setup email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let remindersSent = 0;

    // Send emails for ALL active schedules (no time check!)
    for (const schedule of schedules) {
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

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pawhealth-xi.vercel.app';
        const confirmUrl = `${baseUrl}/feeding-confirm?scheduleId=${schedule.id}&petName=${encodeURIComponent(pet.name)}`;

        await transporter.sendMail({
          from: `"Smart Animal System" <${process.env.EMAIL_USER}>`,
          to: profile.email,
          subject: `🐾 Feeding Reminder: Time to feed ${pet.name}`,
          html: `
            <h2>Time to feed ${pet.name}! 🐾</h2>
            <p><strong>Meal:</strong> ${schedule.meal_type}</p>
            <p><strong>Scheduled Time:</strong> ${schedule.meal_time}</p>
            <p><strong>Portion:</strong> ${schedule.portion_size} ${schedule.portion_unit || 'grams'}</p>
            <a href="${confirmUrl}" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">✅ Confirm Feeding</a>
          `,
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
        console.error(`❌ Failed to send:`, emailError);
      }
    }

    console.log(`=== COMPLETE: ${remindersSent} emails sent ===`);
    return NextResponse.json({ remindersSent });
    
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ remindersSent: 0, error: String(error) });
  }
}