import os
import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv


# ==========================================
# Load environment variables
# ==========================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BASE_DIR, "server", ".env")

load_dotenv(ENV_PATH)


MONGO_URI = os.getenv(
    "MONGO_URI",
    "mongodb://127.0.0.1:27017/air_quality_db"
)


# ==========================================
# Connect to MongoDB
# ==========================================

print("==========================================")
print("AirGuard AI - Data Collection")
print("==========================================")

print("Connecting to MongoDB...")

client = MongoClient(MONGO_URI)

db = client["air_quality_db"]
collection = db["sensordatas"]

print("✅ MongoDB connected")


# ==========================================
# Get sensor readings
# ==========================================

documents = list(
    collection.find({})
    .sort("createdAt", 1)
)


print(f"📊 Total MongoDB readings: {len(documents)}")


if len(documents) == 0:
    print("❌ No sensor data found.")
    print("Make sure ESP32 is sending data to the backend.")
    client.close()
    exit()


# ==========================================
# Convert MongoDB data
# ==========================================

data = []


for item in documents:

    data.append({

        "timestamp": item.get("createdAt"),

        "temperature": item.get("temperature"),

        "humidity": item.get("humidity"),

        # Actual sensors used by our ESP32
        "mq135": item.get("mq135"),

        "co": item.get("co"),

        # Project-specific risk target
        "riskScore": item.get(
            "riskScore",
            item.get("aqi")
        ),

    })


# ==========================================
# Create DataFrame
# ==========================================

df = pd.DataFrame(data)


# ==========================================
# Keep only required AirGuard fields
# ==========================================

required_columns = [
    "timestamp",
    "temperature",
    "humidity",
    "mq135",
    "co",
    "riskScore"
]

df = df[required_columns]


# ==========================================
# Remove incomplete rows
# ==========================================

before = len(df)

df = df.dropna(
    subset=[
        "temperature",
        "humidity",
        "mq135",
        "co",
        "riskScore"
    ]
)

after = len(df)

print(
    f"🧹 Removed incomplete rows: {before - after}"
)


# ==========================================
# Sort chronologically
# ==========================================

df = df.sort_values(
    "timestamp"
)


# ==========================================
# Remove duplicate timestamps
# ==========================================

df = df.drop_duplicates(
    subset=["timestamp"],
    keep="last"
)


# ==========================================
# Create data folder
# ==========================================

DATA_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "data"
)

os.makedirs(
    DATA_DIR,
    exist_ok=True
)


# ==========================================
# Save CSV
# ==========================================

output_path = os.path.join(
    DATA_DIR,
    "sensor_data.csv"
)


df.to_csv(
    output_path,
    index=False
)


# ==========================================
# Display results
# ==========================================

print()
print("==========================================")
print("✅ Dataset created successfully")
print("==========================================")

print(f"📁 File: {output_path}")
print(f"📊 Rows: {len(df)}")

print()
print("Columns:")
print(df.columns.tolist())

print()
print("First 5 readings:")
print(df.head())

print()
print("Dataset statistics:")
print(df.describe())

print()
print("==========================================")
print("AirGuard AI dataset ready for training")
print("==========================================")


# ==========================================
# Close MongoDB
# ==========================================

client.close()