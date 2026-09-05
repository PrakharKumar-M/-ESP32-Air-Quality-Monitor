function calculateAQI({ pm25, pm10, co, gas }) {
  let aqi = Math.round(
    pm25 * 0.6 +
    pm10 * 0.2 +
    co * 1.5 +
    gas * 0.1
  );

  if (aqi < 0) {
    aqi = 0;
  }

  if (aqi > 500) {
    aqi = 500;
  }

  let category = "Good";

  if (aqi > 50 && aqi <= 100) {
    category = "Satisfactory";
  } else if (aqi > 100 && aqi <= 200) {
    category = "Moderate";
  } else if (aqi > 200 && aqi <= 300) {
    category = "Poor";
  } else if (aqi > 300 && aqi <= 400) {
    category = "Very Poor";
  } else if (aqi > 400) {
    category = "Severe";
  }

  return {
    aqi,
    category,
  };
}

module.exports = calculateAQI;