import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { petId, sensorData, petName, species, breed, age, weight } = body;
    
    console.log("Generating health report for pet:", petId);
    console.log("Sensor data:", sensorData);
    
    // Calculate health score based on sensor data
    let healthScore = 100;
    const issues = [];
    const recommendations = [];
    
    // Heart rate analysis
    if (sensorData.heart_rate > 120) {
      healthScore -= 20;
      issues.push("Elevated heart rate detected");
      recommendations.push("Monitor heart rate closely, consider veterinary consultation");
    } else if (sensorData.heart_rate < 60) {
      healthScore -= 10;
      issues.push("Low heart rate detected");
      recommendations.push("Monitor activity levels and energy");
    }
    
    // Temperature analysis
    if (sensorData.temperature > 39.2) {
      healthScore -= 20;
      issues.push("Elevated temperature - possible fever");
      recommendations.push("Monitor for other symptoms, consider veterinary checkup");
    } else if (sensorData.temperature < 37.5) {
      healthScore -= 15;
      issues.push("Low body temperature");
      recommendations.push("Keep pet warm and monitor closely");
    }
    
    // Activity analysis
    if (sensorData.activity_level === 'inactive') {
      healthScore -= 15;
      issues.push("Low activity level detected");
      recommendations.push("Encourage gentle exercise and playtime");
    } else if (sensorData.activity_level === 'very high') {
      healthScore -= 5;
      issues.push("Very high activity level");
      recommendations.push("Ensure adequate rest periods");
    }
    
    // Ensure score is between 0 and 100
    healthScore = Math.max(0, Math.min(100, healthScore));
    
    // Determine status
    let status = "Good";
    let riskLevel = "low";
    let urgency = "Routine checkup recommended";
    
    if (healthScore >= 80) {
      status = "Excellent";
      riskLevel = "low";
      urgency = "Regular monitoring only";
    } else if (healthScore >= 60) {
      status = "Good";
      riskLevel = "low";
      urgency = "Routine checkup recommended";
    } else if (healthScore >= 40) {
      status = "Fair";
      riskLevel = "medium";
      urgency = "Schedule vet visit within 2 weeks";
    } else if (healthScore >= 20) {
      status = "Poor";
      riskLevel = "high";
      urgency = "Schedule vet visit within 48 hours";
    } else {
      status = "Critical";
      riskLevel = "critical";
      urgency = "IMMEDIATE veterinary attention required";
    }
    
    const report = {
      pet_name: petName,
      species: species,
      breed: breed,
      age: age,
      weight: weight,
      generated_at: new Date().toISOString(),
      health_score: healthScore,
      risk_level: riskLevel,
      status: status,
      trend: "stable",
      urgency: urgency,
      vital_signs: {
        heart_rate: sensorData.heart_rate,
        temperature: sensorData.temperature,
        activity_level: sensorData.activity_level,
        recorded_at: sensorData.sensor_time
      },
      weather: {
        temperature: sensorData.weather_temperature || "N/A",
        humidity: sensorData.weather_humidity || "N/A",
        condition: sensorData.weather_condition || "Unknown",
        impact_score: sensorData.weather_impact_score || 0
      },
      issues: issues,
      recommendations: recommendations,
      next_steps: [
        "Continue daily health monitoring",
        "Maintain regular feeding schedule",
        "Ensure adequate hydration",
        "Schedule follow-up as needed"
      ]
    };
    
    return NextResponse.json({ success: true, report });
    
  } catch (error) {
    console.error("Health report generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate health report" },
      { status: 500 }
    );
  }
}