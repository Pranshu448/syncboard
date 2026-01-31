require("dotenv").config({ path: __dirname + "/.env" });

const express = require("express");
const path = require("path");
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
const sessionRoutes = require("./routes/sessionRoutes");
const socket = require("./socket");
const User = require("./models/User");
const cors = require("cors");

const app = express();

// CORS Configuration - Production Ready & Fixed
const getAllowedOrigins = () => {
  const defaultOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "https://syncboard-sigma.vercel.app",
    "https://syncboard-jlrc.onrender.com"
  ];

  if (process.env.ALLOWED_ORIGINS) {
    const envOrigins = process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
    return [...defaultOrigins, ...envOrigins];
  }

  return defaultOrigins;
};

const allowedOrigins = getAllowedOrigins();

// Shared CORS Origin Check Function
const checkOrigin = (origin, callback) => {
  // Allow requests with no origin (mobile apps, Postman, curl, server-to-server)
  if (!origin) return callback(null, true);

  // Check exact matches
  if (allowedOrigins.includes(origin)) {
    return callback(null, true);
  }

  // Allow Vercel preview deployments (syncboard-sigma-*.vercel.app)
  if (origin.match(/^https:\/\/syncboard-sigma.*\.vercel\.app$/)) {
    return callback(null, true);
  }

  console.log("❌ Blocked by CORS:", origin);
  return callback(null, false);
};

// Enhanced CORS configuration for Express
const corsOptions = {
  origin: checkOrigin,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin"
  ],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  maxAge: 600, // Cache preflight requests for 10 minutes
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS middleware FIRST - before any other middleware
// The cors() middleware automatically handles OPTIONS preflight requests
app.use(cors(corsOptions));

// Parse JSON bodies - AFTER CORS
app.use(express.json());

// Serve static files
app.use("/public", express.static(path.join(__dirname, "public")));

const server = http.createServer(app);

// Socket.IO with matching CORS configuration
const io = new Server(server, {
  cors: {
    origin: checkOrigin,
    credentials: true,
    methods: ["GET", "POST"],
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

// Connect to database
connectDB();

// Request logging middleware (for debugging)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

// Health check endpoints
app.get("/", (req, res) => {
  res.json({
    status: "running",
    message: "SyncBoard Server",
    timestamp: new Date().toISOString()
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/users", userRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/sessions", sessionRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    path: req.url,
    method: req.method
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.message);

  // CORS errors
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      error: "CORS Error",
      message: "Origin not allowed"
    });
  }

  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

const { whiteboardRooms, getRoomState } = require("./utils/whiteboardState");

// Track active socket connections per user (Map: userId -> Set of socket IDs)
const userSockets = new Map();

/* ==================== HELPER FUNCTIONS ==================== */

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

  // Track this socket connection for the user
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  userSockets.get(userId).add(socket.id);

  // Mark user as online (only if this is their first connection)
  const isFirstConnection = userSockets.get(userId).size === 1;

  try {
    if (isFirstConnection) {
      await User.findByIdAndUpdate(userId, { isOnline: true });
      socket.broadcast.emit("user_online", userId);
      console.log(`✅ User ${userId} is now ONLINE (${userSockets.get(userId).size} connection(s))`);
    } else {
      console.log(`🔄 User ${userId} added connection (${userSockets.get(userId).size} total)`);
    }
  } catch (err) {
    console.error("Failed to mark online:", err);
  }

  // Personal room for private emits
  socket.join(userId);

  /* ==================== WHITEBOARD SOCKET EVENTS ==================== */

  // Helper: Generate random color
  const getRandomColor = () => {
    const colors = [
      "#ef4444", "#f97316", "#f59e0b", "#84cc16",
      "#10b981", "#06b6d4", "#3b82f6", "#6366f1",
      "#8b5cf6", "#d946ef", "#f43f5e"
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Whiteboard Join Room - Enhanced with state tracking
  socket.on("join_whiteboard", async (roomId) => {
    if (!roomId || typeof roomId !== "string") {
      console.log("❌ Invalid roomId for whiteboard join");
      socket.emit("error", { message: "Invalid room ID" });
      return;
    }

    // Join the Socket.IO room
    socket.join(roomId);

    // Track participant in room state
    const roomState = getRoomState(roomId);

    // Get user details
    let username = "User";
    let profilePicture = "";
    try {
      const user = await User.findById(userId);
      if (user) {
        username = user.username;
        profilePicture = user.profilePicture;
      }
    } catch (err) {
      console.error("Error fetching user for whiteboard:", err);
    }

    const userData = {
      socketId: socket.id,
      userId,
      username,
      profilePicture,
      color: getRandomColor(),
      cursor: { x: 0, y: 0 }
    };

    roomState.participants.set(socket.id, userData);
    roomState.lastActivity = Date.now();

    console.log(
      `✅ User ${userId} (${username}) joined whiteboard room: ${roomId} (${roomState.participants.size} participants)`
    );

    // Convert Map to Array for sending
    const usersList = Array.from(roomState.participants.values());

    // Send current state to the joining user
    socket.emit("room_joined", {
      roomId,
      participantCount: roomState.participants.size,
      users: usersList,
      recentStrokes: roomState.strokes.slice(-50),
    });

    // Notify others in the room
    socket.to(roomId).emit("user_joined_whiteboard", {
      ...userData,
      participantCount: roomState.participants.size,
    });
  });

  // Handle cursor movement
  socket.on("cursor_move", (data) => {
    if (!data || !data.roomId || !data.x || !data.y) return;

    const roomState = whiteboardRooms.get(data.roomId);
    if (roomState && roomState.participants.has(socket.id)) {
      const participant = roomState.participants.get(socket.id);
      participant.cursor = { x: data.x, y: data.y };

      // Broadcast to others (volatile for performance)
      socket.volatile.to(data.roomId).emit("user_cursor_move", {
        userId,
        socketId: socket.id,
        x: data.x,
        y: data.y
      });
    }
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
      id: data.id, // Pass through the stroke ID
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

  // Handle erase stroke event
  socket.on("erase_stroke", (data) => {
    if (!data || !data.roomId || !data.strokeId) return;

    const roomState = getRoomState(data.roomId);
    roomState.lastActivity = Date.now();

    // Remove stroke from history
    roomState.strokes = roomState.strokes.filter(s => s.id !== data.strokeId);

    // Broadcast erase event
    socket.to(data.roomId).emit("erase_stroke", {
      roomId: data.roomId,
      strokeId: data.strokeId,
      senderId: socket.id,
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
        socketId: socket.id,
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
   * Enhanced to mark as delivered when recipient is online
   */
  socket.on("send_message", async ({ chatId, content }) => {
    try {
      const senderId = String(userId);
      const chat = await Chat.findById(chatId);
      if (!chat) return;

      // Check if any recipient is online
      const recipients = chat.participants.filter(uid => uid.toString() !== senderId);
      const hasOnlineRecipient = recipients.some(uid => userSockets.has(uid.toString()));

      // Create message with appropriate initial status
      const message = await Message.create({
        chat: chatId,
        sender: senderId,
        content,
        status: hasOnlineRecipient ? "delivered" : "sent",
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
            status: message.status,
            createdAt: message.createdAt,
          });
        }
      });

      // If marked as delivered, notify sender
      if (hasOnlineRecipient) {
        socket.emit("message_status_update", {
          messageIds: [message._id],
          chatId,
          status: "delivered"
        });
      }
    } catch (err) {
      console.error("Socket send_message error:", err);
    }
  });

  /**
   * Mark all messages in a chat as read when user opens it
   */
  socket.on("mark_chat_as_read", async ({ chatId }) => {
    try {
      // Find all unread messages in this chat that were sent by others
      const messagesToMarkRead = await Message.find({
        chat: chatId,
        sender: { $ne: userId },
        status: { $in: ["sent", "delivered"] }
      });

      if (messagesToMarkRead.length === 0) return;

      // Mark them as read
      await Message.updateMany(
        {
          chat: chatId,
          sender: { $ne: userId },
          status: { $in: ["sent", "delivered"] }
        },
        { status: "read" }
      );

      console.log(`✓✓ User ${userId} marked ${messagesToMarkRead.length} messages as read in chat ${chatId}`);

      // Notify each sender that their message(s) were read
      const senderIds = new Set();
      messagesToMarkRead.forEach(msg => {
        senderIds.add(msg.sender.toString());
      });

      senderIds.forEach(senderId => {
        // Get all message IDs from this sender that were just marked read
        const msgIds = messagesToMarkRead
          .filter(m => m.sender.toString() === senderId)
          .map(m => m._id);

        io.to(senderId).emit("message_status_update", {
          messageIds: msgIds,
          chatId,
          status: "read"
        });
      });
    } catch (err) {
      console.error("Failed to mark chat as read:", err);
    }
  });

  /* ==================== DISCONNECT ==================== */

  /**
   * Handle user disconnection
   * Enhanced with multi-session tracking and grace period
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
          socketId: socket.id,
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

    // Remove this socket from user's active connections
    const userSocketSet = userSockets.get(userId);
    if (userSocketSet) {
      userSocketSet.delete(socket.id);

      console.log(`🔌 Socket ${socket.id} disconnected. User ${userId} has ${userSocketSet.size} remaining connection(s)`);

      // If user has no more active connections, mark them offline after grace period  
      if (userSocketSet.size === 0) {
        // Clean up the empty set
        userSockets.delete(userId);

        // Grace period: wait 2 seconds before marking offline (handles quick reconnects)
        setTimeout(async () => {
          // Check again if user reconnected during grace period
          if (!userSockets.has(userId)) {
            try {
              await User.findByIdAndUpdate(userId, { isOnline: false });
              io.emit("user_offline", userId);
              console.log(`❌ User ${userId} is now OFFLINE (all connections closed)`);
            } catch (err) {
              console.error("Failed to mark offline:", err);
            }
          } else {
            console.log(`✅ User ${userId} reconnected during grace period, staying online`);
          }
        }, 2000);
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});