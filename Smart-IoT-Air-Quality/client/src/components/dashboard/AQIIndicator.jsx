function AQIIndicator({ aqi }) {
  const isGood = aqi <= 100;
  const isWarning = aqi > 100 && aqi <= 200;
  const isDanger = aqi > 200;

  return (
    <div className="card shadow mt-4">
      <div className="card-body">

        <h4 className="mb-4">
          🚦 AQI Alert Indicators
        </h4>

        <div className="row text-center">

          {/* Green Light */}
          <div className="col-md-4">
            <div
              className={`p-4 rounded ${
                isGood
                  ? "bg-success text-white"
                  : "bg-light"
              }`}
            >
              <div
                style={{
                  fontSize: "50px",
                  opacity: isGood ? 1 : 0.25,
                }}
              >
                🟢
              </div>

              <h5>Green Light</h5>

              <p className="mb-0">
                {isGood ? "ON" : "OFF"}
              </p>

              <small>
                AQI ≤ 100
              </small>
            </div>
          </div>

          {/* Red Light */}
          <div className="col-md-4">
            <div
              className={`p-4 rounded ${
                isWarning || isDanger
                  ? "bg-danger text-white"
                  : "bg-light"
              }`}
            >
              <div
                style={{
                  fontSize: "50px",
                  opacity:
                    isWarning || isDanger
                      ? 1
                      : 0.25,
                }}
              >
                🔴
              </div>

              <h5>Red Light</h5>

              <p className="mb-0">
                {isWarning || isDanger
                  ? "ON"
                  : "OFF"}
              </p>

              <small>
                AQI &gt; 100
              </small>
            </div>
          </div>

          {/* Buzzer */}
          <div className="col-md-4">
            <div
              className={`p-4 rounded ${
                isDanger
                  ? "bg-warning"
                  : "bg-light"
              }`}
            >
              <div
                style={{
                  fontSize: "50px",
                  opacity: isDanger ? 1 : 0.25,
                }}
              >
                🔊
              </div>

              <h5>Buzzer</h5>

              <p className="mb-0">
                {isDanger ? "ON" : "OFF"}
              </p>

              <small>
                AQI &gt; 200
              </small>
            </div>
          </div>

        </div>

        {/* Current status */}

        <div className="text-center mt-4">

          <h5>
            Current AQI:{" "}
            <strong>{aqi}</strong>
          </h5>

          {isGood && (
            <span className="badge bg-success">
              Normal
            </span>
          )}

          {isWarning && (
            <span className="badge bg-danger">
              Pollution Warning
            </span>
          )}

          {isDanger && (
            <span className="badge bg-dark">
              HIGH ALERT
            </span>
          )}

        </div>

      </div>
    </div>
  );
}

export default AQIIndicator;