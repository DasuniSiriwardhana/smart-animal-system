import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Create transporter using your existing email config
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // PawHealthAssociation@gmail.com
    pass: process.env.EMAIL_PASS, // Your app password
  },
});

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();

    // Validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Send email to PawHealthAssociation@gmail.com
    await transporter.sendMail({
      from: `"${name}" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // PawHealthAssociation@gmail.com
      replyTo: email,
      subject: `Contact Form: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #4F46E5; margin-bottom: 20px;">📬 New Contact Form Submission</h2>
          
          <div style="margin-bottom: 20px; padding: 15px; background-color: #f9fafb; border-radius: 8px;">
            <p style="margin: 5px 0;"><strong>👤 Name:</strong> ${escapeHtml(name)}</p>
            <p style="margin: 5px 0;"><strong>📧 Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
            <p style="margin: 5px 0;"><strong>📋 Subject:</strong> ${escapeHtml(subject)}</p>
            <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div style="margin-bottom: 20px; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
            <p style="margin: 0 0 10px 0;"><strong>💬 Message:</strong></p>
            <p style="margin: 0; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(message)}</p>
          </div>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #6b7280; font-size: 12px;">
            <p>This message was sent from your Smart Animal System Contact Form</p>
            <p>Reply directly to: <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
          </div>
        </div>
      `,
      text: `
        New Contact Form Submission
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        
        Name: ${name}
        Email: ${email}
        Subject: ${subject}
        Date: ${new Date().toLocaleString()}
        
        Message:
        ─────────────────────────────────────
        ${message}
        ─────────────────────────────────────
        
        Reply to: ${email}
      `,
    });

    // Optional: Send auto-reply to the user
    await transporter.sendMail({
      from: `"Smart Animal System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Thank you for contacting Smart Animal System!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4F46E5;">Thank You, ${escapeHtml(name)}! 🐾</h2>
          <p>We have received your message and will get back to you within 24-48 hours.</p>
          <hr style="margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">Best regards,<br><strong>Smart Animal System Team</strong></p>
          <p style="color: #9ca3af; font-size: 12px;">PawHealthAssociation@gmail.com</p>
        </div>
      `,
      text: `
        Thank You, ${name}! 🐾
        
        We have received your message and will get back to you within 24-48 hours.
        
        Best regards,
        Smart Animal System Team
        PawHealthAssociation@gmail.com
      `,
    });

    return NextResponse.json({ success: true, message: 'Email sent successfully!' });
    
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to send message. Please try again later.' },
      { status: 500 }
    );
  }
}

// XSS protection helper
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}