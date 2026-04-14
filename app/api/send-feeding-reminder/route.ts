// app/api/send-feeding-reminder/route.ts
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { toEmail, petName, mealType, mealTime, portionSize, foodType } = await request.json();

    // Create transporter using your email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const emailContent = `
🐾 Feeding Reminder for ${petName} 🐾

Time to feed your pet!

Meal Details:
• Meal Type: ${mealType}
• Time: ${mealTime}
• Portion: ${portionSize} grams
• Food Type: ${foodType}

Don't forget to log the feeding after completion!

Best regards,
Smart Animal System Team
`;

    await transporter.sendMail({
      from: `"Smart Animal System" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `🐾 Feeding Reminder: Time to feed ${petName}`,
      text: emailContent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email error:', error);
    return NextResponse.json({ error: 'Failed to send reminder' }, { status: 500 });
  }
}