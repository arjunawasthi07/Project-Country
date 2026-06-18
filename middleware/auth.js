const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  // Get token from header
  const authHeader = req.header("Authorization");
  
  if (!authHeader) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  // Check if it starts with Bearer
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ message: "Token format is invalid (Bearer <token>)" });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "mysecretkey");
    req.user = decoded; // Attach user details (id, name, email) to the request object
    next();
  } catch (error) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

module.exports = auth;
