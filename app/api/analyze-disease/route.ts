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

    const HF_API_KEY = process.env.HUGGING_FACE_API_KEY
    const HF_MODEL = process.env.HF_MODEL

    if (!HF_API_KEY) {
      return NextResponse.json({
        success: false,
        error: "API key not configured"
      }, { status: 500 })
    }

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
      console.error("HF API error:", response.status)
      return NextResponse.json({
        success: false,
        error: `Hugging Face API error: ${response.status}`
      }, { status: response.status })
    }

    const result = await response.json()
    console.log("Raw response:", JSON.stringify(result, null, 2))

    // For Keras model, result is an array of probabilities
    let predictions = result
    
    // If result is nested, flatten it
    if (Array.isArray(result) && result.length > 0 && Array.isArray(result[0])) {
      predictions = result[0]
    }

    if (!Array.isArray(predictions)) {
      return NextResponse.json({
        success: false,
        error: "Unexpected response format from model"
      }, { status: 500 })
    }

    // Get top 3 predictions
    const top3 = predictions
      .map((score: number, idx: number) => ({ score, idx }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)

    // You need the class indices mapping
    // For now, use placeholder names
    // After you upload class_indices.pkl, you can fetch it
    const diseaseNames = [
      "Ear Mites in Cat", "Eye Infection in Cat", "Eye Infection in Dog",
      "Feline Acne", "Feline DermAID", "Fungal Infection in Cat",
      "Fungal Infection in Dog", "Gingivitis", "Hot Spots in Dog",
      "Mange in Dog", "Ringworm in Cat", "Scabies in Cat",
      "Skin Allergy in Cat", "Skin Allergy in Dog", "Tick Infestation",
      "Worm Infection in Cat", "Worm Infection in Dog"
    ]

    const topDisease = diseaseNames[top3[0].idx] || "Unknown"
    const topConfidence = top3[0].score

    return NextResponse.json({
      success: true,
      disease: topDisease,
      confidence: topConfidence,
      visible_signs: `AI analysis detected patterns consistent with ${topDisease.toLowerCase()}. Please consult a veterinarian for confirmation.`,
      all_predictions: top3.map(p => ({
        disease: diseaseNames[p.idx] || "Unknown",
        confidence: p.score
      }))
    })

  } catch (error) {
    console.error("Disease detection API error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}