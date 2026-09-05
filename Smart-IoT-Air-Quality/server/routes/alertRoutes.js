const express = require("express");

const router = express.Router();

const {
  getAlerts,
  getAlertSummary,
  markAlertAsRead,
  markAllAlertsAsRead,
} = require("../controllers/alertController");


// ============================================================
// ALERT ROUTES
// ============================================================

// Get alerts
// GET /api/alerts
router.get("/", getAlerts);


// Get alert summary
// GET /api/alerts/summary
router.get("/summary", getAlertSummary);


// Mark all alerts as read
// PATCH /api/alerts/read-all
router.patch("/read-all", markAllAlertsAsRead);


// Mark individual alert as read
// PATCH /api/alerts/:id/read
router.patch("/:id/read", markAlertAsRead);


module.exports = router;