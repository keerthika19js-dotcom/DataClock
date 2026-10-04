import os
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = Path(os.getenv("MODEL_PATH", str(BASE_DIR / "models" / "best_model.joblib")))
PREPROCESSOR_PATH = Path(os.getenv("PREPROCESSOR_PATH", str(BASE_DIR / "models" / "preprocessor.joblib")))


def _as_features(payload: dict):
    data_type = payload.get("data_type") or payload.get("dataType")
    sensitivity = payload.get("sensitivity")
    purpose = payload.get("purpose")
    data_age_days = payload.get("data_age_days")
    days_since_last_access = payload.get("days_since_last_access")
    usage_frequency = payload.get("usage_frequency")
    purpose_completed = payload.get("purpose_completed")
    retention_period_days = payload.get("retention_period_days")
    policy_type = payload.get("policy_type")
    risk_score = payload.get("risk_score", 0)

    return pd.DataFrame([
        {
            "data_type": data_type,
            "sensitivity": sensitivity,
            "purpose": purpose,
            "data_age_days": data_age_days,
            "days_since_last_access": days_since_last_access,
            "usage_frequency": usage_frequency,
            "purpose_completed": purpose_completed,
            "retention_period_days": retention_period_days,
            "policy_type": policy_type,
            "risk_score": risk_score,
        }
    ])


def load_model():
    if not MODEL_PATH.exists() or not PREPROCESSOR_PATH.exists():
        raise FileNotFoundError("Model files are not available. Run train_model.py first.")
    model = joblib.load(MODEL_PATH)
    preprocessor = joblib.load(PREPROCESSOR_PATH)
    return model, preprocessor


def predict_record(payload: dict):
    model, preprocessor = load_model()
    features = _as_features(payload)
    transformed = preprocessor.transform(features)
    probabilities = model.predict_proba(transformed)[0]
    classes = model.classes_
    idx = int(np.argmax(probabilities))
    prediction = classes[idx]
    confidence = float(probabilities[idx])
    class_probabilities = {str(cls): float(prob) for cls, prob in zip(classes, probabilities)}

    risk_level = "LOW"
    if confidence >= 0.7:
        risk_level = "HIGH"
    elif confidence >= 0.45:
        risk_level = "MEDIUM"

    return {
        "prediction": prediction,
        "confidence": round(confidence, 4),
        "risk_level": risk_level,
        "class_probabilities": class_probabilities,
    }
