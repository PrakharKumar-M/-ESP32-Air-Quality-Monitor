"""
AirGuard AI
Calibration-Aware Risk Model Training

Goal:
Train a Random Forest to reproduce the same
AirGuard Risk Score used by the live backend.

This is NOT official AQI.
"""

from pathlib import Path
import json

import numpy as np
import pandas as pd

from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
import joblib


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "sensor_data_clean.csv"
MODEL_DIR = BASE_DIR / "models"

MODEL_DIR.mkdir(parents=True, exist_ok=True)

MODEL_PATH = MODEL_DIR / "airguard_risk_model_v2.pkl"
INFO_PATH = MODEL_DIR / "risk_model_v2_feature_info.json"


# ============================================================
# FEATURES
# ============================================================

FEATURES = [
    "temperature",
    "humidity",
    "mq135",
    "co",
]

TARGET = "riskScore"


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 60)
print("AIRGUARD AI - MODEL TRAINING V2")
print("=" * 60)

print(f"Dataset: {DATA_PATH}")

df = pd.read_csv(DATA_PATH)

print(f"Original rows: {len(df)}")


# ============================================================
# NUMERIC CONVERSION
# ============================================================

for column in FEATURES + [TARGET]:
    df[column] = pd.to_numeric(
        df[column],
        errors="coerce"
    )


# ============================================================
# REMOVE INVALID VALUES
# ============================================================

before = len(df)

df = df.dropna(
    subset=FEATURES + [TARGET]
).copy()

df = df[
    (df["temperature"] >= -40) &
    (df["temperature"] <= 85) &
    (df["humidity"] >= 0) &
    (df["humidity"] <= 100) &
    (df["mq135"] >= 0) &
    (df["mq135"] <= 4095) &
    (df["co"] >= 0) &
    (df["co"] <= 4095) &
    (df[TARGET] >= 0) &
    (df[TARGET] <= 500)
].copy()

after = len(df)

print(f"Valid rows: {after}")
print(f"Removed rows: {before - after}")


# ============================================================
# CHECK DATA
# ============================================================

if len(df) < 100:
    raise RuntimeError(
        "Not enough valid training data."
    )


print()
print("Risk Score statistics:")
print(df[TARGET].describe())


# ============================================================
# FEATURES / TARGET
# ============================================================

X = df[FEATURES]
y = df[TARGET]


# ============================================================
# TRAIN / TEST SPLIT
# ============================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
)


print()
print(f"Training samples: {len(X_train)}")
print(f"Testing samples: {len(X_test)}")


# ============================================================
# RANDOM FOREST
# ============================================================

model = RandomForestRegressor(
    n_estimators=500,
    max_depth=20,
    min_samples_split=4,
    min_samples_leaf=2,
    max_features=1.0,
    random_state=42,
    n_jobs=-1,
)


print()
print("Training Random Forest...")

model.fit(
    X_train,
    y_train
)


# ============================================================
# PREDICTION
# ============================================================

predictions = model.predict(X_test)

predictions = np.clip(
    predictions,
    0,
    500
)


# ============================================================
# METRICS
# ============================================================

mae = mean_absolute_error(
    y_test,
    predictions
)

rmse = np.sqrt(
    mean_squared_error(
        y_test,
        predictions
    )
)

r2 = r2_score(
    y_test,
    predictions
)


print()
print("=" * 60)
print("MODEL PERFORMANCE")
print("=" * 60)

print(f"MAE : {mae:.2f}")
print(f"RMSE: {rmse:.2f}")
print(f"R²  : {r2:.4f}")


# ============================================================
# FEATURE IMPORTANCE
# ============================================================

importance = dict(
    zip(
        FEATURES,
        model.feature_importances_
    )
)

importance = dict(
    sorted(
        importance.items(),
        key=lambda x: x[1],
        reverse=True
    )
)

print()
print("Feature Importance:")

for name, value in importance.items():
    print(
        f"{name:15s}: {value:.4f}"
    )


# ============================================================
# SAMPLE PREDICTIONS
# ============================================================

print()
print("Sample predictions:")

sample_count = min(
    10,
    len(X_test)
)

for actual, predicted in zip(
    y_test.iloc[:sample_count],
    predictions[:sample_count]
):
    print(
        f"Actual: {actual:.2f} | "
        f"Predicted: {predicted:.2f}"
    )


# ============================================================
# SAVE MODEL
# ============================================================

joblib.dump(
    model,
    MODEL_PATH
)


# ============================================================
# SAVE METADATA
# ============================================================

metadata = {
    "model": "AirGuard Random Forest V2",
    "purpose": "AirGuard Risk Score estimation",
    "features": FEATURES,
    "target": TARGET,
    "trainingSamples": int(len(X_train)),
    "testingSamples": int(len(X_test)),
    "metrics": {
        "MAE": float(mae),
        "RMSE": float(rmse),
        "R2": float(r2),
    },
    "featureImportance": {
        key: float(value)
        for key, value in importance.items()
    },
    "riskScoreRange": {
        "min": 0,
        "max": 500,
    },
    "regulatoryDisclaimer": (
        "AirGuard Risk Score is a project-specific "
        "predictive score and is not official AQI "
        "or a laboratory measurement."
    ),
}


with open(
    INFO_PATH,
    "w",
    encoding="utf-8"
) as file:
    json.dump(
        metadata,
        file,
        indent=2
    )


# ============================================================
# COMPLETE
# ============================================================

print()
print("=" * 60)
print("TRAINING COMPLETE")
print("=" * 60)

print(f"Model saved : {MODEL_PATH}")
print(f"Metadata    : {INFO_PATH}")

print()
print("AirGuard AI V2 ready.")