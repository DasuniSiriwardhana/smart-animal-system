import { NextResponse } from 'next/server';

export async function GET() {
  console.log(" CRON TEST CALLED at", new Date().toISOString());
  return NextResponse.json({ 
    success: true, 
    time: new Date().toISOString(),
    message: "Cron is working!"
  });
}