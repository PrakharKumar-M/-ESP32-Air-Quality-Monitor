import {
  FaLeaf,
  FaTemperatureHigh,
  FaTint,
  FaWind,
  FaCloud,
  FaMapMarkerAlt,
} from "react-icons/fa";

import StatCard from "./StatCard";


function DashboardCards({ sensor }) {

  return (

    <div className="row">

      {/* =============================== */}
      {/* AQI */}
      {/* =============================== */}

      <StatCard
        title="AQI"
        value={sensor.aqi}
        unit=""
        icon={<FaLeaf />}
        color="#00C853"
      />


      {/* =============================== */}
      {/* TEMPERATURE */}
      {/* =============================== */}

      <StatCard
        title="Temperature"
        value={sensor.temperature}
        unit="°C"
        icon={<FaTemperatureHigh />}
        color="#F44336"
      />


      {/* =============================== */}
      {/* HUMIDITY */}
      {/* =============================== */}

      <StatCard
        title="Humidity"
        value={sensor.humidity}
        unit="%"
        icon={<FaTint />}
        color="#2196F3"
      />


      {/* =============================== */}
      {/* MQ-135 */}
      {/* =============================== */}

      <StatCard
        title="MQ-135"
        value={sensor.mq135}
        unit=""
        icon={<FaWind />}
        color="#FF9800"
      />


      {/* =============================== */}
      {/* CO - MQ-7 */}
      {/* =============================== */}

      <StatCard
        title="CO"
        value={sensor.co}
        unit=""
        icon={<FaCloud />}
        color="#9C27B0"
      />


      {/* =============================== */}
      {/* LOCATION */}
      {/* =============================== */}

      <StatCard
        title="Location"
        value={sensor.location}
        unit=""
        icon={<FaMapMarkerAlt />}
        color="#212121"
      />

    </div>

  );
}


export default DashboardCards;