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
    origin: '*',
  },
  // Add these options for better reliability
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
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

  /* ==================== WHITEBOARD ==================== */

  // Whiteboard Join Room
  socket.on("join_whiteboard", (roomId) => {
    socket.join(roomId);
  });
  
  socket.on("draw_event", (data) => {
    socket.to(data.roomId).emit("draw_event", data);
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
   */
  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id);
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