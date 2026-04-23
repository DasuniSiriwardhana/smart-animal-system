import tensorflow as tf
from tensorflow.keras import layers, models
import pickle
import numpy as np

# First, let's see what's in the model file
import h5py

print("Inspecting LSTM model file...")
try:
    with h5py.File("ml_models/lstm_model.keras", "r") as f:
        print("Keys in model file:", list(f.keys()))
except Exception as e:
    print(f"Error reading model: {e}")

# Rebuild the LSTM architecture (based on the error output, it expects 24 timesteps, 4 features)
def rebuild_lstm_model():
    model = models.Sequential([
        layers.LSTM(64, return_sequences=True, input_shape=(24, 4)),
        layers.Dropout(0.2),
        layers.LSTM(32, return_sequences=False),
        layers.Dropout(0.2),
        layers.Dense(16, activation='relu'),
        layers.Dense(1, activation='linear')
    ])
    return model

# Try to load weights only
try:
    print("\nAttempting to load LSTM model weights...")
    lstm_model = rebuild_lstm_model()
    
    # Try loading just the weights
    lstm_model.load_weights("ml_models/lstm_model.keras")
    print(" LSTM weights loaded successfully")
    
    # Load scaler
    lstm_scaler = pickle.load(open("ml_models/lstm_scaler.pkl", "rb"))
    print(" LSTM scaler loaded")
    
except Exception as e:
    print(f"Failed to load weights: {e}")
    
    # Alternative: Try loading with custom objects to ignore quantization_config
    try:
        print("\nTrying with custom objects...")
        class CustomDense(layers.Dense):
            def __init__(self, *args, **kwargs):
                kwargs.pop('quantization_config', None)
                super().__init__(*args, **kwargs)
        
        custom_objects = {'Dense': CustomDense}
        
        lstm_model = tf.keras.models.load_model(
            "ml_models/lstm_model.keras",
            custom_objects=custom_objects,
            compile=False
        )
        lstm_scaler = pickle.load(open("ml_models/lstm_scaler.pkl", "rb"))
        print(" LSTM model loaded with custom objects")
    except Exception as e2:
        print(f"All loading attempts failed: {e2}")
        lstm_model = None
        lstm_scaler = None

if lstm_model:
    print("\nTesting LSTM model with sample data...")
    sample_input = np.random.rand(1, 24, 4)
    try:
        output = lstm_model.predict(sample_input, verbose=0)
        print(f" LSTM model working! Sample output: {output[0][0]}")
    except Exception as e:
        print(f"Model prediction failed: {e}")