"use client"

import { MedicationsList } from "@/components/pets/MedicationsList";
import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/components/auth/auth-provider"
import { 
  ArrowLeft, 
  PawPrint, 
  Heart, 
  Activity, 
  Calendar, 
  FileText,
  Loader2,
  Dog,
  Cat,
  Bird,
  Fish,
  Thermometer,
  Droplet,
  Zap,
  TrendingUp,
  AlertTriangle,
  Download,
  Camera,
  X,
  Scan,
  CheckCircle,
  Shield,
  Clock,
  Eye,
  Utensils,
  XCircle,
  Pencil,
  Trash2,
  Brain
} from "lucide-react"

import { generateHealthReportPDF } from '@/lib/pdf-generator';
import { Printer } from 'lucide-react';

interface HealthReportData {
  pet_name?: string;
  species?: string;
  breed?: string;
  age?: number;
  weight?: number;
  generated_at: string;
  health_score: number;
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
  status?: string;
  trend?: 'improving' | 'stable' | 'declining';
  urgency?: string;
  vital_signs?: {
    heart_rate: number;
    temperature: number;
    activity_level: string;
    recorded_at: string;
  };
  weather?: {
    temperature: number | string;
    humidity: number | string;
    condition: string;
    impact_score?: number;
  };
  issues: string[];
  recommendations: string[];
  next_steps: string[];
}

// FEEDING HISTORY COMPONENT
type FeedingLog = {
  id: string
  feeding_time: string
  meal_type: string
  confirmed: boolean
  skipped: boolean
  food_brand: string | null
  food_type: string | null
  actual_portion: number | null
  portion_unit: string
  notes: string | null
  created_at: string
}

function FeedingHistory({ petId, petName, limit = 5 }: { petId: string; petName: string; limit?: number }) {
  const [feedings, setFeedings] = useState<FeedingLog[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    fetchFeedingHistory()
  }, [petId])

  const fetchFeedingHistory = async () => {
    setLoading(true)
    try {
      const { count } = await supabase
        .from('feeding_logs')
        .select('*', { count: 'exact', head: true })
        .eq('pet_id', petId)

      setTotalCount(count || 0)

      const { data } = await supabase
        .from('feeding_logs')
        .select('*')
        .eq('pet_id', petId)
        .order('feeding_time', { ascending: false })
        .limit(limit)

      if (data) setFeedings(data)
    } catch (error) {
      console.error('Error fetching feeding history:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMealIcon = (type: string) => {
    switch(type?.toLowerCase()) {
      case 'breakfast': return '🍳'
      case 'lunch': return '🥗'
      case 'dinner': return '🍲'
      case 'snack': return '🍎'
      default: return '🍽️'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    } else {
      return date.toLocaleDateString()
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground mt-2">Loading feeding history...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
        <CardTitle className="flex items-center gap-2">
          <Utensils className="h-5 w-5 text-primary" />
          Recent Feedings
        </CardTitle>
        {totalCount > limit && (
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/pets/${petId}/feeding/history`}>
              View All ({totalCount})
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {feedings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Utensils className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No feeding records yet</p>
            <p className="text-sm">Feedings will appear here once logged</p>
          </div>
        ) : (
          <div className="space-y-3">
            {feedings.map((feeding) => (
              <div key={feeding.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{getMealIcon(feeding.meal_type)}</div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium capitalize">{feeding.meal_type || 'Feeding'}</p>
                      {feeding.confirmed ? (
                        <Badge className="bg-green-100 text-green-700 text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Confirmed
                        </Badge>
                      ) : feeding.skipped ? (
                        <Badge className="bg-red-100 text-red-700 text-xs">
                          <XCircle className="h-3 w-3 mr-1" />
                          Skipped
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {feeding.food_brand ? (
                        <span>{feeding.food_brand} • </span>
                      ) : null}
                      {feeding.actual_portion ? (
                        <span>{feeding.actual_portion} {feeding.portion_unit}</span>
                      ) : (
                        <span>No portion recorded</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(feeding.feeding_time)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {new Date(feeding.feeding_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// PET DETAIL PAGE COMPONENT
type Pet = {
  id: string
  name: string
  species: string
  breed: string
  age: number
  weight: number
  photo_url: string | null
  created_at: string
}

type DailyLog = {
  id: string
  log_date: string
  mood: string
  activity_type: string
  activity_duration: number
  sleep_duration: number
  meal_portions: number
}

type SensorData = {
  id: string
  heart_rate: number
  temperature: number
  activity_level: string
  sensor_time: string
  weather_temperature: number
  weather_humidity: number
  weather_condition: string
  weather_impact_score: number
}

type DiseaseAnalysisResult = {
  success: boolean
  disease: string
  confidence: number
  visible_signs: string
  all_predictions?: Array<{ disease: string; confidence: number }>
  error?: string
}

const getPetIcon = (species: string) => {
  const lowerSpecies = species.toLowerCase()
  if (lowerSpecies.includes("dog")) return Dog
  if (lowerSpecies.includes("cat")) return Cat
  if (lowerSpecies.includes("bird")) return Bird
  if (lowerSpecies.includes("fish")) return Fish
  return PawPrint
}

export default function PetDetailPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const petId = params.id as string
  
  const [pet, setPet] = useState<Pet | null>(null)
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [sensorData, setSensorData] = useState<SensorData[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [reportData, setReportData] = useState<HealthReportData | null>(null)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [healthReport, setHealthReport] = useState<string | null>(null)
  const [showReport, setShowReport] = useState(false)
  const [analyzingImage, setAnalyzingImage] = useState(false)
  const [diseaseAnalysis, setDiseaseAnalysis] = useState<DiseaseAnalysisResult | null>(null)
  const [showDiseaseModal, setShowDiseaseModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const userPlan = user?.plan || "basic"
  const hasSensorAccess = userPlan === "premium"
  const hasImageRecognition = userPlan === "premium"

  // Fetch pet data
  const fetchPetData = useCallback(async () => {
    if (!user || !petId) return
    
    setLoading(true)
    try {
      const { data: petData, error: petError } = await supabase
        .from("pets")
        .select("*")
        .eq("id", petId)
        .eq("user_id", user.id)
        .single()

      if (petError) throw petError
      setPet(petData)

      const { data: logsData, error: logsError } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("pet_id", petId)
        .order("log_date", { ascending: false })
        .limit(10)

      if (!logsError && logsData) {
        setLogs(logsData)
      }

    } catch (error) {
      console.error("Error fetching pet:", error)
      router.push("/pets")
    } finally {
      setLoading(false)
    }
  }, [user, petId, router])

  // Fetch sensor data - only for premium users
  const fetchSensorData = useCallback(async () => {
    if (!hasSensorAccess || !petId) return
    
    try {
      console.log("Fetching sensor data for pet:", petId)
      const { data, error } = await supabase
        .from("sensor_data")
        .select("*")
        .eq("pet_id", petId)
        .order("sensor_time", { ascending: false })
        .limit(24)

      if (error) {
        console.error("Error fetching sensor data:", error)
        return
      }
      
      console.log("Sensor data received:", data?.length || 0, "records")
      setSensorData(data || [])
    } catch (error) {
      console.error("Error in fetchSensorData:", error)
    }
  }, [hasSensorAccess, petId])

  // Initial data load
  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    if (petId) {
      fetchPetData()
      fetchSensorData()
    }
  }, [user, petId, fetchPetData, fetchSensorData])

const generateHealthReport = async () => {
  if (!hasSensorAccess) {
    alert("Please upgrade to Premium plan to generate health reports");
    return;
  }

  if (!latestSensor) {
    alert("No sensor data available. Connect IoT sensors to generate health reports.");
    return;
  }

  setGeneratingReport(true);
  setHealthReport(null);
  setShowReport(false);

  try {
    const response = await fetch('/api/generate-health-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ petId })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate report');
    }

    const report = data.report;
    setReportData(report);
    
    // Format the report for display
    const formattedReport = `
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         🏥 COMPLETE HEALTH REPORT                              ║
║                         ${report.pet_name?.toUpperCase() || 'PET'}                                         
║                         ${new Date(report.generated_at).toLocaleString('en-US', { timeZone: 'Asia/Colombo' })}
╚═══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────────┐
│ 📋 PET INFORMATION                                                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Name:        ${report.pet_name}                                                 │
│ Species:     ${report.species}                                                  │
│ Breed:       ${report.breed}                                                    │
│ Age:         ${report.age} years                                                │
│ Weight:      ${report.weight} kg                                                │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  HEALTH ASSESSMENT                                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   🏥 Health Score:  ${report.health_score}/100                                   │
│      ${'█'.repeat(Math.floor(report.health_score / 5))}${'░'.repeat(20 - Math.floor(report.health_score / 5))}        │
│                                                                                 │
│   📈 Status:       ${report.status}                                             │
│   ⚠️ Risk Level:   ${report.risk_level?.toUpperCase()}                          │
│   📉 Trend:        ${report.trend?.toUpperCase() || 'STABLE'}                   │
│   🚨 Urgency:      ${report.urgency}                                            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ 📡 VITAL SIGNS (Recorded: ${new Date(report.vital_signs.recorded_at).toLocaleString('en-US', { timeZone: 'Asia/Colombo' })})
├─────────────────────────────────────────────────────────────────────────────────┤
│   ❤️  Heart Rate:     ${report.vital_signs.heart_rate} BPM                       │
│   🌡️  Temperature:    ${report.vital_signs.temperature}°C                        │
│   🏃 Activity:        ${report.vital_signs.activity_level?.toUpperCase()}        │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ 🌤️ ENVIRONMENTAL CONDITIONS                                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│   Temperature:  ${report.weather.temperature}°C                                  │
│   Humidity:     ${report.weather.humidity}%                                      │
│   Condition:    ${report.weather.condition}                                      │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ ⚠️ DETECTED ISSUES                                                              │
├─────────────────────────────────────────────────────────────────────────────────┤
${report.issues.map((issue: string) => `│   • ${issue}`).join('\n')}
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ 💡 RECOMMENDATIONS                                                              │
├─────────────────────────────────────────────────────────────────────────────────┤
${report.recommendations.map((rec: string, i: number) => `│   ${i + 1}. ${rec}`).join('\n')}
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  NEXT STEPS                                                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
${report.next_steps.map((step: string, i: number) => `│   ${i + 1}. ${step}`).join('\n')}
└─────────────────────────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════════════════════╗
║  📞 For emergencies, contact your veterinarian immediately                      ║
║  📅 Schedule follow-up: ${report.urgency}                                       ║
╚═══════════════════════════════════════════════════════════════════════════════╝
`;

    setHealthReport(formattedReport);
    setShowReport(true);
    
    // Refresh the page data to show new prediction
    fetchPetData();
    
  } catch (error) {
    console.error("Health report error:", error);
    setHealthReport(`❌ Error: ${error instanceof Error ? error.message : "Failed to generate report"}`);
    setShowReport(true);
  } finally {
    setGeneratingReport(false);
    
  }
};

  const analyzePetImage = async () => {
    if (!hasImageRecognition) {
      alert("Please upgrade to Premium plan to use Disease Detection")
      return
    }

    if (!pet?.photo_url) {
      alert("Please upload a photo of your pet first")
      return
    }

    setAnalyzingImage(true)
    setDiseaseAnalysis(null)
    setShowDiseaseModal(true)

    try {
      const ML_API_URL = process.env.NEXT_PUBLIC_ML_API_URL
      
      if (!ML_API_URL) {
        throw new Error("ML API URL not configured")
      }
      
      const imageResponse = await fetch(pet.photo_url)
      const blob = await imageResponse.blob()
      
      const formData = new FormData()
      formData.append("file", blob, `${pet.name}.jpg`)
      formData.append("pet_id", pet.id)
      formData.append("pet_name", pet.name)
      
      const mlResponse = await fetch(`${ML_API_URL}/analyze/disease`, {
        method: "POST",
        body: formData,
      })
      
      const result = await mlResponse.json()
      
      if (result.success) {
        setDiseaseAnalysis({
          success: true,
          disease: result.disease,
          confidence: result.confidence,
          visible_signs: result.visible_signs,
          all_predictions: result.all_predictions
        })
        
        await supabase.from("image_analysis").insert({
          pet_id: pet.id,
          image_url: pet.photo_url,
          analysis_date: new Date().toISOString().split('T')[0],
          detected_conditions: result.disease,
          confidence_score: result.confidence
        })
        
      } else {
        setDiseaseAnalysis({
          success: false,
          disease: "",
          confidence: 0,
          visible_signs: "",
          error: result.error || "Analysis failed"
        })
      }
      
    } catch (error) {
      console.error("Disease detection error:", error)
      setDiseaseAnalysis({
        success: false,
        disease: "",
        confidence: 0,
        visible_signs: "",
        error: error instanceof Error ? error.message : "Failed to analyze image"
      })
    } finally {
      setAnalyzingImage(false)
    }
  }

  const deletePet = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("pets")
        .delete()
        .eq("id", petId)
        .eq("user_id", user?.id);

      if (error) throw error;
      router.push("/pets");
    } catch (error) {
      console.error("Error deleting pet:", error);
      alert("Failed to delete pet. Please try again.");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // LSTM Predictions handler with null check
  const handleLSTMPredictionsClick = () => {
    if (pet) {
      router.push(`/pets/${pet.id}/lstm-predictions`);
    }
  };

  const getMoodEmoji = (mood: string) => {
    switch(mood) {
      case 'happy': return '😊'
      case 'calm': return '😌'
      case 'playful': return '🐾'
      case 'tired': return '😴'
      case 'anxious': return '😰'
      default: return '🐶'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return "text-green-600 bg-green-50"
    if (confidence >= 0.4) return "text-yellow-600 bg-yellow-50"
    return "text-red-600 bg-red-50"
  }

  const getRiskLevel = (confidence: number) => {
    if (confidence >= 0.7) return { level: "High", color: "text-red-600" }
    if (confidence >= 0.4) return { level: "Medium", color: "text-yellow-600" }
    return { level: "Low", color: "text-green-600" }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!pet) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold">Pet not found</h1>
          <Button asChild className="mt-4">
            <Link href="/pets">Back to Pets</Link>
          </Button>
        </div>
      </div>
    )
  }

  const Icon = getPetIcon(pet.species)
  const latestSensor = sensorData[0]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-gray-50/50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Back Button */}
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/pets" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Pets
            </Link>
          </Button>
        </div>

        {/* Pet Header */}
        <div className="flex items-center gap-6 mb-8 flex-wrap">
          <div className="relative group">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden ring-4 ring-primary/10">
              {pet.photo_url ? (
                <img 
                  src={pet.photo_url} 
                  alt={pet.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Icon className="h-12 w-12 text-primary" />
              )}
            </div>
            {hasImageRecognition && pet.photo_url && (
              <button
                onClick={analyzePetImage}
                disabled={analyzingImage}
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110"
              >
                {analyzingImage ? (
                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                ) : (
                  <Scan className="h-4 w-4 text-white" />
                )}
              </button>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {pet.name}
              </h1>
              {userPlan === 'premium' && <Badge className="bg-yellow-100 text-yellow-700">Premium Access</Badge>}
            </div>
            <p className="text-muted-foreground">
              {pet.breed || pet.species} • {pet.age} years old • {pet.weight} kg
            </p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <Button size="sm" variant="outline" asChild>
                <Link href={`/pets/${pet.id}/edit`}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit Pet
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/pets/${pet.id}/logs/new`}>
                  <Activity className="h-4 w-4 mr-1" />
                  Add Log
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/pets/${pet.id}/documents`}>
                  <FileText className="h-4 w-4 mr-1" />
                  Documents
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/pets/${pet.id}/feeding`}>
                  <Clock className="h-4 w-4 mr-1" />
                  Feeding Schedule
                </Link>
              </Button>
              
              {/* LSTM PREDICTIONS BUTTON - Only for Premium with null check */}
              {hasSensorAccess && pet && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleLSTMPredictionsClick}
                  className="border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                >
                  <Brain className="h-4 w-4 mr-1" />
                  Health Forecast
                </Button>
              )}

              {hasImageRecognition && pet && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={analyzePetImage}
                  disabled={analyzingImage}
                  className="border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100"
                >
                  {analyzingImage ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Scan className="h-4 w-4 mr-1" />
                  )}
                  AI Scan
                </Button>
              )}
              
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Pet
              </Button>
            </div>
          </div>
        </div>

        {/* Live Sensor Data Dashboard - Only for Premium */}
        {hasSensorAccess && (
          <Card className="mb-8 border-primary/20 shadow-lg">
            <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-accent/5 rounded-t-lg">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Live Sensor Data Dashboard
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={generateHealthReport}
                    disabled={generatingReport}
                    className="gap-2"
                  >
                    {generatingReport ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Generate Health Report
                  </Button>
                </div>
              </div>
              <CardDescription>Real-time health metrics from IoT sensors</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {latestSensor ? (
                <>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center shadow-sm">
                      <Heart className="h-6 w-6 text-red-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{latestSensor.heart_rate}</p>
                      <p className="text-xs text-muted-foreground">Heart Rate (BPM)</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 text-center shadow-sm">
                      <Thermometer className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{latestSensor.temperature}°C</p>
                      <p className="text-xs text-muted-foreground">Temperature</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center shadow-sm">
                      <Activity className="h-6 w-6 text-green-500 mx-auto mb-2" />
                      <p className="text-xl font-bold capitalize">{latestSensor.activity_level}</p>
                      <p className="text-xs text-muted-foreground">Activity Level</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center shadow-sm">
                      <Droplet className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                      <p className="text-xl font-bold">{latestSensor.weather_condition || "Clear"}</p>
                      <p className="text-xs text-muted-foreground">Weather</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    Last updated: {new Date(latestSensor.sensor_time).toLocaleString()}
                  </p>
                </>
              ) : (
                <div className="text-center py-8">
                  <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No Sensor Data Available</h3>
                  <p className="text-muted-foreground text-sm">
                    Connect IoT sensors to start tracking real-time health metrics
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

        )}

        

        {/* Feeding History Component */}
        <div className="mb-8">
          <FeedingHistory petId={pet.id} petName={pet.name} limit={5} />
        </div>

        <MedicationsList petId={petId} />

{/* Beautiful Health Report Modal */}
{showReport && healthReport && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowReport(false)}>
    <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
      
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-primary to-accent p-6 text-white rounded-t-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold">🏥 Health Report</h2>
            <p className="text-white/80 text-sm mt-1">{pet?.name} • Generated {new Date().toLocaleDateString()}</p>
          </div>
          <button onClick={() => setShowReport(false)} className="p-2 hover:bg-white/20 rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Content - Formatted beautifully */}
      <div className="p-6 space-y-4">
        {healthReport.split('\n').map((line, i) => {
          if (line.includes('HEALTH REPORT') || line.includes('═══')) {
            return <div key={i} className="text-lg font-bold text-primary text-center">{line}</div>;
          }
          if (line.includes('📋') || line.includes('📊') || line.includes('📡') || line.includes('⚠️') || line.includes('💡') || line.includes('')) {
            return <div key={i} className="font-semibold text-primary mt-4 mb-2">{line}</div>;
          }
          if (line.includes('Health Score:')) {
            return (
              <div key={i} className="bg-gradient-to-r from-primary/10 to-accent/10 p-4 rounded-xl">
                <span className="text-2xl font-bold text-primary">{line}</span>
              </div>
            );
          }
          return <div key={i} className="text-gray-700 font-mono text-sm">{line}</div>;
        })}
      </div>

      {/* Footer */}
{/* Footer */}
<div className="sticky bottom-0 bg-gray-50 border-t p-4 flex justify-end gap-3">
  <Button variant="outline" onClick={() => setShowReport(false)}>Close</Button>
  <Button variant="outline" onClick={() => window.print()}>
    <Printer className="mr-2 h-4 w-4" />
    Print
  </Button>
  <Button 
    onClick={() => {
      if (reportData) {
        generateHealthReportPDF(reportData, pet?.name || 'Pet');
      } else {
        alert('No report data available');
      }
    }}
    className="bg-gradient-to-r from-primary to-accent text-white"
  >
    <Download className="mr-2 h-4 w-4" />
    Download PDF
  </Button>
</div>
    </div>
  </div>
)}

        {/* AI Disease Detection Modal */}
        {showDiseaseModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDiseaseModal(false)}>
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b rounded-t-2xl p-5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                    <Scan className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">AI Disease Detection Results</h2>
                    <p className="text-xs text-muted-foreground">Powered by Deep Learning</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDiseaseModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6">
                {analyzingImage ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-gray-600">Analyzing pet image with AI model...</p>
                    <p className="text-xs text-muted-foreground mt-2">This may take a few seconds</p>
                  </div>
                ) : diseaseAnalysis?.success ? (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-5 w-5 text-purple-600" />
                        <h3 className="font-semibold text-lg">Detected Condition</h3>
                      </div>
                      <p className="text-2xl font-bold text-purple-700 mb-2">{diseaseAnalysis.disease}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge className={getConfidenceColor(diseaseAnalysis.confidence)}>
                          Confidence: {(diseaseAnalysis.confidence * 100).toFixed(1)}%
                        </Badge>
                        <Badge className={getRiskLevel(diseaseAnalysis.confidence).color + " bg-opacity-10"}>
                          Risk: {getRiskLevel(diseaseAnalysis.confidence).level}
                        </Badge>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Eye className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold">Visible Signs & Symptoms</h3>
                      </div>
                      <p className="text-gray-700">{diseaseAnalysis.visible_signs}</p>
                    </div>

                    {diseaseAnalysis.all_predictions && diseaseAnalysis.all_predictions.length > 1 && (
                      <div className="bg-gray-50 rounded-xl p-5">
                        <h3 className="font-semibold mb-3">Other Possible Conditions</h3>
                        <div className="space-y-2">
                          {diseaseAnalysis.all_predictions.slice(1, 4).map((pred, idx) => (
                            <div key={idx} className="flex justify-between items-center p-2 bg-white rounded-lg">
                              <span className="text-sm">{pred.disease}</span>
                              <span className="text-sm font-medium">{(pred.confidence * 100).toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-green-50 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Shield className="h-5 w-5 text-green-600" />
                        <h3 className="font-semibold">AI Recommendations</h3>
                      </div>
                      <ul className="space-y-2">
                        {diseaseAnalysis.confidence > 0.7 ? (
                          <>
                            <li className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                              Schedule veterinary appointment within 24-48 hours
                            </li>
                            <li className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                              Share these AI analysis results with your veterinarian
                            </li>
                            <li className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                              Monitor symptoms and take follow-up photos in 3-5 days
                            </li>
                          </>
                        ) : diseaseAnalysis.confidence > 0.4 ? (
                          <>
                            <li className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                              Monitor symptoms closely for the next 7 days
                            </li>
                            <li className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                              Schedule vet visit if symptoms worsen
                            </li>
                            <li className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                              Retake photo in better lighting for more accurate analysis
                            </li>
                          </>
                        ) : (
                          <>
                            <li className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                              No immediate action needed - continue regular monitoring
                            </li>
                            <li className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                              Maintain healthy diet and exercise routine
                            </li>
                            <li className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                              Schedule annual wellness checkup
                            </li>
                          </>
                        )}
                      </ul>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                      <Clock className="h-3 w-3" />
                      Analysis completed: {new Date().toLocaleString()}
                    </div>
                  </div>
                ) : diseaseAnalysis?.error ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600 font-medium">Analysis Failed</p>
                    <p className="text-sm text-muted-foreground mt-2">{diseaseAnalysis.error}</p>
                    <Button 
                      onClick={analyzePetImage} 
                      className="mt-4"
                      disabled={analyzingImage}
                    >
                      Try Again
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Delete {pet?.name}?</h2>
                    <p className="text-sm text-muted-foreground">This action cannot be undone</p>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-4">
                  All data associated with {pet?.name} will be permanently deleted.
                </p>

                <div className="flex gap-3">
                  <Button
                    variant="destructive"
                    onClick={deletePet}
                    disabled={deleting}
                    className="flex-1"
                  >
                    {deleting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Yes, Delete Forever
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="logs">Daily Logs</TabsTrigger>
            <TabsTrigger value="health">Health Records</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    About {pet.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{pet.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Species</span>
                    <span className="font-medium">{pet.species}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Breed</span>
                    <span className="font-medium">{pet.breed || "Not specified"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Age</span>
                    <span className="font-medium">{pet.age} years</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Weight</span>
                    <span className="font-medium">{pet.weight} kg</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-500" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Latest updates</CardDescription>
                </CardHeader>
                <CardContent>
                  {logs.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No logs yet</p>
                  ) : (
                    <div className="space-y-3">
                      {logs.slice(0, 5).map((log) => (
                        <div key={log.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                          <span className="text-xl">{getMoodEmoji(log.mood)}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {log.activity_type || "Daily update"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(log.log_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Daily Logs</CardTitle>
                <CardDescription>Track your pet&apos;s daily activities</CardDescription>
              </CardHeader>
              <CardContent>
                {logs.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">No logs yet</h3>
                    <p className="text-muted-foreground mb-4">Start tracking your pet&apos;s daily activities</p>
                    <Button asChild>
                      <Link href={`/pets/${pet.id}/logs/new`}>Add First Log</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {logs.map((log) => (
                      <div key={log.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{getMoodEmoji(log.mood)}</span>
                            <span className="font-medium capitalize">{log.mood}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(log.log_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                          {log.activity_type && (
                            <div>Activity: {log.activity_type} ({log.activity_duration} min)</div>
                          )}
                          {log.sleep_duration && (
                            <div>Sleep: {log.sleep_duration} hours</div>
                          )}
                          {log.meal_portions && (
                            <div>Meals: {log.meal_portions} portions</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="health">
            <Card>
              <CardHeader>
                <CardTitle>Health Records</CardTitle>
                <CardDescription>Medical history and documents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">Health Records Coming Soon</h3>
                  <p className="text-muted-foreground">Track vaccinations, medications, and vet visits</p>
                  <Button className="mt-4" variant="outline" asChild>
                    <Link href={`/pets/${pet.id}/documents`}>View Documents</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
                <MedicationsList petId={pet.id} />
  

          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}