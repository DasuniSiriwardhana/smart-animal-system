import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { userId, email } = await request.json();

    if (!userId || !email) {
      return NextResponse.json({ error: "Missing userId or email" }, { status: 400 });
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Store token
    const { error: insertError } = await supabase
      .from('password_reset_requests')
      .insert({
        user_id: userId,
        token: token,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error inserting token:", insertError);
      return NextResponse.json({ error: "Failed to create reset request" }, { status: 500 });
    }

    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/settings/verify-password?token=${token}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #2f4454, #da7b93); padding: 20px; text-align: center;">
          <h1 style="color: white;">🔐 Password Change Request</h1>
        </div>
        <div style="padding: 20px;">
          <p>Hello,</p>
          <p>We received a request to change your password.</p>
          <p>Click the button below to set a new password:</p>
          <p style="text-align: center;">
            <a href="${resetLink}" style="background: linear-gradient(135deg, #2f4454, #da7b93); color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Change Password</a>
          </p>
          <p>This link expires in 1 hour.</p>
          <hr />
          <p style="font-size: 12px; color: #666;">If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    `;

    const result = await sendEmail(email, "🔐 Password Change Request", emailHtml);

    if (!result.success) {
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Verification email sent" });
    
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to send verification email" }, { status: 500 });
  }
}