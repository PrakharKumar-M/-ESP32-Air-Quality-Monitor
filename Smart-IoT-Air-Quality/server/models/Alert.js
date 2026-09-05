const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
    },

    location: {
      type: String,
      required: true,
    },

    aqi: {
      type: Number,
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      default: "Unread",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Alert", alertSchema);