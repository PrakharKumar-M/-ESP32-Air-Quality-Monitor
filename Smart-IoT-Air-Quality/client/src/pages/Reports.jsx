import { useCallback, useEffect, useMemo, useState } from "react";
import Layout from "../components/layout/Layout";
import API from "../services/api";

const DEVICE_ID = "ESP32-001";

function getScore(item) {
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

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function Reports() {
  const [readings, setReadings] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReportData = useCallback(async () => {
    try {
      setError("");

      const [sensorResponse, analysisResponse] =
        await Promise.all([
          API.get(`/sensors?deviceId=${DEVICE_ID}`),
          API.get(
            `/sensors/analysis?deviceId=${DEVICE_ID}&limit=60`
          ),
        ]);

      let sensorData = sensorResponse.data;

      if (sensorData?.data) {
        sensorData = sensorData.data;
      }

      if (!Array.isArray(sensorData)) {
        sensorData = [];
      }

      setReadings(sensorData.slice(0, 60));

      if (analysisResponse.data?.success) {
        setAnalysis(
          analysisResponse.data.analysis || null
        );
      }
    } catch (err) {
      console.error("Reports error:", err);

      setError(
        "Unable to load report data from the server."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReportData();

    const interval = setInterval(
      fetchReportData,
      10000
    );

    return () => clearInterval(interval);
  }, [fetchReportData]);

  const metrics = useMemo(() => {
    if (!readings.length) {
      return {
        total: 0,
        average: 0,
        maximum: 0,
        minimum: 0,
        averageTemp: 0,
        averageHumidity: 0,
      };
    }

    const scores = readings.map(getScore);

    const temperatures = readings.map(
      (item) => Number(item.temperature) || 0
    );

    const humidities = readings.map(
      (item) => Number(item.humidity) || 0
    );

    return {
      total: readings.length,

      average: Math.round(
        scores.reduce(
          (sum, value) => sum + value,
          0
        ) / scores.length
      ),

      maximum: Math.max(...scores),

      minimum: Math.min(...scores),

      averageTemp: (
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
    };
  }, [readings]);

  const exportCSV = () => {
    if (!readings.length) return;

    const headers = [
      "Date",
      "Device",
      "Location",
      "Risk Score",
      "Category",
      "Alert Level",
      "Temperature (C)",
      "Humidity (%)",
      "MQ-135 Raw",
      "MQ-7 Raw",
    ];

    const rows = readings.map((item) => [
      formatDate(item.createdAt),
      item.deviceId || DEVICE_ID,
      item.location || "Lucknow",
      getScore(item),
      item.category || getCategory(getScore(item)),
      item.alertLevel || "Normal",
      Number(item.temperature ?? 0),
      Number(item.humidity ?? 0),
      Number(item.mq135 ?? 0),
      Number(item.co ?? item.mq7 ?? 0),
    ]);

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) =>
            `"${String(value).replaceAll('"', '""')}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob(
      [csv],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = `airguard-report-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    window.print();
  };

  return (
    <Layout>
      <div className="container-fluid py-2">

        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-center mb-4">

          <div>
            <h2 className="fw-bold mb-1">
              📄 AirGuard Reports
            </h2>

            <p className="text-muted mb-0">
              Real-time sensor monitoring report
            </p>
          </div>

          <span className="badge bg-success px-3 py-2">
            ● LIVE DATA
          </span>

        </div>

        {/* ERROR */}
        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        {loading ? (
          <div className="card shadow-sm border-0">
            <div className="card-body text-center py-5">

              <div
                className="spinner-border text-primary"
                role="status"
              />

              <p className="mt-3 mb-0">
                Preparing report...
              </p>

            </div>
          </div>
        ) : (
          <>
            {/* REPORT INFO */}
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
                    <strong>Location</strong>
                    <div className="text-muted">
                      {readings[0]?.location ||
                        "Lucknow"}
                    </div>
                  </div>

                  <div className="col-md-4">
                    <strong>Generated</strong>
                    <div className="text-muted">
                      {formatDate(new Date())}
                    </div>
                  </div>

                </div>

              </div>
            </div>

            {/* METRICS */}
            <div className="row g-3 mb-4">

              <div className="col-md-3">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-body">

                    <div className="text-muted small">
                      TOTAL READINGS
                    </div>

                    <div className="display-6 fw-bold">
                      {metrics.total}
                    </div>

                  </div>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-body">

                    <div className="text-muted small">
                      AVERAGE RISK
                    </div>

                    <div className="display-6 fw-bold">
                      {metrics.average}
                    </div>

                    <small className="text-muted">
                      / 500
                    </small>

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
                      {metrics.maximum}
                    </div>

                    <small className="text-muted">
                      Highest reading
                    </small>

                  </div>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-body">

                    <div className="text-muted small">
                      MINIMUM RISK
                    </div>

                    <div className="display-6 fw-bold text-success">
                      {metrics.minimum}
                    </div>

                    <small className="text-muted">
                      Lowest reading
                    </small>

                  </div>
                </div>
              </div>

            </div>

            {/* ENVIRONMENT METRICS */}
            <div className="row g-3 mb-4">

              <div className="col-md-6">
                <div className="card shadow-sm border-0">
                  <div className="card-body">

                    <div className="text-muted small">
                      AVERAGE TEMPERATURE
                    </div>

                    <h3 className="fw-bold">
                      {metrics.averageTemp}°C
                    </h3>

                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card shadow-sm border-0">
                  <div className="card-body">

                    <div className="text-muted small">
                      AVERAGE HUMIDITY
                    </div>

                    <h3 className="fw-bold">
                      {metrics.averageHumidity}%
                    </h3>

                  </div>
                </div>
              </div>

            </div>

            {/* ACTIONS */}
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-body">

                <h5 className="fw-bold mb-3">
                  Export Report
                </h5>

                <button
                  className="btn btn-success me-2"
                  onClick={exportCSV}
                  disabled={!readings.length}
                >
                  📊 Export CSV
                </button>

                <button
                  className="btn btn-danger"
                  onClick={printReport}
                >
                  📄 Print / Save PDF
                </button>

                <p className="text-muted small mt-3 mb-0">
                  CSV contains the live sensor readings.
                  Use the browser's print dialog to save the
                  report as PDF.
                </p>

              </div>
            </div>

            {/* REPORT TABLE */}
            <div className="card shadow-sm border-0 mb-4">

              <div className="card-body">

                <div className="d-flex justify-content-between align-items-center mb-3">

                  <div>
                    <h5 className="fw-bold mb-1">
                      Recent Sensor Readings
                    </h5>

                    <small className="text-muted">
                      Latest {readings.length} readings
                    </small>
                  </div>

                  <span className="badge bg-primary">
                    {analysis?.trend || "Unknown"} Trend
                  </span>

                </div>

                {readings.length === 0 ? (
                  <div className="text-center text-muted py-5">
                    No sensor readings available yet.
                  </div>
                ) : (
                  <div className="table-responsive">

                    <table className="table table-hover align-middle">

                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Risk</th>
                          <th>Category</th>
                          <th>Level</th>
                          <th>Temp</th>
                          <th>Humidity</th>
                          <th>MQ-135</th>
                          <th>MQ-7</th>
                        </tr>
                      </thead>

                      <tbody>
                        {readings
                          .slice(0, 30)
                          .map((item, index) => {

                            const score =
                              getScore(item);

                            const itemCategory =
                              item.category ||
                              getCategory(score);

                            return (
                              <tr key={item._id || index}>

                                <td className="text-nowrap">
                                  {formatDate(
                                    item.createdAt
                                  )}
                                </td>

                                <td>
                                  <strong>
                                    {score}
                                  </strong>
                                </td>

                                <td>
                                  {itemCategory}
                                </td>

                                <td>
                                  <span
                                    className={`badge ${
                                      item.alertLevel ===
                                      "Danger"
                                        ? "bg-danger"
                                        : item.alertLevel ===
                                          "Warning"
                                        ? "bg-warning text-dark"
                                        : "bg-success"
                                    }`}
                                  >
                                    {item.alertLevel ||
                                      "Normal"}
                                  </span>
                                </td>

                                <td>
                                  {Number(
                                    item.temperature ?? 0
                                  )}°C
                                </td>

                                <td>
                                  {Number(
                                    item.humidity ?? 0
                                  )}%
                                </td>

                                <td>
                                  {Number(
                                    item.mq135 ?? 0
                                  )}
                                </td>

                                <td>
                                  {Number(
                                    item.co ??
                                      item.mq7 ??
                                      0
                                  )}
                                </td>

                              </tr>
                            );
                          })}
                      </tbody>

                    </table>

                  </div>
                )}

              </div>
            </div>

            {/* DISCLAIMER */}
            <div className="alert alert-info small">

              <strong>Report Note:</strong>{" "}
              AirGuard Risk Score is a project-specific
              indicator from 0–500. It is not official
              regulatory AQI and raw MQ-135/MQ-7 values are
              sensor ADC readings, not direct laboratory gas
              concentration measurements.

            </div>
          </>
        )}

      </div>
    </Layout>
  );
}

export default Reports;