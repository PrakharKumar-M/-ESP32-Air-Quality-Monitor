const express = require("express");
const axios = require("axios");

const router = express.Router();

const ML_API_URL = "http://127.0.0.1:8000";


// ============================================================
// POST /api/ml/predict
// ============================================================

router.post("/predict", async (req, res) => {

  try {

    const {
      temperature,
      humidity,
      mq135,
      co,
      currentRiskScore
    } = req.body;


    // --------------------------------------------------------
    // Validate required sensor values
    // --------------------------------------------------------

    if (
      temperature === undefined ||
      humidity === undefined ||
      mq135 === undefined ||
      co === undefined
    ) {

      return res.status(400).json({
        success: false,
        message:
          "Temperature, humidity, mq135 and co are required"
      });

    }


    // --------------------------------------------------------
    // Build ML request
    // --------------------------------------------------------

    const mlData = {
      temperature: Number(temperature),
      humidity: Number(humidity),
      mq135: Number(mq135),
      co: Number(co)
    };


    // Current Risk Score is optional
    // It allows ML API to calculate rising/falling trend

    if (currentRiskScore !== undefined && currentRiskScore !== null) {

      mlData.currentRiskScore =
        Number(currentRiskScore);

    }


    console.log(
      "🤖 Sending data to AirGuard ML:",
      mlData
    );


    // --------------------------------------------------------
    // Call FastAPI
    // --------------------------------------------------------

    const response = await axios.post(
      `${ML_API_URL}/predict`,
      mlData,
      {
        timeout: 5000
      }
    );


    // --------------------------------------------------------
    // Return ML result to React
    // --------------------------------------------------------

    return res.json(
      response.data
    );


  } catch (error) {

    console.error(
      "❌ ML Prediction Error:",
      error.response?.data || error.message
    );


    return res.status(500).json({

      success: false,

      message:
        "AirGuard AI prediction service unavailable",

      error:
        error.response?.data?.detail ||
        error.message

    });

  }

});


// ============================================================
// ML HEALTH CHECK
// ============================================================

router.get("/health", async (req, res) => {

  try {

    const response = await axios.get(
      `${ML_API_URL}/health`,
      {
        timeout: 3000
      }
    );


    return res.json(
      response.data
    );


  } catch (error) {

    return res.status(503).json({

      success: false,

      mlModelLoaded: false,

      message:
        "AirGuard AI ML service unavailable"

    });

  }

});


module.exports = router;