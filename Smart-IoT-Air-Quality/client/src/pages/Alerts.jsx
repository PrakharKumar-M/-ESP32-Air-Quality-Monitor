import { useCallback, useEffect, useState } from "react";
import Layout from "../components/layout/Layout";
import API from "../services/api";

const DEVICE_ID = "ESP32-001";

function getLevelClass(level) {
  if (level === "Danger") return "bg-danger";
  if (level === "Warning") return "bg-warning text-dark";
  return "bg-success";
}

function getLevelIcon(level) {
  if (level === "Danger") return "🚨";
  if (level === "Warning") return "⚠️";
  return "✅";
}

function formatTime(date) {
  if (!date) return "-";

  return new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    unread: 0,
    danger: 0,
    warning: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAlerts = useCallback(async () => {
    try {
      setError("");

      const [alertsResponse, summaryResponse] = await Promise.all([
        API.get(`/alerts?deviceId=${DEVICE_ID}&limit=100`),
        API.get(`/alerts/summary?deviceId=${DEVICE_ID}`),
      ]);

      if (alertsResponse.data?.success) {
        setAlerts(alertsResponse.data.data || []);
      }

      if (summaryResponse.data?.success) {
        setSummary(
          summaryResponse.data.summary || {
            total: 0,
            unread: 0,
            danger: 0,
            warning: 0,
          }
        );
      }
    } catch (err) {
      console.error("Failed to load alerts:", err);
      setError("Unable to load alerts from the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();

    const interval = setInterval(fetchAlerts, 10000);

    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const markAsRead = async (id) => {
    try {
      await API.patch(`/alerts/${id}/read`);
      await fetchAlerts();
    } catch (err) {
      console.error("Failed to mark alert as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.patch(`/alerts/read-all`, {
        deviceId: DEVICE_ID,
      });

      await fetchAlerts();
    } catch (err) {
      console.error("Failed to mark all alerts as read:", err);
    }
  };

  return (
    <Layout>
      <div className="container-fluid py-2">

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-1">🚨 Alert Center</h2>
            <p className="text-muted mb-0">
              Real-time AirGuard AI risk alerts
            </p>
          </div>

          <button
            className="btn btn-outline-primary"
            onClick={markAllAsRead}
            disabled={summary.unread === 0}
          >
            ✓ Mark All as Read
          </button>
        </div>

        {/* Summary Cards */}
        <div className="row g-3 mb-4">

          <div className="col-md-3">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <div className="text-muted small">
                  TOTAL ALERTS
                </div>
                <div className="display-6 fw-bold">
                  {summary.total}
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <div className="text-muted small">
                  UNREAD
                </div>
                <div className="display-6 fw-bold text-primary">
                  {summary.unread}
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <div className="text-muted small">
                  DANGER
                </div>
                <div className="display-6 fw-bold text-danger">
                  {summary.danger}
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <div className="text-muted small">
                  WARNING
                </div>
                <div className="display-6 fw-bold text-warning">
                  {summary.warning}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="card shadow-sm border-0">
            <div className="card-body text-center py-5">
              <div
                className="spinner-border text-primary mb-3"
                role="status"
              />
              <div>Loading alerts...</div>
            </div>
          </div>
        ) : alerts.length === 0 ? (
          /* Empty State */
          <div className="card shadow-sm border-0">
            <div className="card-body text-center py-5">
              <div style={{ fontSize: "3rem" }}>✅</div>

              <h4 className="mt-3">
                No alerts
              </h4>

              <p className="text-muted mb-0">
                AirGuard has not detected any warning or danger condition.
              </p>
            </div>
          </div>
        ) : (
          /* Alert Table */
          <div className="card shadow-sm border-0">
            <div className="card-body">

              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">

                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Level</th>
                      <th>Risk Score</th>
                      <th>Category</th>
                      <th>Message</th>
                      <th>Time</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {alerts.map((alert) => (
                      <tr
                        key={alert._id}
                        className={
                          alert.status === "Unread"
                            ? "table-light fw-semibold"
                            : ""
                        }
                      >

                        {/* Status */}
                        <td>
                          {alert.status === "Unread" ? (
                            <span className="badge bg-primary">
                              NEW
                            </span>
                          ) : (
                            <span className="badge bg-secondary">
                              READ
                            </span>
                          )}
                        </td>

                        {/* Level */}
                        <td>
                          <span
                            className={`badge ${getLevelClass(
                              alert.level || alert.alertLevel
                            )}`}
                          >
                            {getLevelIcon(
                              alert.level || alert.alertLevel
                            )}{" "}
                            {alert.level || alert.alertLevel || "Normal"}
                          </span>
                        </td>

                        {/* Risk */}
                        <td>
                          <strong>
                            {Number(alert.aqi ?? 0).toFixed(0)}
                          </strong>
                          <span className="text-muted">
                            {" "}
                            / 500
                          </span>
                        </td>

                        {/* Category */}
                        <td>
                          <span className="fw-semibold">
                            {alert.category || "Normal"}
                          </span>
                        </td>

                        {/* Message */}
                        <td>
                          {alert.message}
                        </td>

                        {/* Time */}
                        <td className="text-nowrap">
                          {formatTime(alert.createdAt)}
                        </td>

                        {/* Action */}
                        <td>
                          {alert.status === "Unread" && (
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => markAsRead(alert._id)}
                            >
                              Mark Read
                            </button>
                          )}
                        </td>

                      </tr>
                    ))}
                  </tbody>

                </table>
              </div>

            </div>
          </div>
        )}

        {/* Explanation */}
        <div className="alert alert-info mt-4">
          <strong>AirGuard Alert Logic:</strong>{" "}
          Warning alerts are generated when the AirGuard Risk Score
          enters the warning range. Danger alerts indicate a higher
          risk condition. Alerts are generated automatically from
          live ESP32 sensor readings.
        </div>

        {/* Disclaimer */}
        <p className="text-muted small mt-3">
          AirGuard Risk Score is a project-specific indicator from
          0–500. It is not a regulatory AQI or laboratory gas
          measurement.
        </p>

      </div>
    </Layout>
  );
}

export default Alerts;