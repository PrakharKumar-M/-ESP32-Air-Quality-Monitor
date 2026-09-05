import { useEffect, useState } from "react";
import Layout from "../components/layout/Layout";
import API from "../services/api";

function Devices() {
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    fetchDevices();
  }, []);

  async function fetchDevices() {
    try {
      const res = await API.get("/devices");
      setDevices(res.data);
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <Layout>
      <h2 className="mb-4">Connected Devices</h2>

      <div className="card shadow">
        <div className="card-body">
          <table className="table table-hover">
            <thead className="table-success">
              <tr>
                <th>Device ID</th>
                <th>Device Name</th>
                <th>Location</th>
                <th>Status</th>
                <th>Last Seen</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {devices.map((device) => (
                <tr key={device._id}>
                  <td>{device.deviceId}</td>
                  <td>{device.deviceName}</td>
                  <td>{device.location}</td>

                  <td>
                    {device.status === "Online" ? (
                      <span className="badge bg-success">Online</span>
                    ) : (
                      <span className="badge bg-danger">Offline</span>
                    )}
                  </td>

                  <td>
                    {device.lastSeen
                      ? new Date(device.lastSeen).toLocaleString()
                      : "N/A"}
                  </td>

                  <td>
                    <button className="btn btn-primary btn-sm">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button className="btn btn-success mt-3">
            Add Device
          </button>
        </div>
      </div>
    </Layout>
  );
}

export default Devices;