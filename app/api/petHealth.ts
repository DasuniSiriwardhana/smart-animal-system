// app/api/petHealth.ts
import { NextRequest, NextResponse } from 'next/server';

const ML_API_URL = process.env.NEXT_PUBLIC_ML_API_URL || 'https://scribbly-dimorphous-chloe.ngrok-free.dev';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');
  const petId = searchParams.get('petId');

  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
  }

  try {
    let url = '';
    if (endpoint === 'schedules' && petId) {
      url = `${ML_API_URL}/api/feeding/schedules/${petId}`;
    } else if (endpoint === 'today' && petId) {
      url = `${ML_API_URL}/api/feeding/today/${petId}`;
    } else {
      return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
    }

    const response = await fetch(url);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    const body = await request.json();

    let url = '';
    let options: RequestInit = {};

    if (action === 'confirm') {
      url = `${ML_API_URL}/api/feeding/confirm-enhanced`;
      options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      };
    } else if (action === 'skip') {
      url = `${ML_API_URL}/api/feeding/skip/${body.scheduleId}`;
      options = { method: 'POST' };
    } else if (action === 'create') {
      url = `${ML_API_URL}/api/feeding/schedule`;
      options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      };
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const response = await fetch(url, options);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}