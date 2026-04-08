import { Router } from "express";
import { query } from "../db.js";
import isAuthenticated from "../middleware/isauth.js";

const router = Router();

router.use(isAuthenticated);

const VALID_MOODS = ["casual_chat", "study", "networking"];

router.post("/session/start", async (req, res, next) => {
  try {
    const { roomId, peer2Id, mood } = req.body;

    if (!roomId || !mood) {
      return res.status(400).json({ success: false, message: "roomId and mood are required" });
    }
    if (!VALID_MOODS.includes(mood)) {
      return res.status(400).json({ success: false, message: `mood must be one of: ${VALID_MOODS.join(", ")}` });
    }

    const { rows } = await query(
      `INSERT INTO sessions (user1_id, user2_id, room_id, mood)
       VALUES ($1, $2, $3, $4)
       RETURNING id, room_id, mood, started_at`,
      [req.user.id, peer2Id || null, roomId, mood]
    );

    res.status(201).json({ success: true, session: rows[0] });
  } catch (err) {
    next(err);
  }
});

router.patch("/session/:sessionId/end", async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { status = "ended", isSaved = false } = req.body;

    if (!["ended", "skipped"].includes(status)) {
      return res.status(400).json({ success: false, message: "status must be ended or skipped" });
    }

    const { rows } = await query(
      `UPDATE sessions
       SET ended_at   = NOW(),
           duration_s = EXTRACT(EPOCH FROM (NOW() - started_at))::INT,
           status     = $1,
           is_saved   = $2
       WHERE id = $3
         AND (user1_id = $4 OR user2_id = $4)
         AND status = 'active'
       RETURNING id, duration_s, status, is_saved`,
      [status, isSaved, sessionId, req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Active session not found" });
    }

    res.json({ success: true, session: rows[0] });
  } catch (err) {
    next(err);
  }
});

// GET /api/video/history
router.get("/history", async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT s.id, s.room_id, s.mood, s.started_at, s.duration_s, s.status, s.is_saved,
              u.username AS peer_username
       FROM   sessions s
       LEFT   JOIN users u
              ON u.id = CASE WHEN s.user1_id = $1 THEN s.user2_id ELSE s.user1_id END
       WHERE  (s.user1_id = $1 OR s.user2_id = $1)
       ORDER  BY s.started_at DESC
       LIMIT  20`,
      [req.user.id]
    );

    res.json({ success: true, sessions: rows });
  } catch (err) {
    next(err);
  }
});

router.post("/report", async (req, res, next) => {
  try {
    const { reportedId, sessionId, reason } = req.body;

    if (!reportedId || !reason) {
      return res.status(400).json({ success: false, message: "reportedId and reason are required" });
    }
    if (reportedId === req.user.id) {
      return res.status(400).json({ success: false, message: "You cannot report yourself" });
    }

    await query(
      "INSERT INTO reports (reporter_id, reported_id, session_id, reason) VALUES ($1, $2, $3, $4)",
      [req.user.id, reportedId, sessionId || null, reason]
    );

    await query(
      "UPDATE users SET reputation_score = GREATEST(0, reputation_score - 5) WHERE id = $1",
      [reportedId]
    );

    res.json({ success: true, message: "Report submitted" });
  } catch (err) {
    next(err);
  }
});

export default router;