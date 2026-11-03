const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("../config/jwt");

const verifyToken = (req, res, next) => {
  const authorization = req.headers.authorization;
  const match =
    typeof authorization === "string"
      ? authorization.match(/^Bearer\s+(\S+)$/i)
      : null;

  if (!match) {
    return res.status(401).json({ message: "Authorization token is required" });
  }

  try {
    req.user = jwt.verify(match[1], getJwtSecret());
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = verifyToken;
