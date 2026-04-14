// app/api/cron/send-reminders/route.ts
import { NextResponse } from 'next/server';

// This will be called by a cron job every minute
export async function GET() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/feeding/check-reminders`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send reminders' }, { status: 500 });
  }
}