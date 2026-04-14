import nodemailer from 'nodemailer';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email, scheduleId, petName, mealType, time } = await req.json();

    console.log("Sending email to:", email);
    console.log("Schedule ID:", scheduleId);
    console.log("Pet Name:", petName);

    if (!email || !scheduleId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("Email credentials missing!");
      return NextResponse.json({ error: 'Email not configured' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify connection
    await transporter.verify();

    const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/pets/feeding/confirm?scheduleId=${scheduleId}`;

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"Smart Animal System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🐾 Feeding Reminder for ${petName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #2f4454, #da7b93); padding: 20px; text-align: center;">
            <h1 style="color: white;">🐾 Time to Feed ${petName}!</h1>
          </div>
          <div style="padding: 20px;">
            <p>Hello Pet Parent,</p>
            <p>It's time to feed <strong>${petName}</strong>!</p>
            <div style="background: #f5f0e8; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p><strong>🍽️ Meal:</strong> ${mealType || 'Regular meal'}</p>
              <p><strong>⏰ Time:</strong> ${time || 'Now'}</p>
            </div>
            <p style="text-align: center;">
              <a href="${confirmUrl}" style="background: linear-gradient(135deg, #2f4454, #da7b93); color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;"> Confirm Feeding</a>
            </p>
            <p style="font-size: 12px; color: #666; text-align: center;">
              If the button doesn't work, copy this link: ${confirmUrl}
            </p>
          </div>
        </div>
      `,
    });

    console.log('Email sent successfully:', info.messageId);
    return NextResponse.json({ success: true, messageId: info.messageId });
    
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Failed to send reminder' }, { status: 500 });
  }
}