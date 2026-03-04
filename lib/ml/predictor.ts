// lib/ml/predictor.ts
import { DailyLog, HealthPrediction, ActivityPrediction, Anomaly } from "@/types"

class MLPredictor {
  // Mock LSTM model for health prediction
  async predictHealth(petId: string, daysOfData: number): Promise<HealthPrediction> {
    // Simulate ML processing delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock predictions based on pet ID (to make it look dynamic)
    const hash = petId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
    const baseScore = 70 + (hash % 20)
    
    const recommendations = [
      'Increase daily walks by 15 minutes',
      'Consider adding joint supplements',
      'Schedule dental check-up',
      'Monitor food intake',
      'Increase play time'
    ]
    
    const risks = [
      'Weight gain detected',
      'Reduced activity pattern',
      'Irregular sleep schedule',
      'Stress indicators',
      'Seasonal allergies possible'
    ]
    
    return {
      score: baseScore,
      trend: hash % 3 === 0 ? 'improving' : hash % 3 === 1 ? 'stable' : 'declining',
      confidence: 0.75 + (hash % 20) / 100,
      recommendations: recommendations.slice(0, 3 + (hash % 2)),
      risks: risks.slice(0, 2 + (hash % 2))
    }
  }

  // Predict future activity patterns
  async predictActivity(logs: DailyLog[]): Promise<ActivityPrediction> {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const avgActivity = logs.reduce((sum, log) => sum + (log.activityDuration || 0), 0) / logs.length
    
    return {
      expectedActivity: Math.round(avgActivity * 1.1), // Predict 10% increase
      comparison: avgActivity > 60 ? 'above' : avgActivity > 30 ? 'normal' : 'below',
      pattern: ['Morning peak', 'Evening activity', 'Restful afternoon']
    }
  }

  // Detect anomalies in behavior
  async detectAnomalies(logs: DailyLog[]): Promise<Anomaly[]> {
    await new Promise(resolve => setTimeout(resolve, 600))
    
    const anomalies: Anomaly[] = []
    
    // Simple anomaly detection logic
    for (let i = 1; i < logs.length; i++) {
      const prev = logs[i-1]
      const curr = logs[i]
      
      if (curr.activityDuration && prev.activityDuration) {
        const change = Math.abs(curr.activityDuration - prev.activityDuration)
        if (change > 30) {
          anomalies.push({
            date: curr.date,
            type: 'activity_change',
            severity: change > 60 ? 'high' : 'medium',
            description: `Unusual activity change detected (${change} min difference)`
          })
        }
      }
      
      // Check sleep anomalies
      if (curr.sleepDuration && prev.sleepDuration) {
        const sleepChange = Math.abs(curr.sleepDuration - prev.sleepDuration)
        if (sleepChange > 3) {
          anomalies.push({
            date: curr.date,
            type: 'sleep_disruption',
            severity: sleepChange > 5 ? 'high' : 'medium',
            description: `Significant change in sleep pattern`
          })
        }
      }
    }
    
    return anomalies
  }
}

export const mlPredictor = new MLPredictor()