import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

type ProfileRow = {
  id: string;
  email: string | null;
};

type PetRow = {
  id: string;
  name: string;
  user_id: string;
  profiles: ProfileRow | null;
};

type ScheduleRow = {
  id: string;
  meal_time: string;
  meal_type: string;
  portion_size: number | null;
  portion_unit: string | null;
  food_type: string | null;
  pet_id: string;
  pets: PetRow | null;
};

export async function GET(request: NextRequest) {
  try {
    const isTestMode = request.nextUrl.searchParams.get('test') === 'true';

    console.log("=== REMINDER CHECK STARTED ===");
    if (isTestMode) {
      console.log("⚠️  TEST MODE — skipping time window, sending all pending schedules NOW");
    }

    const now = new Date();
    const SL_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
    const slTime = new Date(now.getTime() + SL_OFFSET_MS);
    const currentHour = slTime.getUTCHours();
    const currentMinute = slTime.getUTCMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;

    console.log(`SL time: ${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`);
    console.log(`EMAIL_USER set: ${!!process.env.EMAIL_USER} | EMAIL_PASS set: ${!!process.env.EMAIL_PASS}`);

    // Daily reset
    const todayMidnightUTC = new Date();
    todayMidnightUTC.setUTCHours(0, 0, 0, 0);

    const { error: resetError } = await supabase
      .from('feeding_schedules')
      .update({ reminder_sent: false, confirmed: false, skipped: false })
      .eq('is_active', true)
      .eq('reminder_sent', true)
      .lt('last_reminder_sent', todayMidnightUTC.toISOString());

    if (resetError) console.warn("Reset warning (non-fatal):", resetError.message);

    const { data, error: fetchError } = await supabase
      .from('feeding_schedules')
      .select(`
        id,
        meal_time,
        meal_type,
        portion_size,
        portion_unit,
        food_type,
        pet_id,
        pets (
          id,
          name,
          user_id,
          profiles (
            id,
            email
          )
        )
      `)
      .eq('is_active', true)
      .eq('reminder_sent', false)
      .eq('confirmed', false)
      .eq('skipped', false);

    if (fetchError) {
      console.error("Fetch error:", fetchError.message);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const schedules = (data ?? []) as unknown as ScheduleRow[];
    console.log(`Found ${schedules.length} pending schedules`);

    if (schedules.length === 0) {
      return NextResponse.json({ message: "No pending schedules", remindersSent: 0 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let remindersSent = 0;
    const skippedReasons: string[] = [];

    for (const schedule of schedules) {
      const pet = schedule.pets;
      const profile = pet?.profiles;

      if (!pet) {
        const reason = `SKIP ${schedule.id}: pet not found`;
        console.log(`  ⚠️ ${reason}`);
        skippedReasons.push(reason);
        continue;
      }
      if (!profile) {
        const reason = `SKIP ${schedule.id}: profile not found (user_id=${pet.user_id})`;
        console.log(`  ⚠️ ${reason}`);
        skippedReasons.push(reason);
        continue;
      }
      if (!profile.email) {
        const reason = `SKIP ${schedule.id}: email null (user_id=${pet.user_id})`;
        console.log(`  ⚠️ ${reason}`);
        skippedReasons.push(reason);
        continue;
      }

      let timeStr = schedule.meal_time ?? '';
      if (timeStr.includes('.')) timeStr = timeStr.split('.')[0];
      const parts = timeStr.split(':').map(Number);
      const mealHour = parts[0] ?? 0;
      const mealMinute = parts[1] ?? 0;
      const mealTimeMinutes = mealHour * 60 + mealMinute;

      let minutesUntil = mealTimeMinutes - currentTimeMinutes;
      if (minutesUntil < -120) minutesUntil += 24 * 60;

      console.log(
        `  ${pet.name} → ${String(mealHour).padStart(2, '0')}:${String(mealMinute).padStart(2, '0')}` +
        ` (${minutesUntil > 0 ? '+' : ''}${minutesUntil} min) → ${profile.email}`
      );

      const inWindow = minutesUntil >= -5 && minutesUntil <= 30;
      if (!isTestMode && !inWindow) {
        console.log(`  ⏰ Outside window (${minutesUntil > 0 ? '+' : ''}${minutesUntil} min, need -5 to +30)`);
        continue;
      }

      console.log(`  ✅ ${isTestMode ? '[TEST] ' : ''}Sending to ${profile.email}...`);

      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const confirmUrl = `${baseUrl}/feeding-confirm?scheduleId=${schedule.id}&petName=${encodeURIComponent(pet.name)}`;

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Feeding Reminder</title>
            <style>
              body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f0e8; }
              .container { max-width: 550px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #2f4454 0%, #da7b93 100%); padding: 30px 20px; text-align: center; }
              .header h1 { color: white; margin: 0; font-size: 28px; letter-spacing: 1px; }
              .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0; }
              .content { padding: 30px; }
              .meal-card { background: #f8f6f2; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #da7b93; }
              .meal-card p { margin: 8px 0; color: #2e151b; }
              .meal-label { font-weight: 600; color: #2f4454; width: 100px; display: inline-block; }
              .button { background: linear-gradient(135deg, #2f4454 0%, #da7b93 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 30px; display: inline-block; font-weight: 600; margin-top: 15px; }
              .footer { background: #f5f0e8; padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #e0d6cc; }
              .pet-icon { font-size: 48px; text-align: center; margin-bottom: 10px; }
              .test-badge { background: #fff3cd; border: 1px solid #ffc107; padding: 10px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="pet-icon">🐾</div>
                <h1>Feeding Reminder</h1>
                <p>Smart Animal System</p>
              </div>
              
              <div class="content">
                ${isTestMode ? `
                  <div class="test-badge">
                    ⚠️ <strong>This is a TEST email</strong> — sent manually to verify the system works.
                  </div>
                ` : ''}
                
                <p style="font-size: 18px; margin-bottom: 5px;">Dear Pet Parent,</p>
                <p>It's time to feed <strong style="color: #da7b93;">${pet.name}</strong>.</p>
                
                <div class="meal-card">
                  <p><span class="meal-label">🍽️ Meal:</span> ${schedule.meal_type.charAt(0).toUpperCase() + schedule.meal_type.slice(1)}</p>
                  <p><span class="meal-label">⏰ Time:</span> ${schedule.meal_time}</p>
                  <p><span class="meal-label">📦 Portion:</span> ${schedule.portion_size ?? '?'} ${schedule.portion_unit ?? 'grams'}</p>
                  <p><span class="meal-label">🍗 Food Type:</span> ${schedule.food_type ?? 'N/A'}</p>
                </div>
                
                <p>Please log the feeding after completion to maintain accurate health records.</p>
                
                <div style="text-align: center;">
                  <a href="${confirmUrl}" class="button">✓ Confirm Feeding</a>
                </div>
                
                <p style="font-size: 12px; color: #999; margin-top: 25px; text-align: center;">
                  This reminder was scheduled from your PawHealth account.
                </p>
              </div>
              
              <div class="footer">
                <p>PawHealth Association — Smart Animal System</p>
                <p>© ${new Date().getFullYear()} All rights reserved</p>
              </div>
            </div>
          </body>
          </html>
        `;

        await transporter.sendMail({
          from: `"PawHealth System" <${process.env.EMAIL_USER}>`,
          to: profile.email,
          subject: `${isTestMode ? '[TEST] ' : ''}🦴 Feeding Reminder: Time to feed ${pet.name}`,
          html: emailHtml,
        });

        const { error: updateError } = await supabase
          .from('feeding_schedules')
          .update({
            reminder_sent: true,
            last_reminder_sent: new Date().toISOString(),
          })
          .eq('id', schedule.id);

        if (updateError) {
          console.error(`  ⚠️ Failed to mark reminder_sent:`, updateError.message);
        } else {
          remindersSent++;
          console.log(`  ✅ Sent + marked for ${pet.name} → ${profile.email}`);
        }
      } catch (emailErr: unknown) {
        const msg = emailErr instanceof Error ? emailErr.message : String(emailErr);
        console.error(`  ❌ Email failed for ${profile.email}:`, msg);
        skippedReasons.push(`Email failed for ${profile.email}: ${msg}`);
      }
    }

    console.log(`=== DONE: ${remindersSent} reminder(s) sent ===`);
    return NextResponse.json({
      remindersSent,
      totalSchedules: schedules.length,
      currentSLTime: `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`,
      testMode: isTestMode,
      ...(skippedReasons.length > 0 && { skippedReasons }),
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Fatal error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}