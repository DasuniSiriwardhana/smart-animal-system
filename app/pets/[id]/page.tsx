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
  Brain,
  Printer
} from "lucide-react"

import { generateHealthReportPDF } from '@/lib/pdf-generator';

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
  causes?: string[]           
  recommendations?: string[]    
  prevention?: string[]       
  urgency?: string            
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
  
  // Image upload states
  const [showImageUploadModal, setShowImageUploadModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

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
    if (!hasSensorAccess || !petId) {
      console.log("Cannot fetch sensor data: hasSensorAccess=", hasSensorAccess, "petId=", petId);
      return;
    }
    
    try {
      console.log("Fetching sensor data for pet:", petId);
      const { data, error } = await supabase
        .from("sensor_data")
        .select("*")
        .eq("pet_id", petId)
        .order("sensor_time", { ascending: false })
        .limit(24);

      if (error) {
        console.error("Error fetching sensor data:", error);
        return;
      }
      
      console.log("Sensor data received:", data?.length || 0, "records");
      if (data && data.length > 0) {
        console.log("First sensor record:", data[0]);
      } else {
        console.log("No sensor data found for pet:", petId);
      }
      setSensorData(data || []);
    } catch (error) {
      console.error("Error in fetchSensorData:", error);
    }
  }, [hasSensorAccess, petId]);

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

    setGeneratingReport(true);
    setHealthReport(null);
    setShowReport(false);

    try {
      console.log("=== GENERATING HEALTH REPORT ===");
      console.log("Pet ID:", petId);
      console.log("Has sensor access:", hasSensorAccess);
      
      console.log("Step 1: Fetching sensor data...");
      const { data: freshSensorData, error: sensorError } = await supabase
        .from("sensor_data")
        .select("*")
        .eq("pet_id", petId)
        .order("sensor_time", { ascending: false })
        .limit(1);

      if (sensorError) {
        console.error("Sensor fetch error:", sensorError);
        alert(`Sensor fetch error: ${sensorError.message}`);
        setGeneratingReport(false);
        return;
      }

      console.log("Sensor data result:", freshSensorData);
      
      if (!freshSensorData || freshSensorData.length === 0) {
        console.log("No sensor data found for pet:", petId);
        
        const { count, error: countError } = await supabase
          .from("sensor_data")
          .select("*", { count: 'exact', head: true });
        
        console.log("Total sensor records in database:", count);
        console.log("Count error:", countError);
        
        alert(`No sensor data available for this pet. Total sensor records in DB: ${count || 0}`);
        setGeneratingReport(false);
        return;
      }

      const currentSensorData = freshSensorData[0];
      console.log("Current sensor data:", currentSensorData);

      console.log("Step 2: Calling /api/generate-health-report...");
      const response = await fetch('/api/generate-health-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          petId,
          sensorData: currentSensorData,
          petName: pet?.name,
          species: pet?.species,
          breed: pet?.breed,
          age: pet?.age,
          weight: pet?.weight
        }),
      });

      console.log("API Response status:", response.status);
      
      const data = await response.json();
      console.log("API Response data:", data);

      if (!response.ok) {
        throw new Error(data.error || `API returned ${response.status}`);
      }

      const report = data.report;
      setReportData(report);
      
      const heartRateStatus = currentSensorData.heart_rate > 120 ? 'ABNORMAL - Tachycardia' : 
                              currentSensorData.heart_rate < 60 ? 'ABNORMAL - Bradycardia' : 'Normal';
      const tempStatus = currentSensorData.temperature > 39.2 ? 'ABNORMAL - Hyperthermia' : 
                         currentSensorData.temperature < 37.5 ? 'ABNORMAL - Hypothermia' : 'Normal';
      const activityStatus = currentSensorData.activity_level === 'inactive' ? 'ABNORMAL - Reduced activity' : 'Normal';

      const formattedReport = `
VETERINARY HEALTH REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PATIENT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Patient Name:    ${pet?.name}
Species:         ${pet?.species}
Breed:           ${pet?.breed || 'Not specified'}
Age:             ${pet?.age} years
Weight:          ${pet?.weight} kg
Patient ID:      ${pet?.id?.substring(0, 8).toUpperCase()}
Report Date:     ${new Date().toLocaleString()}

VITAL SIGNS (IoT Sensor Data)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Parameter              Value           Reference Range        Status
─────────────────────────────────────────────────────────────────────────────
Heart Rate            ${currentSensorData.heart_rate} BPM       60-120 BPM            ${heartRateStatus}
Temperature           ${currentSensorData.temperature} °C        37.5-39.2 °C          ${tempStatus}
Activity Level        ${currentSensorData.activity_level?.toUpperCase() || 'UNKNOWN'}    Active/Normal         ${activityStatus}
Recorded:             ${new Date(currentSensorData.sensor_time).toLocaleString()}

CLINICAL ASSESSMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${currentSensorData.heart_rate > 120 ? '• Tachycardia detected. May indicate pain, fever, anxiety, or cardiac condition.' : 
  currentSensorData.heart_rate < 60 ? '• Bradycardia detected. Monitor for lethargy or weakness.' : 
  '• Heart rate within normal reference range.'}

${currentSensorData.temperature > 39.2 ? '• Hyperthermia detected. Rule out inflammation, infection, or heat stress.' : 
  currentSensorData.temperature < 37.5 ? '• Hypothermia detected. Ensure adequate environmental temperature.' : 
  '• Body temperature within normal reference range.'}

${currentSensorData.activity_level === 'inactive' ? '• Reduced activity level. Consider orthopedic, neurologic, or systemic illness.' : 
  '• Activity level appropriate for species and age.'}

RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Schedule a comprehensive physical examination within 7-14 days.
2. Continue daily monitoring of appetite, water intake, and behavior.
3. Maintain current preventive care schedule (vaccinations, parasite control).
4. Contact veterinarian immediately if you observe:
   - Vomiting or diarrhea
   - Lethargy or weakness
   - Inappetence for >24 hours
   - Difficulty breathing
   - Seizure activity
5. Bring this report to your next veterinary visit for reference.

DISCLAIMER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This report is generated using AI analysis of IoT sensor data and does not constitute a definitive medical diagnosis. It is intended for informational purposes only. Always consult a licensed veterinarian for professional medical advice, diagnosis, or treatment.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Electronically signed: Veterinary Health System v2.0
License #: AI-VET-${new Date().getFullYear()}
${new Date().toLocaleString()}
`;

      setHealthReport(formattedReport);
      setShowReport(true);
      
    } catch (error) {
      console.error("Health report error:", error);
      setHealthReport(`ERROR: ${error instanceof Error ? error.message : "Failed to generate report"}`);
      setShowReport(true);
    } finally {
      setGeneratingReport(false);
    }
  };

const analyzeUploadedImage = async () => {
  if (!uploadedFile) return;
  
  setAnalyzingImage(true);
  setShowImageUploadModal(false);
  setShowDiseaseModal(true);

  try {
    // COMPRESS IMAGE BEFORE UPLOAD
    let fileToUpload = uploadedFile;
    
    // If file is larger than 5MB, compress it
    if (uploadedFile.size > 5 * 1024 * 1024) {
      console.log("Compressing large image...");
      fileToUpload = await compressImage(uploadedFile);
      console.log(`Compressed from ${uploadedFile.size} to ${fileToUpload.size} bytes`);
    }
    
    const formData = new FormData();
    formData.append("file", fileToUpload);
    formData.append("pet_id", pet!.id);
    formData.append("pet_name", pet!.name);
    formData.append("pet_species", pet!.species);

    const mlResponse = await fetch('/api/analyze-disease', {
      method: 'POST',
      body: formData,
    });

    const result = await mlResponse.json();

    if (result.success) {
      setDiseaseAnalysis({
        success: true,
        disease: result.disease,
        confidence: result.confidence,
        visible_signs: result.visible_signs,
        causes: result.causes,
        recommendations: result.recommendations,
        prevention: result.prevention,
        urgency: result.urgency,
        all_predictions: result.all_predictions
      });

      await supabase.from("image_analysis").insert({
        pet_id: pet!.id,
        image_url: selectedImage,
        analysis_date: new Date().toISOString().split('T')[0],
        detected_conditions: result.disease,
        confidence_score: result.confidence
      });

    } else {
      setDiseaseAnalysis({
        success: false,
        disease: "",
        confidence: 0,
        visible_signs: "",
        error: result.error || "Analysis failed"
      });
    }

  } catch (error) {
    console.error("Disease detection error:", error);
    setDiseaseAnalysis({
      success: false,
      disease: "",
      confidence: 0,
      visible_signs: "",
      error: "Service temporarily unavailable. Please try again later."
    });
  } finally {
    setAnalyzingImage(false);
    setSelectedImage(null);
    setUploadedFile(null);
  }
};

// Add this helper function to compress images
const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Max dimensions
        const maxWidth = 800;
        const maxHeight = 800;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Compression failed'));
            }
          },
          'image/jpeg',
          0.7 // Quality (70%)
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

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
    <div className="min-h-screen bg-gray-50">
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

        {/* Pet Header - Professional */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="relative group">
              <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden ring-1 ring-gray-200">
                {pet.photo_url ? (
                  <img 
                    src={pet.photo_url} 
                    alt={pet.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Icon className="h-12 w-12 text-gray-400" />
                )}
              </div>
              {hasImageRecognition && (
                <button
                  onClick={() => setShowImageUploadModal(true)}
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center shadow-lg hover:bg-gray-700 transition-all"
                >
                  <Camera className="h-4 w-4 text-white" />
                </button>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-light text-gray-900">
                  {pet.name}
                </h1>
                {userPlan === 'premium' && (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                    Premium Access
                  </Badge>
                )}
              </div>
              <p className="text-gray-500 mt-1">
                {pet.breed || pet.species} • {pet.age} years • {pet.weight} kg
              </p>
              <div className="flex gap-2 mt-3 flex-wrap">
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/pets/${pet.id}/edit`}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
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
                    Schedule
                  </Link>
                </Button>
                
                {hasSensorAccess && pet && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleLSTMPredictionsClick}
                    className="border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100"
                  >
                    <Brain className="h-4 w-4 mr-1" />
                    Forecast
                  </Button>
                )}

                {hasImageRecognition && pet && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowImageUploadModal(true)}
                    className="border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100"
                  >
                    <Camera className="h-4 w-4 mr-1" />
                    AI Scan
                  </Button>
                )}
                
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={() => setShowDeleteModal(true)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Vital Signs Dashboard - Professional */}
        {hasSensorAccess && (
          <Card className="mb-8 border-gray-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <CardTitle className="text-base font-semibold text-gray-700">
                  Vital Signs Monitor
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="default"
                    onClick={generateHealthReport}
                    disabled={generatingReport}
                    className="gap-2 bg-gray-800 hover:bg-gray-700"
                  >
                    {generatingReport ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    Generate Report
                  </Button>
                </div>
              </div>
              <CardDescription className="text-gray-500">Real-time physiological data from IoT sensors</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {latestSensor ? (
                <>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="border-l-4 border-red-400 pl-4 py-2">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Heart Rate</p>
                      <p className="text-2xl font-semibold text-gray-900">{latestSensor.heart_rate}</p>
                      <p className="text-xs text-gray-400">BPM</p>
                    </div>
                    <div className="border-l-4 border-blue-400 pl-4 py-2">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Temperature</p>
                      <p className="text-2xl font-semibold text-gray-900">{latestSensor.temperature}°C</p>
                      <p className="text-xs text-gray-400">Celsius</p>
                    </div>
                    <div className="border-l-4 border-green-400 pl-4 py-2">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Activity</p>
                      <p className="text-xl font-semibold text-gray-900 capitalize">{latestSensor.activity_level}</p>
                      <p className="text-xs text-gray-400">Current status</p>
                    </div>
                    <div className="border-l-4 border-purple-400 pl-4 py-2">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Environment</p>
                      <p className="text-xl font-semibold text-gray-900 capitalize">{latestSensor.weather_condition || "Indoor"}</p>
                      <p className="text-xs text-gray-400">{latestSensor.weather_temperature}°C / {latestSensor.weather_humidity}%</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 text-center mt-4">
                    Last reading: {new Date(latestSensor.sensor_time).toLocaleString()}
                  </p>
                </>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="font-medium text-gray-700 mb-2">No Sensor Data Available</h3>
                  <p className="text-gray-500 text-sm">
                    Connect IoT sensors to begin tracking vital signs
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

        {/* Image Upload Modal for AI Scan */}
        {showImageUploadModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowImageUploadModal(false)}>
            <div className="bg-white rounded-lg max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Upload Pet Image</h2>
                  <button onClick={() => setShowImageUploadModal(false)} className="p-1 hover:bg-gray-100 rounded">
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">
                  Take a photo or upload an image of the affected area for AI disease detection.
                  <br />
                  <span className="text-xs text-gray-400">Best results: good lighting, clear focus, showing the problem area</span>
                </p>
                
                {!selectedImage ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Camera className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-sm text-gray-500 mb-3">Click to upload or take a photo</p>
                    <input
  type="file"
  accept="image/jpeg,image/png,image/jpg"
  capture="environment"
  onChange={(e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("Image too large. Please select an image under 10MB.");
        return;
      }
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }}
  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-800 file:text-white hover:file:bg-gray-700"
/>
                  </div>
                ) : (
                  <div>
                    <img src={selectedImage} alt="Preview" className="w-full h-48 object-cover rounded-lg mb-4" />
                    <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setSelectedImage(null)
                          setUploadedFile(null)
                        }}
                        className="flex-1"
                      >
                        Retake
                      </Button>
                      <Button 
                        onClick={analyzeUploadedImage}
                        className="flex-1 bg-gray-800 hover:bg-gray-700"
                      >
                        Analyze Image
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PROFESSIONAL VETERINARY REPORT MODAL */}
        {showReport && healthReport && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowReport(false)}>
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
              
              {/* Clinical Header */}
              <div className="border-b border-gray-200 bg-white px-8 py-6 sticky top-0 z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-light tracking-tight text-gray-900">VETERINARY HEALTH REPORT</h1>
                    <p className="text-sm text-gray-500 mt-1">Comprehensive Clinical Assessment</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Report ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
                    <p className="text-xs text-gray-400">Generated: {new Date().toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Report Content - Monospace for clinical feel */}
              <div className="p-8 font-mono text-sm bg-white">
                <pre className="whitespace-pre-wrap font-mono text-gray-800 text-sm leading-relaxed">
                  {healthReport}
                </pre>
              </div>

              {/* Footer Actions */}
              <div className="border-t border-gray-200 px-8 py-4 bg-gray-50 flex justify-end gap-3 sticky bottom-0">
                <button
                  onClick={() => setShowReport(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <Printer className="h-4 w-4 inline mr-2" />
                  Print
                </button>
                <button
                  onClick={() => reportData && generateHealthReportPDF(reportData, pet?.name || 'Pet')}
                  className="px-4 py-2 text-sm bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  <Download className="h-4 w-4 inline mr-2" />
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Disease Detection Modal - Professional */}
        {showDiseaseModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDiseaseModal(false)}>
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-gray-200 rounded-t-lg p-5 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Disease Detection Analysis</h2>
                  <p className="text-xs text-gray-500">AI-Powered Diagnostic Assistant</p>
                </div>
                <button
                  onClick={() => setShowDiseaseModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6">
                {analyzingImage ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600">Analyzing image...</p>
                    <p className="text-xs text-gray-400 mt-2">Processing through neural network</p>
                  </div>
                ) : diseaseAnalysis?.success ? (
                  <div className="space-y-6">
                    <div className="border-l-4 border-amber-500 pl-4 py-2">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Detected Condition</p>
                      <p className="text-xl font-semibold text-gray-900 mt-1">{diseaseAnalysis.disease}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getConfidenceColor(diseaseAnalysis.confidence)}>
                          Confidence: {(diseaseAnalysis.confidence * 100).toFixed(1)}%
                        </Badge>
                        <Badge className={getRiskLevel(diseaseAnalysis.confidence).color + " bg-opacity-10"}>
                          Risk Level: {getRiskLevel(diseaseAnalysis.confidence).level}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Visible Signs</p>
                      <p className="text-gray-700 text-sm">{diseaseAnalysis.visible_signs}</p>
                    </div>

                    {diseaseAnalysis.all_predictions && diseaseAnalysis.all_predictions.length > 1 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Differential Diagnoses</p>
                        <div className="space-y-2">
                          {diseaseAnalysis.all_predictions.slice(1, 4).map((pred, idx) => (
                            <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="text-sm text-gray-700">{pred.disease}</span>
                              <span className="text-sm text-gray-500">{(pred.confidence * 100).toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Clinical Recommendations</p>
                      <ul className="space-y-2">
                        {diseaseAnalysis.confidence > 0.7 ? (
                          <>
                            <li className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="text-amber-600">•</span>
                              Schedule veterinary appointment within 24-48 hours
                            </li>
                            <li className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="text-amber-600">•</span>
                              Provide this analysis to your veterinarian
                            </li>
                          </>
                        ) : diseaseAnalysis.confidence > 0.4 ? (
                          <>
                            <li className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="text-blue-600">•</span>
                              Monitor symptoms for 7 days
                            </li>
                            <li className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="text-blue-600">•</span>
                              Consult vet if symptoms worsen
                            </li>
                          </>
                        ) : (
                          <li className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-green-600">•</span>
                            No immediate action needed - routine monitoring recommended
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                ) : diseaseAnalysis?.error ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Analysis Unavailable</p>
                    <p className="text-sm text-gray-500 mt-2">{diseaseAnalysis.error}</p>
                    <Button onClick={() => setShowImageUploadModal(true)} className="mt-4">
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
            <div className="bg-white rounded-lg max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Delete Patient Record</h2>
                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-4">
                  All medical data, logs, and records for {pet?.name} will be permanently deleted.
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
                    Delete Permanently
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
          <TabsList className="grid w-full grid-cols-3 bg-gray-100">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="logs">Daily Logs</TabsTrigger>
            <TabsTrigger value="health">Health Records</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-gray-800">Patient Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Name</span>
                    <span className="font-medium text-gray-900">{pet.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Species</span>
                    <span className="font-medium text-gray-900 capitalize">{pet.species}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Breed</span>
                    <span className="font-medium text-gray-900">{pet.breed || "Not specified"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Age</span>
                    <span className="font-medium text-gray-900">{pet.age} years</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Weight</span>
                    <span className="font-medium text-gray-900">{pet.weight} kg</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-gray-800">Recent Activity</CardTitle>
                  <CardDescription>Latest wellness logs</CardDescription>
                </CardHeader>
                <CardContent>
                  {logs.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No logs recorded</p>
                  ) : (
                    <div className="space-y-3">
                      {logs.slice(0, 5).map((log) => (
                        <div key={log.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                          <span className="text-xl">{getMoodEmoji(log.mood)}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {log.activity_type || "Daily update"}
                            </p>
                            <p className="text-xs text-gray-500">
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
                <CardTitle className="text-base font-semibold text-gray-800">Daily Wellness Logs</CardTitle>
                <CardDescription>Track daily activities and behaviors</CardDescription>
              </CardHeader>
              <CardContent>
                {logs.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="font-medium text-gray-700 mb-2">No logs yet</h3>
                    <p className="text-gray-500 mb-4">Start tracking your pet&apos;s daily wellness</p>
                    <Button asChild>
                      <Link href={`/pets/${pet.id}/logs/new`}>Add First Log</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {logs.map((log) => (
                      <div key={log.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{getMoodEmoji(log.mood)}</span>
                            <span className="font-medium text-gray-900 capitalize">{log.mood}</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(log.log_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                          {log.activity_type && (
                            <div className="text-gray-600">Activity: {log.activity_type} ({log.activity_duration} min)</div>
                          )}
                          {log.sleep_duration && (
                            <div className="text-gray-600">Sleep: {log.sleep_duration} hours</div>
                          )}
                          {log.meal_portions && (
                            <div className="text-gray-600">Meals: {log.meal_portions} portions</div>
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
                <CardTitle className="text-base font-semibold text-gray-800">Medical Records</CardTitle>
                <CardDescription>Health history and documents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="font-medium text-gray-700 mb-2">Medical Records</h3>
                  <p className="text-gray-500">Vaccinations, medications, and vet visits</p>
                  <Button className="mt-4" variant="outline" asChild>
                    <Link href={`/pets/${pet.id}/documents`}>Manage Documents</Link>
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