"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Thermometer, Heart, TrendingUp, Loader2, CloudRain, Sun, Cloud, Wind, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface SensorData {
  heart_rate: number | null;
  temperature: number | null;
  activity_level: string | null;
  sensor_time: string;
  weather_temperature: number | null;
  weather_humidity: number | null;
  weather_condition: string | null;
  weather_impact_score: number | null;
}

interface HealthReport {
  health_score: number;
  risk_level: string;
  status: string;
  urgency: string;
  weather_alerts: string[];
  recommendations: string[];
  health_score_breakdown: {
    heart_rate_impact: number;
    temperature_impact: number;
    activity_impact: number;
    weather_impact: number;
  };
}

export function SensorDashboard({ petId, petName, latitude, longitude }: { 
  petId: string; 
  petName: string;
  latitude?: number;
  longitude?: number;
}) {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [healthReport, setHealthReport] = useState<HealthReport | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchSensorData = async () => {
    try {
      const { data, error } = await supabase
        .from('sensor_data')
        .select('*')
        .eq('pet_id', petId)
        .order('sensor_time', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      
      setSensorData(data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error fetching sensor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHealthReport = async () => {
    setReportLoading(true);
    try {
      const response = await fetch('/api/health-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          petId, 
          petName,
          latitude: latitude || 6.9271,
          longitude: longitude || 79.8612
        })
      });
      
      const report = await response.json();
      setHealthReport(report);
      setShowReport(true);
    } catch (error) {
      console.error('Error fetching health report:', error);
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    fetchSensorData();
    const interval = setInterval(fetchSensorData, 60000);
    return () => clearInterval(interval);
  }, [petId]);

  const getWeatherIcon = (condition: string | null | undefined) => {
    const cond = condition?.toLowerCase() || '';
    if (cond.includes('rain')) return <CloudRain className="h-5 w-5 text-blue-500" />;
    if (cond.includes('cloud')) return <Cloud className="h-5 w-5 text-gray-500" />;
    if (cond.includes('sun') || cond.includes('clear')) return <Sun className="h-5 w-5 text-yellow-500" />;
    return <Wind className="h-5 w-5 text-gray-500" />;
  };

  const getActivityColor = (level: string | null | undefined) => {
    switch(level?.toLowerCase()) {
      case 'very high': return 'text-purple-600';
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-orange-600';
      case 'inactive': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHeartRateStatus = (hr: number | null | undefined) => {
    if (!hr) return 'Unknown';
    if (hr > 120) return 'Elevated';
    if (hr < 60) return 'Low';
    return 'Normal';
  };

  const getTemperatureStatus = (temp: number | null | undefined) => {
    if (!temp) return 'Unknown';
    if (temp > 39.2) return 'Fever';
    if (temp < 37.5) return 'Low';
    return 'Normal';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Live Sensor Data - {petName}
            <span className="text-xs text-muted-foreground ml-2">(Premium Feature)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Weather Section */}
          {sensorData && (
            <div className="mb-4 p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getWeatherIcon(sensorData.weather_condition)}
                  <span className="font-medium">Weather: {sensorData.weather_condition || 'Unknown'}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {sensorData.weather_temperature ?? '--'}°C | Humidity: {sensorData.weather_humidity ?? '--'}%
                </div>
              </div>
              {(sensorData.weather_impact_score ?? 0) < 0 && (
                <div className="mt-2 text-xs text-orange-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Weather impact: {sensorData.weather_impact_score} points
                </div>
              )}
            </div>
          )}

          {/* Sensor Grid */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Heart Rate */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <Heart className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Heart Rate</p>
                <p className="text-2xl font-bold">{sensorData?.heart_rate ?? '--'} BPM</p>
                <p className={`text-xs ${
                  getHeartRateStatus(sensorData?.heart_rate) === 'Normal' ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {getHeartRateStatus(sensorData?.heart_rate)}
                </p>
              </div>
            </div>

            {/* Temperature */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Thermometer className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Temperature</p>
                <p className="text-2xl font-bold">{sensorData?.temperature ?? '--'} °C</p>
                <p className={`text-xs ${
                  getTemperatureStatus(sensorData?.temperature) === 'Normal' ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {getTemperatureStatus(sensorData?.temperature)}
                </p>
              </div>
            </div>

            {/* Activity Level */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Activity Level</p>
                <p className={`text-2xl font-bold ${getActivityColor(sensorData?.activity_level)}`}>
                  {sensorData?.activity_level || '--'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 text-right">
            <p className="text-xs text-muted-foreground">Last updated: {lastUpdated}</p>
          </div>

          {/* Live Data Analysis Button */}
          <div className="mt-6">
            <Button 
              onClick={fetchHealthReport} 
              disabled={reportLoading}
              className="w-full gap-2 bg-gradient-to-r from-primary to-accent"
            >
              {reportLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4" />
                  Live Data Analysis
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Get AI-powered health insights based on sensor data and weather conditions
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Health Report Modal */}
      {showReport && healthReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Health Analysis Report - {petName}</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowReport(false)}>✕</Button>
            </div>
            <div className="p-6">
              {/* Health Score */}
              <div className="mb-6 p-4 bg-primary/5 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Health Score</p>
                    <p className="text-4xl font-bold text-primary">{healthReport.health_score}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Risk Level</p>
                    <p className={`text-xl font-bold ${
                      healthReport.risk_level === 'low' ? 'text-green-600' :
                      healthReport.risk_level === 'medium' ? 'text-yellow-600' :
                      healthReport.risk_level === 'high' ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {healthReport.risk_level?.toUpperCase() || 'UNKNOWN'}
                    </p>
                    <p className="text-sm">{healthReport.status || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">{healthReport.urgency || 'Monitor'}</p>
                  </div>
                </div>
              </div>

              {/* Health Score Breakdown */}
              {healthReport.health_score_breakdown && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2"> Health Score Breakdown</h3>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span>Heart Rate Impact:</span>
                      <span className={(healthReport.health_score_breakdown.heart_rate_impact ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {(healthReport.health_score_breakdown.heart_rate_impact ?? 0) > 0 ? '+' : ''}{healthReport.health_score_breakdown.heart_rate_impact ?? 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Temperature Impact:</span>
                      <span className={(healthReport.health_score_breakdown.temperature_impact ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {(healthReport.health_score_breakdown.temperature_impact ?? 0) > 0 ? '+' : ''}{healthReport.health_score_breakdown.temperature_impact ?? 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Activity Impact:</span>
                      <span className={(healthReport.health_score_breakdown.activity_impact ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {(healthReport.health_score_breakdown.activity_impact ?? 0) > 0 ? '+' : ''}{healthReport.health_score_breakdown.activity_impact ?? 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Weather Impact:</span>
                      <span className={(healthReport.health_score_breakdown.weather_impact ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {(healthReport.health_score_breakdown.weather_impact ?? 0) > 0 ? '+' : ''}{healthReport.health_score_breakdown.weather_impact ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Weather Alerts */}
              {healthReport.weather_alerts && healthReport.weather_alerts.length > 0 && (
                <div className="mb-6 p-3 bg-yellow-50 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Weather Alerts</h3>
                  <ul className="list-disc pl-5">
                    {healthReport.weather_alerts.map((alert, i) => (
                      <li key={i} className="text-sm text-yellow-700">{alert}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {healthReport.recommendations && healthReport.recommendations.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">💡 Recommendations</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {healthReport.recommendations.map((rec, i) => (
                      <li key={i} className="text-sm">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actionable Steps */}
              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">✅ Actionable Steps</h3>
                <ul className="list-disc pl-5">
                  <li className="text-sm text-green-700">Monitor your pet&apos;s behavior for next 24 hours</li>
                  <li className="text-sm text-green-700">Ensure fresh water is always available</li>
                  <li className="text-sm text-green-700">Schedule follow-up with veterinarian if symptoms persist</li>
                </ul>
              </div>
            </div>
            <div className="sticky bottom-0 bg-background border-t p-4 flex justify-end">
              <Button onClick={() => setShowReport(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}