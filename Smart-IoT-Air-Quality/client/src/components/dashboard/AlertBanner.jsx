function AlertBanner({ aqi }) {

  if (aqi < 150) return null;

  return (
    <div className="alert alert-danger mt-4">

      ⚠ Warning!

      Air Quality is unhealthy.

      Please wear a mask and avoid prolonged outdoor activities.

    </div>
  );
}

export default AlertBanner;