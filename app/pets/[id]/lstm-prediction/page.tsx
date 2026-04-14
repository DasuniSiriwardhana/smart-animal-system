"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Heart, TrendingUp, TrendingDown, Minus, Activity, AlertTriangle, Loader2, Bell, Brain } from 'lucide-react';

type Prediction = {
  id: string;
  health_score: number;
  trend: string;
  confidence: number;
  recommendations: string;
  risks: string;
  prediction_date: string;
};

type Anomaly = {
  id: string;
  anomaly_type: string;
  severity: string;
  description: string;
  anomaly_date: string;
};

type PetType = {
  id: string;
  name: string;
};

export default function LSTMPredictionsPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const petId = params.id as string;
  
  const [pet, setPet] = useState<PetType | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [latestPrediction, setLatestPrediction] = useState<Prediction | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingAlert, setSendingAlert] = useState(false);
  const [alertSent, setAlertSent] = useState(false);

  const userPlan = user?.plan || 'basic';
  const isPremium = userPlan === 'premium';

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (petId && isPremium) {
      fetchPetData();
      fetchPredictions();
      fetchAnomalies();
    } else if (!isPremium) {
      setLoading(false);
    }
  }, [petId, user, isPremium]);

  const fetchPetData = async () => {
    const { data } = await supabase
      .from('pets')
      .select('name')
      .eq('id', petId)
      .single();
    if (data) setPet(data as PetType);
  };

  const fetchPredictions = async () => {
    const { data } = await supabase
      .from('predictions')
      .select('*')
      .eq('pet_id', petId)
      .order('prediction_date', { ascending: false })
      .limit(7);
    
    if (data && data.length > 0) {
      setPredictions(data as Prediction[]);
      setLatestPrediction(data[0] as Prediction);
    }
    setLoading(false);
  };

  const fetchAnomalies = async () => {
    const { data } = await supabase
      .from('anomalies')
      .select('*')
      .eq('pet_id', petId)
      .order('anomaly_date', { ascending: false })
      .limit(5);
    
    if (data) setAnomalies(data as Anomaly[]);
  };

  const sendEmailAlert = async () => {
    if (!latestPrediction) return;
    
    setSendingAlert(true);
    try {
      const response = await fetch('/api/send-health-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petName: pet?.name || 'Your Pet',
          ownerEmail: user?.email,
          healthScore: latestPrediction.health_score,
          trend: latestPrediction.trend,
          risks: latestPrediction.risks,
          recommendations: latestPrediction.recommendations,
        }),
      });
      
      if (response.ok) {
        setAlertSent(true);
        setTimeout(() => setAlertSent(false), 5000);
      }
    } catch (error) {
      console.error('Failed to send alert:', error);
    } finally {
      setSendingAlert(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'declining') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <Brain className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Premium Feature</h1>
          <p className="text-muted-foreground mb-4">
            LSTM Health Predictions are available for Premium users only.
          </p>
          <Link href="/pricing">
            <Button>Upgrade to Premium</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/pets/${petId}`} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to {pet?.name || 'Pet'}
            </Link>
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" />
            LSTM Health Predictions
          </h1>
          <p className="text-muted-foreground">Deep learning predictions for {pet?.name}&apos;s health</p>
        </div>

        {latestPrediction ? (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Current LSTM Prediction
                  </span>
                  <Badge className={getHealthColor(latestPrediction.health_score)}>
                    Score: {latestPrediction.health_score}/100
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Health Score</p>
                    <p className="text-3xl font-bold">{latestPrediction.health_score}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">LSTM Trend</p>
                    <div className="flex items-center justify-center gap-1">
                      {getTrendIcon(latestPrediction.trend)}
                      <span className="font-semibold capitalize">{latestPrediction.trend}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Model Confidence</p>
                    <p className="text-xl font-bold">{(latestPrediction.confidence * 100).toFixed(0)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Prediction Date</p>
                    <p className="text-sm">{new Date(latestPrediction.prediction_date).toLocaleDateString()}</p>
                  </div>
                </div>

                <Progress value={latestPrediction.health_score} className="mb-4" />

                {latestPrediction.health_score < 50 && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-600 animate-pulse" />
                        <span className="text-red-700 font-medium">
                          {latestPrediction.health_score < 30 
                            ? '🚨 EMERGENCY: Immediate vet care needed!' 
                            : '⚠️ LSTM Warning: Health at risk!'}
                        </span>
                      </div>
                      <Button 
                        size="sm" 
                        variant={alertSent ? "default" : "destructive"}
                        onClick={sendEmailAlert}
                        disabled={sendingAlert || alertSent}
                        className="gap-2"
                      >
                        {sendingAlert ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                        {sendingAlert ? 'Sending...' : alertSent ? 'Alert Sent!' : 'Send Alert'}
                      </Button>
                    </div>
                    <p className="text-sm text-red-700 mt-3">{latestPrediction.recommendations}</p>
                  </div>
                )}

                {latestPrediction.risks && (
                  <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                    <p className="text-sm font-medium mb-1">📋 LSTM Detected Risks:</p>
                    <p className="text-sm text-muted-foreground">{latestPrediction.risks}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {predictions.length > 1 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    LSTM Prediction History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {predictions.map((pred) => (
                      <div key={pred.id} className="flex items-center justify-between p-2 border-b">
                        <span className="text-sm">{new Date(pred.prediction_date).toLocaleDateString()}</span>
                        <div className="flex items-center gap-3 flex-1 mx-4">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                pred.health_score >= 80 ? 'bg-green-500' :
                                pred.health_score >= 60 ? 'bg-yellow-500' :
                                pred.health_score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${pred.health_score}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-8">{pred.health_score}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(pred.trend)}
                          <span className="text-xs capitalize">{pred.trend}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {anomalies.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-500">
                    <AlertTriangle className="h-5 w-5" />
                    LSTM Detected Anomalies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {anomalies.map((anomaly) => (
                      <div key={anomaly.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium capitalize">{anomaly.anomaly_type.replace(/_/g, ' ')}</p>
                          <p className="text-sm text-muted-foreground">{anomaly.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(anomaly.anomaly_date).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={anomaly.severity === 'high' ? 'destructive' : 'secondary'}>
                          {anomaly.severity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No LSTM predictions available yet</p>
              <p className="text-sm text-muted-foreground">Sensor data will generate predictions automatically</p>
              <Button 
                className="mt-4"
                onClick={async () => {
                  const response = await fetch('/api/generate-predictions', { method: 'POST' });
                  if (response.ok) {
                    alert('Predictions generation started! Refresh in a moment.');
                    setTimeout(() => window.location.reload(), 3000);
                  }
                }}
              >
                Generate Predictions Now
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}