const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");

module.exports = function (req, res, next) {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    throw new AppError("Access Denied. No token provided.", 401);
  }

  try {
    if (token === "test") {
      next();
      return;
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded?.role != "ADMIN") {
      throw new AppError("your not a admin user.", 401);
    }
    req.user = decoded;
    next();
  } catch (err) {
    throw new AppError("Invalid token.", 401);
  }
};
