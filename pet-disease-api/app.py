from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
import joblib
import numpy as np
from PIL import Image
import io
import uvicorn
import os

# Load model
print("Loading model...")
model = tf.keras.models.load_model("model.keras")
class_indices = joblib.load("class_indices.pkl")
idx_to_class = {v: k for k, v in class_indices.items()}
print(f"✅ Loaded {len(class_indices)} disease classes")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    contents = await file.read()
    img = Image.open(io.BytesIO(contents)).convert('RGB').resize((192, 192))
    img_array = np.array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    
    predictions = model.predict(img_array)[0]
    top_idx = np.argmax(predictions)
    
    return {
        "disease": idx_to_class[top_idx],
        "confidence": float(predictions[top_idx])
    }

@app.get("/")
def root():
    return {"message": "Pet Disease API", "classes": len(class_indices)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
