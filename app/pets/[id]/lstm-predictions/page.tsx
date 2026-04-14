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
import { ArrowLeft, Brain, TrendingUp, TrendingDown, Minus, AlertTriangle, Loader2 } from 'lucide-react';

type Prediction = {
  id: string;
  health_score: number;
  trend: string;
  confidence: number;
  recommendations: string;
  risks: string;
  prediction_date: string;
};

export default function LSTMPredictionsPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const petId = params.id as string;
  
  const [petName, setPetName] = useState('');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [latestPrediction, setLatestPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (petId) {
      fetchPetName();
      fetchPredictions();
    }
  }, [petId, user, router]);

  const fetchPetName = async () => {
    const { data } = await supabase
      .from('pets')
      .select('name')
      .eq('id', petId)
      .single();
    if (data) setPetName(data.name);
  };

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('predictions')
        .select('*')
        .eq('pet_id', petId)
        .order('prediction_date', { ascending: false })
        .limit(7);

      if (data && data.length > 0) {
        setPredictions(data);
        setLatestPrediction(data[0]);
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
    } finally {
      setLoading(false);
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
        {/* Back Button */}
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/pets/${petId}`} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to {petName || 'Pet'}
            </Link>
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-indigo-600" />
            LSTM Health Forecast for {petName}
          </h1>
          <p className="text-muted-foreground">AI-powered health predictions based on historical sensor data</p>
        </div>

        {latestPrediction ? (
          <>
            {/* Current Prediction Card */}
            <Card className="mb-6 border-indigo-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-indigo-500" />
                    Current Health Prediction
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
                    <p className="text-sm text-muted-foreground">Trend</p>
                    <div className="flex items-center justify-center gap-1">
                      {getTrendIcon(latestPrediction.trend)}
                      <span className="font-semibold capitalize">{latestPrediction.trend}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Confidence</p>
                    <p className="text-xl font-bold">{(latestPrediction.confidence * 100).toFixed(0)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Predicted On</p>
                    <p className="text-sm">{new Date(latestPrediction.prediction_date).toLocaleDateString()}</p>
                  </div>
                </div>

                <Progress value={latestPrediction.health_score} className="mb-4" />

                {latestPrediction.health_score < 50 && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <span className="text-red-700 font-medium">
                        {latestPrediction.health_score < 30 
                          ? '🚨 EMERGENCY: Immediate vet care recommended!' 
                          : '⚠️ Warning: Health score below optimal range'}
                      </span>
                    </div>
                    <p className="text-sm text-red-700 mt-2">{latestPrediction.recommendations}</p>
                  </div>
                )}

                {latestPrediction.risks && (
                  <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                    <p className="text-sm font-medium mb-1">📋 Detected Risks:</p>
                    <p className="text-sm text-muted-foreground">{latestPrediction.risks}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Prediction History */}
            {predictions.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    7-Day Prediction History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {predictions.map((pred) => (
                      <div key={pred.id} className="flex items-center justify-between p-3 border-b">
                        <span className="text-sm">{new Date(pred.prediction_date).toLocaleDateString()}</span>
                        <div className="flex items-center gap-3 flex-1 mx-4">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                pred.health_score >= 80 ? 'bg-green-500' :
                                pred.health_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${pred.health_score}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-8">{pred.health_score}</span>
                        </div>
                        <div className="flex items-center gap-1 w-20">
                          {getTrendIcon(pred.trend)}
                          <span className="text-xs capitalize">{pred.trend}</span>
                        </div>
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
              <h3 className="font-semibold text-lg mb-2">No LSTM Predictions Yet</h3>
              <p className="text-muted-foreground mb-4">
                Connect IoT sensors to generate AI-powered health forecasts for {petName}.
              </p>
              <Button onClick={() => router.push(`/pets/${petId}`)}>
                Back to Pet Details
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}