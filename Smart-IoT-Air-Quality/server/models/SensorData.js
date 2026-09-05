const mongoose = require("mongoose");

const sensorSchema = new mongoose.Schema(
  {
    // ==========================================
    // DEVICE INFORMATION
    // ==========================================

    deviceId: {
      type: String,
      required: true,
      default: "ESP32-001",
      trim: true,
    },

    location: {
      type: String,
      required: true,
      default: "Lucknow",
      trim: true,
    },

    // ==========================================
    // DHT11 SENSOR
    // ==========================================

    temperature: {
      type: Number,
      required: true,
      min: -40,
      max: 85,
    },

    humidity: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    // ==========================================
    // MQ-135 RAW ADC VALUE
    // ==========================================

    mq135: {
      type: Number,
      default: null,
      min: 0,
    },

    // ==========================================
    // MQ-7 RAW ADC VALUE
    // ==========================================

    co: {
      type: Number,
      default: null,
      min: 0,
    },

    // ==========================================
    // SENSOR-DERIVED AQI
    // ==========================================
    //
    // IMPORTANT:
    // This is an estimated/project AQI derived
    // from sensor signals.
    //
    // It should NOT be presented as an official
    // regulatory AQI unless proper pollutant
    // calibration and standard AQI calculation
    // are implemented.
    //

    estimatedAQI: {
      type: Number,
      default: 0,
      min: 0,
      max: 500,
    },

    // ==========================================
    // ML PREDICTION
    // ==========================================
    //
    // Future AQI predicted by ML model.
    //

    predictedAQI: {
      type: Number,
      default: null,
      min: 0,
      max: 500,
    },

    // ==========================================
    // AQI CATEGORY
    // ==========================================

    category: {
      type: String,
      enum: [
        "Good",
        "Satisfactory",
        "Moderate",
        "Poor",
        "Very Poor",
        "Severe",
        "Unknown",
      ],
      default: "Unknown",
    },

    // ==========================================
    // ML INFORMATION
    // ==========================================

    predictionConfidence: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },

    predictionHorizonMinutes: {
      type: Number,
      default: null,
      min: 0,
    },

    // ==========================================
    // TREND
    // ==========================================

    trend: {
      type: String,
      enum: [
        "Improving",
        "Stable",
        "Worsening",
        "Unknown",
      ],
      default: "Unknown",
    },

    // ==========================================
    // ALERT INFORMATION
    // ==========================================

    alertLevel: {
      type: String,
      enum: [
        "Normal",
        "Warning",
        "Danger",
      ],
      default: "Normal",
    },

    // ==========================================
    // DEVICE STATUS
    // ==========================================

    status: {
      type: String,
      enum: [
        "Online",
        "Offline",
        "Sensor Disconnected",
      ],
      default: "Online",
    },

    // ==========================================
    // DATA QUALITY
    // ==========================================

    dataQuality: {
      type: String,
      enum: [
        "Good",
        "Warning",
        "Invalid",
      ],
      default: "Good",
    },
  },

  {
    timestamps: true,
  }
);


// ==========================================
// INDEXES
// ==========================================
//
// Useful for dashboard/history/ML queries.
//

sensorSchema.index({
  deviceId: 1,
  createdAt: -1,
});

sensorSchema.index({
  location: 1,
  createdAt: -1,
});

sensorSchema.index({
  createdAt: -1,
});

sensorSchema.index({
  estimatedAQI: -1,
});


// ==========================================
// EXPORT
// ==========================================

module.exports = mongoose.model(
  "SensorData",
  sensorSchema
);