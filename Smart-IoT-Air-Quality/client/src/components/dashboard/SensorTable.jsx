function getRiskInfo(score) {
  const value = Number(score ?? 0);

  if (value <= 50) {
    return {
      label: "Good",
      className: "bg-success",
    };
  }

  if (value <= 100) {
    return {
      label: "Satisfactory",
      className: "bg-success",
    };
  }

  if (value <= 200) {
    return {
      label: "Moderate",
      className: "bg-warning text-dark",
    };
  }

  if (value <= 300) {
    return {
      label: "Poor",
      className: "bg-danger",
    };
  }

  if (value <= 400) {
    return {
      label: "Very Poor",
      className: "bg-danger",
    };
  }

  return {
    label: "Severe",
    className: "bg-dark",
  };
}

function getRiskScore(item) {
  return Number(
    item?.riskScore ??
      item?.estimatedAQI ??
      item?.aqi ??
      0
  );
}

function SensorTable({ history }) {
  return (
    <div className="card shadow mt-4">

      <div className="card-body">

        <div className="d-flex justify-content-between align-items-center mb-3">

          <div>
            <h4 className="mb-1">
              Recent Sensor Readings
            </h4>

            <small className="text-muted">
              Live readings received from the ESP32
            </small>
          </div>

          <span className="badge bg-success">
            ● LIVE
          </span>

        </div>

        <div className="table-responsive">

          <table className="table table-hover table-bordered align-middle">

            <thead className="table-success">

              <tr>

                <th>Temperature</th>

                <th>Humidity</th>

                <th>Risk Score</th>

                <th>Category</th>

                <th>MQ-135</th>

                <th>MQ-7</th>

                <th>Location</th>

                <th>Date</th>

              </tr>

            </thead>

            <tbody>

              {history && history.length > 0 ? (

                history.map((item, index) => {

                  const riskScore =
                    getRiskScore(item);

                  const risk =
                    getRiskInfo(riskScore);

                  return (
                    <tr
                      key={
                        item._id ||
                        item.createdAt ||
                        index
                      }
                    >

                      <td>
                        {Number(
                          item.temperature ?? 0
                        ).toFixed(1)}{" "}
                        °C
                      </td>

                      <td>
                        {Number(
                          item.humidity ?? 0
                        ).toFixed(1)}{" "}
                        %
                      </td>

                      <td>

                        <strong>
                          {riskScore.toFixed(0)}
                        </strong>

                        <span className="text-muted">
                          {" "}/ 500
                        </span>

                      </td>

                      <td>

                        <span
                          className={`badge ${risk.className}`}
                        >
                          {item.category ||
                            risk.label}
                        </span>

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

                      <td>
                        {item.location ||
                          "Lucknow"}
                      </td>

                      <td className="text-nowrap">

                        {item.createdAt
                          ? new Date(
                              item.createdAt
                            ).toLocaleString(
                              "en-IN"
                            )
                          : "--"}

                      </td>

                    </tr>
                  );
                })

              ) : (

                <tr>

                  <td
                    colSpan="8"
                    className="text-center text-muted py-4"
                  >
                    No sensor readings available.
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

        <div className="mt-3">

          <small className="text-muted">

            <strong>Note:</strong>{" "}
            AirGuard Risk Score is a
            project-specific indicator from
            0–500. MQ-135 and MQ-7 values shown
            here are raw sensor readings, not
            direct laboratory gas concentrations.

          </small>

        </div>

      </div>

    </div>
  );
}

export default SensorTable;