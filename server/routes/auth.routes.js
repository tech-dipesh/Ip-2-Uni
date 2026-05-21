import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../db.js";
import isAuthenticated from "../middleware/isauth.js";

const router = Router();
const SALT_ROUNDS = 12;

const isValidEmail    = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const isValidPassword = (p) => typeof p === "string" && p.length >= 8;
const isValidUsername = (u) =>
  typeof u === "string" && u.length >= 3 && u.length <= 30 && /^[a-zA-Z0-9_]+$/.test(u);

const createTokens = (userId) => ({
  accessToken:  jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET,  { expiresIn: "15m" }),
  refreshToken: jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d"  }),
});

const cookieBase = () => {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure:   isProd,
    sameSite: isProd ? "none" : "lax",
  };
};

const setAuthCookies = (res, accessToken, refreshToken) => {
  const base = cookieBase();
  res.cookie("accessToken",  accessToken,  { ...base, maxAge: 15 * 60 * 1000 });
  res.cookie("refreshToken", refreshToken, { ...base, maxAge: 7 * 24 * 60 * 60 * 1000 });
};

router.post("/signup", async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ success: false, message: "All fields are required" });
    if (!isValidUsername(username))
      return res.status(400).json({ success: false, message: "Username: 3–30 chars, letters/numbers/underscore only" });
    if (!isValidEmail(email))
      return res.status(400).json({ success: false, message: "Invalid email address" });
    if (!isValidPassword(password))
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });

    const existing = await query(
      "SELECT id FROM users WHERE email = $1 OR username = $2 LIMIT 1",
      [email.toLowerCase(), username.toLowerCase()]
    );
    if (existing.rows.length)
      return res.status(409).json({ success: false, message: "Email or username already taken" });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const { rows } = await query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, reputation_score, is_verified`,
      [username.toLowerCase(), email.toLowerCase(), passwordHash]
    );

    const { accessToken, refreshToken } = createTokens(rows[0].id);
    setAuthCookies(res, accessToken, refreshToken);
    res.status(201).json({ success: true, user: rows[0] });
  } catch (err) { next(err); }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password are required" });

    const { rows } = await query(
      "SELECT id, username, email, password_hash, reputation_score, is_verified FROM users WHERE email = $1",
      [email.toLowerCase()]
    );
    const user = rows[0];

    const dummy = "$2a$12$invaliddummyhashfortimingonly00";
    const match = await bcrypt.compare(password, user ? user.password_hash : dummy);

    if (!user || !match)
      return res.status(401).json({ success: false, message: "Invalid email or password" });

    const { accessToken, refreshToken } = createTokens(user.id);
    setAuthCookies(res, accessToken, refreshToken);

    const { password_hash: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch (err) { next(err); }
});

router.post("/refresh", (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token)
    return res.status(401).json({ success: false, message: "No refresh token" });

  try {
    const decoded     = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const accessToken = jwt.sign({ userId: decoded.userId }, process.env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
    const base        = cookieBase();
    res.cookie("accessToken", accessToken, { ...base, maxAge: 15 * 60 * 1000 });
    res.json({ success: true });
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
  }
});

router.post("/logout", isAuthenticated, (_req, res) => {
  res.clearCookie("accessToken").clearCookie("refreshToken").json({ success: true, message: "Logged out" });
});

router.get("/me", isAuthenticated, (req, res) => {
  res.json({ success: true, user: req.user });
});

export default router;
