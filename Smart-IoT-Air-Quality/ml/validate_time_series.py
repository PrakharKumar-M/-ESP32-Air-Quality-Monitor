import os
import json
import joblib
import numpy as np
import pandas as pd

from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


# ============================================================
# AirGuard AI - Time Series Validation
# ============================================================

print()
print("=" * 60)
print("          AirGuard AI - Time-Series Validation")
print("=" * 60)
print()


# ------------------------------------------------------------
# Paths
# ------------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_PATH = os.path.join(
    BASE_DIR,
    "data",
    "sensor_data_clean.csv"
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "airguard_risk_model_v2.pkl"
)

METADATA_PATH = os.path.join(
    BASE_DIR,
    "models",
    "feature_info.json"
)


# ------------------------------------------------------------
# Load dataset
# ------------------------------------------------------------

print("📂 Dataset:")
print(DATA_PATH)
print()

print("📊 Loading dataset...")

df = pd.read_csv(DATA_PATH)

print(f"✅ Dataset loaded: {len(df)} rows")
print()


# ------------------------------------------------------------
# Validate required columns
# ------------------------------------------------------------

features = [
    "temperature",
    "humidity",
    "mq135",
    "co"
]

target = "riskScore"

required_columns = [
    "timestamp",
    *features,
    target
]

missing_columns = [
    column
    for column in required_columns
    if column not in df.columns
]

if missing_columns:
    raise ValueError(
        f"Missing required columns: {missing_columns}"
    )


# ------------------------------------------------------------
# Convert data types
# ------------------------------------------------------------

for column in features + [target]:
    df[column] = pd.to_numeric(
        df[column],
        errors="coerce"
    )

df["timestamp"] = pd.to_datetime(
    df["timestamp"],
    errors="coerce"
)


# ------------------------------------------------------------
# Remove invalid rows
# ------------------------------------------------------------

before = len(df)

df = df.dropna(
    subset=required_columns
).copy()

removed = before - len(df)

print(f"🧹 Invalid rows removed: {removed}")


# ------------------------------------------------------------
# Sort chronologically
# ------------------------------------------------------------

df = df.sort_values(
    "timestamp"
).reset_index(drop=True)


print()
print("=" * 60)
print("                 TIME ORDER")
print("=" * 60)

print()
print("First reading:")
print(df.iloc[0]["timestamp"])

print()
print("Last reading:")
print(df.iloc[-1]["timestamp"])


# ------------------------------------------------------------
# Time-series split
# ------------------------------------------------------------

TEST_SIZE = 0.20

split_index = int(
    len(df) * (1 - TEST_SIZE)
)

train_df = df.iloc[:split_index].copy()
test_df = df.iloc[split_index:].copy()


print()
print("=" * 60)
print("              TIME-SERIES SPLIT")
print("=" * 60)

print()
print(f"Total records : {len(df)}")
print(f"Training      : {len(train_df)}")
print(f"Testing       : {len(test_df)}")

print()
print("Training period:")
print(
    f"{train_df.iloc[0]['timestamp']} "
    f"→ "
    f"{train_df.iloc[-1]['timestamp']}"
)

print()
print("Testing period:")
print(
    f"{test_df.iloc[0]['timestamp']} "
    f"→ "
    f"{test_df.iloc[-1]['timestamp']}"
)


# ------------------------------------------------------------
# Load trained model
# ------------------------------------------------------------

print()
print("=" * 60)
print("                 MODEL")
print("=" * 60)

print()
print("Loading trained model...")

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(
        f"Model not found:\n{MODEL_PATH}"
    )

model = joblib.load(MODEL_PATH)

print("✅ Model loaded successfully")


# ------------------------------------------------------------
# Prepare data
# ------------------------------------------------------------

X_train = train_df[features]
y_train = train_df[target]

X_test = test_df[features]
y_test = test_df[target]


# ------------------------------------------------------------
# IMPORTANT:
# Retrain a NEW model using ONLY historical data.
#
# This avoids evaluating the model that was trained on
# random train/test data.
# ------------------------------------------------------------

from sklearn.ensemble import RandomForestRegressor

print()
print("Training validation model using historical data only...")
print()

validation_model = RandomForestRegressor(
    n_estimators=300,
    max_depth=18,
    min_samples_split=4,
    min_samples_leaf=2,
    max_features=1.0,
    random_state=42,
    n_jobs=-1
)

validation_model.fit(
    X_train,
    y_train
)

print("✅ Validation model trained")


# ------------------------------------------------------------
# Predict FUTURE test data
# ------------------------------------------------------------

print()
print("🔮 Predicting unseen future readings...")

predictions = validation_model.predict(
    X_test
)

predictions = np.clip(
    predictions,
    0,
    500
)


# ------------------------------------------------------------
# Metrics
# ------------------------------------------------------------

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


# ------------------------------------------------------------
# Results
# ------------------------------------------------------------

print()
print("=" * 60)
print("           FUTURE PREDICTION RESULTS")
print("=" * 60)

print()

print(f"MAE  : {mae:.2f}")
print(f"RMSE : {rmse:.2f}")
print(f"R²   : {r2:.4f}")


# ------------------------------------------------------------
# Interpretation
# ------------------------------------------------------------

print()
print("=" * 60)
print("              INTERPRETATION")
print("=" * 60)

print()

print(
    f"On unseen future data, the model's average "
    f"absolute error is approximately {mae:.2f} Risk Score points."
)

print()

print(
    "R² indicates how much variation in future Risk Score "
    "is explained by the model."
)

print()

print(
    "⚠️ This is NOT regulatory AQI accuracy."
)

print(
    "AirGuard Risk Score is a project-specific environmental "
    "risk indicator."
)


# ------------------------------------------------------------
# Feature importance
# ------------------------------------------------------------

print()
print("=" * 60)
print("             FEATURE IMPORTANCE")
print("=" * 60)

importance = validation_model.feature_importances_

feature_importance = sorted(
    zip(features, importance),
    key=lambda x: x[1],
    reverse=True
)

print()

for feature, value in feature_importance:
    print(
        f"{feature:<15}: {value:.4f}"
    )


# ------------------------------------------------------------
# Sample future predictions
# ------------------------------------------------------------

print()
print("=" * 60)
print("          SAMPLE FUTURE PREDICTIONS")
print("=" * 60)

print()

sample_count = min(
    10,
    len(test_df)
)

sample_indices = np.linspace(
    0,
    len(test_df) - 1,
    sample_count,
    dtype=int
)

for index in sample_indices:

    actual = y_test.iloc[index]

    predicted = predictions[index]

    error = abs(
        actual - predicted
    )

    timestamp = test_df.iloc[index]["timestamp"]

    print(
        f"{timestamp} | "
        f"Actual: {actual:6.2f} | "
        f"Predicted: {predicted:6.2f} | "
        f"Error: {error:6.2f}"
    )


# ------------------------------------------------------------
# Save validation results
# ------------------------------------------------------------

results = {
    "validation_type": "time_series",
    "total_records": int(len(df)),
    "training_records": int(len(train_df)),
    "testing_records": int(len(test_df)),

    "training_start": str(
        train_df.iloc[0]["timestamp"]
    ),

    "training_end": str(
        train_df.iloc[-1]["timestamp"]
    ),

    "testing_start": str(
        test_df.iloc[0]["timestamp"]
    ),

    "testing_end": str(
        test_df.iloc[-1]["timestamp"]
    ),

    "mae": round(float(mae), 4),
    "rmse": round(float(rmse), 4),
    "r2": round(float(r2), 4),

    "features": features,

    "feature_importance": {
        feature: round(float(value), 6)
        for feature, value
        in feature_importance
    }
}


RESULT_PATH = os.path.join(
    BASE_DIR,
    "models",
    "time_series_validation.json"
)

with open(
    RESULT_PATH,
    "w",
    encoding="utf-8"
) as file:

    json.dump(
        results,
        file,
        indent=4
    )


print()
print("=" * 60)
print("              VALIDATION COMPLETE")
print("=" * 60)

print()
print("💾 Validation results saved:")
print(RESULT_PATH)

print()
print("=" * 60)