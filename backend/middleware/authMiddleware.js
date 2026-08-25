const jwt = require("jsonwebtoken");
const User = require("../model/User");

const JWT_SECRET = process.env.JWT_SECRET || "eventhub_super_secret_jwt_key_2026";

// Sign JWT Token using jsonwebtoken
const signToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
};

// Verify JWT Token using jsonwebtoken
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Middleware to protect routes
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized, no session token provided" });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, message: "Not authorized, token invalid or expired" });
  }

  try {
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ success: false, message: "User account no longer exists" });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Authorization failed", error: error.message });
  }
};

// Middleware to restrict access to specified roles (RBAC)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || (roles.length > 0 && !roles.includes(req.user.role))) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access denied for role '${req.user ? req.user.role : 'unauthenticated'}'. Required role: [${roles.join(', ')}]`,
      });
    }
    next();
  };
};

module.exports = {
  signToken,
  verifyToken,
  protect,
  authorize,
};
