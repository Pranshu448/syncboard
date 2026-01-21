import { useEffect, useState, useRef } from "react";
import api from "../utils/axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { Send, Image, MoreVertical, Phone, Video } from "lucide-react";

export default function Chat() {
  const { user } = useAuth();
  const socket = useSocket();
  const location = useLocation();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const myId = String(user?._id || "");

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);

  // Theme Colors
  const colors = {
    bg: isDark ? "#0a0b10" : "#f8fafc",
    sidebarBg: isDark ? "#0b0c15" : "#ffffff",
    border: isDark ? "#1e293b" : "#e2e8f0",
    textMain: isDark ? "#f8fafc" : "#0f172a",
    textMuted: isDark ? "#94a3b8" : "#64748b",
    primary: "#00d4ff",
    primaryText: "#00d4ff",
    activeItemBg: isDark ? "rgba(0, 212, 255, 0.1)" : "#e0f2fe",
    messageMeBg: "#00d4ff",
    messageMeText: "#0a0b10",
    messageOtherBg: isDark ? "rgba(255,255,255,0.05)" : "#ffffff",
  };

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
      } catch (err) {
        console.error("Failed to mark chat as read:", err);
        const res = await api.get("/chats/my-chats");
        setChats(res.data);
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
      {/* ================= CHAT LIST ================= */}
      <div
        style={{
          width: 300,
          borderRight: `1px solid ${colors.border}`,
          overflowY: "auto",
          backgroundColor: colors.sidebarBg,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: `1px solid ${colors.border}`,
            display: "flex",
            flexDirection: "column",
            gap: 4
          }}
        >
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: colors.textMain }}>Messages</h3>
          <p style={{ margin: 0, fontSize: 13, color: colors.textMuted }}>
            Direct messages with your team.
          </p>
        </div>

        <div style={{ padding: "12px 12px" }}>
          {chats.map((chat) => {
            if (!chat.participants || chat.participants.length === 0) return null;

            const unreadCountObj = chat.unreadCount instanceof Map
              ? Object.fromEntries(chat.unreadCount)
              : (chat.unreadCount || {});
            const unread = Number(unreadCountObj[myId]) || 0;

            const isGroup = chat.isGroup;
            let displayImage = null;
            let displayName = "";
            let displayStatus = false;
            let otherUser = null;

            if (isGroup) {
              displayName = chat.chatName || "Group Chat";
              displayImage = "/gojo.png";
            } else {
              otherUser = chat.participants.find((p) => String(p._id) !== myId);
              displayName = otherUser?.username || "User";
              displayStatus = otherUser?.isOnline;
            }

            const isActive = activeChat?._id === chat._id;

            return (
              <div
                key={chat._id}
                onClick={() => openChat(chat)}
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  cursor: "pointer",
                  backgroundColor: isActive ? colors.activeItemBg : "transparent",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 4,
                  transition: "all 0.15s ease",
                  position: "relative"
                }}
                onMouseEnter={(e) => !isActive && (e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)")}
                onMouseLeave={(e) => !isActive && (e.currentTarget.style.backgroundColor = "transparent")}
              >
                {/* Active Indicator */}
                {isActive && (
                  <div style={{ position: "absolute", left: -6, top: "50%", transform: "translateY(-50%)", width: 3, height: 16, borderRadius: "0 4px 4px 0", backgroundColor: colors.primary }}></div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {isGroup ? (
                    <img
                      src={displayImage}
                      alt="Group"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: `1px solid ${colors.border}`
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: isActive ? colors.primary : `${colors.primary}20`,
                        color: isActive ? "#0a0b10" : colors.primary,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: 16,
                      }}
                    >
                      {(displayName || "U")[0]?.toUpperCase()}
                    </div>
                  )}

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <strong style={{ fontSize: 14, color: isActive ? colors.primary : colors.textMain }}>
                        {displayName}
                      </strong>
                      {displayStatus && (
                        <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#22c55e", border: `2px solid ${colors.sidebarBg}` }} />
                      )}
                    </div>

                    <p
                      style={{
                        margin: "2px 0 0",
                        fontSize: 12,
                        color: isActive ? colors.textMain : colors.textMuted,
                        maxWidth: 140,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        opacity: 0.8
                      }}
                    >
                      {chat.lastMessage?.content || "No messages yet"}
                    </p>
                  </div>
                </div>

                {unread > 0 && (
                  <span
                    style={{
                      minWidth: 20,
                      height: 20,
                      backgroundColor: colors.primary,
                      color: "#0a0b10",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 700,
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
      </div>

      {/* ================= CHAT WINDOW ================= */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          backgroundColor: colors.bg,
        }}
      >
        {activeChat ? (
          <>
            {/* HEADER */}
            <div
              style={{
                padding: "16px 24px",
                borderBottom: `1px solid ${colors.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: isDark ? "rgba(10, 11, 16, 0.95)" : "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(10px)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {activeChat.isGroup ? (
                  <div style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: `${colors.primary}20`, display: "flex", alignItems: "center", justifyContent: "center", color: colors.primary, fontWeight: 700 }}>
                    {activeChat.chatName?.[0]}
                  </div>
                ) : (
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: `${colors.primary}20`,
                      color: colors.primary,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: 18,
                    }}
                  >
                    {(
                      activeChat.participants?.find((p) => String(p._id) !== myId)
                        ?.username || "U"
                    )[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: colors.textMain }}>
                    {activeChat.isGroup
                      ? activeChat.chatName
                      : activeChat.participants?.find((p) => String(p._id) !== myId)?.username || "Chat"
                    }
                  </div>
                  <div style={{ fontSize: 12, color: colors.textMuted, display: "flex", alignItems: "center", gap: 6 }}>
                    {activeChat.isGroup
                      ? `${activeChat.participants?.length || 0} members`
                      : (activeChat.participants?.find((p) => String(p._id) !== myId)?.isOnline
                        ? <span style={{ color: "#22c55e", fontWeight: 600 }}>Online</span>
                        : "Offline")
                    }
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ padding: 8, borderRadius: 8, border: "none", backgroundColor: "transparent", color: colors.textMuted, cursor: "pointer" }}>
                  <Phone size={20} />
                </button>
                <button style={{ padding: 8, borderRadius: 8, border: "none", backgroundColor: "transparent", color: colors.textMuted, cursor: "pointer" }}>
                  <Video size={20} />
                </button>
                <button style={{ padding: 8, borderRadius: 8, border: "none", backgroundColor: "transparent", color: colors.textMuted, cursor: "pointer" }}>
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            {/* MESSAGES */}
            <div
              style={{
                flex: 1,
                padding: "24px 32px",
                overflowY: "auto",
                backgroundImage: isDark
                  ? `radial-gradient(${colors.primary}08 1px, transparent 1px)`
                  : `radial-gradient(${colors.primary}15 1px, transparent 1px)`,
                backgroundSize: "24px 24px"
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
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "60%",
                        padding: "12px 18px",
                        borderRadius: isMe ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                        backgroundColor: isMe ? colors.messageMeBg : colors.messageOtherBg,
                        border: isMe ? "none" : `1px solid ${colors.border}`,
                        color: isMe ? colors.messageMeText : colors.textMain,
                        fontSize: 15,
                        boxShadow: isMe ? `0 4px 12px ${colors.primary}33` : "none",
                        fontWeight: 400,
                        lineHeight: 1.5
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
                padding: "20px 32px",
                borderTop: `1px solid ${colors.border}`,
                backgroundColor: isDark ? "#0a0b10" : "#ffffff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  backgroundColor: isDark ? "#0b0c15" : "#f1f5f9",
                  padding: "10px 16px",
                  borderRadius: 16,
                  border: `1px solid ${colors.border}`,
                  transition: "border-color 0.2s"
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = colors.primary}
                tabIndex={-1}
              >
                <button type="button" style={{ border: "none", background: "transparent", color: colors.textMuted, cursor: "pointer", padding: 0 }}>
                  <Image size={20} />
                </button>
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
                    color: colors.textMain,
                    fontSize: 15,
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    cursor: "pointer",
                    border: "none",
                    backgroundColor: colors.primary,
                    color: "#0a0b10",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 0 10px ${colors.primary}50`
                  }}
                >
                  <Send size={18} />
                </button>
              </div>
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
              color: colors.textMuted,
            }}
          >
            <div style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: `${colors.primary}15`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
              <Send size={32} color={colors.primary} />
            </div>
            <p style={{ fontSize: 18, marginBottom: 8, fontWeight: 600, color: colors.textMain }}>No chat selected</p>
            <p style={{ fontSize: 14 }}>
              Choose a conversation from the left to start chatting.
            </p>
          </div>
        )}
      </div>
    </div>
  );


}



