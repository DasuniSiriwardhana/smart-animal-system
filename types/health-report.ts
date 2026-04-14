export interface HealthReportData {
  pet_name?: string;
  species?: string;
  breed?: string;
  age?: number;
  weight?: number;
  generated_at: string;
  health_score: number;
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
  status?: string;
  trend?: 'improving' | 'stable' | 'declining';
  urgency?: string;
  vital_signs?: {
    heart_rate: number;
    temperature: number;
    activity_level: string;
    recorded_at: string;
  };
  weather?: {
    temperature: number | string;
    humidity: number | string;
    condition: string;
    impact_score?: number;
  };
  issues: string[];
  recommendations: string[];
  next_steps: string[];
}