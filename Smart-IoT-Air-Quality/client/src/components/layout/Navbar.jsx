import { FaLeaf, FaBell, FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-success shadow-sm">
      <div className="container-fluid">

        <span className="navbar-brand fw-bold">
          <FaLeaf className="me-2" />
          Smart Air Quality Monitoring
        </span>

        <div className="d-flex align-items-center">

          <FaBell
            size={20}
            className="text-white me-4"
          />

          <FaUserCircle
            size={30}
            className="text-white me-3"
          />

          <button
            className="btn btn-danger btn-sm"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </div>
    </nav>
  );
}

export default Navbar;