import { createServer, IncomingMessage, ServerResponse } from "http";
import { Server } from "socket.io";

const ALLOWED_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";
const PORT = process.env.PORT || 3001;

const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
  // Set CORS headers for HTTP requests (like /emit)
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }));
    return;
  }

  // Internal emit endpoint for Next.js API routes / server actions to trigger socket broadcasts
  if (req.url === "/emit" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const { room, event, data } = JSON.parse(body);
        if (!event) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Missing 'event' in request body" }));
          return;
        }

        if (room) {
          io.to(room).emit(event, data);
        } else {
          io.emit(event, data);
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, event, room }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON or broadcast failure" }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Join a specific channel or conversation room
  socket.on("join-room", (roomId: string) => {
    if (roomId) {
      socket.join(roomId);
      console.log(`[Socket] ${socket.id} joined room: ${roomId}`);
    }
  });

  // Leave a specific room
  socket.on("leave-room", (roomId: string) => {
    if (roomId) {
      socket.leave(roomId);
      console.log(`[Socket] ${socket.id} left room: ${roomId}`);
    }
  });

  socket.on("disconnect", () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`[Socket Server] Running on http://localhost:${PORT}`);
});