// components/pets/HealthPredictions.tsx
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabaseClient';
import { Heart, TrendingUp, TrendingDown, Minus, AlertTriangle, Activity, Calendar, Bell } from 'lucide-react';

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

export function HealthPredictions({ petId, petName, ownerEmail }: { petId: string; petName: string; ownerEmail: string }) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [latestPrediction, setLatestPrediction] = useState<Prediction | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingAlert, setSendingAlert] = useState(false);

  useEffect(() => {
    fetchPredictions();
    fetchAnomalies();
  }, [petId]);

  const fetchPredictions = async () => {
    const { data } = await supabase
      .from('predictions')
      .select('*')
      .eq('pet_id', petId)
      .order('prediction_date', { ascending: false })
      .limit(7);
    
    if (data) {
      setPredictions(data);
      setLatestPrediction(data[0] || null);
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
    
    if (data) setAnomalies(data);
  };

  const sendEmailAlert = async () => {
    if (!latestPrediction || latestPrediction.health_score >= 50) return;
    
    setSendingAlert(true);
    try {
      const response = await fetch('/api/send-health-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petName,
          ownerEmail,
          healthScore: latestPrediction.health_score,
          trend: latestPrediction.trend,
          risks: latestPrediction.risks,
          recommendations: latestPrediction.recommendations,
        }),
      });
      
      if (response.ok) {
        alert('Alert sent to your email!');
      }
    } catch (error) {
      console.error('Failed to send alert:', error);
    } finally {
      setSendingAlert(false);
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score >= 40) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'declining') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getRiskBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-700">Low Risk</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-700">Medium Risk</Badge>;
    if (score >= 40) return <Badge className="bg-orange-100 text-orange-700">High Risk</Badge>;
    return <Badge className="bg-red-100 text-red-700 animate-pulse">Critical!</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Activity className="h-8 w-8 animate-pulse mx-auto text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Loading health predictions...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Health Status Card */}
      {latestPrediction && (
        <Card className={`border-2 ${getHealthColor(latestPrediction.health_score)}`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Current Health Status
              </div>
              {getRiskBadge(latestPrediction.health_score)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Health Score</p>
                <p className="text-3xl font-bold">{latestPrediction.health_score}/100</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Trend</p>
                <div className="flex items-center justify-center gap-1">
                  {getTrendIcon(latestPrediction.trend)}
                  <p className="text-lg font-semibold capitalize">{latestPrediction.trend}</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Confidence</p>
                <p className="text-lg font-semibold">{(latestPrediction.confidence * 100).toFixed(0)}%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-lg font-semibold">{new Date(latestPrediction.prediction_date).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Alert Button for Critical Cases */}
            {latestPrediction.health_score < 50 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600 animate-pulse" />
                    <span className="text-red-700 font-medium">
                      {latestPrediction.health_score < 30 ? '🚨 EMERGENCY: Immediate vet care needed!' : '⚠️ Warning: Health at risk!'}
                    </span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={sendEmailAlert}
                    disabled={sendingAlert}
                    className="gap-2"
                  >
                    <Bell className="h-4 w-4" />
                    {sendingAlert ? 'Sending...' : 'Send Alert to Email'}
                  </Button>
                </div>
                <p className="text-sm text-red-600 mt-2">{latestPrediction.recommendations}</p>
              </div>
            )}

            {/* Risks Section */}
            {latestPrediction.risks && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium mb-1">Detected Risks:</p>
                <p className="text-sm text-muted-foreground">{latestPrediction.risks}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Health Trends Chart - Using Recharts (Free, no Tableau needed) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Health Score Trends (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <HealthTrendChart predictions={predictions} />
          </div>
        </CardContent>
      </Card>

      {/* Recent Anomalies */}
      {anomalies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Recent Health Anomalies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {anomalies.map((anomaly) => (
                <div key={anomaly.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium capitalize">{anomaly.anomaly_type.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-muted-foreground">{anomaly.description}</p>
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
    </div>
  );
}

// Simple chart component using Recharts (install: npm install recharts)
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function HealthTrendChart({ predictions }: { predictions: Prediction[] }) {
  const chartData = [...predictions].reverse().map(p => ({
    date: new Date(p.prediction_date).toLocaleDateString(),
    score: p.health_score,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis domain={[0, 100]} />
        <Tooltip />
        <Line 
          type="monotone" 
          dataKey="score" 
          stroke="#3b82f6" 
          strokeWidth={2}
          dot={{ fill: '#3b82f6' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}