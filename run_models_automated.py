import os
import pickle
import numpy as np
import pandas as pd
import tensorflow as tf
from datetime import datetime, timedelta
from supabase import create_client

# Supabase credentials
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
MODEL_PATH = "ml_models/"

print("=" * 60)
print("Loading REAL ML Models")
print(f"Time: {datetime.now()}")
print("=" * 60)

# ============================================
# LOAD LSTM MODEL
# ============================================
try:
    print("Loading LSTM model...")
    lstm_model = tf.keras.models.load_model(f"{MODEL_PATH}lstm_model.keras", compile=False)
    lstm_scaler = pickle.load(open(f"{MODEL_PATH}lstm_scaler.pkl", 'rb'))
    print(" LSTM model loaded")
except Exception as e:
    print(f" LSTM model error: {e}")
    lstm_model = None

# ============================================
# LOAD SENSOR MODEL
# ============================================
try:
    print("Loading Sensor model...")
    sensor_model = pickle.load(open(f"{MODEL_PATH}sensor_model.pkl", 'rb'))
    sensor_scaler = pickle.load(open(f"{MODEL_PATH}sensor_scaler.pkl", 'rb'))
    print(" Sensor model loaded")
except Exception as e:
    print(f" Sensor model error: {e}")
    sensor_model = None

# ============================================
# LOAD BUSINESS MODELS
# ============================================
print("\nLoading Business models...")
business_models = {}
business_files = [
    'sales_forecast_model.pkl',
    'brand_performance_model.pkl',
    'churn_prediction_model.pkl',
    'weekly_forecast_model.pkl'
]
for file in business_files:
    try:
        model = pickle.load(open(f"{MODEL_PATH}{file}", 'rb'))
        business_models[file] = model
        print(f" {file} loaded")
    except Exception as e:
        print(f" {file} error: {e}")

# ============================================
# RUN LSTM PREDICTIONS
# ============================================
if lstm_model:
    print("\n" + "=" * 60)
    print("Running LSTM Health Predictions")
    print("=" * 60)
    
    pets = supabase.table('pets').select('id, user_id, name').execute()
    predictions_list = []
    
    for pet in pets.data:
        # Get sensor data for LSTM input
        sensor_data = supabase.table('sensor_data')\
            .select('heart_rate, temperature, activity_level, sensor_time')\
            .eq('pet_id', pet['id'])\
            .order('sensor_time', desc=True)\
            .limit(24)\
            .execute()
        
        if len(sensor_data.data) >= 24:
            activity_map = {'inactive': 0, 'low': 1, 'medium': 2, 'high': 3, 'very high': 4}
            
            features = []
            for reading in sensor_data.data[:24]:
                activity_val = activity_map.get(str(reading.get('activity_level', 'medium')).lower(), 2)
                features.append([
                    reading.get('heart_rate', 80),
                    reading.get('temperature', 38.5),
                    activity_val,
                    0
                ])
            
            features_array = np.array(features)
            features_scaled = lstm_scaler.transform(features_array)
            features_reshaped = features_scaled.reshape(1, 24, 4)
            
            prediction = lstm_model.predict(features_reshaped, verbose=0)
            predicted_score = int(prediction[0][0] * 100)
            predicted_score = max(0, min(100, predicted_score))
            
            predictions_list.append({
                'pet_id': pet['id'],
                'health_score': predicted_score,
                'prediction_date': datetime.now().date().isoformat(),
                'model_type': 'lstm'
            })
            print(f"   {pet['name']}: {predicted_score} (LSTM)")
        else:
            print(f"   {pet['name']}: Need {24 - len(sensor_data.data)} more sensor readings")
    
    if predictions_list:
        today = datetime.now().date().isoformat()
        supabase.table('predictions').delete().eq('prediction_date', today).execute()
        supabase.table('predictions').insert(predictions_list).execute()
        print(f"\n Saved {len(predictions_list)} LSTM predictions")

# ============================================
# RUN CHURN PREDICTIONS
# ============================================
if 'churn_prediction_model.pkl' in business_models:
    print("\n" + "=" * 60)
    print("Running Churn Predictions")
    print("=" * 60)
    
    users = supabase.table('profiles').select('id, plan, created_at').execute()
    
    for user in users.data:
        # Get user activity
        last_activity = supabase.table('daily_logs')\
            .select('log_date')\
            .eq('user_id', user['id'])\
            .order('log_date', desc=True)\
            .limit(1)\
            .execute()
        
        days_since = 60
        if last_activity.data:
            last_date = datetime.strptime(last_activity.data[0]['log_date'], '%Y-%m-%d')
            days_since = (datetime.now() - last_date).days
        
        churn_probability = min(1.0, days_since / 60)
        churn_risk = "High" if days_since > 30 else "Medium" if days_since > 14 else "Low"
        
        supabase.table('churn_predictions').upsert({
            'user_id': user['id'],
            'churn_probability': churn_probability,
            'churn_risk': churn_risk,
            'prediction_date': datetime.now().date().isoformat()
        }, on_conflict='user_id').execute()
        print(f"   {user['id'][:8]}...: {churn_risk} risk ({days_since} days)")

print("\n" + "=" * 60)
print("All REAL models completed!")
print("=" * 60)