const SensorData = require("../models/SensorData");
const Device = require("../models/Device");
const Alert = require("../models/Alert");

const {
  calculateRiskScore,
  getRiskCategory,
  getAlertLevel,
  calculateTrend,
  calculateForecast,
  median,
} = require("../utils/riskEngine");

// ============================================================
// HELPERS
// ============================================================

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function validADC(value) {
  return (
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 4095
  );
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}


// ============================================================
// ALERT HELPERS
// ============================================================

/*
 * Convert an Alert document's category back into
 * the corresponding AirGuard alert level.
 *
 * Alert schema does not currently contain alertLevel,
 * so we infer it from the stored risk category.
 */
function getStoredAlertLevel(category) {
  switch (category) {
    // Warning
    case "Moderate":
      return "Warning";

    // Danger
    case "Poor":
    case "Very Poor":
    case "Severe":
    case "Hazardous":
      return "Danger";

    // Normal
    case "Good":
    case "Satisfactory":
    default:
      return "Normal";
  }
}


/*
 * Create an automatic alert only when the alert state changes.
 *
 * This prevents the ESP32 from creating hundreds of
 * identical alerts because it sends readings repeatedly.
 */
async function createAutomaticAlert({
  deviceId,
  location,
  riskScore,
  category,
  alertLevel,
}) {
  try {
    // --------------------------------------------------------
    // Normal state
    // --------------------------------------------------------

    if (alertLevel === "Normal") {
      /*
       * Check whether the previous alert was Warning/Danger.
       * If so, create one recovery alert.
       */
      const previousAlert = await Alert.findOne({
        deviceId,
      })
        .sort({ createdAt: -1 })
        .lean();

      if (!previousAlert) {
        return null;
      }

      const previousLevel =
        getStoredAlertLevel(
          previousAlert.category
        );

      if (
        previousLevel === "Warning" ||
        previousLevel === "Danger"
      ) {
        const recoveryAlert =
          await Alert.create({
            deviceId,
            location: location || "Unknown",

            // AirGuard Risk Score
            // NOT official AQI.
            aqi: riskScore,

            category: "Good",

            message:
              `Air quality conditions have returned to normal. ` +
              `Current AirGuard Risk Score is ${riskScore}.`,

            status: "Unread",
          });

        console.log(
          `✅ Recovery alert created for ${deviceId}`
        );

        return recoveryAlert;
      }

      return null;
    }


    // --------------------------------------------------------
    // Warning / Danger
    // --------------------------------------------------------

    const previousAlert =
      await Alert.findOne({
        deviceId,
      })
        .sort({ createdAt: -1 })
        .lean();


    // --------------------------------------------------------
    // Determine previous alert level
    // --------------------------------------------------------

    const previousLevel =
      previousAlert
        ? getStoredAlertLevel(
            previousAlert.category
          )
        : "Normal";


    // --------------------------------------------------------
    // Prevent duplicate alerts
    // --------------------------------------------------------

    if (previousLevel === alertLevel) {
      return null;
    }


    // --------------------------------------------------------
    // Build message
    // --------------------------------------------------------

    let message = "";


    if (alertLevel === "Warning") {
      message =
        `Air quality risk has reached the Warning level. ` +
        `Current AirGuard Risk Score is ${riskScore}. ` +
        `Monitor the environment and consider improving ventilation.`;
    }


    if (alertLevel === "Danger") {
      message =
        `High air quality risk detected. ` +
        `Current AirGuard Risk Score is ${riskScore}. ` +
        `Immediate attention is recommended.`;
    }


    // --------------------------------------------------------
    // Create alert
    // --------------------------------------------------------

    const alert =
      await Alert.create({
        deviceId,
        location: location || "Unknown",

        // Compatibility field.
        // This is the AirGuard Risk Score,
        // NOT official regulatory AQI.
        aqi: riskScore,

        category,

        message,

        status: "Unread",
      });


    console.log("");
    console.log("================================");
    console.log("       🚨 AIRGUARD ALERT");
    console.log("================================");
    console.log(`Device: ${deviceId}`);
    console.log(`Location: ${location || "Unknown"}`);
    console.log(`Risk Score: ${riskScore}`);
    console.log(`Category: ${category}`);
    console.log(`Alert Level: ${alertLevel}`);
    console.log(`Message: ${message}`);
    console.log("================================");
    console.log("");


    return alert;

  } catch (error) {
    /*
     * Alert failure should NOT prevent sensor data
     * from being stored.
     */
    console.error(
      "Automatic alert creation error:",
      error
    );

    return null;
  }
}


// ============================================================
// GET SENSOR DATA
// ============================================================

exports.getSensorData = async (req, res) => {
  try {
    const requestedLimit =
      Number(req.query.limit);

    const limit =
      Number.isFinite(requestedLimit) &&
      requestedLimit > 0
        ? Math.min(
            Math.floor(requestedLimit),
            500
          )
        : 100;

    const deviceId =
      req.query.deviceId;

    const query = deviceId
      ? { deviceId }
      : {};

    const data =
      await SensorData.find(query)
        .sort({
          createdAt: -1,
        })
        .limit(limit)
        .lean();


    const normalized =
      data.map((item) => {
        const riskScore =
          clamp(
            Math.round(
              Number(
                item.riskScore ??
                item.estimatedAQI ??
                item.aqi ??
                0
              )
            ) || 0,
            0,
            500
          );


        return {
          ...item,

          // ====================================================
          // Compatibility with old frontend
          // ====================================================

          mq135:
            item.mq135 ??
            item.gas ??
            0,

          mq7:
            item.mq7 ??
            item.co ??
            0,

          co:
            item.co ??
            item.mq7 ??
            0,


          // ====================================================
          // AirGuard Risk Score
          // ====================================================

          riskScore,


          // ====================================================
          // Legacy frontend compatibility
          // ====================================================

          aqi: riskScore,

          // IMPORTANT:
          // This is NOT official AQI.
          // It is the project's Air Quality Risk Score.

          estimatedAQI: riskScore,
        };
      });


    return res.json({
      success: true,
      count: normalized.length,
      data: normalized,
    });

  } catch (error) {
    console.error(
      "Get sensor data error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch sensor data",
      error: error.message,
    });
  }
};


// ============================================================
// POST SENSOR DATA
// ============================================================

exports.createSensorData = async (
  req,
  res
) => {
  try {
    const {
      deviceId,
      location,

      temperature,
      humidity,

      mq135,
      mq7,
      co,

      mq135VoltageMv,
      mq7VoltageMv,
      mq7AO,
    } = req.body;


    // ========================================================
    // REQUIRED FIELDS
    // ========================================================

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message:
          "deviceId is required",
      });
    }


    // ========================================================
    // CONVERT NUMERIC VALUES
    // ========================================================

    const temp =
      toNumber(temperature);

    const hum =
      toNumber(humidity);

    const mq135Raw =
      toNumber(mq135);


    // Accept MQ-7 OR legacy CO field

    const mq7Raw =
      toNumber(
        mq7 !== undefined
          ? mq7
          : co
      );


    // ========================================================
    // VALIDATE TEMPERATURE
    // ========================================================

    if (
      temp === null ||
      temp < -40 ||
      temp > 85
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid temperature",
      });
    }


    // ========================================================
    // VALIDATE HUMIDITY
    // ========================================================

    if (
      hum === null ||
      hum < 0 ||
      hum > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid humidity",
      });
    }


    // ========================================================
    // VALIDATE MQ-135 ADC
    // ========================================================

    if (
      mq135Raw === null ||
      !validADC(
        Math.round(mq135Raw)
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid MQ-135 ADC value",
      });
    }


    // ========================================================
    // VALIDATE MQ-7 ADC
    // ========================================================

    if (
      mq7Raw === null ||
      !validADC(
        Math.round(mq7Raw)
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid MQ-7 ADC value",
      });
    }


    // ========================================================
    // FIND DEVICE
    // ========================================================

    let device =
      await Device.findOne({
        deviceId,
      });


    // ========================================================
    // CREATE DEVICE IF IT DOES NOT EXIST
    // ========================================================

    if (!device) {
      device =
        await Device.create({
          deviceId,

          name: deviceId,

          location:
            location ||
            "Unknown",

          status: "Online",

          lastSeen:
            new Date(),
        });
    }


    // ========================================================
    // CALIBRATION BASELINES
    // ========================================================

    const calibration =
      device.calibration || {};


    const mq135Baseline =
      Number(
        calibration.mq135Baseline
      ) > 0
        ? Number(
            calibration.mq135Baseline
          )
        : null;


    const mq7Baseline =
      Number(
        calibration.mq7Baseline
      ) > 0
        ? Number(
            calibration.mq7Baseline
          )
        : null;


    // ========================================================
    // AIRGUARD RISK ENGINE
    // ========================================================

    const riskResult =
      calculateRiskScore({
        temperature: temp,

        humidity: hum,

        // MQ-135 raw ADC
        mq135: mq135Raw,

        // MQ-7 raw ADC
        co: mq7Raw,

        // Calibration information
        baselines: {
          mq135Baseline,
          mq7Baseline,
        },
      });


    // ========================================================
    // NORMALIZE RISK SCORE
    // ========================================================

    const riskScore =
      clamp(
        Math.round(
          Number(
            riskResult?.riskScore ??
            riskResult?.score ??
            0
          )
        ) || 0,
        0,
        500
      );


    // ========================================================
    // RISK CATEGORY
    // ========================================================

    const category =
      getRiskCategory(
        riskScore
      );


    // ========================================================
    // ALERT LEVEL
    // ========================================================

    const alertLevel =
      getAlertLevel(
        riskScore
      );


    // ========================================================
    // RISK CONTRIBUTORS
    // ========================================================

    const riskContributors =
      Array.isArray(
        riskResult?.contributors
      )
        ? riskResult.contributors
        : [
            {
              name:
                "MQ-135 Gas Response",

              value:
                Math.round(
                  mq135Raw
                ),
            },

            {
              name:
                "MQ-7 Gas Response",

              value:
                Math.round(
                  mq7Raw
                ),
            },

            {
              name: "Humidity",

              value:
                Math.round(
                  hum
                ),
            },
          ];


    // ========================================================
    // CREATE SENSOR DOCUMENT
    // ========================================================

    const sensorData =
      await SensorData.create({

        // ====================================================
        // DEVICE INFORMATION
        // ====================================================

        deviceId,

        location:
          location ||
          device.location ||
          "Unknown",


        // ====================================================
        // ENVIRONMENTAL DATA
        // ====================================================

        temperature: temp,

        humidity: hum,


        // ====================================================
        // MQ-135
        // ====================================================

        mq135:
          Math.round(
            mq135Raw
          ),

        // Legacy compatibility

        gas:
          Math.round(
            mq135Raw
          ),


        // ====================================================
        // MQ-7
        // ====================================================

        mq7:
          Math.round(
            mq7Raw
          ),

        // Legacy compatibility

        co:
          Math.round(
            mq7Raw
          ),


        // ====================================================
        // ELECTRICAL READINGS
        // ====================================================

        mq135VoltageMv:
          mq135VoltageMv !==
          undefined
            ? toNumber(
                mq135VoltageMv
              )
            : undefined,


        mq7VoltageMv:
          mq7VoltageMv !==
          undefined
            ? toNumber(
                mq7VoltageMv
              )
            : undefined,


        mq7AO:
          mq7AO !== undefined
            ? toNumber(
                mq7AO
              )
            : undefined,


        // ====================================================
        // AIRGUARD RISK SCORE
        // ====================================================

        riskScore,


        // Backward compatibility
        //
        // IMPORTANT:
        // This is NOT official AQI.
        // It represents the AirGuard project risk score.

        estimatedAQI:
          riskScore,


        // ====================================================
        // RISK INFORMATION
        // ====================================================

        riskContributors,

        category,

        alertLevel,


        // ====================================================
        // DEVICE STATUS
        // ====================================================

        status: "Online",

        dataQuality: "Good",


        // ====================================================
        // TREND / PREDICTION
        // ====================================================

        trend: "Unknown",

        predictedAQI: null,

        predictionConfidence:
          null,

        predictionHorizonMinutes:
          null,
      });


    // ========================================================
    // AUTOMATIC ALERT SYSTEM
    // ========================================================

    /*
     * IMPORTANT:
     * This runs AFTER sensor data is successfully stored.
     *
     * Therefore an alert failure cannot stop the
     * ESP32 sensor pipeline.
     */

    await createAutomaticAlert({
      deviceId,

      location:
        location ||
        device.location ||
        "Unknown",

      riskScore,

      category,

      alertLevel,
    });


    // ========================================================
    // UPDATE DEVICE HEARTBEAT
    // ========================================================

    device.status =
      "Online";

    device.lastSeen =
      new Date();


    if (location) {
      device.location =
        location;
    }


    await device.save();


    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(201).json({
      success: true,

      message:
        "Sensor data saved successfully",

      data:
        sensorData,

      // AirGuard Risk Score

      riskScore,

      category,

      alertLevel,

      // Frontend compatibility

      estimatedAQI:
        riskScore,
    });

  } catch (error) {
    console.error(
      "Create sensor data error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to save sensor data",

      error:
        error.message,
    });
  }
};


// ============================================================
// CALIBRATION
// ============================================================

exports.calibrateSensors =
  async (req, res) => {
    try {
      const {
        deviceId,
        samples = 60,
      } = req.body;


      // ========================================================
      // VALIDATE DEVICE ID
      // ========================================================

      if (!deviceId) {
        return res.status(400).json({
          success: false,
          message:
            "deviceId is required",
        });
      }


      // ========================================================
      // VALIDATE SAMPLE COUNT
      // ========================================================

      const requestedSamples =
        Number(samples);


      const sampleCount =
        Math.min(
          Math.max(
            Number.isFinite(
              requestedSamples
            )
              ? Math.floor(
                  requestedSamples
                )
              : 60,
            20
          ),
          300
        );


      // ========================================================
      // GET RECENT READINGS
      // ========================================================

      const readings =
        await SensorData.find({
          deviceId,
        })
          .sort({
            createdAt: -1,
          })
          .limit(sampleCount)
          .lean();


      // ========================================================
      // CHECK ENOUGH READINGS
      // ========================================================

      if (readings.length < 10) {
        return res.status(400).json({
          success: false,

          message:
            "Not enough sensor readings for calibration",

          availableSamples:
            readings.length,

          requiredSamples: 10,
        });
      }


      // ========================================================
      // MQ-135 VALUES
      // ========================================================

      const mq135Values =
        readings
          .map((r) =>
            Number(
              r.mq135 ??
              r.gas
            )
          )
          .filter(validADC);


      // ========================================================
      // MQ-7 VALUES
      // ========================================================

      const mq7Values =
        readings
          .map((r) =>
            Number(
              r.mq7 ??
              r.co
            )
          )
          .filter(validADC);


      // ========================================================
      // VALIDATE SENSOR READINGS
      // ========================================================

      if (
        mq135Values.length < 10 ||
        mq7Values.length < 10
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Not enough valid ADC readings for calibration",
        });
      }


      // ========================================================
      // CALCULATE MEDIAN BASELINES
      // ========================================================

      const mq135Baseline =
        Math.round(
          median(
            mq135Values
          )
        );


      const mq7Baseline =
        Math.round(
          median(
            mq7Values
          )
        );


      // ========================================================
      // FIND DEVICE
      // ========================================================

      const device =
        await Device.findOne({
          deviceId,
        });


      if (!device) {
        return res.status(404).json({
          success: false,
          message:
            "Device not found",
        });
      }


      // ========================================================
      // SAVE CALIBRATION
      // ========================================================

      device.calibration = {
        mq135Baseline,

        mq7Baseline,

        samples:
          readings.length,

        calibratedAt:
          new Date(),
      };


      await device.save();


      // ========================================================
      // RESPONSE
      // ========================================================

      return res.json({
        success: true,

        message:
          "Sensor calibration completed",

        calibration: {
          mq135Baseline,

          mq7Baseline,

          samples:
            readings.length,

          calibratedAt:
            device.calibration
              .calibratedAt,
        },
      });

    } catch (error) {
      console.error(
        "Calibration error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Calibration failed",

        error:
          error.message,
      });
    }
  };


// ============================================================
// GET CALIBRATION
// ============================================================

exports.getCalibration =
  async (req, res) => {
    try {
      const {
        deviceId,
      } = req.query;


      // ========================================================
      // VALIDATE DEVICE ID
      // ========================================================

      if (!deviceId) {
        return res.status(400).json({
          success: false,

          message:
            "deviceId is required",
        });
      }


      // ========================================================
      // FIND DEVICE
      // ========================================================

      const device =
        await Device.findOne({
          deviceId,
        }).lean();


      if (!device) {
        return res.status(404).json({
          success: false,

          message:
            "Device not found",
        });
      }


      // ========================================================
      // RESPONSE
      // ========================================================

      return res.json({
        success: true,

        deviceId,

        calibration:
          device.calibration ||
          null,
      });

    } catch (error) {
      console.error(
        "Get calibration error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to get calibration",

        error:
          error.message,
      });
    }
  };


// ============================================================
// SENSOR ANALYSIS
// ============================================================

exports.getSensorAnalysis =
  async (
    req,
    res
  ) => {
    try {
      const {
        deviceId,
        limit = 60,
      } = req.query;


      // ========================================================
      // QUERY
      // ========================================================

      const query =
        deviceId
          ? { deviceId }
          : {};


      // ========================================================
      // LIMIT
      // ========================================================

      const requestedLimit =
        Number(limit);


      const safeLimit =
        Number.isFinite(
          requestedLimit
        ) &&
        requestedLimit > 0
          ? Math.min(
              Math.floor(
                requestedLimit
              ),
              300
            )
          : 60;


      // ========================================================
      // GET READINGS
      // ========================================================

      const readings =
        await SensorData.find(
          query
        )
          .sort({
            createdAt: -1,
          })
          .limit(safeLimit)
          .lean();


      // ========================================================
      // NO DATA
      // ========================================================

      if (!readings.length) {
        return res.json({
          success: true,

          analysis: {
            trend: "Unknown",

            currentRiskScore: 0,

            predictedRiskScore:
              null,

            alertLevel: "Normal",

            forecast: [],
          },
        });
      }


      // ========================================================
      // CONVERT NEWEST-FIRST TO CHRONOLOGICAL
      // ========================================================

      const chronological =
        [...readings].reverse();


      // ========================================================
      // EXTRACT RISK SCORES
      // ========================================================

      const riskValues =
        chronological
          .map((r) =>
            Number(
              r.riskScore ??
              r.estimatedAQI ??
              r.aqi ??
              0
            )
          )
          .map((value) =>
            Number.isFinite(
              value
            )
              ? clamp(
                  Math.round(
                    value
                  ),
                  0,
                  500
                )
              : 0
          );


      // ========================================================
      // TREND
      // ========================================================

      const trend =
        calculateTrend(
          riskValues
        );


      // ========================================================
      // FORECAST
      // ========================================================

      const forecast =
        calculateForecast(
          riskValues
        );


      // ========================================================
      // CURRENT RISK
      // ========================================================

      const currentRiskScore =
        riskValues[
          riskValues.length - 1
        ] || 0;


      // ========================================================
      // PREDICTED RISK
      // ========================================================

      /*
       * calculateForecast() returns an ARRAY:
       *
       * [
       *   {
       *      minutesAhead: 5,
       *      predictedRiskScore: ...
       *   },
       *   ...
       * ]
       *
       * Therefore we use the LAST prediction.
       */

      const predictedRiskScore =
        Array.isArray(
          forecast
        ) &&
        forecast.length > 0
          ? forecast[
              forecast.length - 1
            ].predictedRiskScore
          : null;


      // ========================================================
      // ALERT LEVEL
      // ========================================================

      const analysisAlertLevel =
        getAlertLevel(
          predictedRiskScore ??
          currentRiskScore
        );


      // ========================================================
      // RESPONSE
      // ========================================================

      return res.json({
        success: true,

        analysis: {
          trend,

          currentRiskScore,

          predictedRiskScore,

          alertLevel:
            analysisAlertLevel,

          forecast,
        },
      });

    } catch (error) {
      console.error(
        "Sensor analysis error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to generate sensor analysis",

        error:
          error.message,
      });
    }
  };