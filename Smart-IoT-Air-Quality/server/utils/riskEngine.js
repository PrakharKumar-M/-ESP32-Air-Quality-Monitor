// ============================================================
// AIRGUARD AI - RISK ENGINE
// Smart IoT Air Quality & Gas Risk Monitoring System
// ============================================================

// ============================================================
// CONSTANTS
// ============================================================

const ADC_MAX = 4095;
const RISK_MIN = 0;
const RISK_MAX = 500;

// ============================================================
// CLAMP
// ============================================================

function clamp(value, min, max) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return min;
  }

  return Math.min(max, Math.max(min, number));
}

// ============================================================
// MEDIAN
// ============================================================

function median(values) {
  const clean = values
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

  if (clean.length === 0) {
    return null;
  }

  const middle = Math.floor(clean.length / 2);

  if (clean.length % 2 === 0) {
    return (
      (clean[middle - 1] + clean[middle]) / 2
    );
  }

  return clean[middle];
}

// ============================================================
// RISK CATEGORY
// ============================================================

function getRiskCategory(score) {
  const value = clamp(score, RISK_MIN, RISK_MAX);

  if (value <= 50) {
    return "Good";
  }

  if (value <= 100) {
    return "Satisfactory";
  }

  if (value <= 200) {
    return "Moderate";
  }

  if (value <= 300) {
    return "Poor";
  }

  if (value <= 400) {
    return "Very Poor";
  }

  return "Severe";
}

// ============================================================
// ALERT LEVEL
// ============================================================

function getAlertLevel(score) {
  const value = clamp(score, RISK_MIN, RISK_MAX);

  if (value <= 100) {
    return "Normal";
  }

  if (value <= 200) {
    return "Warning";
  }

  return "Danger";
}

// ============================================================
// RELATIVE GAS RISK
// ============================================================

/*
  MQ sensors produce raw ADC values.

  We DO NOT claim that the ADC value is ppm.

  If calibration exists:
      compare current reading with baseline.

  Example:
      baseline = 100
      current  = 150

      increase = 50%

  Without calibration:
      normalize raw ADC to 0-100.
*/

function relativeGasRisk(value, baseline) {
  const current = Number(value);
  const base = Number(baseline);

  if (
    !Number.isFinite(current) ||
    current < 0
  ) {
    return 0;
  }

  // ----------------------------------------------------------
  // CALIBRATED MODE
  // ----------------------------------------------------------

  if (
    Number.isFinite(base) &&
    base > 0
  ) {
    const ratio = current / base;

    return clamp(
      (ratio - 1) * 100,
      0,
      250
    );
  }

  // ----------------------------------------------------------
  // UNCALIBRATED MODE
  // ----------------------------------------------------------

  return clamp(
    (current / ADC_MAX) * 100,
    0,
    100
  );
}

// ============================================================
// AIRGUARD RISK SCORE
// ============================================================

function calculateRiskScore({
  temperature,
  humidity,
  mq135,
  co,
  baselines = {},
}) {
  const temperatureValue = Number(temperature);
  const humidityValue = Number(humidity);
  const mq135Value = Number(mq135);
  const mq7Value = Number(co);

  // ==========================================================
  // MQ-135 GAS RESPONSE
  // ==========================================================

  const mq135Risk = relativeGasRisk(
    mq135Value,
    baselines.mq135Baseline
  );

  // ==========================================================
  // MQ-7 CO RESPONSE
  // ==========================================================

  const mq7Risk = relativeGasRisk(
    mq7Value,
    baselines.mq7Baseline
  );

  // ==========================================================
  // HUMIDITY RISK
  // ==========================================================

  let humidityRisk = 0;

  if (
    Number.isFinite(humidityValue) &&
    humidityValue > 80
  ) {
    humidityRisk = clamp(
      (humidityValue - 80) * 2.5,
      0,
      50
    );
  }

  // ==========================================================
  // TEMPERATURE RISK
  // ==========================================================

  let temperatureRisk = 0;

  if (
    Number.isFinite(temperatureValue) &&
    temperatureValue > 35
  ) {
    temperatureRisk = clamp(
      (temperatureValue - 35) * 5,
      0,
      25
    );
  }

  // ==========================================================
  // WEIGHTED RISK
  // ==========================================================

  /*
      MQ-135  -> 45%
      MQ-7    -> 45%
      Humidity -> 7%
      Temp     -> 3%

      Total = 100%
  */

  const rawScore =
    mq135Risk * 0.45 +
    mq7Risk * 0.45 +
    humidityRisk * 0.07 +
    temperatureRisk * 0.03;

  const riskScore = clamp(
    Math.round(rawScore),
    RISK_MIN,
    RISK_MAX
  );

  // ==========================================================
  // CONTRIBUTORS
  // ==========================================================

  const contributors = [
    {
      name: "MQ-135 Gas Response",
      value: Math.round(mq135Risk),
      weight: "45%",
    },

    {
      name: "MQ-7 CO Response",
      value: Math.round(mq7Risk),
      weight: "45%",
    },

    {
      name: "Humidity",
      value: Math.round(humidityRisk),
      weight: "7%",
    },

    {
      name: "Temperature",
      value: Math.round(temperatureRisk),
      weight: "3%",
    },
  ]
    .filter(
      (item) => item.value > 0
    )
    .sort(
      (a, b) => b.value - a.value
    )
    .slice(0, 3);

  // ==========================================================
  // RESULT
  // ==========================================================

  return {
    riskScore,

    category:
      getRiskCategory(riskScore),

    alertLevel:
      getAlertLevel(riskScore),

    contributors,
  };
}

// ============================================================
// TREND
// ============================================================

/*
  IMPORTANT:

  The controller passes readings in chronological order
  for analysis.

  We therefore expect:

      [oldest ... newest]

  The function compares:

      recent readings
      vs
      older readings

  This avoids falsely reporting a trend because of one noisy
  sensor reading.
*/

function calculateTrend(values) {
  const clean = values
    .map(Number)
    .filter(Number.isFinite)
    .map((value) =>
      clamp(value, RISK_MIN, RISK_MAX)
    );

  if (clean.length < 4) {
    return "Unknown";
  }

  // ----------------------------------------------------------
  // Take recent and previous windows
  // ----------------------------------------------------------

  const windowSize = Math.min(
    6,
    Math.floor(clean.length / 2)
  );

  const recent = clean.slice(
    clean.length - windowSize
  );

  const older = clean.slice(
    Math.max(
      0,
      clean.length - windowSize * 2
    ),
    clean.length - windowSize
  );

  if (
    recent.length === 0 ||
    older.length === 0
  ) {
    return "Stable";
  }

  // ----------------------------------------------------------
  // Averages
  // ----------------------------------------------------------

  const recentAverage =
    recent.reduce(
      (sum, value) => sum + value,
      0
    ) / recent.length;

  const olderAverage =
    older.reduce(
      (sum, value) => sum + value,
      0
    ) / older.length;

  const difference =
    recentAverage - olderAverage;

  // ----------------------------------------------------------
  // Adaptive threshold
  // ----------------------------------------------------------

  const threshold = Math.max(
    3,
    olderAverage * 0.05
  );

  // ----------------------------------------------------------
  // Trend
  // ----------------------------------------------------------

  if (difference > threshold) {
    return "Worsening";
  }

  if (difference < -threshold) {
    return "Improving";
  }

  return "Stable";
}

// ============================================================
// FORECAST
// ============================================================

/*
  This is a SHORT-TERM TREND PROJECTION.

  It is intentionally NOT called a guaranteed prediction.

  It uses recent historical risk scores and a linear regression
  slope to estimate the next few points.

  Output:

      +5 minutes
      +10 minutes
      +15 minutes

  The result is clamped to 0-500.
*/

function calculateForecast(
  values,
  horizonSteps = 3
) {
  const clean = values
    .map(Number)
    .filter(Number.isFinite)
    .map((value) =>
      clamp(value, RISK_MIN, RISK_MAX)
    );

  if (clean.length < 4) {
    return [];
  }

  // ----------------------------------------------------------
  // Use only the latest 30 points
  // ----------------------------------------------------------

  const recentValues =
    clean.slice(-30);

  if (recentValues.length < 4) {
    return [];
  }

  const n =
    recentValues.length;

  // ----------------------------------------------------------
  // Calculate linear regression
  // ----------------------------------------------------------

  const xMean =
    (n - 1) / 2;

  const yMean =
    recentValues.reduce(
      (sum, value) => sum + value,
      0
    ) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    const xDifference =
      i - xMean;

    const yDifference =
      recentValues[i] - yMean;

    numerator +=
      xDifference * yDifference;

    denominator +=
      xDifference * xDifference;
  }

  const slope =
    denominator !== 0
      ? numerator / denominator
      : 0;

  // ----------------------------------------------------------
  // Current value
  // ----------------------------------------------------------

  const lastValue =
    recentValues[n - 1];

  // ----------------------------------------------------------
  // Limit the influence of noisy slopes
  // ----------------------------------------------------------

  /*
    A gas sensor can suddenly jump because of noise,
    proximity to gas, warm-up behavior, etc.

    Therefore we limit the maximum movement per step.

    This prevents unrealistic dashboard values such as:

        5 -> 493

    simply because one raw sensor value changed.
  */

  const safeSlope = clamp(
    slope,
    -15,
    15
  );

  // ----------------------------------------------------------
  // Generate forecast
  // ----------------------------------------------------------

  return Array.from(
    {
      length: Math.max(
        1,
        Number(horizonSteps) || 3
      ),
    },
    (_, index) => {
      const step = index + 1;

      const projected =
        lastValue +
        safeSlope * step;

      return {
        minutesAhead:
          step * 5,

        predictedRiskScore:
          Math.round(
            clamp(
              projected,
              RISK_MIN,
              RISK_MAX
            )
          ),
      };
    }
  );
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  clamp,
  median,
  relativeGasRisk,
  calculateRiskScore,
  getRiskCategory,
  getAlertLevel,
  calculateTrend,
  calculateForecast,
};