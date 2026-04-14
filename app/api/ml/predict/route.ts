import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

const ML_BACKEND_URL = process.env.ML_BACKEND_URL || 'http://localhost:5001';

export async function POST(request: NextRequest) {
  try {
    const { petId } = await request.json();
    
    // Fetch recent logs for the pet
    const { data: logs } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('pet_id', petId)
      .order('log_date', { ascending: false })
      .limit(30);
    
    // Call Python ML backend
    const response = await fetch(`${ML_BACKEND_URL}/predict/full`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logs: logs || [] })
    });
    
    const prediction = await response.json();
    return NextResponse.json(prediction);
    
  } catch (error) {
    console.error('ML Prediction Error:', error);
    return NextResponse.json(
      { error: 'Failed to get prediction' },
      { status: 500 }
    );
  }
}