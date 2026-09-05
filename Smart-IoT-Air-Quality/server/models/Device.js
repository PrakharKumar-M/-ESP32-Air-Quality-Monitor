const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
    },

    deviceName: {
      type: String,
      required: true,
    },

    location: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      default: "Offline",
    },

    lastSeen: {
      type: Date,
      default: Date.now,
    },

    // ==========================================================
    // SENSOR CALIBRATION
    // ==========================================================

    calibration: {
      mq135Baseline: {
        type: Number,
        default: null,
      },

      mq7Baseline: {
        type: Number,
        default: null,
      },

      samples: {
        type: Number,
        default: 0,
      },

      calibratedAt: {
        type: Date,
        default: null,
      },
    },
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Device", deviceSchema);