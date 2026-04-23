import os
import numpy as np
from datetime import datetime, timedelta
from supabase import create_client

# Get credentials from environment variables (GitHub Secrets)
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 60)
print("Starting Health Score Predictions")
print(f"Time: {datetime.now()}")
print("=" * 60)

def parse_value(value):
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return value
    if isinstance(value, str):
        try:
            return float(value)
        except:
            return None
    return None

def calculate_health_score(log):
    score = 75
    
    sleep_quality = log.get('sleep_quality')
    if sleep_quality:
        if isinstance(sleep_quality, str):
            quality_lower = sleep_quality.lower()
            if 'good' in quality_lower or 'excellent' in quality_lower:
                score += 10
            elif 'fair' in quality_lower or 'average' in quality_lower:
                score += 5
            elif 'poor' in quality_lower or 'bad' in quality_lower:
                score -= 10
    
    sleep_duration = parse_value(log.get('sleep_duration'))
    if sleep_duration:
        if 7 <= sleep_duration <= 9:
            score += 10
        elif 5 <= sleep_duration <= 11:
            score += 5
        else:
            score -= 10
    
    activity_duration = parse_value(log.get('activity_duration'))
    if activity_duration:
        if activity_duration >= 60:
            score += 10
        elif activity_duration >= 30:
            score += 5
        else:
            score -= 5
    
    water_intake = parse_value(log.get('water_intake'))
    if water_intake:
        if water_intake >= 8:
            score += 5
        elif water_intake >= 4:
            score += 2
        else:
            score -= 5
    
    mood = log.get('mood')
    if mood:
        if isinstance(mood, str):
            mood_lower = mood.lower()
            if 'happy' in mood_lower or 'good' in mood_lower or 'great' in mood_lower:
                score += 5
            elif 'sad' in mood_lower or 'bad' in mood_lower or 'low' in mood_lower:
                score -= 5
    
    return max(0, min(100, score))

try:
    pets = supabase.table('pets').select('id, user_id, name').execute()
    print(f"\n📊 Found {len(pets.data)} pets")
    
    predictions_list = []
    
    for idx, pet in enumerate(pets.data, 1):
        thirty_days_ago = (datetime.now() - timedelta(days=30)).isoformat()
        
        response = supabase.table('daily_logs')\
            .select('*')\
            .eq('pet_id', pet['id'])\
            .gte('log_date', thirty_days_ago)\
            .order('log_date', desc=True)\
            .execute()
        
        logs = response.data
        
        if len(logs) >= 3:
            health_scores = []
            for log in logs:
                score = calculate_health_score(log)
                health_scores.append(score)
            
            if len(health_scores) >= 7:
                recent_avg = np.mean(health_scores[:7])
                older_avg = np.mean(health_scores[-7:]) if len(health_scores) >= 14 else recent_avg
                trend = recent_avg - older_avg
                predicted_score = int(recent_avg + (trend * 0.3))
            else:
                predicted_score = int(np.mean(health_scores))
            
            predicted_score = max(0, min(100, predicted_score))
            
            predictions_list.append({
                'pet_id': pet['id'],
                'health_score': predicted_score,
                'prediction_date': datetime.now().date().isoformat()
            })
            
            if len(health_scores) >= 7:
                trend_icon = '📈' if trend > 2 else '📉' if trend < -2 else '➡️'
                print(f"  {idx:3d}. {pet['name'][:20]:20} → {predicted_score:3d} {trend_icon}")
            else:
                print(f"  {idx:3d}. {pet['name'][:20]:20} → {predicted_score:3d} (based on {len(logs)} days)")
        else:
            predictions_list.append({
                'pet_id': pet['id'],
                'health_score': 75,
                'prediction_date': datetime.now().date().isoformat()
            })
            print(f"  {idx:3d}. {pet['name'][:20]:20} → 75 (need {3-len(logs)} more days)")
    
    if predictions_list:
        today = datetime.now().date().isoformat()
        supabase.table('predictions').delete().eq('prediction_date', today).execute()
        
        batch_size = 100
        for i in range(0, len(predictions_list), batch_size):
            batch = predictions_list[i:i+batch_size]
            supabase.table('predictions').insert(batch).execute()
        
        print(f"\n Saved {len(predictions_list)} predictions for {today}")
    
    print("=" * 60)
    
except Exception as e:
    print(f"\n Error: {e}")
    import traceback
    traceback.print_exc()