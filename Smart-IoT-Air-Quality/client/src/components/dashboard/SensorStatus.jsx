function SensorStatus({ sensor }) {
  return (
    <div className="card shadow mt-4">
      <div className="card-body">

        <h4>📡 Sensor Status</h4>

        <table className="table">

          <tbody>

            <tr>
              <td>Device</td>
              <td>ESP32-001</td>
            </tr>

            <tr>
              <td>Status</td>
              <td>
                <span className="badge bg-success">
                  Online
                </span>
              </td>
            </tr>

            <tr>
              <td>Location</td>
              <td>{sensor.location}</td>
            </tr>

            <tr>
              <td>Last Reading</td>
              <td>
                {new Date().toLocaleString()}
              </td>
            </tr>

          </tbody>

        </table>

      </div>
    </div>
  );
}

export default SensorStatus;