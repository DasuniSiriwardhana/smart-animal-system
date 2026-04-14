"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Heart, TrendingUp, TrendingDown, Minus, AlertTriangle, Activity, Mail, CheckCircle, Bell } from 'lucide-react';

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

export function HealthPredictions({ petId, petName, ownerEmail, isPremium }: { 
  petId: string; 
  petName: string; 
  ownerEmail: string;
  isPremium: boolean;
}) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [latestPrediction, setLatestPrediction] = useState<Prediction | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingAlert, setSendingAlert] = useState(false);
  const [alertSent, setAlertSent] = useState(false);

  useEffect(() => {
    if (isPremium) {
      fetchPredictions();
      fetchAnomalies();
    }
  }, [petId, isPremium]);

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
    if (!latestPrediction) return;
    
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
        setAlertSent(true);
        setTimeout(() => setAlertSent(false), 5000);
      }
    } catch (error) {
      console.error('Failed to send alert:', error);
    } finally {
      setSendingAlert(false);
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'border-green-500 bg-green-50';
    if (score >= 60) return 'border-yellow-500 bg-yellow-50';
    if (score >= 40) return 'border-orange-500 bg-orange-50';
    return 'border-red-500 bg-red-50';
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

  // Auto-send email alert when critical anomaly is detected
  useEffect(() => {
    if (latestPrediction && latestPrediction.health_score < 40 && isPremium) {
      sendEmailAlert();
    }
  }, [latestPrediction]);

  if (!isPremium) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Heart className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Upgrade to Premium to see AI health predictions</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/pricing">Upgrade Now</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Loading health predictions...</p>
        </CardContent>
      </Card>
    );
  }

  if (!latestPrediction) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Heart className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">No health predictions yet</p>
          <p className="text-sm text-muted-foreground">Sensor data will generate predictions automatically</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Health Status Card */}
      <Card className={`border-2 ${getHealthColor(latestPrediction.health_score)}`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Current Health Status
            </div>
            {getRiskBadge(latestPrediction.health_score)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
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

          {/* Alert Section for Critical Cases */}
          {latestPrediction.health_score < 50 && (
            <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-lg">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 animate-pulse" />
                  <span className="text-red-700 font-medium">
                    {latestPrediction.health_score < 30 
                      ? '🚨 EMERGENCY: Immediate vet care needed!' 
                      : '⚠️ Warning: Health at risk!'}
                  </span>
                </div>
                <Button 
                  size="sm" 
                  variant={alertSent ? "default" : "destructive"}
                  onClick={sendEmailAlert}
                  disabled={sendingAlert || alertSent}
                  className="gap-2"
                >
                  {sendingAlert ? (
                    <Activity className="h-4 w-4 animate-spin" />
                  ) : alertSent ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Bell className="h-4 w-4" />
                  )}
                  {sendingAlert ? 'Sending...' : alertSent ? 'Alert Sent!' : 'Send Alert'}
                </Button>
              </div>
              <p className="text-sm text-red-700 mt-3">{latestPrediction.recommendations}</p>
            </div>
          )}

          {/* Healthy Pet Section */}
          {latestPrediction.health_score >= 50 && (
            <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-700 font-medium">Pet is in good health</span>
              </div>
              <p className="text-sm text-green-600 mt-1">Continue regular monitoring</p>
            </div>
          )}

          {/* Risks Section */}
          {latestPrediction.risks && latestPrediction.health_score < 60 && (
            <div className="mt-4 p-3 bg-gray-100 rounded-lg">
              <p className="text-sm font-medium mb-1">📋 Detected Risks:</p>
              <p className="text-sm text-muted-foreground">{latestPrediction.risks}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Health History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Health Score History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {predictions.slice(0, 7).map((pred) => (
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
                <div className="flex items-center gap-1 w-20">
                  {getTrendIcon(pred.trend)}
                  <span className="text-xs capitalize">{pred.trend}</span>
                </div>
              </div>
            ))}
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
    </div>
  );
}