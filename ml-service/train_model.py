import json
import os
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, precision_score, recall_score
from sklearn.model_selection import GridSearchCV, StratifiedKFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.tree import DecisionTreeClassifier

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"
MODEL_DIR.mkdir(exist_ok=True)
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)


def generate_synthetic_dataset(n_samples=1800, random_state=42):
    rng = np.random.default_rng(random_state)
    data_types = ["Identity", "Contact", "Financial", "Location", "Academic", "Other"]
    purposes = ["Verification", "Registration", "Communication", "Navigation", "Payment", "Academic", "Other"]
    usage = ["None", "Low", "Medium", "High"]
    policy_types = ["Temporary", "Operational", "Compliance", "Legal", "Archive"]
    labels = ["RETAIN", "REVIEW", "EXPIRE"]

    rows = []
    for _ in range(n_samples):
        data_type = rng.choice(data_types)
        sensitivity = rng.choice([1, 2, 3, 4, 5], p=[0.05, 0.20, 0.30, 0.25, 0.20])
        purpose = rng.choice(purposes)
        data_age_days = int(rng.integers(1, 1600))
        days_since_last_access = int(rng.integers(0, max(1, data_age_days)))
        usage_frequency = rng.choice(usage)
        purpose_completed = bool(rng.random() < 0.55)
        retention_period_days = int(rng.integers(7, 540))
        policy_type = rng.choice(policy_types)

        if data_type == "Identity":
            sensitivity = int(np.clip(sensitivity + 1, 1, 5))
        elif data_type == "Financial":
            sensitivity = int(np.clip(sensitivity + 2, 1, 5))
        elif data_type == "Location":
            sensitivity = int(np.clip(sensitivity + 1, 1, 5))
        elif data_type == "Academic":
            sensitivity = int(np.clip(sensitivity - 1, 1, 5))

        flag = (
            (sensitivity >= 4)
            and (purpose_completed or purpose in ["Verification", "Payment"])
            and (data_age_days > 120)
            and (days_since_last_access > 45)
            and (usage_frequency in ["None", "Low"])
        )
        retention_score = (
            sensitivity * 12
            + max(0, data_age_days - 30) * 0.06
            + max(0, days_since_last_access - 10) * 0.08
            + (0 if purpose_completed else 18)
            + (0 if usage_frequency in ["Medium", "High"] else 10)
            + max(0, retention_period_days - 90) * 0.02
        )

        if purpose in ["Verification", "Payment", "Academic"] and purpose_completed:
            retention_score += 12
        if purpose == "Communication" and not purpose_completed:
            retention_score -= 8

        if retention_score > 150:
            label = "EXPIRE"
        elif retention_score > 95:
            label = "REVIEW"
        else:
            label = "RETAIN"

        if rng.random() < 0.12:
            label = rng.choice(labels)

        risk_score = int(np.clip(retention_score, 0, 100))

        rows.append({
            "data_type": data_type,
            "sensitivity": sensitivity,
            "purpose": purpose,
            "data_age_days": data_age_days,
            "days_since_last_access": days_since_last_access,
            "usage_frequency": usage_frequency,
            "purpose_completed": int(purpose_completed),
            "retention_period_days": retention_period_days,
            "policy_type": policy_type,
            "risk_score": risk_score,
            "retention_status": label,
        })

    df = pd.DataFrame(rows)
    df.to_csv(DATA_DIR / "synthetic_retention_dataset.csv", index=False)
    return df


def make_preprocessor():
    categorical_features = ["data_type", "purpose", "usage_frequency", "policy_type"]
    numerical_features = [
        "sensitivity",
        "data_age_days",
        "days_since_last_access",
        "purpose_completed",
        "retention_period_days",
        "risk_score",
    ]

    preprocessor = ColumnTransformer([
        ("num", Pipeline([("imputer", SimpleImputer(strategy="median")), ("scaler", StandardScaler())]), numerical_features),
        ("cat", Pipeline([("imputer", SimpleImputer(strategy="most_frequent")), ("onehot", OneHotEncoder(handle_unknown="ignore"))]), categorical_features),
    ])
    return preprocessor


def build_models():
    models = {
        "Logistic Regression": LogisticRegression(max_iter=500, class_weight="balanced"),
        "Decision Tree": DecisionTreeClassifier(random_state=42, class_weight="balanced"),
        "Random Forest": RandomForestClassifier(random_state=42, class_weight="balanced", n_estimators=200, max_depth=12, min_samples_leaf=2, min_samples_split=5),
    }
    return models


def compute_metrics(y_true, y_pred):
    return {
        "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
        "precision": round(float(precision_score(y_true, y_pred, average="weighted", zero_division=0)), 4),
        "recall": round(float(recall_score(y_true, y_pred, average="weighted", zero_division=0)), 4),
        "f1_score": round(float(f1_score(y_true, y_pred, average="weighted", zero_division=0)), 4),
        "confusion_matrix": confusion_matrix(y_true, y_pred).tolist(),
    }


def train_and_select_model():
    df = generate_synthetic_dataset()

    X = df.drop(columns=["retention_status"])
    y = df["retention_status"]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        stratify=y,
        random_state=42,
    )

    preprocessor = make_preprocessor()
    results = {}

    for name, model in build_models().items():
        pipeline = Pipeline([
            ("preprocessor", preprocessor),
            ("model", model),
        ])
        pipeline.fit(X_train, y_train)
        predictions = pipeline.predict(X_test)
        metrics = compute_metrics(y_test, predictions)
        cv_scores = cross_val_score(pipeline, X_train, y_train, cv=StratifiedKFold(n_splits=3), scoring="f1_weighted")
        results[name] = {
            "metrics": metrics,
            "cv_score": round(float(cv_scores.mean()), 4),
            "pipeline": pipeline,
        }

    best_model_name = max(results, key=lambda name: results[name]["metrics"]["f1_score"])
    best_pipeline = results[best_model_name]["pipeline"]
    best_model = best_pipeline.named_steps["model"]
    best_preprocessor = best_pipeline.named_steps["preprocessor"]

    joblib.dump(best_model, MODEL_DIR / "best_model.joblib")
    joblib.dump(best_preprocessor, MODEL_DIR / "preprocessor.joblib")

    summary = {
        "best_model": best_model_name,
        "results": {name: {**info["metrics"], "cv_score": info["cv_score"]} for name, info in results.items()},
        "training_records": len(X_train),
        "testing_records": len(X_test),
        "last_trained": pd.Timestamp.now().isoformat(),
    }

    with open(BASE_DIR / "training" / "evaluation_summary.json", "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    return summary


if __name__ == "__main__":
    summary = train_and_select_model()
    print(json.dumps(summary, indent=2))
