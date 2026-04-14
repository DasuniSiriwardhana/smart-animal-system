import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
};

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: to,
      subject: subject,
      html: html,
    });
    console.log("Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: String(error) };
  }
}