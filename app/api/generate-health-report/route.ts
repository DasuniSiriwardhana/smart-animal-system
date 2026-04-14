import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const { petId } = await request.json();
    
    if (!petId) {
      return NextResponse.json({ 
        error: 'Pet ID is required' 
      }, { status: 400 });
    }
    
    // Fetch latest sensor data
    const { data: sensorData, error: sensorError } = await supabase
      .from('sensor_data')
      .select('*')
      .eq('pet_id', petId)
      .order('sensor_time', { ascending: false })
      .limit(1)
      .single();
    
    if (sensorError || !sensorData) {
      return NextResponse.json({ 
        error: 'No sensor data available for this pet. Connect IoT sensors to generate reports.' 
      }, { status: 404 });
    }
    
    // Fetch pet info
    const { data: pet } = await supabase
      .from('pets')
      .select('name, species, breed, age, weight')
      .eq('id', petId)
      .single();
    
    // Fetch recent daily logs for additional context
    const { data: recentLogs } = await supabase
      .from('daily_logs')
      .select('mood, activity_duration, sleep_duration, water_intake')
      .eq('pet_id', petId)
      .order('log_date', { ascending: false })
      .limit(7);
    
    // Calculate health metrics
    let healthScore = 100;
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Heart rate analysis (normal: 60-120 BPM)
    if (sensorData.heart_rate > 140) {
      healthScore -= 25;
      issues.push('Severely elevated heart rate detected');
      recommendations.push('URGENT: Seek veterinary attention for elevated heart rate');
    } else if (sensorData.heart_rate > 120) {
      healthScore -= 15;
      issues.push('Elevated heart rate detected');
      recommendations.push('Schedule veterinary checkup for heart rate evaluation');
    } else if (sensorData.heart_rate < 50) {
      healthScore -= 20;
      issues.push('Dangerously low heart rate');
      recommendations.push('URGENT: Seek veterinary attention for low heart rate');
    } else if (sensorData.heart_rate < 60) {
      healthScore -= 10;
      issues.push('Low heart rate detected');
      recommendations.push('Monitor energy levels and consult vet if persists');
    }
    
    // Temperature analysis (normal: 37.5-39.2°C)
    if (sensorData.temperature > 40) {
      healthScore -= 30;
      issues.push('High fever detected');
      recommendations.push('URGENT: Seek veterinary attention immediately');
    } else if (sensorData.temperature > 39.2) {
      healthScore -= 20;
      issues.push('Fever detected');
      recommendations.push('Monitor temperature every 2 hours, consult vet if above 39.5°C');
    } else if (sensorData.temperature < 37) {
      healthScore -= 15;
      issues.push('Low body temperature (hypothermia risk)');
      recommendations.push('Provide warm environment and monitor closely');
    } else if (sensorData.temperature < 37.5) {
      healthScore -= 5;
      issues.push('Slightly low body temperature');
      recommendations.push('Keep pet warm and monitor');
    }
    
    // Activity analysis
    if (sensorData.activity_level === 'inactive') {
      healthScore -= 15;
      issues.push('Low activity level');
      recommendations.push('Encourage gentle exercise and playtime');
    } else if (sensorData.activity_level === 'low') {
      healthScore -= 5;
      issues.push('Below average activity');
      recommendations.push('Increase daily activity gradually');
    } else if (sensorData.activity_level === 'very high') {
      healthScore -= 5;
      issues.push('Unusually high activity');
      recommendations.push('Ensure adequate rest periods');
    }
    
    // Analyze recent logs for patterns
    if (recentLogs && recentLogs.length > 0) {
      const avgSleep = recentLogs.reduce((sum, log) => sum + (log.sleep_duration || 0), 0) / recentLogs.length;
      const lowMoodCount = recentLogs.filter(log => 
        log.mood === 'tired' || log.mood === 'anxious'
      ).length;
      
      if (avgSleep < 6) {
        healthScore -= 10;
        issues.push('Insufficient sleep detected');
        recommendations.push('Ensure quiet, comfortable sleeping environment');
      }
      
      if (lowMoodCount >= 3) {
        healthScore -= 10;
        issues.push('Persistent low mood detected');
        recommendations.push('Increase interactive playtime and mental stimulation');
      }
    }
    
    // Weather impact
    if (sensorData.weather_impact_score && sensorData.weather_impact_score < 0) {
      healthScore += sensorData.weather_impact_score;
      
      if (sensorData.weather_condition === 'Rain') {
        recommendations.push('Keep pet dry, indoor activities recommended');
      } else if (sensorData.weather_condition === 'Thunderstorm') {
        recommendations.push('Create safe space for pet during storms');
      }
      
      if (sensorData.weather_temperature > 30) {
        recommendations.push('Ensure plenty of fresh water and shade');
        recommendations.push('Avoid walks during peak heat hours');
      } else if (sensorData.weather_temperature < 10) {
        recommendations.push('Limit outdoor time, use pet jacket for walks');
      }
    }
    
    // Ensure score is between 0-100
    healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));
    
    // Determine risk level and urgency
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let status = 'Good';
    let urgency = 'Routine checkup';
    
    if (healthScore >= 80) {
      riskLevel = 'low';
      status = 'Excellent';
      urgency = 'Routine checkup in 6 months';
    } else if (healthScore >= 65) {
      riskLevel = 'low';
      status = 'Good';
      urgency = 'Routine checkup in 3 months';
    } else if (healthScore >= 50) {
      riskLevel = 'medium';
      status = 'Fair';
      urgency = 'Schedule vet visit within 1 month';
    } else if (healthScore >= 35) {
      riskLevel = 'high';
      status = 'Needs Attention';
      urgency = 'Schedule vet visit within 1 week';
    } else if (healthScore >= 20) {
      riskLevel = 'high';
      status = 'Urgent Care Needed';
      urgency = 'Schedule vet visit within 48 hours';
    } else {
      riskLevel = 'critical';
      status = 'Emergency';
      urgency = 'SEEK VETERINARY CARE IMMEDIATELY';
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Continue current excellent care routine');
      recommendations.push('Maintain regular exercise and feeding schedule');
    }
    
    // Determine trend
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    const { data: previousPredictions } = await supabase
      .from('predictions')
      .select('health_score')
      .eq('pet_id', petId)
      .order('prediction_date', { ascending: false })
      .limit(1);
    
    if (previousPredictions && previousPredictions.length > 0) {
      const prevScore = previousPredictions[0].health_score;
      if (healthScore > prevScore + 5) trend = 'improving';
      else if (healthScore < prevScore - 5) trend = 'declining';
    }
    
    const report = {
      pet_name: pet?.name || 'Unknown',
      species: pet?.species || 'Unknown',
      breed: pet?.breed || 'Not specified',
      age: pet?.age || 'Unknown',
      weight: pet?.weight || 'Unknown',
      generated_at: new Date().toISOString(),
      health_score: healthScore,
      risk_level: riskLevel,
      status: status,
      urgency: urgency,
      trend: trend,
      vital_signs: {
        heart_rate: sensorData.heart_rate,
        temperature: sensorData.temperature,
        activity_level: sensorData.activity_level,
        recorded_at: sensorData.sensor_time
      },
      weather: {
        temperature: sensorData.weather_temperature || 'N/A',
        humidity: sensorData.weather_humidity || 'N/A',
        condition: sensorData.weather_condition || 'Unknown',
        impact_score: sensorData.weather_impact_score || 0
      },
      issues: issues.length > 0 ? issues : ['No major health issues detected'],
      recommendations: recommendations,
      next_steps: [
        urgency,
        'Continue monitoring vital signs daily',
        'Maintain regular feeding and hydration schedule',
        'Document any behavioral changes'
      ]
    };
    
    // Save prediction to database
    await supabase.from('predictions').insert({
      pet_id: petId,
      prediction_date: new Date().toISOString().split('T')[0],
      health_score: healthScore,
      trend: trend,
      confidence: 0.88,
      recommendations: recommendations.join('; '),
      risks: issues.join('; ')
    });
    
    return NextResponse.json({ success: true, report });
    
  } catch (error) {
    console.error('Health report error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate health report. Please try again.' 
    }, { status: 500 });
  }
}