// app/insights/page.tsx
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth/auth-guard"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card3D, FloatingElement } from "@/components/ui/3d-card"
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
  ArrowLeft
} from "lucide-react"
import { mlPredictor } from "@/lib/ml/predictor"
import { DailyLog, HealthPrediction, ActivityPrediction, Anomaly } from "@/types"

// Mock data for demonstration
const mockPets = [
  { id: "1", name: "Max", species: "Golden Retriever" },
  { id: "2", name: "Luna", species: "Siamese Cat" },
  { id: "3", name: "Rio", species: "Parrot" },
]

const mockLogs: DailyLog[] = [
  { id: "1", petId: "1", date: "2026-03-01", activityDuration: 45, mood: "happy", sleepDuration: 8 },
  { id: "2", petId: "1", date: "2026-03-02", activityDuration: 30, mood: "calm", sleepDuration: 7.5 },
  { id: "3", petId: "1", date: "2026-03-03", activityDuration: 60, mood: "playful", sleepDuration: 9 },
  { id: "4", petId: "1", date: "2026-03-04", activityDuration: 20, mood: "tired", sleepDuration: 6 },
  { id: "5", petId: "1", date: "2026-03-05", activityDuration: 55, mood: "happy", sleepDuration: 8.5 },
]

export default function InsightsPage() {
  const [selectedPet, setSelectedPet] = useState("1")
  const [loading, setLoading] = useState(false)
  const [prediction, setPrediction] = useState<HealthPrediction | null>(null)
  const [activityPrediction, setActivityPrediction] = useState<ActivityPrediction | null>(null)
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])

  useEffect(() => {
    if (selectedPet) {
      generateInsights()
    }
  }, [selectedPet])

  const generateInsights = async () => {
    setLoading(true)
    try {
      const [health, activity, anomalyData] = await Promise.all([
        mlPredictor.predictHealth(selectedPet, 30),
        mlPredictor.predictActivity(mockLogs),
        mlPredictor.detectAnomalies(mockLogs)
      ])
      
      setPrediction(health)
      setActivityPrediction(activity)
      setAnomalies(anomalyData)
    } catch (error) {
      console.error("Failed to generate insights:", error)
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (trend: string) => {
    switch(trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />
      default: return <Minus className="h-4 w-4 text-yellow-500" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch(trend) {
      case 'improving': return 'bg-green-100 text-green-700'
      case 'declining': return 'bg-red-100 text-red-700'
      default: return 'bg-yellow-100 text-yellow-700'
    }
  }

  const selectedPetData = mockPets.find(p => p.id === selectedPet)

  return (
    <AuthGuard requiredPlan="standard" featureName="AI Insights">
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <FloatingElement delay={0}>
            <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          </FloatingElement>
          <FloatingElement delay={2}>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
          </FloatingElement>
        </div>

        <Navbar />
        
        <div className="container mx-auto px-4 py-8 relative z-10">
          {/* Back Button */}
          <div className="mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Brain className="h-8 w-8 text-primary" />
                AI Insights
              </h1>
              <p className="text-muted-foreground">
                LSTM neural network predictions for your pet&apos;s health
              </p>
            </div>
            
            <Select value={selectedPet} onValueChange={setSelectedPet}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select pet" />
              </SelectTrigger>
              <SelectContent>
                {mockPets.map((pet) => (
                  <SelectItem key={pet.id} value={pet.id}>
                    {pet.name} ({pet.species})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <Card3D>
              <Card>
                <CardContent className="py-16">
                  <div className="text-center space-y-4">
                    <Brain className="h-16 w-16 animate-pulse mx-auto text-primary" />
                    <div>
                      <p className="text-lg font-medium">AI is analyzing your pet&apos;s data...</p>
                      <p className="text-sm text-muted-foreground">Using LSTM neural network with 30-day history</p>
                    </div>
                    <Progress value={45} className="w-64 mx-auto" />
                  </div>
                </CardContent>
              </Card>
            </Card3D>
          ) : prediction && activityPrediction ? (
            <div className="space-y-6">
              {/* Health Score Card */}
              <Card3D glare>
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
                      LSTM model confidence: {(prediction.confidence * 100).toFixed(0)}% based on 30-day analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="text-5xl font-bold text-primary">{prediction.score}</div>
                      <div className="flex-1">
                        <Progress value={prediction.score} className="h-3" />
                        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                          <span>Poor</span>
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
                            {prediction.recommendations.map((rec: string, i: number) => (
                              <li key={i} className="text-sm">{rec}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>

                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Detected Risks</AlertTitle>
                        <AlertDescription>
                          <ul className="list-disc pl-4 mt-2 space-y-1">
                            {prediction.risks.map((risk: string, i: number) => (
                              <li key={i} className="text-sm">{risk}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    </div>
                  </CardContent>
                </Card>
              </Card3D>

              {/* Activity Prediction */}
              <Card3D>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-500" />
                      Activity Forecast (Next 7 Days)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Expected Daily Activity</p>
                        <p className="text-2xl font-bold">{activityPrediction.expectedActivity} min</p>
                        <p className="text-xs text-muted-foreground mt-1">↑ 10% from baseline</p>
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
                        <p className="text-sm text-muted-foreground">Predicted Pattern</p>
                        <p className="text-sm font-medium mt-1">{activityPrediction.pattern.join(' → ')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Card3D>

              {/* Anomaly Detection */}
              {anomalies.length > 0 && (
                <Card3D>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-yellow-500">
                        <AlertTriangle className="h-5 w-5" />
                        Anomalies Detected ({anomalies.length})
                      </CardTitle>
                      <CardDescription>
                        Unusual patterns identified by LSTM model
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {anomalies.map((anomaly, i) => (
                          <Alert key={i} variant={anomaly.severity === 'high' ? 'destructive' : 'default'}>
                            <AlertTitle className="flex justify-between items-center">
                              <span className="capitalize">{anomaly.type.replace('_', ' ')}</span>
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
                    </CardContent>
                  </Card>
                </Card3D>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-4">
                <Button onClick={generateInsights} variant="outline" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Refresh Predictions
                </Button>
                <Button className="gap-2" asChild>
                  <Link href={`/pets/${selectedPet}/logs`}>
                    View Raw Data
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <Card3D>
              <Card>
                <CardContent className="py-16 text-center">
                  <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
                  <p className="text-muted-foreground">
                    Start logging your pet&apos;s activities to generate insights
                  </p>
                </CardContent>
              </Card>
            </Card3D>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}