import { FaTemperatureHigh, FaTint, FaWind, FaCloudSun } from "react-icons/fa";

function WeatherWidget() {
  const weather = {
    location: "Lucknow",
    temperature: 31,
    humidity: 66,
    wind: 12,
    condition: "Partly Cloudy",
    updated: new Date().toLocaleTimeString(),
  };

  return (
    <div className="card shadow mt-4">
      <div className="card-body">

        <h4 className="mb-4">
          🌤 Live Weather
        </h4>

        <div className="row">

          <div className="col-md-4 mb-3">
            <h5><FaTemperatureHigh /> Temperature</h5>
            <h3>{weather.temperature}°C</h3>
          </div>

          <div className="col-md-4 mb-3">
            <h5><FaTint /> Humidity</h5>
            <h3>{weather.humidity}%</h3>
          </div>

          <div className="col-md-4 mb-3">
            <h5><FaWind /> Wind</h5>
            <h3>{weather.wind} km/h</h3>
          </div>

        </div>

        <hr />

        <h5>
          <FaCloudSun /> {weather.condition}
        </h5>

        <p>
          📍 {weather.location}
        </p>

        <small>
          Updated: {weather.updated}
        </small>

      </div>
    </div>
  );
}

export default WeatherWidget;