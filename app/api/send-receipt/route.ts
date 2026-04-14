import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { email, plan, amount, interval, date } = await request.json();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const receiptContent = `
PAWHEALTH RECEIPT

Thank you for your purchase!

Plan: ${plan.toUpperCase()} (${interval}ly)
Amount: LKR ${amount}
Date: ${new Date(date).toLocaleDateString()}
Status: Paid

Next billing date: ${interval === 'month' 
  ? new Date(new Date(date).setMonth(new Date(date).getMonth() + 1)).toLocaleDateString()
  : new Date(new Date(date).setFullYear(new Date(date).getFullYear() + 1)).toLocaleDateString()}

Thank you for choosing PawHealth!
    `;

    await transporter.sendMail({
      from: `"PawHealth" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Receipt for your ${plan} plan purchase`,
      text: receiptContent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email error:', error);
    return NextResponse.json({ error: 'Failed to send receipt' }, { status: 500 });
  }
}