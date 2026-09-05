import "./EmergencyPanel.css";

function EmergencyPanel({ aqi }) {
  const safe = aqi <= 100;
  const warning = aqi > 100 && aqi <= 200;
  const danger = aqi > 200;

  return (
    <div className="card shadow mt-4">
      <div className="card-header bg-dark text-white">
        <h4 className="mb-0">🚨 Emergency Control Panel</h4>
      </div>

      <div className="card-body">

        <div className="status-row">
          <span>🟢 Green LED</span>

          <span className={safe ? "status-on green" : "status-off"}>
            {safe ? "ON" : "OFF"}
          </span>
        </div>

        <div className="status-row">
          <span>🔴 Red LED</span>

          <span
            className={
              warning || danger
                ? "status-on red blink"
                : "status-off"
            }
          >
            {warning || danger ? "BLINKING" : "OFF"}
          </span>
        </div>

        <div className="status-row">
          <span>🚨 Buzzer</span>

          <span
            className={
              danger
                ? "status-on red"
                : "status-off"
            }
          >
            {danger ? "ON" : "OFF"}
          </span>
        </div>

        <hr />

        <h5>
          System Status :
          {" "}
          {safe && (
            <span className="text-success">
              SAFE
            </span>
          )}

          {warning && (
            <span className="text-warning">
              WARNING
            </span>
          )}

          {danger && (
            <span className="text-danger">
              DANGER
            </span>
          )}
        </h5>

      </div>
    </div>
  );
}

export default EmergencyPanel;