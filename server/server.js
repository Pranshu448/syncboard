require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const messageRoutes = require("./routes/messageRoutes");
const http = require("http");
const { Server } = require("socket.io");
const socketAuth = require("./middleware/socketAuth");
const Chat = require("./models/Chat");
const Message = require("./models/Message");
const chatRoutes = require("./routes/chatRoutes");
const userRoutes = require("./routes/userRoutes");
const teamRoutes = require("./routes/teamRoutes");
const socket = require("./socket");
const User = require("./models/User");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
}));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  },
  // Optimize for real-time whiteboard performance
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  maxHttpBufferSize: 1e6, // 1MB max message size
  // Enable compression for better performance
  perMessageDeflate: {
    threshold: 1024, // Compress messages larger than 1KB
  },
  // Connection state recovery for reconnections
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: true,
  },
});

socket.init(io);
io.use(socketAuth);

app.use(express.json());
connectDB();

// Good for error handling
app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

app.get("/", (req, res) => {
  res.send("server is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/users", userRoutes);
app.use("/api/teams", teamRoutes);

// Store online users and room states
const onlineUsers = new Set();

/* ==================== WHITEBOARD STATE MANAGEMENT ==================== */

// Store active whiteboard rooms and their participants
const whiteboardRooms = new Map();

// Room state structure:
// {
//   roomId: {
//     participants: Set<socketId>,
//     strokes: [], // Optional: store recent strokes for late joiners
//     lastActivity: timestamp
//   }
// }

/* ==================== HELPER FUNCTIONS ==================== */

const getRoomState = (roomId) => {
  if (!whiteboardRooms.has(roomId)) {
    whiteboardRooms.set(roomId, {
      participants: new Set(),
      strokes: [],
      lastActivity: Date.now(),
    });
  }
  return whiteboardRooms.get(roomId);
};

const cleanupInactiveRooms = () => {
  const now = Date.now();
  const INACTIVE_TIMEOUT = 3600000; // 1 hour

  for (const [roomId, room] of whiteboardRooms.entries()) {
    if (room.participants.size === 0 && now - room.lastActivity > INACTIVE_TIMEOUT) {
      whiteboardRooms.delete(roomId);
      console.log(`🧹 Cleaned up inactive room: ${roomId}`);
    }
  }
};

// Run cleanup every 30 minutes
setInterval(cleanupInactiveRooms, 1800000);

io.on("connection", async (socket) => {
  const userId = socket.userId;

  if (!userId) {
    console.log("Socket connected without userId");
    return;
  }

  console.log("User connected:", userId, "socket ID:", socket.id);

  try {
    await User.findByIdAndUpdate(userId, { isOnline: true });
  } catch (err) {
    console.error("Failed to mark online:", err);
  }

  // Personal room for private emits
  socket.join(userId);
  socket.broadcast.emit("user_online", userId);

  /* ==================== WHITEBOARD SOCKET EVENTS ==================== */

  // Whiteboard Join Room - Enhanced with state tracking
  socket.on("join_whiteboard", (roomId) => {
    if (!roomId || typeof roomId !== "string") {
      console.log("❌ Invalid roomId for whiteboard join");
      socket.emit("error", { message: "Invalid room ID" });
      return;
    }

    // Join the Socket.IO room
    socket.join(roomId);

    // Track participant in room state
    const roomState = getRoomState(roomId);
    roomState.participants.add(socket.id);
    roomState.lastActivity = Date.now();

    console.log(
      `✅ User ${userId} joined whiteboard room: ${roomId} (${roomState.participants.size} participants)`
    );

    // Send current participant count to the joining user
    socket.emit("room_joined", {
      roomId,
      participantCount: roomState.participants.size,
      // Optional: send recent strokes for synchronization
      recentStrokes: roomState.strokes.slice(-50), // Last 50 strokes
    });

    // Notify others in the room
    socket.to(roomId).emit("user_joined_whiteboard", {
      userId,
      roomId,
      participantCount: roomState.participants.size,
    });
  });

  // Handle drawing events - Optimized for multiple users
  socket.on("draw_event", (data) => {
    if (!data || !data.roomId || !data.points) {
      console.log("❌ Invalid draw_event data");
      return;
    }

    // Validate points array
    if (!Array.isArray(data.points) || data.points.length < 2) {
      return;
    }

    // Validate roomId
    if (typeof data.roomId !== "string") {
      return;
    }

    const roomState = getRoomState(data.roomId);
    roomState.lastActivity = Date.now();

    // Create optimized draw data with minimal payload
    const drawData = {
      points: data.points,
      strokeStyle: data.strokeStyle || "#2d3436",
      lineWidth: data.lineWidth || 3,
      senderId: socket.id,
      timestamp: Date.now(),
    };

    // Store stroke in room history (limit to last 100 strokes)
    roomState.strokes.push(drawData);
    if (roomState.strokes.length > 100) {
      roomState.strokes.shift();
    }

    // Use volatile emit for real-time drawing to prevent buffering
    // This allows dropping packets if client is slow, preventing lag buildup
    socket.volatile.to(data.roomId).emit("draw_event", drawData);
  });

  // Handle clear canvas events
  socket.on("clear_event", (data) => {
    if (!data || !data.roomId) {
      console.log("❌ Invalid clear_event data");
      return;
    }

    if (typeof data.roomId !== "string") {
      return;
    }

    const roomState = getRoomState(data.roomId);
    roomState.lastActivity = Date.now();

    // Clear stored strokes
    roomState.strokes = [];

    console.log(`🗑️ User ${userId} cleared whiteboard room: ${data.roomId}`);

    // Broadcast clear event to all clients in the room (including sender for consistency)
    io.to(data.roomId).emit("clear_event", {
      roomId: data.roomId,
      senderId: socket.id,
      timestamp: Date.now(),
    });
  });

  // Leave whiteboard room
  socket.on("leave_whiteboard", (roomId) => {
    if (!roomId || typeof roomId !== "string") {
      return;
    }

    socket.leave(roomId);

    const roomState = whiteboardRooms.get(roomId);
    if (roomState) {
      roomState.participants.delete(socket.id);
      roomState.lastActivity = Date.now();

      console.log(
        `👋 User ${userId} left whiteboard room: ${roomId} (${roomState.participants.size} remaining)`
      );

      // Notify others
      socket.to(roomId).emit("user_left_whiteboard", {
        userId,
        roomId,
        participantCount: roomState.participants.size,
      });

      // Clean up empty rooms immediately
      if (roomState.participants.size === 0) {
        whiteboardRooms.delete(roomId);
        console.log(`🧹 Removed empty room: ${roomId}`);
      }
    }
  });

  /* ==================== CHAT MESSAGES ==================== */

  /**
   * Deliver pending messages to newly connected user
   */
  try {
    const pendingMessages = await Message.find({
      status: "sent",
    })
      .populate("chat")
      .populate("sender");

    for (const msg of pendingMessages) {
      const isParticipant = msg.chat.participants.some(
        (id) => id.toString() === userId
      );

      if (isParticipant && msg.sender._id.toString() !== userId) {
        msg.status = "delivered";
        await msg.save();

        io.to(msg.sender._id.toString()).emit("message_status_update", {
          messageId: msg._id,
          status: "delivered",
        });
      }
    }
  } catch (err) {
    console.error("Deliver pending messages error:", err);
  }

  /**
   * Handle sending a chat message
   */
  socket.on("send_message", async ({ chatId, content }) => {
    try {
      const senderId = String(userId);
      const chat = await Chat.findById(chatId);
      if (!chat) return;

      const message = await Message.create({
        chat: chatId,
        sender: senderId,
        content,
        status: "sent",
      });

      // Update unread counts - ONLY for receivers (not sender)
      chat.participants.forEach((uid) => {
        const pId = uid.toString();
        if (pId !== senderId) {
          const prev = chat.unreadCount.get(pId) || 0;
          chat.unreadCount.set(pId, prev + 1);
        }
      });

      chat.lastMessage = message._id;
      chat.markModified('unreadCount');
      await chat.save();

      // Emit to other participants
      chat.participants.forEach((uid) => {
        if (uid.toString() !== senderId) {
          io.to(uid.toString()).emit("receive_message", {
            _id: message._id,
            chatId,
            sender: senderId,
            content,
            createdAt: message.createdAt,
          });
        }
      });
    } catch (err) {
      console.error("Socket send_message error:", err);
    }
  });

  /* ==================== DISCONNECT ==================== */

  /**
   * Handle user disconnection
   * Enhanced to clean up whiteboard rooms
   */
  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id);

    // Clean up from all whiteboard rooms
    for (const [roomId, roomState] of whiteboardRooms.entries()) {
      if (roomState.participants.has(socket.id)) {
        roomState.participants.delete(socket.id);

        // Notify others in the room
        socket.to(roomId).emit("user_left_whiteboard", {
          userId,
          roomId,
          participantCount: roomState.participants.size,
        });

        // Remove empty rooms
        if (roomState.participants.size === 0) {
          whiteboardRooms.delete(roomId);
          console.log(`🧹 Removed empty room on disconnect: ${roomId}`);
        }
      }
    }

    try {
      await User.findByIdAndUpdate(userId, { isOnline: false });
      socket.broadcast.emit("user_offline", userId);
    } catch (err) {
      console.error("Failed to mark offline:", err);
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is listening on Port ${PORT}`);
});