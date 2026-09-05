import pandas as pd
from pathlib import Path

# ============================================================
# AIRGUARD AI - DATA CLEANING
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

INPUT_FILE = BASE_DIR / "data" / "sensor_data.csv"
OUTPUT_FILE = BASE_DIR / "data" / "sensor_data_clean.csv"

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
print("AIRGUARD AI - DATA CLEANING")
print("=" * 60)

df = pd.read_csv(INPUT_FILE)

print(f"\nOriginal rows: {len(df)}")

# ============================================================
# CONVERT NUMERIC COLUMNS
# ============================================================

for column in FEATURES + [TARGET]:
    df[column] = pd.to_numeric(
        df[column],
        errors="coerce"
    )


# ============================================================
# REMOVE MISSING VALUES
# ============================================================

before_missing = len(df)

df = df.dropna(
    subset=FEATURES + [TARGET]
)

removed_missing = before_missing - len(df)

print(f"Removed missing rows: {removed_missing}")


# ============================================================
# REMOVE PHYSICALLY INVALID DHT VALUES
# ============================================================

before_dht = len(df)

df = df[
    (df["temperature"] > 0) &
    (df["humidity"] > 0) &
    (df["humidity"] <= 100)
]

removed_dht = before_dht - len(df)

print(f"Removed invalid DHT rows: {removed_dht}")


# ============================================================
# REMOVE ZERO GAS READINGS
#
# Zero MQ values in this dataset appear in a long cluster
# and are treated as unavailable/invalid sensor readings.
# ============================================================

before_gas = len(df)

df = df[
    (df["mq135"] > 0) &
    (df["co"] > 0)
]

removed_gas = before_gas - len(df)

print(f"Removed zero gas rows: {removed_gas}")


# ============================================================
# VALIDATE SENSOR RANGES
# ============================================================

before_range = len(df)

df = df[
    (df["temperature"] >= 0) &
    (df["temperature"] <= 85) &
    (df["humidity"] >= 0) &
    (df["humidity"] <= 100) &
    (df["mq135"] >= 0) &
    (df["mq135"] <= 4095) &
    (df["co"] >= 0) &
    (df["co"] <= 4095)
]

removed_range = before_range - len(df)

print(f"Removed out-of-range rows: {removed_range}")


# ============================================================
# CLAMP RISK SCORE
# ============================================================

df[TARGET] = df[TARGET].clip(
    lower=0,
    upper=500
)


# ============================================================
# SORT BY TIME
# ============================================================

if "timestamp" in df.columns:

    df["timestamp"] = pd.to_datetime(
        df["timestamp"],
        errors="coerce"
    )

    df = df.dropna(
        subset=["timestamp"]
    )

    df = df.sort_values(
        "timestamp"
    )

    df = df.drop_duplicates(
        subset=["timestamp"]
    )


# ============================================================
# SAVE
# ============================================================

df.to_csv(
    OUTPUT_FILE,
    index=False
)


# ============================================================
# REPORT
# ============================================================

print("\n" + "=" * 60)
print("CLEANING COMPLETE")
print("=" * 60)

print(f"\nOriginal rows : {before_missing}")
print(f"Clean rows    : {len(df)}")
print(f"Rows removed  : {before_missing - len(df)}")

print("\nRemaining zero/invalid values:")

print(
    (df[FEATURES] <= 0).sum()
)

print("\nRisk Score statistics:")

print(
    df[TARGET].describe()
)

print("\nClean dataset saved to:")

print(OUTPUT_FILE)

print("\n" + "=" * 60)