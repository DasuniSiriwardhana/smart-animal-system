import { NextRequest, NextResponse } from 'next/server';

const ML_BACKEND_URL = process.env.ML_BACKEND_URL || 'http://localhost:5001';

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();
    
    const response = await fetch(`${ML_BACKEND_URL}/analyze/image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image })
    });
    
    const analysis = await response.json();
    return NextResponse.json(analysis);
    
  } catch (error) {
    console.error('Image Analysis Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze image', posture: 'unknown', confidence: 0 },
      { status: 500 }
    );
  }
}