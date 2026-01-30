import { useEffect, useState, useRef } from "react";
import api from "../utils/axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { Send, Image, MoreVertical, Phone, Video, ArrowLeft, Search, Plus } from "lucide-react";

export default function Chat() {
  const { user } = useAuth();
  const socket = useSocket();
  const location = useLocation();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Responsive Check
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);


  const myId = String(user?._id || "");

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef(null);

  // Theme Colors - Updated for Premium Look
  const colors = {
    bg: isDark ? "#09090b" : "#f8fafc", // Deep zinc/black
    sidebarBg: isDark ? "rgba(18, 18, 23, 0.85)" : "#ffffff", // Translucent dark
    border: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
    textMain: isDark ? "#ededed" : "#0f172a",
    textMuted: isDark ? "#a1a1aa" : "#64748b",
    primary: "#3b82f6",
    activeItemBg: isDark ? "rgba(255, 255, 255, 0.08)" : "#f0f9ff",
    messageMeBg: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    messageMeText: "#ffffff",
    messageOtherBg: isDark ? "rgba(39, 39, 42, 0.7)" : "#ffffff",
  };

  // Noise Texture SVG (Base64)
  const noiseTexture = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`;

  /* ================= LOAD CHAT LIST ================= */
  useEffect(() => {
    if (!user) return;

    const loadChats = async () => {
      try {
        const res = await api.get("/chats/my-chats");
        setChats(res.data);
      } catch (err) {
        console.error("Failed to load chats", err);
      }
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
      try {
        const res = await api.get(`/messages/chat/${activeChat._id}`);
        setMessages(res.data);
      } catch (err) {
        console.error("Failed to load messages", err);
      }
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
      if (String(msg.chatId) === String(activeChat?._id)) {
        setMessages((prev) => [...prev, msg]);
      }

      setChats((prev) =>
        prev.map((chat) => {
          if (String(chat._id) === String(msg.chatId)) {
            const unreadCountObj = chat.unreadCount instanceof Map
              ? Object.fromEntries(chat.unreadCount)
              : (chat.unreadCount || {});

            const currentCount = Number(unreadCountObj[myId]) || 0;
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

  /* ================= MESSAGE STATUS UPDATES ================= */
  useEffect(() => {
    if (!socket) return;

    const handleMessageStatusUpdate = ({ messageIds, chatId, status }) => {
      // Update message status in current chat view
      if (String(chatId) === String(activeChat?._id)) {
        setMessages((prev) =>
          prev.map((msg) =>
            messageIds.includes(String(msg._id)) ? { ...msg, status } : msg
          )
        );
      }
    };

    socket.on("message_status_update", handleMessageStatusUpdate);
    return () => socket.off("message_status_update", handleMessageStatusUpdate);
  }, [socket, activeChat?._id]);

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

  /* ================= CHAT READ EVENT ================= */
  useEffect(() => {
    if (!socket) return;

    const handleChatRead = ({ chatId, readerId }) => {
      setChats((prev) =>
        prev.map((chat) => {
          if (String(chat._id) === String(chatId)) {
            const unreadCountObj = chat.unreadCount instanceof Map
              ? Object.fromEntries(chat.unreadCount)
              : (chat.unreadCount || {});

            return {
              ...chat,
              unreadCount: {
                ...unreadCountObj,
                [myId]: 0,
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
  const sendMessage = (e) => {
    if (e) e.preventDefault();

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

    socket.emit("send_message", {
      chatId: activeChat._id,
      content: messageContent,
    });

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

    setMessage("");
  };

  /* ================= CHAT CLICK HANDLER ================= */
  const openChat = async (chat) => {
    setActiveChat(chat);

    const unreadCountObj = chat.unreadCount instanceof Map
      ? Object.fromEntries(chat.unreadCount)
      : (chat.unreadCount || {});
    const currentUnread = Number(unreadCountObj[myId]) || 0;

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

    if (currentUnread > 0) {
      try {
        await api.post(`/chats/read/${chat._id}`);

        // Emit socket event to mark messages as read (for status updates)
        if (socket) {
          socket.emit("mark_chat_as_read", { chatId: chat._id });
        }
      } catch (err) {
        console.error("Failed to mark chat as read:", err);
      }
    }
  };


  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        width: "100%",
        fontFamily: "'Inter', sans-serif",
        backgroundColor: colors.bg,
        color: colors.textMain,
        overflow: "hidden"
      }}
    >
      {/* Background Ambient Glow & Noise */}
      {isDark && (
        <>
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: noiseTexture,
            opacity: 0.4, pointerEvents: "none", zIndex: 0
          }} />
          {/* Deep Gradient Base */}
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(circle at 50% 120%, #1e1b4b 0%, #09090b 50%, #000000 100%)", // Indigo tint at bottom
            zIndex: -1
          }} />
          {/* Top Right Highlight */}
          <div style={{
            position: "absolute", top: "-10%", right: "-5%",
            width: "50%", height: "50%",
            background: "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)",
            filter: "blur(60px)", pointerEvents: "none"
          }} />
        </>
      )}

      {/* ================= CHAT LIST SIDEBAR ================= */}
      <div
        className={activeChat ? "hidden-mobile" : "w-full-mobile"}
        style={{
          width: 320,
          borderRight: `1px solid ${colors.border}`,
          backgroundColor: colors.sidebarBg,
          backdropFilter: "blur(20px)",
          display: "flex",
          flexDirection: "column",
          zIndex: 2,
          position: "relative",
          boxShadow: isDark ? "5px 0 30px rgba(0,0,0,0.3)" : "none" // Subtle depth separator
        }}
      >
        <div
          style={{
            padding: isMobile ? "16px" : "24px 24px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <h2 className="text-gradient-primary" style={{ margin: 0, fontSize: isMobile ? 20 : 24, fontWeight: 700 }}>Messages</h2>
          <button style={{
            background: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9",
            border: "none", borderRadius: "50%", width: 32, height: 32,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: colors.textMain
          }}>
            <Plus size={18} />
          </button>
        </div>

        {/* Search Bar (Visual) */}
        <div style={{ padding: isMobile ? "0 16px 12px" : "0 24px 16px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            padding: "10px 14px"
          }}>
            <Search size={16} color={colors.textMuted} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              style={{
                background: "transparent", border: "none", outline: "none",
                color: colors.textMain, fontSize: 14, width: "100%"
              }}
            />
          </div>
        </div>

        <div style={{ padding: isMobile ? "0 12px" : "8px 16px", flex: 1, overflowY: "auto" }}>
          {chats.filter(chat => {
            if (!searchQuery) return true;
            const isGroup = chat.isGroup;
            let displayName = "";
            if (isGroup) {
              displayName = chat.chatName || "Group Chat";
            } else {
              const otherUser = chat.participants?.find((p) => String(p._id) !== myId);
              displayName = otherUser?.username || "User";
            }
            return displayName.toLowerCase().includes(searchQuery.toLowerCase());
          }).map((chat) => {
            if (!chat.participants || chat.participants.length === 0) return null;

            const unreadCountObj = chat.unreadCount instanceof Map
              ? Object.fromEntries(chat.unreadCount)
              : (chat.unreadCount || {});
            const unread = Number(unreadCountObj[myId]) || 0;

            const isGroup = chat.isGroup;
            let displayName = "";
            let otherUser = null;

            if (isGroup) {
              displayName = chat.chatName || "Group Chat";
            } else {
              otherUser = chat.participants.find((p) => String(p._id) !== myId);
              displayName = otherUser?.username || "User";
            }

            const isActive = activeChat?._id === chat._id;
            const isOnline = otherUser?.isOnline;

            return (
              <div
                key={chat._id}
                onClick={() => openChat(chat)}
                className={isActive ? "active-chat-item" : "hover-lift"}
                style={{
                  padding: isMobile ? "10px 12px" : "14px",
                  borderRadius: 16,
                  cursor: "pointer",
                  backgroundColor: isActive ? colors.activeItemBg : "transparent",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  marginBottom: 6,
                  transition: "all 0.2s ease",
                  border: isActive ? `1px solid ${colors.primary}30` : "1px solid transparent"
                }}
              >
                <div style={{ position: "relative" }}>
                  <div style={{
                    width: isMobile ? 38 : 44, height: isMobile ? 38 : 44, borderRadius: 14,
                    background: isGroup ? "linear-gradient(135deg, #a855f7, #6366f1)" : "linear-gradient(135deg, #0cebeb, #20e3b2, #29ffc6)", // distinct gradients
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontWeight: 700, fontSize: isMobile ? 16 : 18,
                    textShadow: "0 2px 4px rgba(0,0,0,0.1)"
                  }}>
                    {displayName[0]?.toUpperCase()}
                  </div>
                  {isOnline && (
                    <div style={{
                      position: "absolute", bottom: -2, right: -2,
                      width: 14, height: 14, borderRadius: "50%",
                      backgroundColor: "#22c55e",
                      border: `3px solid ${colors.sidebarBg}`
                    }} />
                  )}
                </div>

                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontWeight: isActive ? 600 : 500, color: colors.textMain, fontSize: 15 }}>
                      {displayName}
                    </span>
                    {chat.lastMessage && (
                      <span style={{ fontSize: 11, color: colors.textMuted, opacity: 0.7 }}>
                        {new Date(chat.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{
                      margin: 0, fontSize: 13, color: colors.textMuted,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "90%"
                    }}>
                      {chat.lastMessage?.content || "No messages yet"}
                    </p>
                    {unread > 0 && (
                      <div style={{
                        background: colors.primary, color: "#fff",
                        fontSize: 10, fontWeight: 700,
                        height: 18, minWidth: 18, borderRadius: 9,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: "0 4px"
                      }}>
                        {unread}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= MAIN CHAT WINDOW ================= */}
      <div
        className={!activeChat ? "hidden-mobile" : "w-full-mobile"}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          zIndex: 1,
          background: "transparent", // Let global gradients show through
        }}
      >
        {activeChat ? (
          <>
            {/* Header */}
            <div
              className={isDark ? "glass-panel" : "glass-panel-light"}
              style={{
                padding: isMobile ? "12px 16px" : "16px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderRadius: 0,
                borderBottom: `1px solid ${colors.border}`,
                backgroundColor: isDark ? "rgba(9, 9, 11, 0.6)" : "rgba(255,255,255,0.8)",
                backdropFilter: "blur(12px)",
                zIndex: 10
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <button className="hidden-desktop" onClick={() => setActiveChat(null)} style={{ background: "transparent", border: "none", color: colors.textMain, padding: 0 }}>
                  <ArrowLeft />
                </button>

                <div style={{ position: "relative" }}>
                  <div style={{
                    width: isMobile ? 36 : 40, height: isMobile ? 36 : 40, borderRadius: 12,
                    background: activeChat.isGroup ? "#a855f7" : "#00d4ff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontWeight: 700
                  }}>
                    {(
                      activeChat.isGroup
                        ? activeChat.chatName
                        : activeChat.participants?.find((p) => String(p._id) !== myId)?.username
                    )?.[0]?.toUpperCase() || "C"}
                  </div>
                  {activeChat.participants?.find((p) => String(p._id) !== myId)?.isOnline && !activeChat.isGroup && (
                    <div style={{
                      position: "absolute", bottom: -2, right: -2,
                      width: 12, height: 12, borderRadius: "50%",
                      backgroundColor: "#22c55e", border: `2px solid ${isDark ? "#1e293b" : "#fff"}`
                    }} />
                  )}
                </div>

                <div>
                  <h3 style={{ margin: 0, fontSize: isMobile ? 15 : 16, color: colors.textMain }}>
                    {activeChat.isGroup ? activeChat.chatName : activeChat.participants?.find((p) => String(p._id) !== myId)?.username}
                  </h3>
                  <span style={{ fontSize: 12, color: colors.textMuted }}>
                    {activeChat.isGroup ? `${activeChat.participants.length} members` : (activeChat.participants?.find((p) => String(p._id) !== myId)?.isOnline ? "Active now" : "Offline")}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div
              style={{
                flex: 1,
                padding: isMobile ? "16px 16px" : "24px 32px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: isMobile ? 14 : 20
              }}
            >
              {messages.map((msg, i) => {
                const senderId = typeof msg.sender === "string" ? msg.sender : msg.sender?._id;
                if (!senderId) return null;
                const isMe = String(senderId) === myId;
                const showAvatar = !isMe && (i === 0 || messages[i - 1]?.sender !== senderId);

                // Find if this is the last message sent by me
                // Note: performing this check inside map is okay for typical chat lengths (hundreds), 
                // but optimization would be to pre-calc getLastIndex outside.
                // For simplicity and correctness with live updates, checking here (or pre-calc above).
                // Let's rely on a helper if we were outside, but here:
                const isLastMyMessage = isMe && i === messages.map(m => String(typeof m.sender === "string" ? m.sender : m.sender?._id)).lastIndexOf(myId);

                return (
                  <div
                    key={msg._id || i}
                    className="animate-fade-in"
                    style={{
                      display: "flex",
                      justifyContent: isMe ? "flex-end" : "flex-start",
                      alignItems: "flex-end",
                      gap: isMobile ? 8 : 12
                    }}
                  >
                    {!isMe && (
                      <div style={{ width: 28, height: 28, flexShrink: 0 }}>
                        {showAvatar && (
                          <div style={{
                            width: 28, height: 28, borderRadius: 10,
                            background: "#334155", color: "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 12, fontWeight: 700
                          }}>
                            {activeChat.participants?.find(p => String(p._id) === String(senderId))?.username?.[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isMe ? "flex-end" : "flex-start",
                        maxWidth: isMobile ? "80%" : "65%",
                      }}
                    >
                      <div
                        style={{
                          padding: isMobile ? "10px 14px" : "12px 18px",
                          borderRadius: isMe ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                          background: isMe ? colors.messageMeBg : colors.messageOtherBg,
                          color: isMe ? colors.messageMeText : colors.textMain,
                          boxShadow: isMe ? "0 8px 16px -4px rgba(0, 212, 255, 0.3)" : "none",
                          border: isMe ? "none" : `1px solid ${colors.border}`,
                          backdropFilter: !isMe ? "blur(10px)" : "none",
                          fontSize: isMobile ? 14 : 15,
                          lineHeight: 1.5,
                          width: "fit-content"
                        }}
                      >
                        <div style={{ marginBottom: 4 }}>{msg.content}</div>
                        <div style={{
                          fontSize: 11,
                          color: isMe ? "rgba(255,255,255,0.6)" : colors.textMuted,
                          textAlign: "right"
                        }}>
                          {new Date(msg.createdAt).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </div>
                      </div>

                      {/* Status Indicator */}
                      {isLastMyMessage && (
                        <div
                          className="animate-fade-in"
                          style={{
                            marginTop: 4,
                            marginBottom: -4,
                            paddingRight: 4, // Align with bubble curve
                            textAlign: "right"
                          }}
                        >
                          <span style={{
                            fontSize: 10,
                            color: colors.textMuted,
                            fontWeight: 500,
                          }}>
                            {msg.status ? msg.status.charAt(0).toUpperCase() + msg.status.slice(1) : "Sent"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{ padding: isMobile ? "16px" : "24px 32px" }}>
              <div
                className={isDark ? "glass-panel" : "glass-panel-light"}
                style={{
                  padding: isMobile ? "6px 6px 6px 16px" : "8px 8px 8px 20px",
                  borderRadius: 24,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.1)"
                }}
              >

                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      sendMessage(e);
                    }
                  }}
                  placeholder="Type a message..."
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: colors.textMain,
                    fontSize: isMobile ? 14 : 15
                  }}
                />
                <button
                  onClick={sendMessage}
                  className="hover-lift"
                  style={{
                    width: isMobile ? 36 : 44, height: isMobile ? 36 : 44, borderRadius: 20,
                    background: colors.messageMeBg,
                    border: "none", color: "#fff",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                  }}
                >
                  <Send size={isMobile ? 18 : 20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: colors.textMuted }}>
            <div style={{
              width: 80, height: 80, borderRadius: 24,
              background: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 24
            }}>
              <Send size={36} color={colors.primary} />
            </div>
            <h3 style={{ fontSize: 20, color: colors.textMain, marginBottom: 8 }}>No Chat Selected</h3>
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
