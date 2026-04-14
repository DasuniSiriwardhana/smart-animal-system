import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function GET() {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Smart Animal System" <${process.env.EMAIL_USER}>`,
      to: "smmdasuni@gmail.com", // Test email
      subject: "Test Email from Smart Animal System",
      text: "If you receive this, email is working!",
    });

    return NextResponse.json({ success: true, message: "Test email sent!" });
  } catch (error) {
    console.error("Email error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}