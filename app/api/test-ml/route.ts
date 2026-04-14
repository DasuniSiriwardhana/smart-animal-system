// app/api/test-ml/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const ML_API_URL = process.env.NEXT_PUBLIC_ML_API_URL;
  
  try {
    const response = await fetch(`${ML_API_URL}/health`);
    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: String(error),
      ml_api_url: ML_API_URL 
    }, { status: 500 });
  }
}