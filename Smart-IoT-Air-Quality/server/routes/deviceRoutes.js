const express = require("express");

const router = express.Router();

const {
  getDevices,
  addDevice,
  updateHeartbeat,
} = require("../controllers/deviceController");

router.get("/", getDevices);

router.post("/", addDevice);
router.put("/heartbeat", updateHeartbeat);


module.exports = router;