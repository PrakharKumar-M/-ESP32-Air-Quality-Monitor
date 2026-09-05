function getRiskClass(level) {
  switch (level) {
    case "CRITICAL":
    case "HIGH":
      return "text-danger";

    case "ELEVATED":
      return "text-warning";

    default:
      return "text-success";
  }
}

function getRiskBadge(level) {
  switch (level) {
    case "CRITICAL":
    case "HIGH":
      return "bg-danger";

    case "ELEVATED":
      return "bg-warning text-dark";

    default:
      return "bg-success";
  }
}

function AIPrediction({ prediction, loading }) {
  if (loading) {
    return (
      <div className="card border-0 shadow-sm mt-4">
        <div className="card-body text-center p-4">

          <div
            className="spinner-border text-primary"
            role="status"
          />

          <p className="mt-3 mb-0">
            🤖 AirGuard AI is analyzing the latest sensor data...
          </p>

        </div>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="card border-0 shadow-sm mt-4">
        <div className="card-body p-4">

          <div className="d-flex justify-content-between align-items-center">

            <div>
              <h4 className="fw-bold mb-1">
                🤖 AirGuard AI
              </h4>

              <p className="text-muted mb-0">
                Waiting for AI analysis...
              </p>
            </div>

            <span className="badge bg-secondary">
              STANDBY
            </span>

          </div>

        </div>
      </div>
    );
  }

  const currentRisk = Number(
    prediction.currentRiskScore ?? 0
  );

  const aiEstimatedRisk = Number(
    prediction.aiEstimatedRisk ??
      prediction.predictedRiskScore ??
      0
  );

  const riskChange = Number(
    prediction.riskChange ??
      aiEstimatedRisk - currentRisk
  );

  const direction =
    prediction.direction || "STABLE";

  const riskLevel =
    prediction.riskLevel || "NORMAL";

  const warning =
    prediction.warning ||
    "No immediate AI risk warning.";

  const inputs =
    prediction.inputs || {};

  const riskClass =
    getRiskClass(riskLevel);

  const riskBadge =
    getRiskBadge(riskLevel);

  let directionIcon = "→";

  if (direction === "RISING") {
    directionIcon = "↗";
  } else if (direction === "FALLING") {
    directionIcon = "↘";
  }

  return (
    <div className="card border-0 shadow-sm mt-4">

      <div className="card-body p-4">

        {/* HEADER */}

        <div className="d-flex justify-content-between align-items-center">

          <div>
            <h4 className="fw-bold mb-1">
              🤖 AirGuard AI
            </h4>

            <p className="text-muted mb-0">
              Random Forest Risk Analysis
            </p>
          </div>

          <span className="badge bg-primary px-3 py-2">
            AI ACTIVE
          </span>

        </div>


        {/* SCORES */}

        <div className="row mt-4 g-3">

          <div className="col-md-4 text-center">

            <div className="border rounded-3 p-3 h-100">

              <small className="text-muted">
                CURRENT RISK
              </small>

              <h1 className="text-primary fw-bold mb-0">
                {currentRisk.toFixed(0)}
              </h1>

              <small className="text-muted">
                / 500
              </small>

            </div>

          </div>


          <div className="col-md-4 text-center">

            <div className="border rounded-3 p-3 h-100">

              <small className="text-muted">
                AI ESTIMATED RISK
              </small>

              <h1 className={`${riskClass} fw-bold mb-0`}>
                {aiEstimatedRisk.toFixed(0)}
              </h1>

              <small className="text-muted">
                / 500
              </small>

            </div>

          </div>


          <div className="col-md-4 text-center">

            <div className="border rounded-3 p-3 h-100">

              <small className="text-muted">
                AI DIRECTION
              </small>

              <h2 className={`${riskClass} fw-bold`}>
                {directionIcon} {direction}
              </h2>

              <small className="text-muted">
                Change:{" "}
                {riskChange >= 0 ? "+" : ""}
                {riskChange.toFixed(0)}
              </small>

            </div>

          </div>

        </div>


        {/* LEVEL */}

        <div className="text-center mt-4">

          <span
            className={`badge ${riskBadge} px-3 py-2`}
          >
            {riskLevel}
          </span>

        </div>


        {/* AI ASSESSMENT */}

        <div
          className={`alert mt-4 ${
            riskLevel === "CRITICAL" ||
            riskLevel === "HIGH"
              ? "alert-danger"
              : riskLevel === "ELEVATED"
                ? "alert-warning"
                : "alert-success"
          }`}
        >

          <strong>
            AI Assessment:
          </strong>{" "}

          {warning}

        </div>


        {/* INPUTS */}

        <div className="row mt-4 g-3">

          <div className="col-md-3">
            <small className="text-muted">
              Temperature
            </small>

            <div className="fw-semibold">
              {inputs.temperature ?? "--"} °C
            </div>
          </div>


          <div className="col-md-3">
            <small className="text-muted">
              Humidity
            </small>

            <div className="fw-semibold">
              {inputs.humidity ?? "--"} %
            </div>
          </div>


          <div className="col-md-3">
            <small className="text-muted">
              MQ-135
            </small>

            <div className="fw-semibold">
              {inputs.mq135 ?? "--"}
            </div>
          </div>


          <div className="col-md-3">
            <small className="text-muted">
              MQ-7
            </small>

            <div className="fw-semibold">
              {inputs.co ?? "--"}
            </div>
          </div>

        </div>


        {/* MODEL NOTE */}

        <div className="mt-4 p-3 bg-light rounded-3">

          <small className="text-muted">
            <strong>How to interpret this:</strong>{" "}
            the Random Forest provides an AI-based risk
            estimate from the current sensor inputs.
            The live AirGuard Risk Engine remains the
            authoritative project risk score.
          </small>

        </div>


        {/* DISCLAIMER */}

        <div className="mt-3">

          <small className="text-muted">
            AirGuard Risk Score is a project-specific
            indicator from 0–500. It is not a regulatory
            AQI or laboratory gas measurement.
          </small>

        </div>

      </div>

    </div>
  );
}

export default AIPrediction;