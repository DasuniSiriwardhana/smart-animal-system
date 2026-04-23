// app/api/groq/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt, type } = await request.json();
    
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    
    if (!GROQ_API_KEY) {
      console.error("GROQ_API_KEY not set");
      return NextResponse.json({ success: false, error: "GROQ_API_KEY not configured" });
    }

    let systemPrompt = "";
    if (type === 'health-report') {
      systemPrompt = "You are a veterinary AI assistant. Generate professional health reports with medical accuracy. Always recommend consulting a veterinarian.";
    } else if (type === 'disease-analysis') {
      systemPrompt = "You are a veterinary AI assistant. Provide accurate pet health information about diseases and conditions.";
    } else if (type === 'business-analysis') {
      systemPrompt = "You are a business analyst for a pet health platform. Provide actionable insights and recommendations based on the data. Be concise and professional.";
    } else {
      systemPrompt = "You are a helpful veterinary assistant. Provide accurate pet health information.";
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    return NextResponse.json({ success: true, content });
  } catch (error) {
    console.error("Groq API error:", error);
    return NextResponse.json({ success: false, error: "Failed to generate response" });
  }
}