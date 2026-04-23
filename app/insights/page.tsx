"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Activity,
  Heart,
  Moon,
  ArrowLeft,
  Loader2,
  Crown
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/auth-provider";
import { getPlanLimit } from "@/lib/plan-config";

type Pet = {
  id: string;
  name: string;
  species: string;
  breed: string;
};

type DailyLog = {
  id: string;
  log_date: string;
  mood: string;
  activity_type: string;
  activity_duration: number;
  sleep_duration: number;
  meal_portions: number;
  treats: number;
  water_intake: number;
};

type HealthPrediction = {
  score: number;
  trend: string;
  confidence: number;
  recommendations: string[];
  risks: string[];
};

type ActivityPrediction = {
  expectedActivity: number;
  comparison: string;
  pattern: string[];
};

type Anomaly = {
  type: string;
  severity: string;
  description: string;
  date: string;
};

export default function InsightsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [fetchingPets, setFetchingPets] = useState(true);
  const [prediction, setPrediction] = useState<HealthPrediction | null>(null);
  const [activityPrediction, setActivityPrediction] = useState<ActivityPrediction | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [logCount, setLogCount] = useState(0);

  const userPlan = (user?.plan || "basic") as "basic" | "standard" | "premium";
  const isPremium = userPlan === "premium";
  const maxRecommendations = getPlanLimit(userPlan, "maxRecommendations");
  const maxAnomalies = getPlanLimit(userPlan, "maxAnomalies");

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    fetchUserPets();
  }, [user, router]);

  const fetchUserPets = async () => {
    setFetchingPets(true);
    try {
      const { data, error } = await supabase
        .from("pets")
        .select("id, name, species, breed")
        .eq("user_id", user?.id);

      if (error) throw error;
      
      setPets(data || []);
      if (data && data.length > 0) {
        setSelectedPet(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching pets:", error);
    } finally {
      setFetchingPets(false);
    }
  };

  useEffect(() => {
    if (selectedPet) {
      generateInsights();
    }
  }, [selectedPet]);

  const fetchPetLogs = async (petId: string): Promise<DailyLog[]> => {
    const { data, error } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("pet_id", petId)
      .order("log_date", { ascending: false })
      .limit(30);

    if (error) {
      console.error("Error fetching logs:", error);
      return [];
    }
    setLogCount(data?.length || 0);
    return data || [];
  };

  // Calculate confidence based on actual data quality
  const calculateConfidence = (logs: DailyLog[]): number => {
    if (logs.length === 0) return 0.3;
    
    let confidence = 0.5; // base
    
    // More logs = higher confidence
    if (logs.length >= 30) confidence += 0.25;
    else if (logs.length >= 14) confidence += 0.2;
    else if (logs.length >= 7) confidence += 0.15;
    else if (logs.length >= 3) confidence += 0.1;
    
    // Check data completeness (logs with all fields filled)
    const completeLogs = logs.filter(log => 
      log.activity_duration && 
      log.activity_duration > 0 &&
      log.sleep_duration && 
      log.sleep_duration > 0 &&
      log.water_intake && 
      log.water_intake > 0 &&
      log.mood
    ).length;
    const completeness = completeLogs / logs.length;
    confidence += completeness * 0.15;
    
    // Check consistency (recent logs - last 7 days)
    const recentLogs = logs.slice(0, 7);
    if (recentLogs.length >= 5) confidence += 0.1;
    
    // Premium bonus
    if (isPremium) confidence += 0.05;
    
    return Math.min(0.95, Math.max(0.4, confidence));
  };

  const calculateTrendScore = (logs: DailyLog[]): number => {
    const avgActivity = logs.reduce((sum, log) => sum + (log.activity_duration || 0), 0) / logs.length;
    const avgSleep = logs.reduce((sum, log) => sum + (log.sleep_duration || 0), 0) / logs.length;
    const happyLogs = logs.filter(log => log.mood === "happy" || log.mood === "playful").length;
    const happyRatio = happyLogs / logs.length;
    
    let score = 70;
    if (avgActivity >= 30 && avgActivity <= 60) score += 15;
    if (avgSleep >= 8 && avgSleep <= 14) score += 10;
    if (happyRatio > 0.7) score += 10;
    return Math.min(100, Math.max(0, score));
  };

  const calculateHealthScore = (logs: DailyLog[]): HealthPrediction => {
    if (logs.length === 0) {
      return {
        score: 75,
        trend: "stable",
        confidence: calculateConfidence(logs),
        recommendations: ["Start logging your pet's daily activities to get better insights"],
        risks: ["Insufficient data for accurate prediction"]
      };
    }

    const avgActivity = logs.reduce((sum, log) => sum + (log.activity_duration || 0), 0) / logs.length;
    const avgSleep = logs.reduce((sum, log) => sum + (log.sleep_duration || 0), 0) / logs.length;
    const avgWater = logs.reduce((sum, log) => sum + (log.water_intake || 0), 0) / logs.length;
    
    let score = 70;
    
    // Activity scoring
    if (avgActivity >= 30 && avgActivity <= 60) score += 15;
    else if (avgActivity > 60) score += 10;
    else if (avgActivity > 15) score += 5;
    else if (avgActivity < 15) score -= 10;
    
    // Sleep scoring
    if (avgSleep >= 8 && avgSleep <= 14) score += 10;
    else if (avgSleep >= 6 && avgSleep <= 16) score += 5;
    else score -= 10;
    
    // Water intake scoring
    if (avgWater >= 0.5) score += 5;
    else score -= 5;
    
    // Mood scoring
    const happyLogs = logs.filter(log => log.mood === "happy" || log.mood === "playful").length;
    const happyRatio = happyLogs / logs.length;
    if (happyRatio > 0.7) score += 10;
    else if (happyRatio > 0.4) score += 5;
    else score -= 10;
    
    // Trend calculation
    const recentLogs = logs.slice(0, 7);
    const olderLogs = logs.slice(7, 14);
    const recentScore = recentLogs.length > 0 ? calculateTrendScore(recentLogs) : score;
    const olderScore = olderLogs.length > 0 ? calculateTrendScore(olderLogs) : score;
    
    let trend = "stable";
    if (recentScore > olderScore + 5) trend = "improving";
    else if (recentScore < olderScore - 5) trend = "declining";
    
    // Generate recommendations based on actual data
    let recommendations: string[] = [];
    if (avgActivity < 30) recommendations.push("Increase daily walks by 15 minutes");
    if (avgActivity > 90) recommendations.push("Monitor for over-exercise; ensure adequate rest");
    if (avgSleep < 8) recommendations.push("Ensure quiet sleeping environment");
    if (avgSleep > 16) recommendations.push("Monitor for lethargy; consult vet if persistent");
    if (avgWater < 0.5) recommendations.push("Encourage more water intake");
    if (happyRatio < 0.5) recommendations.push("Add more playtime and interactive toys");
    
    if (recommendations.length === 0) {
      recommendations.push("Great job! Keep maintaining this healthy routine");
    }
    
    // Generate risks based on actual data
    let risks: string[] = [];
    if (avgActivity < 15) risks.push("Low activity level detected - risk of obesity");
    if (avgSleep < 6) risks.push("Sleep deprivation risk - may affect immune system");
    if (avgSleep > 16) risks.push("Excessive sleeping - possible underlying health issue");
    if (avgWater < 0.3) risks.push("Dehydration risk - monitor water intake");
    if (happyRatio < 0.3) risks.push("Persistent low mood - possible stress or illness");
    
    if (risks.length === 0 && logs.length >= 7) {
      risks.push("No major health risks detected");
    }
    
    // Apply plan limits
    const maxRecs = typeof maxRecommendations === 'number' ? maxRecommendations : 10;
    const maxRisks = typeof maxRecommendations === 'number' ? Math.min(maxRecommendations, 3) : 3;
    recommendations = recommendations.slice(0, maxRecs);
    risks = risks.slice(0, maxRisks);
    
    return {
      score: Math.min(100, Math.max(0, Math.round(score))),
      trend,
      confidence: calculateConfidence(logs),
      recommendations,
      risks
    };
  };

  const predictActivity = (logs: DailyLog[]): ActivityPrediction => {
    if (logs.length === 0) {
      return {
        expectedActivity: 30,
        comparison: "normal",
        pattern: ["No data available"]
      };
    }
    
    const avgActivity = logs.reduce((sum, log) => sum + (log.activity_duration || 0), 0) / logs.length;
    const recentActivity = logs.slice(0, 5).reduce((sum, log) => sum + (log.activity_duration || 0), 0) / 5;
    
    let comparison = "normal";
    if (recentActivity > avgActivity * 1.2) comparison = "above";
    else if (recentActivity < avgActivity * 0.8) comparison = "below";
    
    return {
      expectedActivity: Math.round(recentActivity),
      comparison,
      pattern: [`Based on ${logs.length} days of data, your pet's activity is ${comparison} average`]
    };
  };

  const detectAnomalies = (logs: DailyLog[]): Anomaly[] => {
    const anomalies: Anomaly[] = [];
    
    if (logs.length === 0) return anomalies;
    
    const avgActivity = logs.reduce((sum, log) => sum + (log.activity_duration || 0), 0) / logs.length;
    
    const lowActivityDays = logs.filter(log => log.activity_duration < avgActivity * 0.3);
    if (lowActivityDays.length > 0) {
      anomalies.push({
        type: "low_activity",
        severity: "medium",
        description: `${lowActivityDays.length} day(s) with significantly lower activity than usual`,
        date: lowActivityDays[0].log_date
      });
    }
    
    const poorSleepDays = logs.filter(log => log.sleep_duration < 6 || log.sleep_duration > 16);
    if (poorSleepDays.length > 0) {
      anomalies.push({
        type: "sleep_disturbance",
        severity: "medium",
        description: `${poorSleepDays.length} day(s) with unusual sleep patterns`,
        date: poorSleepDays[0].log_date
      });
    }
    
    const sadDays = logs.filter(log => log.mood === "tired" || log.mood === "anxious");
    if (sadDays.length > 3) {
      anomalies.push({
        type: "mood_change",
        severity: "low",
        description: "Persistent low mood detected over multiple days",
        date: sadDays[0].log_date
      });
    }
    
    const maxAnom = typeof maxAnomalies === 'number' ? maxAnomalies : 5;
    return anomalies.slice(0, maxAnom);
  };

  const generateInsights = async () => {
    setLoading(true);
    try {
      const logs = await fetchPetLogs(selectedPet);
      
      if (logs.length === 0) {
        setPrediction(null);
        setActivityPrediction(null);
        setAnomalies([]);
        setLoading(false);
        return;
      }
      
      const healthPrediction = calculateHealthScore(logs);
      const activityPred = predictActivity(logs);
      const anomalyData = detectAnomalies(logs);
      
      setPrediction(healthPrediction);
      setActivityPrediction(activityPred);
      setAnomalies(anomalyData);
    } catch (error) {
      console.error("Failed to generate insights:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch(trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch(trend) {
      case 'improving': return 'bg-green-100 text-green-700';
      case 'declining': return 'bg-red-100 text-red-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return "High";
    if (confidence >= 0.6) return "Medium";
    return "Low";
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-100 text-green-700";
    if (confidence >= 0.6) return "bg-yellow-100 text-yellow-700";
    return "bg-gray-100 text-gray-700";
  };

  const selectedPetData = pets.find(p => p.id === selectedPet);

  if (fetchingPets) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (pets.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <Brain className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Pets Found</h2>
          <p className="text-muted-foreground mb-4">
            Add a pet first to get AI-powered health insights
          </p>
          <Link href="/pets/new">
            <Button>Add Your First Pet</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Brain className="h-8 w-8 text-primary" />
              AI Insights
            </h1>
            <p className="text-muted-foreground">
              Health predictions based on your pet&apos;s daily logs
              {!isPremium && (
                <Badge className="ml-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white">
                  <Crown className="h-3 w-3 mr-1" />
                  Upgrade for More
                </Badge>
              )}
            </p>
          </div>
          
          <Select value={selectedPet} onValueChange={setSelectedPet}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select pet" />
            </SelectTrigger>
            <SelectContent>
              {pets.map((pet) => (
                <SelectItem key={pet.id} value={pet.id}>
                  {pet.name} ({pet.species})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Data Quality Indicator */}
        {logCount > 0 && (
          <div className="mb-4 flex items-center justify-end gap-2">
            <span className="text-xs text-muted-foreground">Data quality:</span>
            <Badge className={getConfidenceColor(prediction?.confidence || 0.5)}>
              {getConfidenceLabel(prediction?.confidence || 0.5)} confidence
              {logCount > 0 && ` (${logCount} days of data)`}
            </Badge>
          </div>
        )}

        {/* Upgrade Banner for Non-Premium Users */}
        {!isPremium && (
          <Alert className="mb-6 bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200">
            <Crown className="h-4 w-4 text-amber-600" />
            <AlertTitle>Upgrade to Premium for Full AI Insights</AlertTitle>
            <AlertDescription>
              Premium users get: More recommendations, complete anomaly detection, and real-time health monitoring.
              <Link href="/pricing">
                <Button size="sm" className="ml-4 bg-amber-600 hover:bg-amber-700">
                  Upgrade Now
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center space-y-4">
                <Brain className="h-16 w-16 animate-pulse mx-auto text-primary" />
                <div>
                  <p className="text-lg font-medium">AI is analyzing your pet&apos;s data...</p>
                  <p className="text-sm text-muted-foreground">Analyzing {logCount} days of activity logs</p>
                </div>
                <Progress value={65} className="w-64 mx-auto" />
              </div>
            </CardContent>
          </Card>
        ) : prediction && activityPrediction ? (
          <div className="space-y-6">
            {/* Health Score Card */}
            <Card className="border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    Health Prediction for {selectedPetData?.name}
                  </CardTitle>
                  <Badge className={getTrendColor(prediction.trend)}>
                    {getTrendIcon(prediction.trend)}
                    <span className="ml-1 capitalize">{prediction.trend}</span>
                  </Badge>
                </div>
                <CardDescription>
                  Based on {logCount} days of data | AI confidence: {(prediction.confidence * 100).toFixed(0)}% ({getConfidenceLabel(prediction.confidence)})
                  {!isPremium && " (Upgrade for higher accuracy)"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-5xl font-bold text-primary">{prediction.score}</div>
                  <div className="flex-1">
                    <Progress value={prediction.score} className="h-3" />
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>Needs Attention</span>
                      <span>Good</span>
                      <span>Excellent</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <Alert>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertTitle>AI Recommendations</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc pl-4 mt-2 space-y-1">
                        {prediction.recommendations.map((rec, i) => (
                          <li key={i} className="text-sm">{rec}</li>
                        ))}
                      </ul>
                      {!isPremium && (
                        <p className="text-xs text-muted-foreground mt-2">
                          🔒 Upgrade for more recommendations
                        </p>
                      )}
                    </AlertDescription>
                  </Alert>

                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Detected Risks</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc pl-4 mt-2 space-y-1">
                        {prediction.risks.map((risk, i) => (
                          <li key={i} className="text-sm">{risk}</li>
                        ))}
                      </ul>
                      {!isPremium && (
                        <p className="text-xs text-muted-foreground mt-2">
                          🔒 Upgrade for complete risk analysis
                        </p>
                      )}
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>

            {/* Activity Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  Activity Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Avg Daily Activity</p>
                    <p className="text-2xl font-bold">{activityPrediction.expectedActivity} min</p>
                    <p className="text-xs text-muted-foreground mt-1">Based on {logCount} days</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Activity Level</p>
                    <Badge variant={
                      activityPrediction.comparison === 'above' ? 'default' :
                      activityPrediction.comparison === 'normal' ? 'secondary' : 'destructive'
                    } className="mt-1">
                      {activityPrediction.comparison} average
                    </Badge>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Data Coverage</p>
                    <p className="text-sm font-medium mt-1">
                      {logCount} days logged
                    </p>
                  </div>
                </div>
                {activityPrediction.pattern[0] && (
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    {activityPrediction.pattern[0]}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Anomalies Section */}
            {anomalies.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-500">
                    <AlertTriangle className="h-5 w-5" />
                    Anomalies Detected ({anomalies.length})
                  </CardTitle>
                  <CardDescription>
                    Unusual patterns identified in your pet&apos;s behavior
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {anomalies.map((anomaly, i) => (
                      <Alert key={i} variant={anomaly.severity === 'high' ? 'destructive' : 'default'}>
                        <AlertTitle className="flex justify-between items-center">
                          <span className="capitalize">{anomaly.type.replace(/_/g, ' ')}</span>
                          <Badge variant={anomaly.severity === 'high' ? 'destructive' : 'outline'}>
                            {anomaly.severity} priority
                          </Badge>
                        </AlertTitle>
                        <AlertDescription>
                          {anomaly.description} on {new Date(anomaly.date).toLocaleDateString()}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                  {!isPremium && (
                    <p className="text-xs text-muted-foreground mt-3 text-center">
                      🔒 Upgrade to Premium to detect more anomalies
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-4">
              <Button onClick={generateInsights} variant="outline" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Refresh Insights
              </Button>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
              <p className="text-muted-foreground">
                Start logging your pet&apos;s daily activities to generate AI insights
              </p>
              <Button className="mt-4" onClick={() => router.push(`/pets/${selectedPet}/logs/new`)}>
                Add First Log
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}