import json
import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from predict import predict_record
from train_model import train_and_select_model

BASE_DIR = Path(__file__).resolve().parent
app = FastAPI(title="DataClock ML Service")


class PredictionInput(BaseModel):
    data_type: str
    sensitivity: int = Field(..., ge=1, le=5)
    purpose: str
    data_age_days: int = Field(..., ge=0)
    days_since_last_access: int = Field(..., ge=0)
    usage_frequency: str
    purpose_completed: bool
    retention_period_days: int = Field(..., ge=1)
    policy_type: str = "Temporary"
    risk_score: int = Field(default=0, ge=0, le=100)


@app.get("/health")
def health():
    return {"status": "ok", "service": "dataclock-ml"}


@app.post("/predict")
def predict(payload: PredictionInput):
    try:
        result = predict_record(payload.model_dump())
        return result
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail="Model not trained yet. Run train_model.py first.") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/evaluation")
def evaluation():
    summary_path = BASE_DIR / "training" / "evaluation_summary.json"
    if not summary_path.exists():
        raise HTTPException(status_code=404, detail="No evaluation summary available. Train the model first.")
    with open(summary_path, "r", encoding="utf-8") as file:
        data = json.load(file)
    return data


@app.post("/retrain")
def retrain():
    try:
        summary = train_and_select_model()
        return {"status": "success", "summary": summary}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
