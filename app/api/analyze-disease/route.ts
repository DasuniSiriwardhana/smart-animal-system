// app/api/analyze-disease/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const petId = formData.get('pet_id') as string
    const petName = formData.get('pet_name') as string
    const petSpecies = formData.get('pet_species') as string

    console.log("=== AI DISEASE DETECTION ===")
    console.log("Pet:", petName, "Species:", petSpecies)

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No image file provided" },
        { status: 400 }
      )
    }

    const HF_API_KEY = process.env.HUGGING_FACE_API_KEY
    const HF_MODEL = process.env.HF_MODEL || "DasuniSiriwardhana/smart-animal-cnn-model"

    if (!HF_API_KEY) {
      console.error("HUGGING_FACE_API_KEY not set")
      return NextResponse.json(
        { success: false, error: "API key not configured" },
        { status: 500 }
      )
    }

    // Convert image to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString('base64')
    const dataUrl = `data:${file.type || 'image/jpeg'};base64,${base64Image}`

    console.log("Calling Hugging Face API...")

    // Call Hugging Face
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
      console.error("HF API Error:", response.status)
      return NextResponse.json(
        { success: false, error: `Hugging Face API error: ${response.status}` },
        { status: response.status }
      )
    }

    const result = await response.json()
    console.log("HF Response received")

    // Parse predictions
    let predictions = result
    if (Array.isArray(result) && result.length > 0 && Array.isArray(result[0])) {
      predictions = result[0]
    }

    if (!Array.isArray(predictions)) {
      return NextResponse.json(
        { success: false, error: "Unexpected response format" },
        { status: 500 }
      )
    }

    // Disease names in correct order
    const diseaseNames = [
      "Ear Mites in Cat", "Eye Infection in Cat", "Eye Infection in Dog",
      "Feline Acne", "Feline DermAID", "Fungal Infection in Cat",
      "Fungal Infection in Dog", "Gingivitis", "Hot Spots in Dog",
      "Mange in Dog", "Ringworm in Cat", "Scabies in Cat",
      "Skin Allergy in Cat", "Skin Allergy in Dog", "Tick Infestation",
      "Worm Infection in Cat", "Worm Infection in Dog"
    ]

    // Get top prediction
    const topIndex = predictions.indexOf(Math.max(...predictions))
    const topDisease = diseaseNames[topIndex] || "Unknown"
    const topConfidence = predictions[topIndex]

    console.log("Detected:", topDisease, "Confidence:", topConfidence)

    // Get AI-generated recommendations from Gemini
    let aiRecommendations = null
    try {
      const geminiResponse = await fetch('/api/gemini-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disease: topDisease,
          confidence: topConfidence,
          petSpecies: petSpecies,
          petName: petName
        })
      })
      if (geminiResponse.ok) {
        aiRecommendations = await geminiResponse.json()
      }
    } catch (geminiError) {
      console.error("Gemini API error:", geminiError)
    }

    // Return response with AI recommendations if available
    return NextResponse.json({
      success: true,
      disease: topDisease,
      confidence: topConfidence,
      visible_signs: aiRecommendations?.symptoms || getSymptomsForDisease(topDisease),
      causes: aiRecommendations?.causes || getCausesForDisease(topDisease),
      recommendations: aiRecommendations?.recommendations || getRecommendationsForDisease(topDisease, topConfidence),
      prevention: aiRecommendations?.prevention || getPreventionForDisease(topDisease),
      urgency: aiRecommendations?.urgency || getUrgencyLevel(topConfidence),
      vet_recommended: true,
      all_predictions: predictions
        .map((score: number, idx: number) => ({ disease: diseaseNames[idx], confidence: score }))
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5)
    })

  } catch (error) {
    console.error("Disease detection error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

// Fallback helper functions (used only if Gemini fails)
function getSymptomsForDisease(disease: string): string {
  const symptomsMap: Record<string, string> = {
    "Ear Mites in Cat": "Head shaking, ear scratching, dark discharge, ear odor",
    "Eye Infection in Cat": "Redness, discharge, squinting, swelling around eyes",
    "Eye Infection in Dog": "Redness, discharge, squinting, excessive tearing",
    "Fungal Infection": "Circular hair loss, scaly patches, redness, itching",
    "Skin Allergy": "Redness, itching, hives, paw chewing, ear infections",
    "Tick Infestation": "Visible ticks, scratching, hair loss, lethargy",
    "Worm Infection": "Weight loss, bloated belly, visible worms in stool, diarrhea",
    "Hot Spots": "Red, moist, irritated skin lesion, excessive licking",
    "Mange": "Intense itching, hair loss, skin thickening, crusting",
    "Ringworm": "Circular hair loss, scaly patches, broken hairs"
  }
  for (const [key, symptoms] of Object.entries(symptomsMap)) {
    if (disease.includes(key)) return symptoms
  }
  return "Visible symptoms may include changes in behavior or appearance. Consult a veterinarian for accurate diagnosis."
}

function getCausesForDisease(disease: string): string[] {
  const causesMap: Record<string, string[]> = {
    "Ear Mites": ["Contact with infected animals", "Poor hygiene", "Weakened immune system"],
    "Eye Infection": ["Bacterial infection", "Viral infection", "Foreign object", "Allergies"],
    "Fungal Infection": ["Damp environment", "Contact with infected soil", "Weakened immunity"],
    "Skin Allergy": ["Food allergies", "Environmental allergens", "Flea allergy"],
    "Tick Infestation": ["Exposure to wooded areas", "Contact with infested animals"],
    "Worm Infection": ["Ingesting infected feces", "Eating contaminated soil", "Fleas"],
    "Hot Spots": ["Excessive licking/scratching", "Flea bites", "Allergies", "Stress"],
    "Mange": ["Contact with infected animals", "Weakened immune system", "Poor nutrition"],
    "Ringworm": ["Contact with infected animals", "Contaminated bedding", "Damp environment"]
  }
  for (const [key, causes] of Object.entries(causesMap)) {
    if (disease.includes(key)) return causes
  }
  return ["Consult a veterinarian for accurate diagnosis"]
}

function getRecommendationsForDisease(disease: string, confidence: number): string[] {
  const high = confidence > 0.7
  if (high) {
    return [
      "Schedule veterinary appointment within 24-48 hours",
      "Share these AI analysis results with your veterinarian",
      "Monitor for worsening symptoms",
      "Keep the affected area clean and dry"
    ]
  } else if (confidence > 0.4) {
    return [
      "Monitor symptoms closely for 5-7 days",
      "Consult a veterinarian if symptoms worsen",
      "Take another clear photo for comparison"
    ]
  } else {
    return [
      "No immediate action needed - routine monitoring recommended",
      "Consider retaking photo with better lighting",
      "Continue regular wellness checks"
    ]
  }
}

function getPreventionForDisease(disease: string): string[] {
  const preventionMap: Record<string, string[]> = {
    "Ear Mites": ["Regular ear cleaning", "Avoid contact with infected animals", "Routine vet checks"],
    "Eye Infection": ["Keep eyes clean", "Avoid irritants", "Regular vet examinations"],
    "Fungal Infection": ["Keep living areas dry and clean", "Regular grooming", "Avoid contaminated soil"],
    "Skin Allergy": ["Identify and avoid allergens", "Regular bathing", "Quality diet"],
    "Tick Infestation": ["Use tick prevention medication", "Check after walks", "Keep grass short"],
    "Worm Infection": ["Regular deworming", "Clean up feces promptly", "Prevent hunting"],
    "Hot Spots": ["Address underlying allergies", "Regular grooming", "Prevent excessive licking"],
    "Mange": ["Avoid contact with infected animals", "Regular vet checks", "Good nutrition"],
    "Ringworm": ["Disinfect living areas", "Avoid contact with strays", "Regular grooming"]
  }
  for (const [key, prevention] of Object.entries(preventionMap)) {
    if (disease.includes(key)) return prevention
  }
  return ["Maintain good hygiene", "Regular veterinary check-ups", "Balanced nutrition"]
}

function getUrgencyLevel(confidence: number): string {
  if (confidence > 0.85) return "emergency"
  if (confidence > 0.7) return "high"
  if (confidence > 0.5) return "medium"
  return "low"
}