import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

import API from "../services/api";
import { getSensorData } from "../services/sensorService";
import Layout from "../components/layout/Layout";

import TemperatureHumidityChart from "../components/dashboard/TemperatureHumidityChart";
import SensorTable from "../components/dashboard/SensorTable";
import LocationMap from "../components/dashboard/LocationMap";
import SensorStatus from "../components/dashboard/SensorStatus";
import EnvironmentalInsights from "../components/dashboard/EnvironmentalInsights";
import AIPrediction from "../components/dashboard/AIPrediction";

/*
|--------------------------------------------------------------------------
| AirGuard Risk Information
|--------------------------------------------------------------------------
| Project-specific risk score: 0–500
|
| This is NOT official CPCB AQI and should not be presented as
| laboratory-grade gas concentration.
|--------------------------------------------------------------------------
*/

function getRiskInfo(score) {
  const value = Number(score ?? 0);

  if (value <= 50) {
    return {
      label: "GOOD",
      category: "Good",
      className: "text-success",
      badge: "bg-success",
    };
  }

  if (value <= 100) {
    return {
      label: "NORMAL",
      category: "Satisfactory",
      className: "text-success",
      badge: "bg-success",
    };
  }

  if (value <= 200) {
    return {
      label: "WARNING",
      category: "Moderate",
      className: "text-warning",
      badge: "bg-warning text-dark",
    };
  }

  if (value <= 300) {
    return {
      label: "DANGER",
      category: "Poor",
      className: "text-danger",
      badge: "bg-danger",
    };
  }

  if (value <= 400) {
    return {
      label: "VERY POOR",
      category: "Very Poor",
      className: "text-danger",
      badge: "bg-danger",
    };
  }

  return {
    label: "SEVERE",
    category: "Severe",
    className: "text-danger",
    badge: "bg-dark",
  };
}

/*
|--------------------------------------------------------------------------
| Get AirGuard Risk Score
|--------------------------------------------------------------------------
*/

function getScore(sensor) {
  return Number(
    sensor?.riskScore ??
      sensor?.estimatedAQI ??
      sensor?.aqi ??
      0
  );
}

/*
|--------------------------------------------------------------------------
| Format timestamp
|--------------------------------------------------------------------------
*/

function formatTime(value) {
  if (!value) return "--";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "--";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/*
|--------------------------------------------------------------------------
| Dashboard
|--------------------------------------------------------------------------
*/

function Dashboard() {
  const [sensor, setSensor] = useState(null);
  const [history, setHistory] = useState([]);
  const [analysis, setAnalysis] = useState(null);

  const [prediction, setPrediction] = useState(null);
  const [mlLoading, setMlLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const previousSensorId = useRef(null);
  const previousAlertLevel = useRef(null);

  const deviceId = "ESP32-001";

  /*
  |--------------------------------------------------------------------------
  | AI Prediction
  |--------------------------------------------------------------------------
  */

  const getAIPrediction = useCallback(async (latestSensor) => {
    try {
      const temperature = Number(latestSensor?.temperature);
      const humidity = Number(latestSensor?.humidity);
      const mq135 = Number(latestSensor?.mq135);

      const co = Number(
        latestSensor?.co ??
          latestSensor?.mq7
      );

      if (
        !Number.isFinite(temperature) ||
        !Number.isFinite(humidity) ||
        !Number.isFinite(mq135) ||
        !Number.isFinite(co)
      ) {
        return;
      }

      setMlLoading(true);

      const currentRiskScore = getScore(latestSensor);

      const response = await API.post("/ml/predict", {
        temperature,
        humidity,
        mq135,
        co,
        currentRiskScore,
      });

      setPrediction(response.data);
    } catch (error) {
      console.error("AI Prediction Error:", error);
      setPrediction(null);
    } finally {
      setMlLoading(false);
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Fetch Dashboard Data
  |--------------------------------------------------------------------------
  */

  const fetchDashboard = useCallback(async () => {
    try {
      const data = await getSensorData(deviceId, 100);

      if (!data || data.length === 0) {
        setLoading(false);
        return;
      }

      const latest = data[0];

      /*
       * Normalize legacy/current backend field names.
       * This keeps existing dashboard components compatible
       * while presenting the AirGuard Risk Score consistently.
       */

      const normalizedHistory = data.map((item) => ({
        ...item,

        aqi: getScore(item),

        riskScore: getScore(item),

        co: Number(
          item.co ??
            item.mq7 ??
            0
        ),
      }));

      const normalizedLatest = {
        ...latest,

        aqi: getScore(latest),

        riskScore: getScore(latest),

        co: Number(
          latest.co ??
            latest.mq7 ??
            0
        ),
      };

      setHistory(normalizedHistory);

      setSensor(normalizedLatest);

      setLastUpdated(
        latest.updatedAt ??
          latest.createdAt ??
          new Date().toISOString()
      );

      setLoading(false);

      /*
       * Run AI prediction only when a genuinely
       * new sensor record arrives.
       */

      if (previousSensorId.current !== latest._id) {
        previousSensorId.current = latest._id;

        await getAIPrediction(normalizedLatest);
      }

      /*
       * Dashboard notification.
       *
       * Backend remains the authoritative alert generator.
       */

      const currentAlertLevel =
        normalizedLatest.alertLevel ||
        "Normal";

      if (
        previousAlertLevel.current &&
        previousAlertLevel.current !== currentAlertLevel
      ) {
        if (currentAlertLevel === "Danger") {
          toast.error(
            `🚨 AirGuard Danger — Risk Score ${normalizedLatest.riskScore}`,
            {
              toastId: `danger-${latest._id}`,
            }
          );
        } else if (currentAlertLevel === "Warning") {
          toast.warning(
            `⚠ AirGuard Warning — Risk Score ${normalizedLatest.riskScore}`,
            {
              toastId: `warning-${latest._id}`,
            }
          );
        } else {
          toast.success(
            `✓ Air quality returned to normal — Risk Score ${normalizedLatest.riskScore}`,
            {
              toastId: `normal-${latest._id}`,
            }
          );
        }
      }

      previousAlertLevel.current =
        currentAlertLevel;
    } catch (error) {
      console.error(
        "Dashboard fetch error:",
        error
      );

      setLoading(false);
    }
  }, [deviceId, getAIPrediction]);

  /*
  |--------------------------------------------------------------------------
  | Fetch Risk Analysis
  |--------------------------------------------------------------------------
  */

  const fetchAnalysis = useCallback(async () => {
    try {
      const response = await API.get(
        "/sensors/analysis",
        {
          params: {
            deviceId,
            limit: 30,
          },
        }
      );

      if (response.data?.success) {
        setAnalysis(
          response.data.analysis
        );
      }
    } catch (error) {
      console.error(
        "Analysis fetch error:",
        error
      );
    }
  }, [deviceId]);

  /*
  |--------------------------------------------------------------------------
  | Initial Load + Live Polling
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    fetchDashboard();
    fetchAnalysis();

    const interval = setInterval(() => {
      fetchDashboard();
      fetchAnalysis();
    }, 10000);

    return () =>
      clearInterval(interval);
  }, [
    fetchDashboard,
    fetchAnalysis,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Loading State
  |--------------------------------------------------------------------------
  */

  if (loading && !sensor) {
    return (
      <Layout>
        <div className="container-fluid py-5">
          <div className="text-center">
            <div
              className="spinner-border text-success"
              role="status"
            />

            <h5 className="mt-3">
              Connecting to AirGuard...
            </h5>

            <p className="text-muted">
              Waiting for live ESP32 sensor data
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | No Data State
  |--------------------------------------------------------------------------
  */

  if (!sensor) {
    return (
      <Layout>
        <div className="container-fluid py-5">
          <div className="alert alert-warning">
            No sensor data is currently available.
          </div>
        </div>
      </Layout>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Current Sensor Values
  |--------------------------------------------------------------------------
  */

  const riskScore = getScore(sensor);

  const risk = getRiskInfo(
    riskScore
  );

  const temperature =
    Number(sensor.temperature ?? 0);

  const humidity =
    Number(sensor.humidity ?? 0);

  const mq135 =
    Number(sensor.mq135 ?? 0);

  const co =
    Number(
      sensor.co ??
        sensor.mq7 ??
        0
    );

  const trend =
    analysis?.trend ??
    sensor.trend ??
    "Unknown";

  const forecast =
    analysis?.forecast ?? [];

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <Layout>
      <div className="container-fluid pb-5">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">

          <div>
            <div className="d-flex align-items-center gap-2">

              <h2 className="fw-bold mb-1">
                AirGuard Command Center
              </h2>

              <span className="badge bg-success">
                ● LIVE
              </span>

            </div>

            <p className="text-muted mb-0">
              Smart IoT Air Quality & Gas Risk Monitoring
            </p>
          </div>

          <div className="text-end mt-3 mt-md-0">

            <div className="fw-semibold">
              {deviceId}
            </div>

            <small className="text-muted">
              📍{" "}
              {sensor.location ||
                "Lucknow"}{" "}
              · Updated{" "}
              {formatTime(lastUpdated)}
            </small>

          </div>

        </div>


        {/* ================================================= */}
        {/* HERO RISK CARD */}
        {/* ================================================= */}

        <div className="card border-0 shadow-lg mb-4 overflow-hidden">

          <div className="card-body p-4">

            <div className="row align-items-center">

              {/* ----------------------------------------- */}
              {/* Risk Score */}
              {/* ----------------------------------------- */}

              <div className="col-lg-7">

                <div className="d-flex align-items-center gap-2 mb-2">

                  <span className="text-muted">
                    AIRGUARD RISK SCORE
                  </span>

                  <span className="badge bg-light text-dark">
                    0–500
                  </span>

                </div>

                <div className="d-flex align-items-end gap-3">

                  <h1
                    className={`display-1 fw-bold mb-0 ${risk.className}`}
                  >
                    {riskScore.toFixed(0)}
                  </h1>

                  <div className="pb-2">

                    <span
                      className={`badge ${risk.badge} px-3 py-2`}
                    >
                      {risk.label}
                    </span>

                    <div className="small text-muted mt-2">
                      {risk.category}
                    </div>

                  </div>

                </div>

                <p className="text-muted mt-3 mb-0">
                  Project-specific environmental
                  risk indicator calculated from
                  the live sensor readings.
                </p>

              </div>


              {/* ----------------------------------------- */}
              {/* Status + Trend */}
              {/* ----------------------------------------- */}

              <div className="col-lg-5 mt-4 mt-lg-0">

                <div className="row g-3">

                  <div className="col-6">

                    <div className="border rounded-3 p-3 h-100">

                      <small className="text-muted">
                        DEVICE STATUS
                      </small>

                      <div className="fw-bold text-success mt-1">
                        ● ONLINE
                      </div>

                      <small className="text-muted">
                        {deviceId}
                      </small>

                    </div>

                  </div>


                  <div className="col-6">

                    <div className="border rounded-3 p-3 h-100">

                      <small className="text-muted">
                        TREND
                      </small>

                      <div className="fw-bold mt-1">
                        {trend}
                      </div>

                      <small className="text-muted">
                        Last 30 readings
                      </small>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>


        {/* ================================================= */}
        {/* LIVE SENSOR METRICS */}
        {/* ================================================= */}

        <div className="row g-3 mb-4">

          {/* Temperature */}

          <div className="col-sm-6 col-xl-3">

            <div className="card border-0 shadow-sm h-100">

              <div className="card-body">

                <small className="text-muted">
                  TEMPERATURE
                </small>

                <h3 className="fw-bold mt-2 mb-1">
                  {temperature.toFixed(1)}°C
                </h3>

                <small className="text-muted">
                  DHT11
                </small>

              </div>

            </div>

          </div>


          {/* Humidity */}

          <div className="col-sm-6 col-xl-3">

            <div className="card border-0 shadow-sm h-100">

              <div className="card-body">

                <small className="text-muted">
                  HUMIDITY
                </small>

                <h3 className="fw-bold mt-2 mb-1">
                  {humidity.toFixed(1)}%
                </h3>

                <small className="text-muted">
                  DHT11
                </small>

              </div>

            </div>

          </div>


          {/* MQ-135 */}

          <div className="col-sm-6 col-xl-3">

            <div className="card border-0 shadow-sm h-100">

              <div className="card-body">

                <small className="text-muted">
                  MQ-135
                </small>

                <h3 className="fw-bold mt-2 mb-1">
                  {mq135}
                </h3>

                <small className="text-muted">
                  Gas sensor ADC
                </small>

              </div>

            </div>

          </div>


          {/* MQ-7 */}

          <div className="col-sm-6 col-xl-3">

            <div className="card border-0 shadow-sm h-100">

              <div className="card-body">

                <small className="text-muted">
                  MQ-7
                </small>

                <h3 className="fw-bold mt-2 mb-1">
                  {co}
                </h3>

                <small className="text-muted">
                  Calibrated sensor reading
                </small>

              </div>

            </div>

          </div>

        </div>


        {/* ================================================= */}
        {/* AI RISK ANALYSIS */}
        {/* ================================================= */}

        <AIPrediction
          prediction={prediction}
          loading={mlLoading}
        />


        {/* ================================================= */}
        {/* PREDICTIVE RISK TIMELINE */}
        {/* ================================================= */}

        <div className="card border-0 shadow-sm mt-4">

          <div className="card-body p-4">

            <div className="d-flex justify-content-between align-items-center mb-4">

              <div>

                <h4 className="fw-bold mb-1">
                  Predictive Risk Timeline
                </h4>

                <p className="text-muted mb-0">
                  Short-term trend projection from
                  the AirGuard Risk Engine
                </p>

              </div>

              <span className="badge bg-light text-dark">
                AI + Trend
              </span>

            </div>


            <div className="row g-3">

              {/* NOW */}

              <div className="col-6 col-lg-3">

                <div className="border rounded-3 p-3 text-center">

                  <small className="text-muted">
                    NOW
                  </small>

                  <h3
                    className={`fw-bold ${risk.className}`}
                  >
                    {riskScore.toFixed(0)}
                  </h3>

                </div>

              </div>


              {/* Forecast */}

              {forecast.length > 0 ? (

                forecast.map((point) => (

                  <div
                    className="col-6 col-lg-3"
                    key={point.minutesAhead}
                  >

                    <div className="border rounded-3 p-3 text-center">

                      <small className="text-muted">
                        +{point.minutesAhead} MIN
                      </small>

                      <h3 className="fw-bold">
                        {Number(
                          point.predictedRiskScore ??
                            0
                        ).toFixed(0)}
                      </h3>

                    </div>

                  </div>

                ))

              ) : (

                <div className="col-6 col-lg-3">

                  <div className="border rounded-3 p-3 text-center">

                    <small className="text-muted">
                      FORECAST
                    </small>

                    <div className="mt-2 text-muted">
                      Collecting data...
                    </div>

                  </div>

                </div>

              )}

            </div>

          </div>

        </div>


        {/* ================================================= */}
        {/* DECISION SUPPORT */}
        {/* ================================================= */}

        <div className="card border-0 shadow-sm mt-4">

          <div className="card-body p-4">

            <div className="d-flex align-items-start gap-3">

              <div style={{ fontSize: "2rem" }}>

                {riskScore > 200
                  ? "🚨"
                  : riskScore > 100
                    ? "⚠️"
                    : "✅"}

              </div>

              <div>

                <h5 className="fw-bold mb-1">
                  AirGuard Decision Support
                </h5>

                <p className="mb-0 text-muted">

                  {riskScore > 200
                    ? "High environmental risk detected. Immediate attention and improved ventilation are recommended."
                    : riskScore > 100
                      ? "Environmental risk is elevated. Monitor the readings and consider improving ventilation."
                      : "Current environmental risk is within the normal project threshold."}

                </p>

              </div>

            </div>

          </div>

        </div>


        {/* ================================================= */}
        {/* ENVIRONMENTAL TRENDS */}
        {/* ================================================= */}

        <div className="row mt-4 g-4">

          {/* Temperature + Humidity */}

          <div className="col-lg-6">

            <TemperatureHumidityChart
              history={history.slice(0, 30)}
            />

          </div>


          {/* Environmental Insights */}

          <div className="col-lg-6">

            <div className="card border-0 shadow-sm h-100">

              <div className="card-body">

                <h5 className="fw-bold mb-3">
                  Environmental Insights
                </h5>

                <EnvironmentalInsights
                  history={history}
                  sensor={sensor}
                />

              </div>

            </div>

          </div>

        </div>


        {/* ================================================= */}
        {/* DEVICE + LOCATION */}
        {/* ================================================= */}

        <div className="row mt-4 g-4">

          {/* Sensor Status */}

          <div className="col-lg-5">

            <SensorStatus
              sensor={sensor}
            />

          </div>


          {/* Location */}

          <div className="col-lg-7">

            <LocationMap />

          </div>

        </div>


        {/* ================================================= */}
        {/* RECENT SENSOR DATA */}
        {/* ================================================= */}

        <div className="mt-4">

          <SensorTable
            history={history.slice(0, 30)}
          />

        </div>


        {/* ================================================= */}
        {/* DISCLAIMER */}
        {/* ================================================= */}

        <div className="text-center mt-4">

          <small className="text-muted">

            AirGuard Risk Score is a
            project-specific indicator
            from 0–500. It is not a
            regulatory AQI and does not
            represent laboratory-grade
            gas concentration.

          </small>

        </div>

      </div>
    </Layout>
  );
}

export default Dashboard;