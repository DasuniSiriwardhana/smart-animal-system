import os
import pickle
import joblib
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras import layers
from datetime import datetime, timedelta
from supabase import create_client

# Supabase credentials
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

MODEL_PATH = "ml_models/"

print("=" * 60)
print("Loading REAL ML Models (Fixed)")
print(f"Time: {datetime.now()}")
print("=" * 60)

# ============================================
# FIX 1: Custom LSTM Loader
# ============================================
class CustomDense(layers.Dense):
    def __init__(self, *args, **kwargs):
        kwargs.pop('quantization_config', None)
        super().__init__(*args, **kwargs)

custom_objects = {'Dense': CustomDense}

try:
    print("Loading LSTM model...")
    lstm_model = tf.keras.models.load_model(
        f"{MODEL_PATH}lstm_model.keras",
        custom_objects=custom_objects,
        compile=False
    )
    lstm_scaler = pickle.load(open(f"{MODEL_PATH}lstm_scaler.pkl", 'rb'))
    print(" LSTM model loaded")
except Exception as e:
    print(f" LSTM model error: {e}")
    lstm_model = None

# ============================================
# FIX 2: Sensor Model with joblib fallback
# ============================================
try:
    print("Loading Sensor model...")
    try:
        sensor_model = pickle.load(open(f"{MODEL_PATH}sensor_model.pkl", 'rb'))
    except:
        sensor_model = joblib.load(f"{MODEL_PATH}sensor_model.pkl")
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
# RUN LSTM PREDICTIONS (if available)
# ============================================
if lstm_model:
    print("\n" + "=" * 60)
    print("Running LSTM Health Predictions")
    print("=" * 60)
    
    pets = supabase.table('pets').select('id, user_id, name').execute()
    predictions_list = []
    
    for pet in pets.data:
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
# FIX 3: CHURN PREDICTIONS - Fixed query
# ============================================
if 'churn_prediction_model.pkl' in business_models:
    print("\n" + "=" * 60)
    print("Running Churn Predictions (Fixed)")
    print("=" * 60)
    
    # Get unique users from pets table (since daily_logs has pet_id, not user_id)
    pets_data = supabase.table('pets').select('user_id').execute()
    unique_users = list(set([p['user_id'] for p in pets_data.data if p['user_id']]))
    
    for user_id in unique_users:
        # Get user's last activity date from daily_logs via pets
        last_activity = supabase.table('daily_logs')\
            .select('log_date')\
            .eq('pet_id', supabase.table('pets').select('id').eq('user_id', user_id).execute().data[0]['id'] if len(supabase.table('pets').select('id').eq('user_id', user_id).execute().data) > 0 else '')\
            .order('log_date', desc=True)\
            .limit(1)\
            .execute()
        
        days_since = 60
        if last_activity.data and len(last_activity.data) > 0:
            last_date = datetime.strptime(last_activity.data[0]['log_date'], '%Y-%m-%d')
            days_since = (datetime.now() - last_date).days
        
        churn_probability = min(1.0, days_since / 60)
        churn_risk = "High" if days_since > 30 else "Medium" if days_since > 14 else "Low"
        
        # Get user email for reference
        user = supabase.table('profiles').select('email').eq('id', user_id).execute()
        email = user.data[0]['email'] if user.data else 'unknown'
        
        supabase.table('churn_predictions').upsert({
            'user_id': user_id,
            'churn_probability': churn_probability,
            'churn_risk': churn_risk,
            'prediction_date': datetime.now().date().isoformat()
        }, on_conflict='user_id').execute()
        print(f"   {email[:20] if email != 'unknown' else user_id[:8]}...: {churn_risk} risk ({days_since} days)")

print("\n" + "=" * 60)
print("All models completed!")
print("=" * 60)