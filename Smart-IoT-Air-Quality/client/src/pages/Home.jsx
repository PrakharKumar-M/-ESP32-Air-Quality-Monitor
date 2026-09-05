import { Link } from "react-router-dom";
import { FaLeaf, FaChartLine, FaMicrochip } from "react-icons/fa";

function Home() {
  return (
    <>
      {/* Hero Section */}
      <section
        className="text-white d-flex align-items-center"
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg,#0f2027,#203a43,#2c5364)",
        }}
      >
        <div className="container">

          <div className="row align-items-center">

            <div className="col-lg-6">

             <div
  className="d-inline-block px-3 py-2 mb-3 rounded-pill"
  style={{
    backgroundColor: "rgba(255,255,255,0.15)",
    border: "2px solid #FFD700",
  }}
>
  <span
    style={{
      color: "#FFD700",
      fontWeight: "bold",
      fontSize: "20px",
    }}
  >
    👥 Created by Confidant Team Member
  </span>
</div>

<h1
  className="fw-bold"
  style={{ fontSize: "55px" }}
>
  🌿 Smart Air Quality
  <br />
  Monitoring System
</h1>
              <p className="mt-4 fs-5">
                Monitor Air Quality, Temperature, Humidity,
                Gas and CO₂ in Real Time using IoT &
                MERN Stack.
              </p>

              <Link
                to="/dashboard"
                className="btn btn-success btn-lg mt-3"
              >
                Open Dashboard
              </Link>

            </div>

            <div className="col-lg-6 text-center">

              <img
                src="https://cdn-icons-png.flaticon.com/512/2933/2933822.png"
                alt="IoT"
                width="380"
              />

            </div>

          </div>

        </div>
      </section>

      {/* Features */}

      <section className="container py-5">

        <div className="text-center mb-5">

          <h2>Project Features</h2>

        </div>

        <div className="row">

          <div className="col-md-4">

            <div className="card shadow p-4 text-center">

              <FaLeaf
                size={60}
                color="green"
              />

              <h3 className="mt-3">

                Live AQI

              </h3>

              <p>

                Monitor Air Quality Index in real time.

              </p>

            </div>

          </div>

          <div className="col-md-4">

           <a href="http://localhost:5173/analytics "> <div className="card shadow p-4 text-center">

              <FaChartLine
                size={60}
                color="blue"
              />

              <h3 className="mt-3">

                Analytics

              </h3>

              <p>

                Beautiful charts with historical data.

              </p>

            </div> </a>

          </div>

          <div className="col-md-4">

            <a href="http://localhost:5173/devices">  <div className="card shadow p-4 text-center">

              <FaMicrochip
                size={60}
                color="orange"
              />

              <h3 className="mt-3">

             IoT Devices 

              </h3>

              <p>

                Connect ESP32 and sensors easily.

              </p>

            </div></a>

          </div>

        </div>

      </section>
    </>
  );
}

export default Home;