import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyTeams, createTeam, joinTeam, deleteTeam } from "../api/teams";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import api from "../utils/axios";
import TeamCard from "../components/TeamCard";
import { useTheme } from "../context/ThemeContext";
import { Users, Plus, Key, X, MessageSquare, Loader2 } from "lucide-react";

// Themed Modal Component
function Modal({ title, onClose, children, isDark }) {
  const overlayStyle = {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
    padding: "16px" // Added padding for mobile safety
  };

  const contentStyle = {
    backgroundColor: isDark ? "#1e293b" : "#ffffff",
    padding: 24,
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
    color: isDark ? "#f8fafc" : "#0f172a",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    maxHeight: "90vh", // prevent overflow on small vertical screens
    overflowY: "auto",
    position: "relative"
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={contentStyle} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: isDark ? "#94a3b8" : "#64748b", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Teams() {
  const { user } = useAuth();
  const socket = useSocket();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [teams, setTeams] = useState([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [viewingMembers, setViewingMembers] = useState(null); // team object
  const [newTeamName, setNewTeamName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Theme Colors
  const colors = {
    bg: isDark ? "#0a0b10" : "#f8fafc",
    textMain: isDark ? "#f8fafc" : "#0f172a",
    textMuted: isDark ? "#94a3b8" : "#64748b",
    primary: "#00d4ff",
    border: isDark ? "#1e293b" : "#e2e8f0",
    cardBg: isDark ? "rgba(30, 41, 59, 0.5)" : "#ffffff",
    inputBg: isDark ? "#0f172a" : "#f1f5f9",
    inputBorder: isDark ? "#334155" : "#cbd5e1"
  };

  useEffect(() => {
    loadTeams();
  }, []);

  // Listen for presence updates
  useEffect(() => {
    if (!socket) return;

    const handleUserOnline = (userId) => {
      setTeams((prev) =>
        prev.map((team) => ({
          ...team,
          members: team.members?.map((m) =>
            String(m._id) === String(userId) ? { ...m, isOnline: true } : m
          ),
        }))
      );
    };

    const handleUserOffline = (userId) => {
      setTeams((prev) =>
        prev.map((team) => ({
          ...team,
          members: team.members?.map((m) =>
            String(m._id) === String(userId) ? { ...m, isOnline: false } : m
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

  const loadTeams = async () => {
    try {
      const res = await getMyTeams();
      setTeams(res.data || []);
    } catch (err) {
      console.error("Failed to load teams", err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setIsLoading(true);
    try {
      await createTeam({ name: newTeamName });
      setIsCreateOpen(false);
      setNewTeamName("");
      loadTeams();
    } catch (err) {
      console.error("Failed to create team", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setIsLoading(true);
    try {
      await joinTeam({ code: joinCode });
      setIsJoinOpen(false);
      setJoinCode("");
      loadTeams();
    } catch (err) {
      console.error("Failed to join team", err);
      alert(err.response?.data?.message || "Failed to join team");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (teamId) => {
    if (!window.confirm("Are you sure you want to delete this team? This action cannot be undone.")) return;
    try {
      await deleteTeam(teamId);
      loadTeams();
    } catch (err) {
      console.error("Failed to delete team", err);
      alert(err.response?.data?.message || "Failed to delete team");
    }
  };

  const handleInvite = (team) => {
    const link = `${team.code}`; // Just copy the code as per requirement to join by Team ID
    navigator.clipboard.writeText(link);
    alert(`Team ID copied: ${link}`);
  };

  const handleMessage = async (memberId) => {
    try {
      const res = await api.post("/chats/create", {
        otherUserId: memberId,
      });
      const chat = res.data;
      navigate("/workspace/chat", { state: { openChatId: chat._id } });
    } catch (err) {
      console.error("Failed to open chat", err);
      navigate("/workspace/chat");
    }
  };

  return (
    <div
      className="p-mobile-4"
      style={{
        padding: "32px 40px",
        height: "100%",
        overflowY: "auto",
        boxSizing: "border-box",
        fontFamily: "'Inter', sans-serif",
        backgroundColor: colors.bg,
        color: colors.textMain
      }}
    >
      <div
        className="flex-col-mobile"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40, gap: 16 }}
      >
        <div>
          <h1 style={{ margin: "0 0 8px", fontSize: 32, fontWeight: 800, color: colors.textMain, letterSpacing: "-0.02em" }}>Teams</h1>
          <p style={{ margin: 0, color: colors.textMuted, fontSize: 16 }}>Manage your teams and collaborate with members</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => setIsJoinOpen(true)}
            style={{
              padding: "10px 20px",
              borderRadius: 12,
              border: `1px solid ${colors.border}`,
              backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "white",
              color: colors.textMain,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9"}
            onMouseLeave={(e) => e.target.style.backgroundColor = isDark ? "rgba(255,255,255,0.03)" : "white"}
          >
            <Key size={18} />
            Join Team
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            style={{
              padding: "10px 20px",
              borderRadius: 12,
              border: "none",
              backgroundColor: colors.primary,
              color: "#0a0b10",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: `0 0 15px ${colors.primary}40`
            }}
          >
            <Plus size={18} strokeWidth={3} />
            Create Team
          </button>
        </div>
      </div>

      <div className="grid-responsive">
        {teams.map(team => (
          <TeamCard
            key={team._id}
            team={team}
            currentUserId={user?._id}
            onInvite={handleInvite}
            onViewMembers={setViewingMembers}
            onDelete={handleDelete}
            isDark={isDark}
            colors={colors}
          />
        ))}

        {/* Create New Team Card Placeholder */}
        <div
          onClick={() => setIsCreateOpen(true)}
          style={{
            border: `2px dashed ${colors.border}`,
            borderRadius: 24,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 220,
            cursor: "pointer",
            backgroundColor: isDark ? "rgba(30, 41, 59, 0.2)" : "rgba(241, 245, 249, 0.5)",
            color: colors.textMuted,
            transition: "all 0.2s",
            gap: 16
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = colors.primary;
            e.currentTarget.style.backgroundColor = isDark ? "rgba(30, 41, 59, 0.3)" : "rgba(241, 245, 249, 0.8)";
            e.currentTarget.style.color = colors.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = colors.border;
            e.currentTarget.style.backgroundColor = isDark ? "rgba(30, 41, 59, 0.2)" : "rgba(241, 245, 249, 0.5)";
            e.currentTarget.style.color = colors.textMuted;
          }}
        >
          <div style={{
            width: 56, height: 56, borderRadius: "50%", backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "white",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: isDark ? "none" : "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
          }}>
            <Plus size={28} />
          </div>
          <div style={{ textAlign: "center" }}>
            <span style={{ fontWeight: 600, fontSize: 16, display: "block", marginBottom: 4 }}>Create New Team</span>
            <span style={{ fontSize: 13, opacity: 0.8 }}>Start collaborating today</span>
          </div>
        </div>
      </div>

      {isCreateOpen && (
        <Modal title="Create New Team" onClose={() => setIsCreateOpen(false)} isDark={isDark}>
          <form onSubmit={handleCreate}>
            <label style={{ display: "block", marginBottom: 8, fontSize: 14, color: colors.textMuted, fontWeight: 500 }}>Team Name</label>
            <div style={{ position: "relative", marginBottom: 24 }}>
              <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: colors.textMuted }}>
                <Users size={18} />
              </div>
              <input
                autoFocus
                value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
                placeholder="e.g. Engineering"
                style={{
                  width: "100%",
                  padding: "12px 12px 12px 40px",
                  borderRadius: 12,
                  border: `1px solid ${colors.inputBorder}`,
                  backgroundColor: colors.inputBg,
                  color: colors.textMain,
                  boxSizing: "border-box",
                  fontSize: 15,
                  outline: "none",
                  transition: "border-color 0.2s"
                }}
                onFocus={(e) => e.target.style.borderColor = colors.primary}
                onBlur={(e) => e.target.style.borderColor = colors.inputBorder}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                style={{ padding: "10px 18px", borderRadius: 10, background: "transparent", border: `1px solid ${colors.border}`, color: colors.textMuted, cursor: "pointer", fontWeight: 500 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newTeamName.trim() || isLoading}
                style={{ padding: "10px 24px", borderRadius: 10, background: colors.primary, border: "none", color: "#0a0b10", fontWeight: 700, cursor: "pointer", minWidth: 100, display: "flex", justifyContent: "center" }}
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Create Team"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {isJoinOpen && (
        <Modal title="Join Team" onClose={() => setIsJoinOpen(false)} isDark={isDark}>
          <form onSubmit={handleJoin}>
            <label style={{ display: "block", marginBottom: 8, fontSize: 14, color: colors.textMuted, fontWeight: 500 }}>Team ID / Code</label>
            <div style={{ position: "relative", marginBottom: 24 }}>
              <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: colors.textMuted }}>
                <Key size={18} />
              </div>
              <input
                autoFocus
                value={joinCode}
                onChange={e => setJoinCode(e.target.value)}
                placeholder="e.g. A3F9BC"
                style={{
                  width: "100%",
                  padding: "12px 12px 12px 40px",
                  borderRadius: 12,
                  border: `1px solid ${colors.inputBorder}`,
                  backgroundColor: colors.inputBg,
                  color: colors.textMain,
                  boxSizing: "border-box",
                  fontSize: 15,
                  outline: "none",
                  transition: "border-color 0.2s"
                }}
                onFocus={(e) => e.target.style.borderColor = colors.primary}
                onBlur={(e) => e.target.style.borderColor = colors.inputBorder}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button
                type="button"
                onClick={() => setIsJoinOpen(false)}
                style={{ padding: "10px 18px", borderRadius: 10, background: "transparent", border: `1px solid ${colors.border}`, color: colors.textMuted, cursor: "pointer", fontWeight: 500 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!joinCode.trim() || isLoading}
                style={{ padding: "10px 24px", borderRadius: 10, background: "#22c55e", border: "none", color: "#ffffff", fontWeight: 700, cursor: "pointer", minWidth: 100, display: "flex", justifyContent: "center" }}
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Join Team"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {viewingMembers && (
        <Modal title={`Members of ${viewingMembers.name}`} onClose={() => setViewingMembers(null)} isDark={isDark}>
          <div style={{ maxHeight: 300, overflowY: "auto", paddingRight: 4 }}>
            {viewingMembers.members.map(member => (
              <div key={member._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${colors.border}` }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ position: "relative" }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12, background: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9",
                      display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, marginRight: 12,
                      color: colors.primary, border: `1px solid ${colors.border}`
                    }}>
                      {member.username[0].toUpperCase()}
                    </div>
                    {member.isOnline && (
                      <div style={{
                        position: "absolute", bottom: 0, right: 10,
                        width: 12, height: 12, borderRadius: "50%",
                        backgroundColor: "#22c55e",
                        border: `2px solid ${isDark ? "#1e293b" : "#ffffff"}`
                      }} />
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{member.username}</div>
                    <div style={{ fontSize: 13, color: colors.textMuted }}>
                      {member.isOnline ? (
                        <span style={{ color: "#22c55e" }}>Active now</span>
                      ) : (
                        member.email
                      )}
                    </div>
                  </div>
                </div>
                {user?._id !== member._id && (
                  <button
                    onClick={() => handleMessage(member._id)}
                    style={{
                      padding: "8px 12px", borderRadius: 8, border: `1px solid ${colors.border}`,
                      backgroundColor: "transparent", color: colors.textMain, cursor: "pointer", fontSize: 13,
                      display: "flex", alignItems: "center", gap: 6, transition: "background 0.2s"
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = isDark ? "rgba(255,255,255,0.05)" : "#f8fafc"}
                    onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                  >
                    <MessageSquare size={14} />
                    Message
                  </button>
                )}
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

