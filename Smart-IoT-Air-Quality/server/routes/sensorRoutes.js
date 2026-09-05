const express = require("express");

const router = express.Router();

const {
  getSensorData,
  createSensorData,
  getSensorAnalysis,
  calibrateSensors,
  getCalibration,
} = require("../controllers/sensorController");

const SensorData = require("../models/SensorData");

// ==========================================
// GET ALL SENSOR DATA
// GET /api/sensors
// ==========================================

router.get("/", getSensorData);


// ==========================================
// GET SENSOR ANALYSIS
// GET /api/sensors/analysis
// ==========================================

router.get("/analysis", getSensorAnalysis);


// ==========================================
// GET SENSOR CALIBRATION
// GET /api/sensors/calibration
// ==========================================

router.get("/calibration", getCalibration);


// ==========================================
// CALIBRATE SENSOR
// POST /api/sensors/calibrate
// ==========================================

router.post("/calibrate", calibrateSensors);


// ==========================================
// GET CURRENT AIRGUARD ALERT STATUS
// GET /api/sensors/alert
// ==========================================

router.get("/alert", async (req, res) => {
  try {
    const latestSensor = await SensorData.findOne()
      .sort({ createdAt: -1 });

    if (!latestSensor) {
      return res.status(404).json({
        success: false,
        message: "No sensor data available",
      });
    }

    const riskScore = Number(
      latestSensor.riskScore ??
      latestSensor.aqi ??
      0
    );

    let green = false;
    let red = false;
    let buzzer = false;

    // ==========================================
    // AIRGUARD RISK LEVEL
    // ==========================================

    if (riskScore < 100) {
      green = true;
    } else if (riskScore < 250) {
      red = true;
    } else {
      red = true;
      buzzer = true;
    }

    let riskLevel = "LOW";

    if (riskScore >= 250) {
      riskLevel = "CRITICAL";
    } else if (riskScore >= 100) {
      riskLevel = "ELEVATED";
    }

    res.json({
      success: true,

      riskScore,

      riskLevel,

      green,

      red,

      buzzer,

      status: latestSensor.status || "Online",

      deviceId: latestSensor.deviceId,

      location: latestSensor.location,

      createdAt: latestSensor.createdAt,
    });

  } catch (error) {

    console.error(
      "Alert API Error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


// ==========================================
// POST SENSOR DATA
// POST /api/sensors
// ==========================================

router.post("/", createSensorData);


// ==========================================
// EXPORT ROUTER
// ==========================================

module.exports = router;