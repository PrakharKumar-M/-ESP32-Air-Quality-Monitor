const SensorData = require("../models/SensorData");

function random(min, max) {
  return +(Math.random() * (max - min) + min).toFixed(1);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function generateSensorData() {
  try {
    // Environmental values
    const temperature = random(28, 35);

    const humidity = randomInt(55, 75);

    const pm25 = randomInt(20, 150);

    const pm10 = randomInt(40, 220);

    const co = randomInt(5, 40);

    const co2 = randomInt(400, 1200);

    const gas = randomInt(350, 500);

    // AQI calculation for simulation
    let aqi = Math.round(
      pm25 * 0.6 +
      pm10 * 0.2 +
      co * 1.5 +
      gas * 0.1
    );

    // Keep AQI within 0–500
    if (aqi < 0) {
      aqi = 0;
    }

    if (aqi > 500) {
      aqi = 500;
    }

    // AQI category
    let category = "Good";

    if (aqi > 50 && aqi <= 100) {
      category = "Satisfactory";
    } else if (aqi > 100 && aqi <= 200) {
      category = "Moderate";
    } else if (aqi > 200 && aqi <= 300) {
      category = "Poor";
    } else if (aqi > 300 && aqi <= 400) {
      category = "Very Poor";
    } else if (aqi > 400) {
      category = "Severe";
    }

    await SensorData.create({
      deviceId: "ESP32-001",

      location: "Lucknow",

      temperature,

      humidity,

      pm25,

      pm10,

      co,

      co2,

      gas,

      aqi,

      status: "Online",
    });

    console.log(
      `✅ Sensor Data Generated | AQI: ${aqi} | Category: ${category}`
    );

  } catch (error) {
    console.log(
      "❌ Sensor Error:",
      error.message
    );
  }
}

module.exports = generateSensorData;