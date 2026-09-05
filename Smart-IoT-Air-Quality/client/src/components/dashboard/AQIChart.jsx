import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

function AQIChart({ history }) {
  // Safety check
  if (!history || history.length === 0) {
    return (
      <div className="card shadow mt-4">
        <div className="card-body">
          <h4>AQI Trend</h4>
          <p className="text-muted">No AQI data available.</p>
        </div>
      </div>
    );
  }

  // Latest 20 readings
  const readings = history.slice(0, 20).reverse();

  // AQI values
  const aqiValues = readings.map((item) => item.aqi);

  // Statistics
  const averageAQI = Math.round(
    aqiValues.reduce((sum, value) => sum + value, 0) /
      aqiValues.length
  );

  const maxAQI = Math.max(...aqiValues);
  const minAQI = Math.min(...aqiValues);

  // Trend
  let trend = "Stable";
  let trendIcon = "→";

  if (aqiValues.length >= 2) {
    const first = aqiValues[0];
    const last = aqiValues[aqiValues.length - 1];

    if (last > first) {
      trend = "Increasing";
      trendIcon = "↗";
    } else if (last < first) {
      trend = "Decreasing";
      trendIcon = "↘";
    }
  }

  // Chart
  const data = {
    labels: readings.map((item) =>
      new Date(item.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    ),

    datasets: [
      {
        label: "AQI",

        data: aqiValues,

        borderColor: "#00C853",

        backgroundColor: "rgba(0,200,83,.15)",

        fill: true,

        tension: 0.4,

        pointRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,

    maintainAspectRatio: false,

    plugins: {
      legend: {
        position: "top",
      },
    },

    scales: {
      y: {
        beginAtZero: true,
        suggestedMax: 500,
      },
    },
  };

  return (
    <div className="card shadow mt-4">

      <div className="card-body">

        <h4 className="mb-4">
          📈 AQI Trend
        </h4>

        {/* Statistics */}

        <div className="row g-3 mb-4">

          <div className="col-md-3">
            <div className="p-3 bg-light rounded">
              <small className="text-muted">
                Average AQI
              </small>

              <h4 className="mb-0">
                {averageAQI}
              </h4>
            </div>
          </div>

          <div className="col-md-3">
            <div className="p-3 bg-light rounded">
              <small className="text-muted">
                Maximum AQI
              </small>

              <h4 className="mb-0 text-danger">
                {maxAQI}
              </h4>
            </div>
          </div>

          <div className="col-md-3">
            <div className="p-3 bg-light rounded">
              <small className="text-muted">
                Minimum AQI
              </small>

              <h4 className="mb-0 text-success">
                {minAQI}
              </h4>
            </div>
          </div>

          <div className="col-md-3">
            <div className="p-3 bg-light rounded">
              <small className="text-muted">
                Trend
              </small>

              <h4 className="mb-0">
                {trendIcon} {trend}
              </h4>
            </div>
          </div>

        </div>

        {/* Chart */}

        <div style={{ height: "350px" }}>
          <Line
            data={data}
            options={options}
          />
        </div>

      </div>

    </div>
  );
}

export default AQIChart;