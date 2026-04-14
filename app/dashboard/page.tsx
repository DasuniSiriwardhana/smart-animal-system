"use client";

import { Chatbot } from '@/components/ui/Chatbot';
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import DataView, { type DataItem } from '@/components/ui/DataView';
import {
  PawPrint,
  Activity,
  Moon,
  Heart,
  Plus,
  Dog,
  Cat,
  Bird,
  Fish,
  ChevronRight,
  Loader2,
  Crown,
  Sparkles,
  Lock,
  Camera,
  Thermometer,
  X,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertTriangle,
  Scan,
  Clock,
  Brain
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/auth-provider";
import { canAddMorePets } from "@/lib/plan-config";

// Use DataItem as Pet type
type Pet = DataItem;

type SensorData = {
  heart_rate: number;
  temperature: number;
  activity_level: string;
  sensor_time: string;
};

type DashboardStats = {
  totalPets: number;
  activeToday: number;
  avgSleep: string;
  healthScore: number;
};

type DailyLogEntry = {
  id: string;
  pet_id: string;
  log_date: string;
  mood: string | null;
  activity_type: string | null;
  activity_duration: number | null;
  sleep_duration: number | null;
  pets: { name: string; species: string } | null;
};

type SensorActivity = {
  id: string;
  pet_id: string;
  activity_type: string;
  activity_date: string;
  duration_minutes: number;
  distance_km: number;
  calories_burned: number;
  pets: { name: string; species: string } | null;
};

type AnalysisResult = {
  healthScore: number;
  status: string;
  recommendations: string[];
  anomalies: string[];
  timestamp: string;
  detected_disease?: string;
  confidence?: number;
};

function PlanBadge() {
  const { user } = useAuth();
  const userPlan = user?.plan || "basic";

  const planConfig = {
    basic: { label: "Basic Plan", icon: Lock, color: "bg-gray-100 text-gray-700 border-gray-200" },
    standard: { label: "Standard Plan", icon: Sparkles, color: "bg-blue-100 text-blue-700 border-blue-200" },
    premium: { label: "Premium Plan", icon: Crown, color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  };

  const config = planConfig[userPlan as keyof typeof planConfig];
  const Icon = config.icon;

  return (
    <Badge className={`${config.color} px-3 py-1.5 gap-1.5 border`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
}

function PetAvatarIcon({ species, className }: { species: string; className?: string }) {
  const s = species.toLowerCase();
  if (s.includes("dog")) return <Dog className={className} />;
  if (s.includes("cat")) return <Cat className={className} />;
  if (s.includes("bird")) return <Bird className={className} />;
  if (s.includes("fish")) return <Fish className={className} />;
  return <PawPrint className={className} />;
}

// ✅ ENHANCED: Pet Card Component with Live Sensor Data
function PetCard({ pet, onSelect }: { pet: Pet; onSelect: (pet: Pet) => void }) {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [prevHeartRate, setPrevHeartRate] = useState<number | null>(null);
  const [prevTemp, setPrevTemp] = useState<number | null>(null);

  useEffect(() => {
    const fetchSensorData = async () => {
      const { data } = await supabase
        .from("sensor_data")
        .select("heart_rate, temperature, activity_level, sensor_time")
        .eq("pet_id", pet.id)
        .order("sensor_time", { ascending: false })
        .limit(1);
      if (data && data.length > 0) {
        setSensorData(data[0]);
        setPrevHeartRate(data[0].heart_rate);
        setPrevTemp(data[0].temperature);
setLastUpdate(new Date(data[0].sensor_time).toLocaleTimeString('en-US', { 
  timeZone: 'Asia/Colombo',
  hour: '2-digit', 
  minute: '2-digit',
  second: '2-digit',
  hour12: false 
}));        setIsConnected(true);
      }
    };
    fetchSensorData();

    const channel = supabase
      .channel(`sensor_updates_${pet.id}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'sensor_data', 
          filter: `pet_id=eq.${pet.id}` 
        },
        (payload) => {
          const newData = {
            heart_rate: payload.new.heart_rate,
            temperature: payload.new.temperature,
            activity_level: payload.new.activity_level,
            sensor_time: payload.new.sensor_time
          };
          
          // Store previous values for animation
          if (sensorData) {
            setPrevHeartRate(sensorData.heart_rate);
            setPrevTemp(sensorData.temperature);
          }
          
          setSensorData(newData);
setLastUpdate(new Date(payload.new.sensor_time).toLocaleTimeString('en-US', { 
  timeZone: 'Asia/Colombo',
  hour: '2-digit', 
  minute: '2-digit',
  second: '2-digit',
  hour12: false 
}));          setIsLive(true);
          setIsConnected(true);
          
          // Reset live indicator after 2 seconds
          setTimeout(() => setIsLive(false), 2000);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Realtime connected for ${pet.name}`);
        }
      });

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [pet.id, pet.name]);

  // Helper to show trend arrow
  const getTrend = (current: number, previous: number | null) => {
    if (!previous) return null;
    if (current > previous) return <span className="text-green-500 text-[8px] ml-0.5">↑</span>;
    if (current < previous) return <span className="text-red-500 text-[8px] ml-0.5">↓</span>;
    return <span className="text-gray-400 text-[8px] ml-0.5">→</span>;
  };

  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
      onClick={() => onSelect(pet)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden">
              {pet.photo_url ? (
                <img src={pet.photo_url} alt={pet.name} className="h-full w-full object-cover" />
              ) : (
                <PetAvatarIcon species={pet.species} className="h-6 w-6 text-primary" />
              )}
            </div>
            {isConnected && (
              <div className="absolute -right-0.5 -top-0.5">
                <div className={`h-2.5 w-2.5 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-green-500'} ring-2 ring-white`} />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold truncate">{pet.name}</h3>
            <p className="text-xs text-muted-foreground">{pet.breed || pet.species}</p>
            <p className="text-xs text-muted-foreground">{pet.age} yrs • {pet.weight} kg</p>
          </div>
        </div>

        {pet.health_score !== undefined && (
          <div className="mt-3 pt-2 border-t">
            <div className="flex items-center justify-between text-xs">
              <span>Health Score</span>
              <span className={`font-bold ${
                pet.health_score >= 80 ? 'text-green-600' :
                pet.health_score >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>{pet.health_score}%</span>
            </div>
            <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  pet.health_score >= 80 ? 'bg-green-500' :
                  pet.health_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${pet.health_score}%` }}
              />
            </div>
          </div>
        )}

        {sensorData && (
          <div className="mt-3 pt-2 border-t">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <p className="flex items-center gap-1 text-[10px] font-medium text-gray-500">
                  {isConnected ? (
                    <Wifi className={`h-2.5 w-2.5 ${isLive ? 'text-green-500 animate-pulse' : 'text-green-500'}`} />
                  ) : (
                    <WifiOff className="h-2.5 w-2.5 text-red-500" />
                  )}
                  Live Data
                </p>
                {lastUpdate && (
                  <span className="text-[8px] text-gray-400 flex items-center gap-0.5">
                    <Clock className="h-2 w-2" />
                    {lastUpdate}
                  </span>
                )}
              </div>
              {isLive && (
                <Badge className="bg-green-500 px-1 py-0 text-[8px] text-white animate-pulse">
                  LIVE
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {/* Heart Rate */}
              <div className={`rounded-lg bg-blue-50 p-1.5 text-center transition-all duration-300 ${isLive ? 'ring-2 ring-blue-300 scale-105' : ''}`}>
                <Heart className={`mx-auto h-3 w-3 text-red-500 ${isLive ? 'animate-pulse' : ''}`} />
                <p className="mt-0.5 text-xs font-bold flex items-center justify-center">
                  {sensorData.heart_rate}
                  {getTrend(sensorData.heart_rate, prevHeartRate)}
                </p>
                <p className="text-[8px] text-gray-500">BPM</p>
              </div>
              
              {/* Temperature */}
              <div className={`rounded-lg bg-orange-50 p-1.5 text-center transition-all duration-300 ${isLive ? 'ring-2 ring-orange-300 scale-105' : ''}`}>
                <Thermometer className={`mx-auto h-3 w-3 text-orange-500 ${isLive ? 'animate-pulse' : ''}`} />
                <p className="mt-0.5 text-xs font-bold flex items-center justify-center">
                  {sensorData.temperature}°
                  {getTrend(sensorData.temperature, prevTemp)}
                </p>
                <p className="text-[8px] text-gray-500">Temp</p>
              </div>
              
              {/* Activity Level */}
              <div className={`rounded-lg bg-green-50 p-1.5 text-center transition-all duration-300 ${isLive ? 'ring-2 ring-green-300 scale-105' : ''}`}>
                <Activity className={`mx-auto h-3 w-3 text-green-500 ${isLive ? 'animate-pulse' : ''}`} />
                <p className="mt-0.5 text-xs font-bold capitalize">{sensorData.activity_level?.slice(0, 3)}</p>
                <p className="text-[8px] text-gray-500">Activity</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Custom list item renderer for DataView
function PetListItemRenderer({ pet, onSelect }: { pet: Pet; onSelect: (pet: Pet) => void }) {
  return (
    <div 
      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => onSelect(pet)}
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden">
          {pet.photo_url ? (
            <img src={pet.photo_url} alt={pet.name} className="h-full w-full object-cover rounded-full" />
          ) : (
            <PetAvatarIcon species={pet.species} className="h-5 w-5 text-primary" />
          )}
        </div>
        <div>
          <p className="font-medium">{pet.name}</p>
          <p className="text-xs text-muted-foreground">{pet.breed || pet.species}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm">{pet.age} yrs • {pet.weight} kg</p>
        <p className="text-xs text-muted-foreground">
          Joined: {new Date(pet.created_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

// IMAGE UPLOAD MODAL
function ImageUploadModal({ 
  isOpen, 
  onClose, 
  petId, 
  petName, 
  onAnalyze,
  isAnalyzing
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  petId: string; 
  petName: string; 
  onAnalyze: (petId: string, petName: string, imageFile: File) => Promise<void>;
  isAnalyzing: boolean;
}) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedImage) return;
    await onAnalyze(petId, petName, selectedImage);
    setSelectedImage(null);
    setPreview(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md overflow-visible">
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.25)] border border-gray-100">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <Scan className="h-5 w-5" />
                  <span className="text-xs font-semibold uppercase tracking-wider">AI Powered</span>
                </div>
                <h2 className="text-2xl font-bold">AI Health Scan</h2>
                <p className="mt-1 text-sm text-white/90">Upload a photo of {petName}</p>
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white transition-all duration-200 hover:bg-white hover:text-gray-800 hover:scale-110 ring-1 ring-white/30"
              >
                <X className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="bg-gray-50 p-6">
            <div className="mb-6 flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-purple-100 to-pink-100">
                <PawPrint className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Selected Pet</p>
                <p className="text-lg font-bold text-gray-800">{petName}</p>
              </div>
            </div>

            {!preview ? (
              <label className="group block cursor-pointer">
                <div className="rounded-xl border-2 border-dashed border-purple-400 bg-gradient-to-br from-white to-purple-50 p-8 text-center transition-all duration-300 group-hover:border-purple-600 group-hover:shadow-lg group-hover:scale-[1.02]">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-purple-200 to-pink-200 shadow-md transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg">
                    <Camera className="h-10 w-10 text-purple-600" />
                  </div>
                  <p className="text-lg font-semibold text-gray-700">Click to Upload Photo</p>
                  <p className="mt-2 text-sm text-gray-500">Take a photo of your pet&apos;s affected area</p>
                  <div className="mt-4 flex justify-center gap-2">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">JPG</span>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">PNG</span>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">JPEG</span>
                  </div>
                  <p className="mt-3 text-xs text-gray-400">Maximum file size: 10MB</p>
                </div>
                <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              </label>
            ) : (
              <div className="relative overflow-hidden rounded-xl bg-white p-2 shadow-[0_10px_30px_rgba(0,0,0,0.2)] border border-gray-100">
                <img src={preview} alt="Preview" className="h-64 w-full rounded-lg object-cover" />
                <button
                  onClick={() => { setSelectedImage(null); setPreview(null); }}
                  className="absolute right-2 top-2 rounded-full bg-red-600 p-2 text-white shadow-lg transition-all hover:bg-red-700 hover:scale-110"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-green-50 p-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-medium text-green-700">Image ready for analysis</p>
                </div>
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={!selectedImage || isAnalyzing}
              className="mt-6 h-12 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-base font-semibold text-white shadow-[0_10px_25px_rgba(168,85,247,0.4)] transition-all duration-300 hover:shadow-[0_15px_35px_rgba(168,85,247,0.6)] hover:scale-[1.02] disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing Image...
                </>
              ) : (
                <>
                  <Scan className="mr-2 h-5 w-5" />
                  {selectedImage ? "Start Health Analysis" : "Select a Photo First"}
                </>
              )}
            </Button>

            <p className="mt-4 text-center text-xs text-gray-500">
              🤖 Our AI will analyze the image for potential health issues
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ANALYSIS RESULT MODAL
function AnalysisModal({ result, petName, onClose }: { result: AnalysisResult | null; petName: string; onClose: () => void }) {
  useEffect(() => {
    if (result) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [result]);

  if (!result) return null;

  const getHealthColor = (score: number) => {
    if (score >= 80) return "from-green-500 to-emerald-600";
    if (score >= 60) return "from-yellow-500 to-orange-500";
    return "from-red-500 to-rose-600";
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg">
        <div className="max-h-[85vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
          <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  <span className="text-xs font-semibold uppercase tracking-wider">AI Analysis Report</span>
                </div>
                <h2 className="text-2xl font-bold">{petName}&apos;s Health</h2>
                <p className="mt-1 text-sm text-white/80">{new Date(result.timestamp).toLocaleString()}</p>
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white transition-all duration-200 hover:bg-white hover:text-gray-800 hover:scale-110 ring-1 ring-white/30"
              >
                <X className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="bg-gray-50 p-6 space-y-6">
            {result.detected_disease && (
              <div className="rounded-xl bg-amber-50 p-5 border-2 border-amber-200">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-amber-500 shadow-lg">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Detected Condition</p>
                    <p className="mt-1 text-xl font-bold text-amber-900">{result.detected_disease}</p>
                    {result.confidence && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-amber-800">Confidence Score</span>
                          <span className="font-semibold text-amber-900">{result.confidence}%</span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-amber-200">
                          <div 
                            className="h-full rounded-full bg-amber-600 transition-all duration-1000" 
                            style={{ width: `${result.confidence}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <div className="mt-3 rounded-lg bg-amber-100 p-2">
                      <p className="text-sm text-amber-800">⚠️ Please consult a veterinarian for proper diagnosis and treatment</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className={`rounded-xl bg-gradient-to-br ${getHealthColor(result.healthScore)} p-6 text-center text-white shadow-lg`}>
              <p className="text-sm font-medium uppercase tracking-wide opacity-90">Overall Health Score</p>
              <p className="mt-2 text-6xl font-bold">{result.healthScore}</p>
              <p className="text-sm opacity-90">out of 100</p>
              <div className="mt-4">
                <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium backdrop-blur-sm">
                  {result.healthScore >= 80 ? "Excellent Health" : result.healthScore >= 60 ? "Moderate Risk" : "Needs Immediate Attention"}
                </span>
              </div>
            </div>

            {result.anomalies && result.anomalies.length > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <h4 className="mb-3 flex items-center gap-2 font-semibold text-red-800">
                  <AlertTriangle className="h-4 w-4" />
                  Areas of Concern
                </h4>
                <div className="space-y-2">
                  {result.anomalies.map((anomaly, idx) => (
                    <div key={idx} className="flex items-start gap-2 rounded-lg bg-white p-3 text-sm text-red-700 shadow-sm">
                      <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500" />
                      {anomaly}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl bg-blue-50 p-5">
              <h3 className="mb-4 flex items-center gap-2 font-bold text-blue-800">
                <CheckCircle className="h-5 w-5" />
                Recommendations
              </h3>
              <div className="space-y-3">
                {result.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex gap-3 rounded-lg bg-white p-3 shadow-sm">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                      {idx + 1}
                    </div>
                    <p className="flex-1 text-sm text-gray-700">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 flex gap-3 border-t bg-white p-4">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Close
            </Button>
            <Button className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl">
              Schedule Vet Visit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyLogs, setDailyLogs] = useState<DailyLogEntry[]>([]);
  const [sensorActivities, setSensorActivities] = useState<SensorActivity[]>([]);
  const [analyzingPetId, setAnalyzingPetId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedPetName, setSelectedPetName] = useState<string>("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState<string>("");
  const [stats, setStats] = useState<DashboardStats>({
    totalPets: 0,
    activeToday: 0,
    avgSleep: "0 hrs",
    healthScore: 0,
  });

  const userPlan = (user?.plan || "basic") as "basic" | "standard" | "premium";
  const canAddMore = canAddMorePets(userPlan, pets.length);
  const hasAIAccess = userPlan === "premium";

  const refreshDashboard = useCallback(async () => {
    await fetchDashboardData();
    await refreshUser();
    if (hasAIAccess) {
      await loadSensorActivities();
    }
    setRefreshTrigger(prev => prev + 1);
  }, [refreshUser, hasAIAccess]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshDashboard();
    }, 30000);
    return () => clearInterval(interval);
  }, [refreshDashboard]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshDashboard();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshDashboard]);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const checkRole = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'admin') {
        router.replace('/admin');
        return;
      }
      fetchDashboardData();
    };

    checkRole();
  }, [user, router, refreshTrigger]);

  useEffect(() => {
    if (hasAIAccess && pets.length > 0) {
      loadSensorActivities();
    }
  }, [hasAIAccess, pets]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: petsData } = await supabase
        .from("pets")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      const safePets = petsData ?? [];
      
      const petsWithHealth = await Promise.all(
        safePets.map(async (pet) => {
          const { data: predictions } = await supabase
            .from("predictions")
            .select("health_score")
            .eq("pet_id", pet.id)
            .order("prediction_date", { ascending: false })
            .limit(1);
          
          return {
            ...pet,
            health_score: predictions?.[0]?.health_score || Math.floor(Math.random() * 40) + 60
          };
        })
      );
      
      setPets(petsWithHealth);
      setStats(prev => ({ ...prev, totalPets: safePets.length }));

      if (petsWithHealth.length > 0) {
        const avgHealthScore = petsWithHealth.reduce((sum, pet) => sum + (pet.health_score || 0), 0) / petsWithHealth.length;
        setStats(prev => ({ ...prev, healthScore: Math.round(avgHealthScore) }));
      } else {
        setStats(prev => ({ ...prev, healthScore: 0 }));
      }

      if (safePets.length > 0) {
        const petIds = safePets.map(p => p.id);
        const { data: fetchedLogs } = await supabase
          .from("daily_logs")
          .select(`*, pets!inner (name, species)`)
          .in("pet_id", petIds)
          .order("log_date", { ascending: false })
          .limit(5);
        
        if (fetchedLogs) {
          const logs = fetchedLogs as DailyLogEntry[];
          setDailyLogs(logs);
          const sleepLogs = logs.filter(l => l.sleep_duration);
          if (sleepLogs.length > 0) {
            const avgSleep = sleepLogs.reduce((acc, l) => acc + (l.sleep_duration ?? 0), 0) / sleepLogs.length;
            setStats(prev => ({ ...prev, avgSleep: `${avgSleep.toFixed(1)} hrs` }));
          }
          const today = new Date().toISOString().split("T")[0];
          setStats(prev => ({ ...prev, activeToday: logs.filter(l => l.log_date === today).length || safePets.length }));
        }
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSensorActivities = async () => {
    if (!hasAIAccess || pets.length === 0) return;
    
    try {
      const petIds = pets.map(p => p.id);
      const { data, error } = await supabase
        .from("activity_logs")
        .select(`
          id,
          pet_id,
          activity_type,
          activity_date,
          duration_minutes,
          distance_km,
          calories_burned,
          pets!inner (name, species)
        `)
        .in("pet_id", petIds)
        .order("activity_date", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      type RawActivityData = {
        id: string;
        pet_id: string;
        activity_type: string;
        activity_date: string;
        duration_minutes: number;
        distance_km: number;
        calories_burned: number;
        pets: Array<{ name: string; species: string }>;
      };
      
      const transformedData: SensorActivity[] = (data as RawActivityData[] || []).map((item) => ({
        id: item.id,
        pet_id: item.pet_id,
        activity_type: item.activity_type,
        activity_date: item.activity_date,
        duration_minutes: item.duration_minutes,
        distance_km: item.distance_km,
        calories_burned: item.calories_burned,
        pets: item.pets && item.pets[0] ? { 
          name: item.pets[0].name, 
          species: item.pets[0].species 
        } : null,
      }));
      
      setSensorActivities(transformedData);
    } catch (error) {
      console.error("Error loading sensor activities:", error);
    }
  };

  const handleOpenUploadModal = (petId: string, petName: string) => {
    setSelectedPetId(petId);
    setSelectedPetName(petName);
    setShowUploadModal(true);
  };

  const handleAnalyzeImage = async (petId: string, petName: string, imageFile: File) => {
    setAnalyzingPetId(petId);
    try {
      const formData = new FormData();
      formData.append("petId", petId);
      formData.append("petName", petName);
      formData.append("image", imageFile);
      const response = await fetch("/api/analyze-health", { method: "POST", body: formData });
      const data = await response.json();
      if (data.success) {
        setAnalysisResult(data.analysis);
        refreshDashboard();
      } else {
        alert(data.error || "Analysis failed");
      }
    } catch (error) {
      alert("Network error");
    } finally {
      setAnalyzingPetId(null);
    }
  };

  const handleActionComplete = () => {
    refreshDashboard();
  };

  const handlePetSelect = (pet: Pet) => {
    router.push(`/pets/${pet.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Pets</p>
                  <p className="text-2xl font-bold">{stats.totalPets}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <PawPrint className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Today</p>
                  <p className="text-2xl font-bold">{stats.activeToday}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg. Sleep</p>
                  <p className="text-2xl font-bold">{stats.avgSleep}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Moon className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Health Score</p>
                  <p className="text-2xl font-bold">{stats.healthScore}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                  <Heart className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {userPlan === "basic" && (
          <Alert className="mb-6 rounded-xl border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
            <Crown className="h-4 w-4 text-primary" />
            <AlertTitle>Upgrade to Unlock AI Health Scan</AlertTitle>
            <AlertDescription>
              Get AI-powered image analysis with Premium plan.
              <Link href="/pricing">
                <Button size="sm" className="mt-2 h-7 text-xs">View Plans <ChevronRight className="ml-1 h-3 w-3" /></Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-6 flex justify-end">
          {canAddMore ? (
            <Link href="/pets/new">
              <Button size="sm">
                <Plus className="mr-1.5 h-4 w-4" />
                Add Pet
              </Button>
            </Link>
          ) : (
            <Button size="sm" disabled>Pet Limit Reached</Button>
          )}
        </div>

        <div className="mb-8">
          <h2 className="flex items-center gap-2 text-lg font-semibold mb-3">
            <PawPrint className="h-5 w-5 text-primary" />
            My Pets
          </h2>
          
          <DataView
            data={pets}
            viewMode="grid"
            showFilters={true}
            showSearch={true}
            itemsPerPage={8}
            emptyMessage="No pets yet. Click 'Add Pet' to get started!"
            onItemClick={handlePetSelect}
            renderCard={(pet: Pet) => <PetCard pet={pet} onSelect={handlePetSelect} />}
            renderListItem={(pet: Pet) => <PetListItemRenderer pet={pet} onSelect={handlePetSelect} />}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              {hasAIAccess 
                ? "Real-time sensor data from your pets" 
                : "Upgrade to Premium to see real-time pet activities"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!hasAIAccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Crown className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Unlock Real-Time Activity Tracking</h3>
                <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
                  Upgrade to Premium to see your pet&apos;s real-time activities including walks, runs, play time, and more from IoT sensors.
                </p>
                <Link href="/pricing">
                  <Button className="bg-gradient-to-r from-primary to-accent text-white">
                    Upgrade to Premium
                  </Button>
                </Link>
              </div>
            ) : sensorActivities.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                <p className="text-muted-foreground">No sensor activities yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Connect IoT sensors to start tracking your pet&apos;s activities
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sensorActivities.map((activity) => {
                  const getActivityIcon = () => {
                    switch(activity.activity_type?.toLowerCase()) {
                      case 'walk': return '🚶‍♂️';
                      case 'run': return '🏃‍♂️';
                      case 'play': return '🎾';
                      case 'rest': return '😴';
                      default: return '🐾';
                    }
                  };
                  
                  return (
                    <div key={activity.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                        {getActivityIcon()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <p className="text-sm font-medium">
                            <span className="font-semibold">{activity.pets?.name}</span>
                            <span className="text-muted-foreground ml-1">
                              {activity.activity_type?.toLowerCase() || "was active"}
                            </span>
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            {new Date(activity.activity_date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Badge>
                        </div>
                        <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                          {activity.duration_minutes > 0 && (
                            <span>⏱️ {activity.duration_minutes} min</span>
                          )}
                          {activity.distance_km > 0 && (
                            <span>📏 {activity.distance_km} km</span>
                          )}
                          {activity.calories_burned > 0 && (
                            <span>🔥 {activity.calories_burned} cal</span>
                          )}
                        </div>
                      </div>
                      <Link href={`/pets/${activity.pet_id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ImageUploadModal 
        isOpen={showUploadModal} 
        onClose={() => setShowUploadModal(false)} 
        petId={selectedPetId} 
        petName={selectedPetName} 
        onAnalyze={handleAnalyzeImage} 
        isAnalyzing={analyzingPetId !== null} 
      />
      <AnalysisModal 
        result={analysisResult} 
        petName={selectedPetName} 
        onClose={() => setAnalysisResult(null)} 
      />

      <Chatbot />
    </div>
  );
}