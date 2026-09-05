const Alert = require("../models/Alert");

// ============================================================
// GET ALERTS
// ============================================================

const getAlerts = async (req, res) => {
  try {
    const {
      deviceId,
      status,
      limit = 50,
    } = req.query;

    const query = {};

    if (deviceId) {
      query.deviceId = deviceId;
    }

    if (status) {
      query.status = status;
    }

    const safeLimit = Math.min(
      Math.max(Number(limit) || 50, 1),
      200
    );

    const alerts = await Alert.find(query)
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .lean();

    return res.json({
      success: true,
      count: alerts.length,
      data: alerts,
    });

  } catch (error) {
    console.error(
      "Get alerts error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch alerts",
      error: error.message,
    });
  }
};


// ============================================================
// GET ALERT SUMMARY
// ============================================================

const getAlertSummary = async (req, res) => {
  try {
    const deviceId = req.query.deviceId;

    const query = deviceId
      ? { deviceId }
      : {};

    const [
      total,
      unread,
      danger,
      warning,
    ] = await Promise.all([

      Alert.countDocuments(query),

      Alert.countDocuments({
        ...query,
        status: "Unread",
      }),

      Alert.countDocuments({
        ...query,
        category: {
          $in: [
            "Very Poor",
            "Severe",
            "Danger",
            "Critical",
          ],
        },
      }),

      Alert.countDocuments({
        ...query,
        category: {
          $in: [
            "Moderate",
            "Poor",
            "Warning",
          ],
        },
      }),

    ]);

    return res.json({
      success: true,

      summary: {
        total,
        unread,
        danger,
        warning,
      },
    });

  } catch (error) {
    console.error(
      "Alert summary error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to generate alert summary",
      error: error.message,
    });
  }
};


// ============================================================
// MARK ALERT AS READ
// ============================================================

const markAlertAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const alert = await Alert.findByIdAndUpdate(
      id,
      {
        status: "Read",
      },
      {
        new: true,
      }
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    return res.json({
      success: true,
      message: "Alert marked as read",
      data: alert,
    });

  } catch (error) {
    console.error(
      "Mark alert read error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update alert",
      error: error.message,
    });
  }
};


// ============================================================
// MARK ALL ALERTS AS READ
// ============================================================

const markAllAlertsAsRead = async (req, res) => {
  try {
    const deviceId = req.query.deviceId;

    const query = {
      status: "Unread",
    };

    if (deviceId) {
      query.deviceId = deviceId;
    }

    const result = await Alert.updateMany(
      query,
      {
        $set: {
          status: "Read",
        },
      }
    );

    return res.json({
      success: true,
      message: "Alerts marked as read",
      modifiedCount: result.modifiedCount,
    });

  } catch (error) {
    console.error(
      "Mark all alerts read error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update alerts",
      error: error.message,
    });
  }
};


// ============================================================
// EXPORT
// ============================================================

module.exports = {
  getAlerts,
  getAlertSummary,
  markAlertAsRead,
  markAllAlertsAsRead,
};