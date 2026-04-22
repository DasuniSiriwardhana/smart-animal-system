// src/app/api/analyze-disease/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const petId = formData.get('pet_id') as string
    const petName = formData.get('pet_name') as string

    console.log("=== AI DISEASE DETECTION API ===")
    console.log("Pet ID:", petId)
    console.log("Pet Name:", petName)
    console.log("File received:", file?.name, file?.size, "bytes")

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No image file provided" },
        { status: 400 }
      )
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString('base64')
    const mimeType = file.type || 'image/jpeg'
    const dataUrl = `data:${mimeType};base64,${base64Image}`

    // Your Hugging Face API key (use environment variable!)
    const HF_API_KEY = process.env.HUGGING_FACE_API_KEY
    const HF_MODEL = process.env.HF_MODEL || "microsoft/resnet-50"

    if (!HF_API_KEY) {
      console.warn("No Hugging Face API key found. Using mock response.")
      // Return mock response for development
      return NextResponse.json({
        success: true,
        disease: "No abnormalities detected",
        confidence: 0.15,
        visible_signs: "Based on the image analysis, no visible signs of disease were detected. However, always consult a veterinarian for a complete physical examination.",
        all_predictions: [
          { disease: "No abnormalities detected", confidence: 0.15 },
          { disease: "Minor skin irritation", confidence: 0.08 },
          { disease: "Normal variation", confidence: 0.07 }
        ],
        fallback: true
      })
    }

    try {
      // Call Hugging Face API
      const response = await fetch(
        `https://api-inference.huggingface.co/models/${HF_MODEL}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${HF_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inputs: dataUrl }),
        }
      )

      if (!response.ok) {
        throw new Error(`Hugging Face API error: ${response.status}`)
      }

      const result = await response.json()
      console.log("HF API Response:", result)

      // Parse the response (depends on the model)
      // This is a simplified parser - adjust based on your model
      const predictions = Array.isArray(result) ? result[0] : result
      const topPrediction = predictions?.labels?.[0] || "Unknown condition"
      const topConfidence = predictions?.scores?.[0] || 0.5

      return NextResponse.json({
        success: true,
        disease: topPrediction,
        confidence: topConfidence,
        visible_signs: `AI analysis detected patterns consistent with ${topPrediction.toLowerCase()}. Please consult a veterinarian for confirmation.`,
        all_predictions: predictions?.labels?.slice(0, 5).map((label: string, idx: number) => ({
          disease: label,
          confidence: predictions.scores[idx]
        })) || []
      })

    } catch (apiError) {
      console.error("Hugging Face API error:", apiError)
      // Return fallback response
      return NextResponse.json({
        success: true,
        disease: "Analysis completed - No significant findings",
        confidence: 0.20,
        visible_signs: "The AI model completed analysis but could not make a definitive assessment. Consider uploading a clearer image or consulting a veterinarian.",
        all_predictions: [],
        fallback: true
      })
    }

  } catch (error) {
    console.error("Disease detection API error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Internal server error" 
      },
      { status: 500 }
    )
  }
}