require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

const sensorRoutes = require("./routes/sensorRoutes");
const authRoutes = require("./routes/authRoutes");

const protect = require("./middleware/authMiddleware");

const alertRoutes = require("./routes/alertRoutes");
const deviceRoutes = require("./routes/deviceRoutes");
const mlRoutes = require("./routes/mlRoutes");

const app = express();


// ==========================================
// CONNECT MONGODB
// ==========================================

connectDB();


// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());

app.use(express.json());


// ==========================================
// HOME ROUTE
// ==========================================

app.get("/", (req, res) => {

  res.json({

    success: true,

    message:
      "Smart IoT Air Quality Monitoring API Running...",
  });

});


// ==========================================
// PROTECTED ROUTE
// ==========================================

app.get(
  "/api/protected",
  protect,
  (req, res) => {

    res.json({

      success: true,

      message:
        "Protected Route Working",

      user:
        req.user,
    });

  }
);


// ==========================================
// ROUTES
// ==========================================

app.use(
  "/api/sensors",
  sensorRoutes
);

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/devices",
  deviceRoutes
);

app.use(
  "/api/alerts",
  alertRoutes
);

app.use(
  "/api/ml",
  mlRoutes
);


// ==========================================
// START SERVER
// ==========================================

app.get("/test", (req, res) => {
  console.log("✅ ESP32 TEST REQUEST RECEIVED");

  res.json({
    success: true,
    message: "ESP32 can reach Node.js"
  });
});

const PORT = 5001;

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `Server running on port ${PORT}`
    );

  }
);