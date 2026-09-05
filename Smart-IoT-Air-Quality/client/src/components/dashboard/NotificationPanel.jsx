function NotificationPanel({ sensor }) {

  const notifications = [];

  if (sensor.aqi > 150) {
    notifications.push({
      type: "danger",
      text: `AQI is ${sensor.aqi}. Air quality is unhealthy.`,
    });
  }

  if (sensor.temperature > 35) {
    notifications.push({
      type: "warning",
      text: `Temperature is ${sensor.temperature}°C.`,
    });
  }

  if (sensor.humidity > 80) {
    notifications.push({
      type: "info",
      text: `Humidity is ${sensor.humidity}%.`,
    });
  }

  return (
    <div className="card shadow mt-4">
      <div className="card-body">

        <h4 className="mb-3">🔔 Notifications</h4>

        {notifications.length === 0 ? (
          <div className="alert alert-success">
            No active alerts.
          </div>
        ) : (
          notifications.map((item, index) => (
            <div
              key={index}
              className={`alert alert-${item.type}`}
            >
              {item.text}
            </div>
          ))
        )}

      </div>
    </div>
  );
}

export default NotificationPanel;