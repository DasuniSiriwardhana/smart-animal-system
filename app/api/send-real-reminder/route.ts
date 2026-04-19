import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import nodemailer from 'nodemailer';

export async function GET() {
  try {
    // Get a real schedule for the user
    const { data: schedule, error: scheduleError } = await supabase
      .from('feeding_schedules')
      .select(`
        id,
        meal_time,
        meal_type,
        portion_size,
        portion_unit,
        food_type,
        pet_id
      `)
      .eq('is_active', true)
      .eq('reminder_sent', false)
      .limit(1)
      .single();

    let petName = "your pet";
    let userEmail = "siriwardhanadasuni183@gmail.com";
    let mealTime = "08:00";
    let mealType = "dinner";
    let portionSize = 150;
    let portionUnit = "grams";
    let scheduleId = null;

    if (schedule && !scheduleError) {
      // Get pet info
      const { data: pet } = await supabase
        .from('pets')
        .select('name, user_id')
        .eq('id', schedule.pet_id)
        .single();
      
      if (pet) {
        petName = pet.name;
        
        // Get user email
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', pet.user_id)
          .single();
        
        if (profile?.email) {
          userEmail = profile.email;
        }
      }
      
      mealTime = schedule.meal_time;
      mealType = schedule.meal_type;
      portionSize = schedule.portion_size;
      portionUnit = schedule.portion_unit || 'grams';
      scheduleId = schedule.id;
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app';
    const confirmUrl = scheduleId ? `${baseUrl}/feeding-confirm?scheduleId=${scheduleId}&petName=${encodeURIComponent(petName)}` : '#';

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

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
            <p style="font-size: 18px; margin-bottom: 5px;">Dear Pet Parent,</p>
            <p>It's time to feed <strong style="color: #da7b93;">${petName}</strong>.</p>
            
            <div class="meal-card">
              <p><span class="meal-label">🍽️ Meal:</span> ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}</p>
              <p><span class="meal-label">⏰ Time:</span> ${mealTime}</p>
              <p><span class="meal-label">📦 Portion:</span> ${portionSize} ${portionUnit}</p>
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

    const result = await transporter.sendMail({
      from: `"PawHealth System" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `🦴 Feeding Reminder: Time to feed ${petName}`,
      html: emailHtml,
    });

    return NextResponse.json({ 
      success: true, 
      messageId: result.messageId,
      sentTo: userEmail,
      pet: petName
    });
    
  } catch (error) {
    console.error("Email error:", error);
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    });
  }
}