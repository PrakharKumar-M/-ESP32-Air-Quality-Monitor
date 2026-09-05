const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  let token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access Denied. No Token.",
    });
  }

  token = token.replace("Bearer ", "");

  try {
    const decoded = jwt.verify(token, "smartiotsecret");

    req.user = decoded;

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid Token",
    });
  }
};

module.exports = protect;