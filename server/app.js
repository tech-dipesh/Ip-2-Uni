import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { connectDB } from "./db.js";
import authRoutes    from "./routes/auth.routes.js";
import videoRoutes   from "./routes/video.routes.js";
import profileRoutes from "./routes/profile.routes.js";

const app        = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL || "http://localhost:5173", methods: ["GET", "POST"], credentials: true },
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/auth",    authRoutes);
app.use("/api/video",   videoRoutes);
app.use("/api/profile", profileRoutes);

app.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

app.use((_req, res) => res.status(404).json({ success: false, message: "Route not found" }));

app.use((err, _req, res, _next) => {
  console.error("[ERROR]", err.stack || err.message);
  const status  = err.statusCode || 500;
  const message = status === 500 && process.env.NODE_ENV === "production"
    ? "Internal server error" : err.message || "Something went wrong";
  res.status(status).json({ success: false, message });
});


const VALID_MOODS = ["casual_chat", "study", "networking"];

const ALL_QUEUES  = [...VALID_MOODS, "any"];
const moodQueues  = new Map(ALL_QUEUES.map((m) => [m, new Set()]));
const activeRooms = new Map();

const generateRoomId = () =>
  `room_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const emitQueueCounts = () => {
  const counts = {};
  for (const mood of VALID_MOODS) counts[mood] = moodQueues.get(mood).size;
  io.emit("queue_counts", counts);
};

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.userId = decoded.userId;
    } catch { /* treat as anonymous */ }
  }
  socket.isAnonymous = !socket.userId;
  next();
});

io.on("connection", (socket) => {

  emitQueueCounts();

  socket.on("find_match", ({ mood } = {}) => {

    const queueKey = VALID_MOODS.includes(mood) ? mood : "any";
    const queue    = moodQueues.get(queueKey);

    if (queue.has(socket.id)) return;

    const candidateQueues =
      queueKey === "any"
        ? [moodQueues.get("any")]
        : [queue, moodQueues.get("any")];

    let peerId = null;
    let usedQueue = null;
    for (const q of candidateQueues) {
      if (q.size > 0) {
        [peerId] = q;
        usedQueue = q;
        break;
      }
    }

    if (peerId) {
      usedQueue.delete(peerId);

      const roomId = generateRoomId();
      activeRooms.set(roomId, { peer1: peerId, peer2: socket.id });

      socket.join(roomId);
      io.sockets.sockets.get(peerId)?.join(roomId);

      // peer1 is the WebRTC offer initiator
      io.to(peerId).emit("match_found", { roomId, initiator: true });
      socket.emit("match_found",         { roomId, initiator: false });
    } else {
      queue.add(socket.id);
      socket.emit("waiting");
    }

    emitQueueCounts();
  });


  socket.on("signal", ({ roomId, signal }) => {
    socket.to(roomId).emit("signal", { roomId, signal, from: socket.id });
  });

  socket.on("chat_message", ({ roomId, text, time }) => {
    socket.to(roomId).emit("chat_message", { text, time });
  });

  socket.on("skip", ({ roomId, mood }) => {
    leaveRoom(socket, roomId);
    const queueKey = VALID_MOODS.includes(mood) ? mood : "any";
    moodQueues.get(queueKey).add(socket.id);
    socket.emit("waiting");
    emitQueueCounts();
  });

  socket.on("cancel_match", ({ mood } = {}) => {
    for (const queue of moodQueues.values()) queue.delete(socket.id);
    emitQueueCounts();
  });

  socket.on("leave_room", ({ roomId }) => leaveRoom(socket, roomId));

  socket.on("disconnect", (reason) => {
    console.log(`[Socket] Disconnected: ${socket.id} (${reason})`);
    for (const queue of moodQueues.values()) queue.delete(socket.id);
    for (const [roomId, peers] of activeRooms.entries()) {
      if (peers.peer1 === socket.id || peers.peer2 === socket.id) {
        leaveRoom(socket, roomId);
        break;
      }
    }
    emitQueueCounts();
  });

  socket.on("error", (err) => console.error(`[Socket Error] ${socket.id}:`, err.message));
});

function leaveRoom(socket, roomId) {
  if (!activeRooms.has(roomId)) return;
  socket.to(roomId).emit("peer_left", { socketId: socket.id });
  socket.leave(roomId);
  activeRooms.delete(roomId);
}

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      console.log(`Server Listening on port ${PORT}`);
    });  } catch (err) {
  console.error("[FATAL]", err.message);
    process.exit(1);
  }
};

startServer();
export { io };
