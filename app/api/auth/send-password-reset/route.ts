import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { email, resetLink, name } = await request.json();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const emailContent = `
Hello ${name || 'Pet Parent'},

You requested to reset your password for your Smart Animal System account.

Click the link below to reset your password (this link expires in 1 hour):

${resetLink}

If you didn't request this, please ignore this email.

Best regards,
Smart Animal System Team
`;

    await transporter.sendMail({
      from: `"Smart Animal System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reset Your Password - Smart Animal System",
      text: emailContent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email error:', error);
    return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 });
  }
}