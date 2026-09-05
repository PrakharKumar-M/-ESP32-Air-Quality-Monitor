function AQIStatus({ aqi }) {

  let status = "";
  let color = "";
  let message = "";

  if (aqi <= 50) {
    status = "Good";
    color = "#00C853";
    message = "Air quality is excellent.";
  } else if (aqi <= 100) {
    status = "Moderate";
    color = "#8BC34A";
    message = "Air quality is acceptable.";
  } else if (aqi <= 150) {
    status = "Unhealthy for Sensitive Groups";
    color = "#FFC107";
    message = "Sensitive people should reduce outdoor activity.";
  } else if (aqi <= 200) {
    status = "Unhealthy";
    color = "#FF9800";
    message = "Everyone should limit prolonged outdoor activity.";
  } else if (aqi <= 300) {
    status = "Very Unhealthy";
    color = "#F44336";
    message = "Avoid outdoor activities if possible.";
  } else {
    status = "Hazardous";
    color = "#7B1FA2";
    message = "Stay indoors. Wear a mask if you must go outside.";
  }

  return (
    <div
      className="card shadow mt-4"
      style={{
        borderLeft: `8px solid ${color}`
      }}
    >
      <div className="card-body">

        <h3 style={{ color }}>
          AQI Status : {status}
        </h3>

        <h5>
          Current AQI : {aqi}
        </h5>

        <p>{message}</p>

      </div>
    </div>
  );
}

export default AQIStatus;