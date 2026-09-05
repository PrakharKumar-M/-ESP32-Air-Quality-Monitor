import joblib
import os


MODEL_PATH = os.path.join(
    "models",
    "aqi_random_forest.pkl"
)


# Load trained model
model = joblib.load(MODEL_PATH)

print("✅ ML Model Loaded")


# Example current sensor readings
temperature = 31.0
humidity = 68.0
gas = 850.0
co = 18.0


# Model input
input_data = [[
    temperature,
    humidity,
    gas,
    co
]]


# Prediction
prediction = model.predict(input_data)[0]

predicted_aqi = round(prediction)


# Keep AQI within 0-500
predicted_aqi = max(
    0,
    min(predicted_aqi, 500)
)


# Determine pollution category
if predicted_aqi <= 50:
    category = "Good"

elif predicted_aqi <= 100:
    category = "Satisfactory"

elif predicted_aqi <= 200:
    category = "Moderate"

elif predicted_aqi <= 300:
    category = "Poor"

elif predicted_aqi <= 400:
    category = "Very Poor"

else:
    category = "Severe"


print()
print("==============================")
print("      AI AQI PREDICTION")
print("==============================")

print(f"Temperature : {temperature} °C")
print(f"Humidity    : {humidity} %")
print(f"Gas         : {gas}")
print(f"CO          : {co}")

print("------------------------------")

print(f"Predicted AQI : {predicted_aqi}")
print(f"Category      : {category}")