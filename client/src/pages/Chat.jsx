import { useEffect, useState, useRef } from "react";
import api from "../utils/axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

export default function Chat() {
    const { user } = useAuth();
    const  socket = useSocket();
    const location = useLocation();
    const { theme } = useTheme();
    const isDark = theme === "dark";
  
    const myId = String(user?._id || "");
  
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const messagesEndRef = useRef(null);
  
    /* ================= LOAD CHAT LIST ================= */
    useEffect(() => {
      if (!user) return;
  
      const loadChats = async () => {
        const res = await api.get("/chats/my-chats");
        setChats(res.data);
      };
  
      loadChats();
    }, [user]);

    // When navigated from Teams with a specific chat id, select that chat once list is loaded
    useEffect(() => {
      const state = location.state;
      if (!state || !state.openChatId || chats.length === 0) return;

      const target = chats.find((c) => String(c._id) === String(state.openChatId));
      if (target) {
        setActiveChat(target);
      }
    }, [location.state, chats]);
  
    /* ================= LOAD MESSAGES ================= */
    useEffect(() => {
      if (!activeChat) return;
  
      setMessages([]);
  
      const loadMessages = async () => {
        const res = await api.get(`/messages/chat/${activeChat._id}`);
        setMessages(res.data);
      };
  
      loadMessages();
    }, [activeChat?._id]);
  
    /* ================= AUTO-SCROLL TO BOTTOM ON NEW MESSAGES ================= */
    useEffect(() => {
      if (!messagesEndRef.current) return;
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }, [messages, activeChat?._id]);
  
    /* ================= RECEIVE MESSAGE ================= */
    useEffect(() => {
      if (!socket) return;
    
      const handleReceive = (msg) => {
        // 1. Update messages if this is the active chat
        if (String(msg.chatId) === String(activeChat?._id)) {
          setMessages((prev) => [...prev, msg]);
        }
    
        // 2. Update the Sidebar (Chats List) - increment unread count for receiver
        // MongoDB Map serializes to an object, so we need to handle both formats
        setChats((prev) =>
          prev.map((chat) => {
            if (String(chat._id) === String(msg.chatId)) {
              // Handle MongoDB Map serialization: unreadCount can be Map or object
              const unreadCountObj = chat.unreadCount instanceof Map 
                ? Object.fromEntries(chat.unreadCount) 
                : (chat.unreadCount || {});
              
              const currentCount = Number(unreadCountObj[myId]) || 0;
              
              // Only increment if I am NOT currently looking at this chat
              // (If viewing chat, badge stays 0 - database is source of truth)
              const newCount = String(msg.chatId) === String(activeChat?._id) ? 0 : currentCount + 1;
              
              return {
                ...chat,
                unreadCount: {
                  ...unreadCountObj,
                  [myId]: newCount,
                },
                lastMessage: msg,
              };
            }
            return chat;
          })
        );
      };
  
      socket.on("receive_message", handleReceive);
      return () => socket.off("receive_message", handleReceive);
    }, [socket, activeChat?._id, myId]);

    /* ================= ONLINE / OFFLINE PRESENCE ================= */
    useEffect(() => {
      if (!socket) return;

      const handleUserOnline = (userId) => {
        setChats((prev) =>
          prev.map((chat) => ({
            ...chat,
            participants: chat.participants?.map((p) =>
              String(p._id) === String(userId) ? { ...p, isOnline: true } : p
            ),
          }))
        );
      };

      const handleUserOffline = (userId) => {
        setChats((prev) =>
          prev.map((chat) => ({
            ...chat,
            participants: chat.participants?.map((p) =>
              String(p._id) === String(userId) ? { ...p, isOnline: false } : p
            ),
          }))
        );
      };

      socket.on("user_online", handleUserOnline);
      socket.on("user_offline", handleUserOffline);

      return () => {
        socket.off("user_online", handleUserOnline);
        socket.off("user_offline", handleUserOffline);
      };
    }, [socket]);

    /* ================= CHAT READ EVENT (Sender receives when receiver opens chat) ================= */
    useEffect(() => {
      if (!socket) return;

      const handleChatRead = ({ chatId, readerId }) => {
        // ✅ This runs on SENDER side when receiver opens the chat
        // Clear sender's unreadCount for this chat (receiver has seen messages)
        setChats((prev) =>
          prev.map((chat) => {
            if (String(chat._id) === String(chatId)) {
              // Handle MongoDB Map serialization
              const unreadCountObj = chat.unreadCount instanceof Map 
                ? Object.fromEntries(chat.unreadCount) 
                : (chat.unreadCount || {});
              
              return {
                ...chat,
                unreadCount: {
                  ...unreadCountObj,
                  [myId]: 0, // ✅ Clear MY badge (I'm the sender, receiver has read)
                },
              };
            }
            return chat;
          })
        );
      };

      socket.on("chat_read", handleChatRead);
      return () => socket.off("chat_read", handleChatRead);
    }, [socket, myId]);
      
  
    /* ================= SEND MESSAGE ================= */
    // ✅ WHY SEND NOW WORKS:
    // - Explicit type="button" prevents any default form submission behavior
    // - Enter key handler allows submitting via keyboard
    // - Socket check ensures we don't try to emit when socket is null
    // - Message is captured before clearing state
    const sendMessage = (e) => {
      // Prevent default form behavior if triggered from Enter key
      if (e) e.preventDefault();
      
      // Guard checks: socket, activeChat, and non-empty message required
      if (!socket) {
        console.warn("Socket not available");
        return;
      }
      if (!activeChat) {
        console.warn("No active chat selected");
        return;
      }
      const messageContent = message.trim();
      if (!messageContent) return;
  
      // Emit to backend via socket
      socket.emit("send_message", {
        chatId: activeChat._id,
        content: messageContent,
      });
  
      // Optimistic UI update - message appears immediately
      setMessages((prev) => [
        ...prev,
        {
          _id: `temp-${Date.now()}`,
          content: messageContent,
          sender: myId,
          chatId: activeChat._id,
          createdAt: new Date(),
        },
      ]);
  
      // Clear input field
      setMessage("");
    };
  
    /* ================= CHAT CLICK HANDLER ================= */
    const openChat = async (chat) => {
      setActiveChat(chat);
  
      // Handle MongoDB Map serialization to get current unread count
      const unreadCountObj = chat.unreadCount instanceof Map 
        ? Object.fromEntries(chat.unreadCount) 
        : (chat.unreadCount || {});
      const currentUnread = Number(unreadCountObj[myId]) || 0;
  
      // (1) CLEAR MY BADGE IMMEDIATELY (LOCAL) - optimistic update for instant UI feedback
      setChats((prev) =>
        prev.map((c) =>
          String(c._id) === String(chat._id)
            ? {
                ...c,
                unreadCount: {
                  ...unreadCountObj,
                  [myId]: 0,
                },
              }
            : c
        )
      );
  
      // (2) MARK AS READ (BACKEND + SOCKET → SENDER) - only if there were unread messages
      // ✅ WHY BADGE STAYS CLEARED AFTER REFRESH:
      // - This API call updates the database: chat.unreadCount[myId] = 0
      // - Database is the source of truth, not socket events
      // - On page refresh, GET /chats/my-chats returns chats from database
      // - Since database has unreadCount[myId] = 0, badge remains cleared
      // - Socket events are just notifications, they don't replace database state
      if (currentUnread > 0) {
        try {
          await api.post(`/chats/read/${chat._id}`);
        } catch (err) {
          console.error("Failed to mark chat as read:", err);
          // On error, reload chats from server to get accurate state
          const res = await api.get("/chats/my-chats");
          setChats(res.data);
        }
      }
    };
  
  
  
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        backgroundColor: isDark ? "#020617" : "#f3f4f6",
        color: isDark ? "#e5e7eb" : "#0f172a",
      }}
    >
      {/* ================= CHAT LIST ================= */}
      <div
        style={{
          width: 280,
          borderRight: isDark ? "1px solid #111827" : "1px solid #e5e7eb",
          overflowY: "auto",
          backgroundColor: isDark ? "#020617" : "#ffffff",
        }}
      >
        <div
          style={{
            padding: "14px 16px",
            borderBottom: isDark ? "1px solid #111827" : "1px solid #e5e7eb",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16 }}>Chats</h3>
          <p
            style={{
              margin: 0,
              marginTop: 4,
              fontSize: 11,
              color: isDark ? "#6b7280" : "#64748b",
            }}
          >
            Direct messages with your team.
          </p>
        </div>
  
        {chats.map((chat) => {

            if (!chat.participants || chat.participants.length === 0) return null;

            // ✅ Handle MongoDB Map serialization: unreadCount can be Map or object
            // ✅ Database is source of truth - badge reflects persisted unreadCount
            const unreadCountObj = chat.unreadCount instanceof Map 
              ? Object.fromEntries(chat.unreadCount) 
              : (chat.unreadCount || {});
            const unread = Number(unreadCountObj[myId]) || 0;

            const otherUser = chat.participants.find(
            (p) => String(p._id) !== myId
          );
  
          return (
            <div
              key={chat._id}
              onClick={() => openChat(chat)}
              style={{
                padding: "12px 14px",
                cursor: "pointer",
                backgroundColor:
                  activeChat?._id === chat._id
                    ? isDark
                      ? "#0b1120"
                      : "rgba(37,99,235,0.08)"
                    : "transparent",
                borderBottom: isDark ? "1px solid #020617" : "1px solid #f1f5f9",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                transition: "background-color 0.15s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 999,
                    border: isDark
                      ? "1px solid rgba(148, 163, 184, 0.55)"
                      : "1px solid rgba(37,99,235,0.25)",
                    background: isDark
                      ? "radial-gradient(circle at 30% 0, rgba(99,102,241,0.75), rgba(2,6,23,1))"
                      : "radial-gradient(circle at 30% 0, rgba(37,99,235,0.25), rgba(34,197,94,0.18))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    color: isDark ? "#e5e7eb" : "#0f172a",
                    flex: "0 0 auto",
                  }}
                >
                  {(otherUser?.username || "U")[0]?.toUpperCase()}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <strong style={{ fontSize: 14 }}>
                    {otherUser?.username}
                  </strong>
  
                  {otherUser?.isOnline && (
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        backgroundColor: "#22c55e",
                        borderRadius: "50%",
                      }}
                    />
                  )}
                </div>
  
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 12,
                    color: isDark ? "#9ca3af" : "#64748b",
                  }}
                >
                  {chat.lastMessage?.content || "No messages yet"}
                </p>
              </div>
  
              {unread > 0 && (
                <span
                  style={{
                    minWidth: 22,
                    height: 22,
                    backgroundColor: "#2563eb",
                    color: "#fff",
                    borderRadius: 999,
                    fontSize: 11,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {unread}
                </span>
              )}
            </div>
          );
        })}
      </div>
  
      {/* ================= CHAT WINDOW ================= */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          backgroundColor: isDark ? "#020617" : "#f3f4f6",
        }}
      >
        {activeChat ? (
          <>
            {/* HEADER */}
            <div
              style={{
                padding: "12px 18px",
                borderBottom: isDark ? "1px solid #111827" : "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: isDark ? "#020617" : "#ffffff",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "999px",
                    border: isDark
                      ? "1px solid rgba(148, 163, 184, 0.55)"
                      : "1px solid rgba(34,197,94,0.25)",
                    background: isDark
                      ? "radial-gradient(circle at 30% 0, rgba(34,197,94,0.7), rgba(2,6,23,1))"
                      : "radial-gradient(circle at 30% 0, rgba(34,197,94,0.25), rgba(37,99,235,0.15))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    color: isDark ? "#e5e7eb" : "#0f172a",
                  }}
                >
                  {(
                    activeChat.participants?.find((p) => String(p._id) !== myId)
                      ?.username || "U"
                  )[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>
                    {activeChat.participants?.find(
                      (p) => String(p._id) !== myId
                    )?.username || "Chat"}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: isDark ? "#9ca3af" : "#64748b",
                    }}
                  >
                    {activeChat.participants?.find(
                      (p) => String(p._id) !== myId
                    )?.isOnline
                      ? "Online"
                      : "Offline"}
                  </div>
                </div>
              </div>
            </div>

            {/* MESSAGES */}
            <div
              style={{
                flex: 1,
                padding: "16px 18px",
                overflowY: "auto",
                background: isDark
                  ? "radial-gradient(circle at top left, rgba(30,64,175,0.3), transparent 55%)"
                  : "radial-gradient(circle at top left, rgba(59,130,246,0.10), transparent 55%)",
              }}
            >
              {messages.map((msg, i) => {
                const senderId =
                  typeof msg.sender === "string"
                    ? msg.sender
                    : msg.sender?._id;
  
                if (!senderId) return null;
  
                const isMe = String(senderId) === myId;
  
                return (
                  <div
                    key={msg._id || i}
                    style={{
                      display: "flex",
                      justifyContent: isMe ? "flex-end" : "flex-start",
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "64%",
                        padding: "8px 12px",
                        borderRadius: 16,
                        backgroundColor: isMe
                          ? isDark
                            ? "#4f46e5"
                            : "#2563eb"
                          : isDark
                            ? "#020617"
                            : "#ffffff",
                        border: isMe
                          ? isDark
                            ? "1px solid rgba(129,140,248,0.7)"
                            : "1px solid rgba(37,99,235,0.35)"
                          : isDark
                            ? "1px solid #111827"
                            : "1px solid #e5e7eb",
                        color: isMe ? "#ffffff" : isDark ? "#e5e7eb" : "#0f172a",
                        fontSize: 14,
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
  
            {/* INPUT BOX */}
            <div
              style={{
                display: "flex",
                padding: "12px 16px",
                borderTop: isDark ? "1px solid #111827" : "1px solid #e5e7eb",
                gap: 10,
                backgroundColor: isDark ? "#020617" : "#ffffff",
              }}
            >
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => {
                  // Allow sending message with Enter key
                  if (e.key === "Enter" && !e.shiftKey) {
                    sendMessage(e);
                  }
                }}
                placeholder="Type a message..."
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  fontSize: 14,
                  borderRadius: 999,
                  border: isDark ? "1px solid #374151" : "1px solid #cbd5f5",
                  backgroundColor: isDark ? "#020617" : "#f9fafb",
                  color: isDark ? "#e5e7eb" : "#0f172a",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={sendMessage}
                style={{
                  padding: "10px 22px",
                  borderRadius: 999,
                  cursor: "pointer",
                  border: "none",
                  background:
                    "linear-gradient(135deg, #2563eb, #4f46e5)",
                  color: "#f9fafb",
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: isDark ? "#6b7280" : "#64748b",
            }}
          >
            <p style={{ fontSize: 16, marginBottom: 6 }}>No chat selected</p>
            <p style={{ fontSize: 13 }}>
              Choose a conversation from the left to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
  
  
}

