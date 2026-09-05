import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

function ParticulateChart({ history }) {
  if (!history || history.length === 0) {
    return (
      <div className="card shadow mt-4">
        <div className="card-body">
          <h4>Particulate Matter Trend</h4>
          <p className="text-muted">
            No particulate data available.
          </p>
        </div>
      </div>
    );
  }

  const readings = history.slice(0, 20).reverse();

  const labels = readings.map((item) =>
    new Date(item.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  );

  const data = {
    labels,

    datasets: [
      {
        label: "PM2.5",

        data: readings.map((item) => item.pm25),

        borderColor: "#FF9800",

        backgroundColor: "rgba(255,152,0,0.1)",

        tension: 0.4,

        pointRadius: 3,
      },

      {
        label: "PM10",

        data: readings.map((item) => item.pm10),

        borderColor: "#795548",

        backgroundColor: "rgba(121,85,72,0.1)",

        tension: 0.4,

        pointRadius: 3,
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

        title: {
          display: true,

          text: "Concentration (µg/m³)",
        },
      },
    },
  };

  return (
    <div className="card shadow mt-4">

      <div className="card-body">

        <h4 className="mb-4">
          🌫️ Particulate Matter Trend
        </h4>

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

export default ParticulateChart;