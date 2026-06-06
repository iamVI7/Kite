import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors());
app.use(express.json());

const rooms = new Map();
const ROOM_TTL_MS = 30 * 60 * 1000;

function createRoom(roomId) {
  const room = {
    id: roomId,
    peers: [],
    createdAt: Date.now(),
    expiresAt: Date.now() + ROOM_TTL_MS,
  };
  rooms.set(roomId, room);
  setTimeout(() => {
    if (rooms.has(roomId)) {
      const r = rooms.get(roomId);
      r.peers.forEach((socketId) => {
        const s = io.sockets.sockets.get(socketId);
        if (s) s.disconnect(true);
      });
      rooms.delete(roomId);
      console.log(`[room] ${roomId} expired`);
    }
  }, ROOM_TTL_MS);
  return room;
}

app.get("/health", (_, res) => res.json({ status: "ok" }));

app.post("/api/rooms", (req, res) => {
  const roomId = uuidv4().slice(0, 8).toUpperCase();
  const room = createRoom(roomId);
  res.json({ roomId: room.id, expiresAt: room.expiresAt });
});

app.get("/api/rooms/:roomId", (req, res) => {
  const room = rooms.get(req.params.roomId.toUpperCase());
  if (!room) return res.status(404).json({ error: "Room not found" });
  res.json({ roomId: room.id, peerCount: room.peers.length, expiresAt: room.expiresAt });
});

io.on("connection", (socket) => {
  console.log(`[socket] connected: ${socket.id}`);

  socket.on("join-room", ({ roomId }) => {
    const id = roomId?.toUpperCase();
    let room = rooms.get(id);

    if (!room) room = createRoom(id);

    // Allow rejoin: if this socket is already in the room, skip the full check
    const alreadyIn = room.peers.includes(socket.id);
    if (!alreadyIn && room.peers.length >= 2) {
      socket.emit("room-full");
      return;
    }

    if (!alreadyIn) {
      socket.join(id);
      socket.data.roomId = id;
      socket.data.intentionalLeave = false;
      socket.data.role = room.peers.length === 0 ? "host" : "guest";
      room.peers.push(socket.id);
    }

    socket.emit("room-joined", {
      roomId: id,
      role: socket.data.role,
      peerCount: room.peers.length,
      expiresAt: room.expiresAt,
    });

    // Only notify the other peer if this is a fresh join (not a re-join)
    if (!alreadyIn) {
      socket.to(id).emit("peer-joined", { peerId: socket.id });
    }

    console.log(`[room] ${id} — ${socket.id} joined as ${socket.data.role} (${room.peers.length}/2)`);
  });

  // WebRTC signaling relay
  socket.on("offer", ({ roomId, offer }) => {
    socket.to(roomId.toUpperCase()).emit("offer", { offer, from: socket.id });
  });

  socket.on("answer", ({ roomId, answer }) => {
    socket.to(roomId.toUpperCase()).emit("answer", { answer, from: socket.id });
  });

  socket.on("ice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId.toUpperCase()).emit("ice-candidate", { candidate, from: socket.id });
  });

  // Intentional leave — cleanly remove peer and notify the other side
  socket.on("peer-leave-intentional", ({ roomId }) => {
    const id = roomId?.toUpperCase();
    socket.data.intentionalLeave = true;

    // Remove from room immediately so the slot is freed
    if (rooms.has(id)) {
      const room = rooms.get(id);
      room.peers = room.peers.filter((pid) => pid !== socket.id);
      console.log(`[room] ${id} — ${socket.id} left intentionally (${room.peers.length}/2)`);
      if (room.peers.length === 0) {
        rooms.delete(id);
        console.log(`[room] ${id} deleted (empty)`);
      }
    }

    // Tell the remaining peer it was intentional — they should NOT reconnect
    socket.to(id).emit("peer-left-intentional");
  });

  // Cleanup on socket disconnect
  socket.on("disconnect", () => {
    const roomId = socket.data.roomId;
    if (!roomId || !rooms.has(roomId)) return;

    const room = rooms.get(roomId);

    // If already removed by intentional leave, skip
    if (!room.peers.includes(socket.id)) return;

    room.peers = room.peers.filter((id) => id !== socket.id);
    console.log(`[room] ${roomId} — ${socket.id} disconnected unexpectedly (${room.peers.length}/2)`);

    // Only trigger reconnect flow on the other side if this was NOT intentional
    if (!socket.data.intentionalLeave) {
      socket.to(roomId).emit("peer-left");
    }

    if (room.peers.length === 0) {
      rooms.delete(roomId);
      console.log(`[room] ${roomId} deleted (empty)`);
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Kite signaling server on :${PORT}`);
});