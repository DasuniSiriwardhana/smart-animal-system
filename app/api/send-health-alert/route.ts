// app/api/send-health-alert/route.ts
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { petName, ownerEmail, healthScore, trend, risks, recommendations } = await request.json();

    // Use your existing email credentials from .env.local
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,  // pawhealthassociation@gmail.com
        pass: process.env.EMAIL_PASS,   // PawHealth@#$%1234
      },
    });

    const emailContent = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🚨 PET HEALTH ALERT - ACTION REQUIRED 🚨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Pet Name: ${petName}
Health Score: ${healthScore}/100
Trend: ${trend}
Alert Time: ${new Date().toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ DETECTED RISKS:
${risks || 'Multiple health anomalies detected'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 RECOMMENDATIONS:
${recommendations || 'Please check the app for detailed health analysis'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ ACTION STEPS:
${healthScore < 30 ? '• IMMEDIATE: Take pet to emergency vet' : 
  healthScore < 50 ? '• Schedule vet visit within 24 hours' : 
  '• Monitor pet closely for next 48 hours'}

• Check the Smart Animal System app for real-time updates
• Review sensor data and activity logs
• Contact your veterinarian if symptoms persist

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is an automated alert from Smart Animal System.
`;

    // Send to pet owner
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"Smart Animal System" <${process.env.EMAIL_USER}>`,
      to: ownerEmail,
      subject: `🚨 HEALTH ALERT: ${petName} needs attention (Score: ${healthScore}/100)`,
      text: emailContent,
    });

    // Also send to admin (you can add your admin email)
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"Smart Animal System" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Sends to pawhealthassociation@gmail.com
      subject: `🚨 ALERT: ${petName} - Health Score ${healthScore}/100`,
      text: emailContent,
    });

    return NextResponse.json({ success: true, message: 'Alert sent successfully' });
    
  } catch (error) {
    console.error('Email error:', error);
    return NextResponse.json({ error: 'Failed to send alert' }, { status: 500 });
  }
}