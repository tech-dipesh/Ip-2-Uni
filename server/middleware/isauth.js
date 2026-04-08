import jwt from "jsonwebtoken";
import { query } from "../db.js";

const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (err) {
      const message =
        err.name === "TokenExpiredError"
          ? "Access token expired"
          : "Invalid token";
      return res.status(401).json({ success: false, message });
    }

    const { rows } = await query(
      "SELECT id, username, email, reputation_score, is_verified FROM users WHERE id = $1",
      [decoded.userId]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    next(err);
  }
};

export default isAuthenticated;