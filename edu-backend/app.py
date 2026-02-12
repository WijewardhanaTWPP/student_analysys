from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import numpy as np
import os
import joblib

app = FastAPI(title="Edu Risk ML Service", version="1.0")

MODEL_PATH = os.getenv("MODEL_PATH", "model.joblib")
MODEL_TYPE = os.getenv("MODEL_TYPE", "stub")  

model = None

class PredictRequest(BaseModel):

    features: list[float] = Field(..., min_length=1)
    student_id: int | None = None
    course_id: int | None = None

class PredictResponse(BaseModel):
    risk_score: float
    risk_label: str
    model_version: str
    reasons: list[str] = []

def sigmoid(x: float) -> float:
    return float(1 / (1 + np.exp(-x)))

@app.on_event("startup")
def load_model():
    global model
    if MODEL_TYPE == "sklearn":
        if not os.path.exists(MODEL_PATH):
            
            model = None
            return
        model = joblib.load(MODEL_PATH)
    else:
        model = "stub"

@app.get("/health")
def health():
    return {"ok": True, "model_type": MODEL_TYPE, "model_loaded": model is not None}

@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    features = np.array(req.features, dtype=np.float32)

    if MODEL_TYPE == "sklearn":
        if model is None:
            raise HTTPException(status_code=500, detail="Model not loaded. Check MODEL_PATH.")
  
        try:
            proba = model.predict_proba(features.reshape(1, -1))[0][1]
            risk_score = float(proba)
            model_version = "sklearn-v1"
            reasons = []
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")
    else:
        
        if features.shape[0] < 3:
            raise HTTPException(status_code=400, detail="Stub expects at least 3 features.")
        attendance_rate = float(features[0])
        avg_score_ratio = float(features[1])
        participation_norm = float(features[2])

        
        risk = 0.5 * (1 - avg_score_ratio) + 0.3 * (1 - attendance_rate) + 0.2 * (1 - participation_norm)
        risk_score = max(0.0, min(1.0, risk))

        reasons = []
        if attendance_rate < 0.7:
            reasons.append("Low attendance rate")
        if avg_score_ratio < 0.5:
            reasons.append("Low average score")
        if participation_norm < 0.3:
            reasons.append("Low participation")

        model_version = "stub-v1"

    risk_label = "at_risk" if risk_score >= 0.6 else "not_at_risk"

    return PredictResponse(
        risk_score=risk_score,
        risk_label=risk_label,
        model_version=model_version,
        reasons=reasons
    )
