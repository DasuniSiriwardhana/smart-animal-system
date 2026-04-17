import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { email, resetLink, name } = await request.json();

    console.log("Sending reset email to:", email);
    console.log("Reset link:", resetLink);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // HTML email format with clickable button
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #2F4454;">🐾 Password Reset Request</h2>
        <p>Hello ${name || 'Pet Parent'},</p>
        <p>You requested to reset your password for your <strong>Smart Animal System</strong> account.</p>
        <p>Click the button below to reset your password (this link expires in 1 hour):</p>
        <p style="text-align: center;">
          <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #2F4454, #DA7B93); color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0;">
            Reset Password
          </a>
        </p>
        <p>Or copy this link into your browser:</p>
        <p style="background: #f5f0e8; padding: 10px; border-radius: 5px; word-break: break-all;">${resetLink}</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr />
        <p style="font-size: 12px; color: #666;">Smart Animal System - Pet Health Monitoring Platform</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Smart Animal System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reset Your Password - Smart Animal System",
      html: emailHtml,
      text: `Reset your password using this link: ${resetLink}`,
    });

    console.log("Reset email sent successfully to:", email);
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Email error:', error);
    return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 });
  }
}