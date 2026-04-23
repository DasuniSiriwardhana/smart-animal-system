// app/api/gemini-recommendations/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { disease, confidence, petSpecies, petName } = await request.json()
    
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY
    
    if (!GEMINI_API_KEY) {
      console.warn("Gemini API key not found")
      return NextResponse.json({ success: false, error: "Gemini API key not configured" })
    }

    const prompt = `
      You are a veterinary AI assistant. Based on the following information, provide a JSON response with NO markdown formatting, just pure JSON.

      Disease: ${disease}
      Pet Species: ${petSpecies}
      Pet Name: ${petName}
      Confidence Level: ${(confidence * 100).toFixed(1)}%

      Respond with this exact JSON structure:
      {
        "causes": ["cause 1", "cause 2", "cause 3"],
        "symptoms": ["symptom 1", "symptom 2", "symptom 3"],
        "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
        "prevention": ["prevention tip 1", "prevention tip 2", "prevention tip 3"],
        "urgency": "low/medium/high/emergency",
        "vet_recommended": true
      }
    `

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 1,
            topP: 1,
            maxOutputTokens: 1024,
          }
        })
      }
    )

    const data = await response.json()
    
    if (!response.ok) {
      console.error("Gemini API error:", data)
      throw new Error(data.error?.message || "Gemini API request failed")
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ""
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const result = JSON.parse(cleanText)
    
    return NextResponse.json({ success: true, ...result })

  } catch (error) {
    console.error("Gemini recommendations error:", error)
    return NextResponse.json({ success: false, error: "Failed to generate recommendations" })
  }
}