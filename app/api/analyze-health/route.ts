// app/api/analyze-health/route.ts
import { NextResponse } from "next/server";

const COLAB_API_URL = "https://scribbly-dimorphous-chloe.ngrok-free.dev";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const petId = formData.get("petId") as string;
    const petName = formData.get("petName") as string;
    const imageFile = formData.get("image") as File | null;

    // If image is provided, send to Colab for disease detection
    if (imageFile) {
      const colabFormData = new FormData();
      colabFormData.append("file", imageFile);
      colabFormData.append("pet_id", petId);
      colabFormData.append("pet_name", petName);

      const response = await fetch(`${COLAB_API_URL}/analyze/disease`, {
        method: "POST",
        body: colabFormData,
      });

      const result = await response.json();

      if (result.success) {
        const recommendations = generateRecommendations(result.disease);
        const confidencePercent = Math.round(result.confidence * 100);
        
        return NextResponse.json({
          success: true,
          analysis: {
            detected_disease: result.disease,
            confidence: confidencePercent,
            healthScore: calculateHealthScore(result.confidence),
            status: result.confidence > 0.7 ? "Needs Attention" : "Monitor Closely",
            recommendations: recommendations,
            anomalies: [result.disease],
            timestamp: new Date().toISOString()
          }
        });
      } else {
        return NextResponse.json({
          success: false,
          error: result.error || "Disease detection failed"
        }, { status: 500 });
      }
    }

    // If no image, return health score only
    return NextResponse.json({
      success: true,
      analysis: {
        healthScore: 85,
        status: "Good",
        recommendations: ["Schedule regular checkup", "Maintain current routine"],
        anomalies: [],
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Health analysis error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to analyze health" },
      { status: 500 }
    );
  }
}

function generateRecommendations(disease: string): string[] {
  const recommendations: Record<string, string[]> = {
    "Ear Mites in Cat": [
      "Visit vet for prescription ear drops",
      "Clean ears weekly with vet-approved solution",
      "Isolate from other pets to prevent spread"
    ],
    "Eye Infection in Cat": [
      "Schedule vet appointment for antibiotic drops",
      "Gently wipe discharge with warm cloth",
      "Monitor for worsening symptoms"
    ],
    "Eye Infection in Dog": [
      "Vet visit for proper diagnosis",
      "Apply prescribed eye drops as directed",
      "Prevent scratching with cone if needed"
    ],
    "Fungal Infection in Cat": [
      "Antifungal medication from vet",
      "Keep environment clean and dry",
      "Complete full treatment course"
    ],
    "Fungal Infection in Dog": [
      "Vet-prescribed antifungal treatment",
      "Bathe with medicated shampoo",
      "Disinfect bedding and toys"
    ],
    "Kennel Cough in Dog": [
      "Rest and isolation from other dogs",
      "Use humidifier to soothe throat",
      "Complete prescribed antibiotics"
    ],
    "Skin Allergy in Cat": [
      "Identify and remove allergens",
      "Vet may prescribe antihistamines",
      "Consider hypoallergenic diet"
    ],
    "Skin Allergy in Dog": [
      "Vet allergy testing recommended",
      "Regular bathing with medicated shampoo",
      "Omega-3 supplements may help"
    ]
  };

  for (const [key, value] of Object.entries(recommendations)) {
    if (disease.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  
  return [
    "Schedule veterinary appointment for proper diagnosis",
    "Follow prescribed treatment plan exactly",
    "Monitor symptoms and report changes to vet"
  ];
}

function calculateHealthScore(confidence: number): number {
  if (confidence > 0.85) return 45;
  if (confidence > 0.7) return 55;
  if (confidence > 0.5) return 65;
  return 75;
}