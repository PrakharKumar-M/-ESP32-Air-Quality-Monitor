import { useCallback, useEffect, useMemo, useState } from "react";
import Layout from "../components/layout/Layout";
import API from "../services/api";
import AQIChart from "../components/dashboard/AQIChart";
import TemperatureHumidityChart from "../components/dashboard/TemperatureHumidityChart";

const DEVICE_ID = "ESP32-001";

function getRiskScore(item) {
  return Number(
    item?.riskScore ??
    item?.estimatedAQI ??
    item?.aqi ??
    0
  );
}

function getCategory(score) {
  if (score <= 50) return "Good";
  if (score <= 100) return "Satisfactory";
  if (score <= 200) return "Moderate";
  if (score <= 300) return "Poor";
  if (score <= 400) return "Very Poor";
  return "Severe";
}

function getCategoryClass(category) {
  switch (category) {
    case "Good":
      return "text-success";
    case "Satisfactory":
      return "text-success";
    case "Moderate":
      return "text-warning";
    case "Poor":
      return "text-danger";
    case "Very Poor":
      return "text-danger";
    case "Severe":
      return "text-danger";
    default:
      return "text-muted";
  }
}

function Analytics() {
  const [history, setHistory] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = useCallback(async () => {
    try {
      setError("");

      const response = await API.get(
        `/sensors/analysis?deviceId=${DEVICE_ID}&limit=60`
      );

      if (!response.data?.success) {
        throw new Error("Failed to load sensor analysis");
      }

      setAnalysis(response.data.analysis || null);

      /*
       * Fetch actual sensor history separately.
       * Backend returns newest readings first.
       */
      const sensorResponse = await API.get(
        `/sensors?deviceId=${DEVICE_ID}`
      );

      let sensorData = sensorResponse.data;

      if (sensorData?.data) {
        sensorData = sensorData.data;
      }

      if (!Array.isArray(sensorData)) {
        sensorData = [];
      }

      const normalized = sensorData
        .slice(0, 60)
        .map((item) => ({
          ...item,

          aqi: getRiskScore(item),

          riskScore: getRiskScore(item),

          temperature: Number(item.temperature ?? 0),

          humidity: Number(item.humidity ?? 0),

          mq135: Number(item.mq135 ?? 0),

          co: Number(item.co ?? item.mq7 ?? 0),
        }))
        .reverse();

      setHistory(normalized);
    } catch (err) {
      console.error("Analytics error:", err);
      setError(
        "Unable to load analytics data from the server."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();

    const interval = setInterval(
      fetchAnalytics,
      10000
    );

    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  const metrics = useMemo(() => {
    if (!history.length) {
      return {
        averageAQI: 0,
        maximumAQI: 0,
        minimumAQI: 0,
        averageTemperature: 0,
        averageHumidity: 0,
        readings: 0,
      };
    }

    const scores = history.map(getRiskScore);

    const temperatures = history.map(
      (item) => Number(item.temperature) || 0
    );

    const humidities = history.map(
      (item) => Number(item.humidity) || 0
    );

    return {
      averageAQI: Math.round(
        scores.reduce((sum, value) => sum + value, 0) /
          scores.length
      ),

      maximumAQI: Math.max(...scores),

      minimumAQI: Math.min(...scores),

      averageTemperature: (
        temperatures.reduce(
          (sum, value) => sum + value,
          0
        ) / temperatures.length
      ).toFixed(1),

      averageHumidity: Math.round(
        humidities.reduce(
          (sum, value) => sum + value,
          0
        ) / humidities.length
      ),

      readings: history.length,
    };
  }, [history]);

  const currentRisk = analysis?.currentRiskScore ?? 0;

  const predictedRisk =
    analysis?.predictedRiskScore ?? null;

  const trend = analysis?.trend ?? "Unknown";

  const category = getCategory(currentRisk);

  return (
    <Layout>
      <div className="container-fluid py-2">

        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-1">
              📊 Air Quality Analytics
            </h2>

            <p className="text-muted mb-0">
              Live analysis of ESP32 sensor readings
            </p>
          </div>

          <div>
            <span className="badge bg-success px-3 py-2">
              ● LIVE
            </span>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        {/* LOADING */}
        {loading ? (
          <div className="card shadow-sm border-0">
            <div className="card-body text-center py-5">
              <div
                className="spinner-border text-primary"
                role="status"
              />

              <p className="mt-3 mb-0">
                Loading live analytics...
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* METRIC CARDS */}
            <div className="row g-3 mb-4">

              <div className="col-md-3">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-body">
                    <div className="text-muted small">
                      AVERAGE AIR QUALITY
                    </div>

                    <div className="display-6 fw-bold">
                      {metrics.averageAQI}
                    </div>

                    <div className="small text-muted">
                      Project indicator
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-body">
                    <div className="text-muted small">
                      MAXIMUM RISK
                    </div>

                    <div className="display-6 fw-bold text-danger">
                      {metrics.maximumAQI}
                    </div>

                    <div className="small text-muted">
                      Highest recorded
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-body">
                    <div className="text-muted small">
                      AVERAGE TEMPERATURE
                    </div>

                    <div className="display-6 fw-bold">
                      {metrics.averageTemperature}°C
                    </div>

                    <div className="small text-muted">
                      DHT11
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-body">
                    <div className="text-muted small">
                      AVERAGE HUMIDITY
                    </div>

                    <div className="display-6 fw-bold">
                      {metrics.averageHumidity}%
                    </div>

                    <div className="small text-muted">
                      DHT11
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* CURRENT ANALYSIS */}
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-body">

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="fw-bold mb-1">
                      🧠 AirGuard Risk Analysis
                    </h5>

                    <small className="text-muted">
                      Real-time risk assessment
                    </small>
                  </div>

                  <span
                    className={`fw-bold ${getCategoryClass(
                      category
                    )}`}
                  >
                    {category}
                  </span>
                </div>

                <div className="row text-center">

                  <div className="col-md-4">
                    <div className="text-muted small">
                      CURRENT RISK
                    </div>

                    <div className="display-5 fw-bold">
                      {currentRisk}
                    </div>

                    <small className="text-muted">
                      / 500
                    </small>
                  </div>

                  <div className="col-md-4">
                    <div className="text-muted small">
                      SHORT-TERM OUTLOOK
                    </div>

                    <div className="display-5 fw-bold">
                      {predictedRisk !== null
                        ? predictedRisk
                        : "--"}
                    </div>

                    <small className="text-muted">
                      Risk score
                    </small>
                  </div>

                  <div className="col-md-4">
                    <div className="text-muted small">
                      TREND
                    </div>

                    <div className="display-5 fw-bold">
                      {trend === "Rising" && "↗️"}
                      {trend === "Falling" && "↘️"}
                      {trend === "Stable" && "→"}
                      {trend === "Unknown" && "—"}
                    </div>

                    <div className="fw-semibold">
                      {trend}
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* AQI / RISK CHART */}
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-body">

                <h5 className="fw-bold mb-1">
                  📈 Air Quality Trend
                </h5>

                <p className="text-muted small">
                  Historical AirGuard Risk Score over recent
                  sensor readings
                </p>

                <AQIChart
                  history={history}
                />

              </div>
            </div>

            {/* TEMP + HUMIDITY */}
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-body">

                <h5 className="fw-bold mb-1">
                  🌡️ Environmental Conditions
                </h5>

                <p className="text-muted small">
                  Temperature and humidity from the DHT11
                  sensor
                </p>

                <TemperatureHumidityChart
                  history={history}
                />

              </div>
            </div>

            {/* SENSOR SUMMARY */}
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-body">

                <h5 className="fw-bold mb-3">
                  🔬 Sensor Statistics
                </h5>

                <div className="table-responsive">

                  <table className="table table-hover align-middle">

                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th>Current</th>
                        <th>Average</th>
                        <th>Maximum</th>
                      </tr>
                    </thead>

                    <tbody>

                      <tr>
                        <td>
                          <strong>Air Quality Risk</strong>
                        </td>

                        <td>
                          {currentRisk}
                        </td>

                        <td>
                          {metrics.averageAQI}
                        </td>

                        <td>
                          {metrics.maximumAQI}
                        </td>
                      </tr>

                      <tr>
                        <td>
                          <strong>Temperature</strong>
                        </td>

                        <td>
                          {history.length
                            ? `${history[history.length - 1].temperature}°C`
                            : "--"}
                        </td>

                        <td>
                          {metrics.averageTemperature}°C
                        </td>

                        <td>
                          {history.length
                            ? `${Math.max(
                                ...history.map(
                                  (item) =>
                                    Number(
                                      item.temperature
                                    ) || 0
                                )
                              )}°C`
                            : "--"}
                        </td>
                      </tr>

                      <tr>
                        <td>
                          <strong>Humidity</strong>
                        </td>

                        <td>
                          {history.length
                            ? `${history[history.length - 1].humidity}%`
                            : "--"}
                        </td>

                        <td>
                          {metrics.averageHumidity}%
                        </td>

                        <td>
                          {history.length
                            ? `${Math.max(
                                ...history.map(
                                  (item) =>
                                    Number(
                                      item.humidity
                                    ) || 0
                                )
                              )}%`
                            : "--"}
                        </td>
                      </tr>

                      <tr>
                        <td>
                          <strong>MQ-135</strong>
                        </td>

                        <td>
                          {history.length
                            ? history[
                                history.length - 1
                              ].mq135
                            : "--"}
                        </td>

                        <td>
                          {history.length
                            ? Math.round(
                                history.reduce(
                                  (sum, item) =>
                                    sum +
                                    Number(
                                      item.mq135
                                    ),
                                  0
                                ) / history.length
                              )
                            : "--"}
                        </td>

                        <td>
                          {history.length
                            ? Math.max(
                                ...history.map(
                                  (item) =>
                                    Number(
                                      item.mq135
                                    ) || 0
                                )
                              )
                            : "--"}
                        </td>
                      </tr>

                      <tr>
                        <td>
                          <strong>MQ-7</strong>
                        </td>

                        <td>
                          {history.length
                            ? history[
                                history.length - 1
                              ].co
                            : "--"}
                        </td>

                        <td>
                          {history.length
                            ? Math.round(
                                history.reduce(
                                  (sum, item) =>
                                    sum +
                                    Number(item.co),
                                  0
                                ) / history.length
                              )
                            : "--"}
                        </td>

                        <td>
                          {history.length
                            ? Math.max(
                                ...history.map(
                                  (item) =>
                                    Number(item.co) ||
                                    0
                                )
                              )
                            : "--"}
                        </td>
                      </tr>

                    </tbody>

                  </table>
                </div>
              </div>
            </div>

            {/* DATA INFORMATION */}
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-body">

                <div className="row">

                  <div className="col-md-4">
                    <strong>Device</strong>
                    <div className="text-muted">
                      {DEVICE_ID}
                    </div>
                  </div>

                  <div className="col-md-4">
                    <strong>Readings Analyzed</strong>
                    <div className="text-muted">
                      {metrics.readings}
                    </div>
                  </div>

                  <div className="col-md-4">
                    <strong>Update Frequency</strong>
                    <div className="text-muted">
                      Every 10 seconds
                    </div>
                  </div>

                </div>

              </div>
            </div>

            {/* DISCLAIMER */}
            <div className="alert alert-info small">
              <strong>Note:</strong>{" "}
              AirGuard Risk Score is a project-specific
              indicator from 0–500. It should not be interpreted
              as official regulatory AQI or a laboratory gas
              concentration measurement.
            </div>
          </>
        )}

      </div>
    </Layout>
  );
}

export default Analytics;