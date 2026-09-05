import { Link } from "react-router-dom";
import {
  FaHome,
  FaChartBar,
  FaMicrochip,
  FaBell,
  FaInfoCircle,
  FaCog,
   FaFileAlt,
   FaGamepad ,
} from "react-icons/fa";

function Sidebar() {
  return (
    <aside
      className="bg-dark text-white"
      style={{
        width: "250px",
        minHeight: "100vh",
      }}
    >
      <div className="p-3">

        <h4 className="mb-4">Dashboard</h4>

        <ul className="nav flex-column">

          <li className="nav-item mb-2">
            <Link className="nav-link text-white" to="/">
              <FaHome className="me-2" />
              Home
            </Link>
          </li>

   <li className="nav-item mb-2">
  <Link className="nav-link text-white" to="/dashboard">
    <FaChartBar className="me-2" />
    Dashboard
  </Link>
</li>

{/* Analytics */}
<li className="nav-item mb-2">
  <Link className="nav-link text-white" to="/analytics">
    <FaChartBar className="me-2" />
    Analytics
  </Link>
</li>

{/* Devices */}
<li className="nav-item mb-2">
  <Link className="nav-link text-white" to="/devices">
    <FaMicrochip className="me-2" />
    Devices
  </Link>
</li>

       <li className="nav-item mb-2">
  <Link className="nav-link text-white" to="/alerts">
    <FaBell className="me-2" />
    Alerts
  </Link>
</li>
<li className="nav-item mb-2">
  <Link className="nav-link text-white" to="/reports">
    <FaFileAlt className="me-2" />
    Reports
  </Link>
</li>
<li className="nav-item mb-2">
  <Link className="nav-link text-white" to="/device-control">
    <FaGamepad className="me-2" />
    Device Control
  </Link>
</li>
          <li className="nav-item">
            <Link className="nav-link text-white" to="#">
              <FaCog className="me-2" />
              Settings
            </Link>
          </li>

        </ul>

      </div>
    </aside>
  );
}

export default Sidebar;