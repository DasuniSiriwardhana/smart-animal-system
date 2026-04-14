import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const { petId, petName, latitude, longitude } = await request.json();
    
    // Fetch latest sensor data
    const { data: sensorData } = await supabase
      .from('sensor_data')
      .select('*')
      .eq('pet_id', petId)
      .order('sensor_time', { ascending: false })
      .limit(1)
      .single();
    
    if (!sensorData) {
      return NextResponse.json({ error: 'No sensor data found' }, { status: 404 });
    }
    
    // Calculate health score breakdown
    let healthScore = 100;
    let heartRateImpact = 0;
    let temperatureImpact = 0;
    let activityImpact = 0;
    let weatherImpact = 0;
    const weatherAlerts = [];
    const recommendations = [];
    
    // Heart rate impact
    if (sensorData.heart_rate > 120) {
      heartRateImpact = -20;
      healthScore += heartRateImpact;
      recommendations.push("Elevated heart rate detected - schedule veterinary checkup");
    } else if (sensorData.heart_rate < 60) {
      heartRateImpact = -15;
      healthScore += heartRateImpact;
      recommendations.push("Low heart rate detected - monitor energy levels");
    } else {
      heartRateImpact = +5;
      healthScore += heartRateImpact;
    }
    
    // Temperature impact
    if (sensorData.temperature > 39.2) {
      temperatureImpact = -20;
      healthScore += temperatureImpact;
      recommendations.push("Fever detected - monitor temperature every 4 hours");
    } else if (sensorData.temperature < 37.5) {
      temperatureImpact = -10;
      healthScore += temperatureImpact;
      recommendations.push("Low temperature detected - provide warm environment");
    } else {
      temperatureImpact = +5;
      healthScore += temperatureImpact;
    }
    
    // Activity impact
    if (sensorData.activity_level === 'inactive') {
      activityImpact = -15;
      healthScore += activityImpact;
      recommendations.push("Low activity detected - encourage gentle exercise");
    } else if (sensorData.activity_level === 'low') {
      activityImpact = -8;
      healthScore += activityImpact;
      recommendations.push("Increase daily activity gradually");
    } else if (sensorData.activity_level === 'very high') {
      activityImpact = -5;
      healthScore += activityImpact;
      recommendations.push("Ensure adequate rest periods");
    } else {
      activityImpact = +5;
      healthScore += activityImpact;
    }
    
    // Weather impact
    weatherImpact = sensorData.weather_impact_score || 0;
    healthScore += weatherImpact;
    
    if (sensorData.weather_temperature > 30) {
      weatherAlerts.push(`High temperature (${sensorData.weather_temperature}°C) - risk of heatstroke`);
      recommendations.push("Keep pet indoors with AC, provide plenty of water");
    } else if (sensorData.weather_temperature < 10) {
      weatherAlerts.push(`Low temperature (${sensorData.weather_temperature}°C) - risk of joint stiffness`);
      recommendations.push("Use pet jacket for walks, provide warm bedding");
    }
    
    if (sensorData.weather_condition === 'Rain') {
      weatherAlerts.push("Rainy day - reduced outdoor activity");
      recommendations.push("Use raincoat for walks, indoor play alternatives");
    } else if (sensorData.weather_condition === 'Thunderstorm') {
      weatherAlerts.push("Storm detected - high anxiety risk");
      recommendations.push("Create safe space with white noise, use anxiety wrap if needed");
    }
    
    healthScore = Math.max(0, Math.min(100, healthScore));
    
    // Determine risk level
    let riskLevel = 'low';
    let status = 'Good';
    let urgency = 'Routine checkup';
    
    if (healthScore >= 80) {
      riskLevel = 'low';
      status = 'Excellent';
      urgency = 'Routine checkup';
    } else if (healthScore >= 70) {
      riskLevel = 'low';
      status = 'Good';
      urgency = 'Routine checkup';
    } else if (healthScore >= 60) {
      riskLevel = 'medium';
      status = 'Fair';
      urgency = 'Monitor closely';
    } else if (healthScore >= 50) {
      riskLevel = 'medium';
      status = 'Needs Attention';
      urgency = 'Schedule vet visit within 2 weeks';
    } else if (healthScore >= 30) {
      riskLevel = 'high';
      status = 'Vet Visit Recommended';
      urgency = 'Schedule vet visit within 48 hours';
    } else {
      riskLevel = 'critical';
      status = 'Immediate Vet Care Needed';
      urgency = 'EMERGENCY - Take to vet immediately';
    }
    
    if (recommendations.length === 0) {
      recommendations.push("Continue current routine");
      recommendations.push("Maintain regular checkups");
    }
    
    return NextResponse.json({
      health_score: Math.round(healthScore),
      risk_level: riskLevel,
      status: status,
      urgency: urgency,
      weather_alerts: weatherAlerts,
      recommendations: recommendations.slice(0, 5),
      health_score_breakdown: {
        heart_rate_impact: heartRateImpact,
        temperature_impact: temperatureImpact,
        activity_impact: activityImpact,
        weather_impact: weatherImpact
      }
    });
    
  } catch (error) {
    console.error('Health report error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}