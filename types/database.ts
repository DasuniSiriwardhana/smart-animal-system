// types/database.ts

export type SqlValue = string | number | boolean | Date | null;

export interface UserRow {
  ID: number;
  EMAIL: string;
  NAME: string;
  ROLE: 'admin' | 'user';
  PLAN: 'basic' | 'standard' | 'premium';
  PASSWORD_HASH: string;
  PHONE?: string;
  AVATAR_URL?: string;
  CREATED_AT: Date;
  UPDATED_AT: Date;
  LAST_LOGIN?: Date;
}

export interface PetRow {
  ID: number;
  USER_ID: number;
  NAME: string;
  SPECIES: string;
  BREED?: string;
  AGE?: number;
  WEIGHT?: number;
  PHOTO_URL?: string;
  CREATED_AT: Date;
  UPDATED_AT: Date;
}

export interface DailyLogRow {
  ID: number;
  PET_ID: number;
  LOG_DATE: Date;
  MOOD?: 'happy' | 'calm' | 'anxious' | 'tired' | 'playful';
  ACTIVITY_TYPE?: string;
  ACTIVITY_DURATION?: number;
  ACTIVITY_INTENSITY?: 'low' | 'medium' | 'high';
  MEAL_PORTIONS?: number;
  TREATS?: number;
  WATER_INTAKE?: number;
  SLEEP_DURATION?: number;
  SLEEP_QUALITY?: 'poor' | 'fair' | 'good' | 'excellent';
  ENVIRONMENT_NOTES?: string;
  CREATED_AT: Date;
  UPDATED_AT: Date;
}

export interface VetDocumentRow {
  ID: number;
  PET_ID: number;
  DOC_NAME: string;
  DOC_CATEGORY: 'vaccination' | 'medical' | 'prescription' | 'lab' | 'other';
  DOC_DATE: Date;
  EXPIRATION_DATE?: Date;
  FILE_DATA?: Buffer;
  FILE_TYPE?: string;
  NOTES?: string;
  CREATED_AT: Date;
}

export interface PredictionRow {
  ID: number;
  PET_ID: number;
  PREDICTION_DATE: Date;
  HEALTH_SCORE: number;
  TREND: 'improving' | 'stable' | 'declining';
  CONFIDENCE: number;
  RECOMMENDATIONS?: string;
  RISKS?: string;
  CREATED_AT: Date;
}

export interface AnomalyRow {
  ID: number;
  PET_ID: number;
  ANOMALY_DATE: Date;
  ANOMALY_TYPE: string;
  SEVERITY: 'low' | 'medium' | 'high';
  DESCRIPTION: string;
  DETECTED_AT: Date;
}

export interface SensorDataRow {
  ID: number;
  PET_ID: number;
  SENSOR_TIME: Date;
  ACCEL_X?: number;
  ACCEL_Y?: number;
  ACCEL_Z?: number;
  HEART_RATE?: number;
  TEMPERATURE?: number;
  ACTIVITY_LEVEL?: string;
  CREATED_AT: Date;
}

export interface ImageAnalysisRow {
  ID: number;
  PET_ID: number;
  IMAGE_URL?: string;
  ANALYSIS_DATE: Date;
  DETECTED_CONDITIONS?: string;
  CONFIDENCE_SCORE?: number;
  CREATED_AT: Date;
}

export interface ProductPurchaseRow {
  ID: number;
  USER_ID: number;
  PET_ID?: number;
  PRODUCT_NAME: string;
  BRAND: string;
  CATEGORY: string;
  PRICE: number;
  QUANTITY: number;
  PURCHASE_DATE: Date;
  LOCATION?: string;
  CREATED_AT: Date;
}

export interface MarketAggregateRow {
  ID: number;
  AGGREGATE_DATE: Date;
  DISTRICT?: string;
  BRAND?: string;
  PRODUCT_CATEGORY?: string;
  TOTAL_SALES?: number;
  AVG_PRICE?: number;
  CUSTOMER_COUNT?: number;
  CREATED_AT: Date;
}

export interface SubscriptionRow {
  ID: number;
  USER_ID: number;
  PLAN_TYPE: 'basic' | 'standard' | 'premium';
  START_DATE: Date;
  END_DATE?: Date;
  STATUS: 'active' | 'expired' | 'cancelled';
  PAYMENT_METHOD?: string;
  AMOUNT?: number;
  CREATED_AT: Date;
}