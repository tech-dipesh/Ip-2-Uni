import { Router } from "express";
import { query } from "../db.js";
import isAuthenticated from "../middleware/isauth.js";

const router = Router();

const profileSelect = `
  SELECT u.id, u.username, u.avatar_url, u.reputation_score, u.is_verified,
         COUNT(s.id)::INT AS session_count
  FROM   users u
  LEFT   JOIN sessions s ON (s.user1_id = u.id OR s.user2_id = u.id)
`;

router.get("/me", isAuthenticated, async (req, res, next) => {
  try {
    const { rows } = await query(
      `${profileSelect} WHERE u.id = $1 GROUP BY u.id`,
      [req.user.id]
    );
    res.json({ success: true, profile: rows[0] });
  } catch (err) {
    next(err);
  }
});

router.get("/:username", async (req, res, next) => {
  try {
    const { rows } = await query(
      `${profileSelect} WHERE u.username = $1 GROUP BY u.id`,
      [req.params.username.toLowerCase()]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, profile: rows[0] });
  } catch (err) {
    next(err);
  }
});

router.patch("/me", isAuthenticated, async (req, res, next) => {
  try {
    const { avatarUrl, username } = req.body;

    if (!avatarUrl && !username) {
      return res.status(400).json({ success: false, message: "Nothing to update" });
    }

    const sets = [];
    const vals = [];
    let i = 1;

    if (avatarUrl) { sets.push(`avatar_url = $${i++}`); vals.push(avatarUrl); }
    if (username) {
      if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
        return res.status(400).json({ success: false, message: "Invalid username format" });
      }
      sets.push(`username = $${i++}`);
      vals.push(username.toLowerCase());
    }

    sets.push("updated_at = NOW()");
    vals.push(req.user.id);

    const { rows } = await query(
      `UPDATE users SET ${sets.join(", ")} WHERE id = $${i} RETURNING id, username, avatar_url, reputation_score`,
      vals
    );
    res.json({ success: true, profile: rows[0] });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ success: false, message: "Username already taken" });
    }
    next(err);
  }
});

export default router;