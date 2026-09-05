import { FaLightbulb, FaChartLine, FaExclamationTriangle } from "react-icons/fa";

function EnvironmentalInsights({ history, sensor }) {
  if (!history || history.length === 0 || !sensor) {
    return null;
  }

  // Latest 20 readings
  const readings = history.slice(0, 20);

  const aqiValues = readings.map((item) => item.aqi);
  const pm25Values = readings.map((item) => item.pm25);

  const averageAQI = Math.round(
    aqiValues.reduce((sum, value) => sum + value, 0) /
      aqiValues.length
  );

  const maxAQI = Math.max(...aqiValues);

  const averagePM25 = Math.round(
    pm25Values.reduce((sum, value) => sum + value, 0) /
      pm25Values.length
  );

  // Determine AQI trend
  let trend = "stable";

  if (aqiValues.length >= 2) {
    const latest = aqiValues[0];
    const previous = aqiValues[aqiValues.length - 1];

    if (latest > previous) {
      trend = "increasing";
    } else if (latest < previous) {
      trend = "decreasing";
    }
  }

  // Generate insights
  const insights = [];

  if (trend === "increasing") {
    insights.push(
      "AQI is currently showing an increasing trend."
    );
  } else if (trend === "decreasing") {
    insights.push(
      "AQI is currently showing an improving trend."
    );
  } else {
    insights.push(
      "AQI is currently relatively stable."
    );
  }

  if (sensor.aqi > 200) {
    insights.push(
      "Current AQI is in a high-risk range. Immediate attention is recommended."
    );
  } else if (sensor.aqi > 100) {
    insights.push(
      "Current AQI indicates elevated pollution levels."
    );
  } else {
    insights.push(
      "Current AQI is within the lower pollution range."
    );
  }

  if (sensor.pm25 > 100) {
    insights.push(
      "PM2.5 is currently high and is an important contributor to the observed pollution."
    );
  }

  return (
    <div className="card shadow mt-4">
      <div className="card-body">

        <h4 className="mb-4">
          <FaLightbulb className="me-2 text-warning" />
          Environmental Insights
        </h4>

        {/* Summary */}
        <div className="row g-3 mb-4">

          <div className="col-md-4">
            <div className="p-3 bg-light rounded">
              <small className="text-muted">
                Average AQI
              </small>

              <h3 className="mb-0">
                {averageAQI}
              </h3>
            </div>
          </div>

          <div className="col-md-4">
            <div className="p-3 bg-light rounded">
              <small className="text-muted">
                Maximum AQI
              </small>

              <h3 className="mb-0 text-danger">
                {maxAQI}
              </h3>
            </div>
          </div>

          <div className="col-md-4">
            <div className="p-3 bg-light rounded">
              <small className="text-muted">
                Average PM2.5
              </small>

              <h3 className="mb-0">
                {averagePM25} µg/m³
              </h3>
            </div>
          </div>

        </div>

        {/* Insights */}

        <div>
          {insights.map((insight, index) => (
            <div
              key={index}
              className="alert alert-light border d-flex align-items-center"
            >
              {insight.includes("high-risk") ? (
                <FaExclamationTriangle className="text-danger me-3" />
              ) : (
                <FaChartLine className="text-success me-3" />
              )}

              <span>{insight}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default EnvironmentalInsights;