import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Plus, Activity, Users, Video } from "lucide-react";
import api from "../utils/axios";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function Session() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();

  const [activeSessions, setActiveSessions] = useState([]);
  const [sessionName, setSessionName] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [teams, setTeams] = useState([]);
  const [view, setView] = useState("menu"); // menu | create | join

  const [joinId, setJoinId] = useState("");

  useEffect(() => {
    fetchSessions();
    fetchTeams();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await api.get("/sessions/my");
      setActiveSessions(res.data);
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await api.get("/teams/me");
      setTeams(res.data);
      if (res.data.length > 0) setSelectedTeam(res.data[0]._id);
    } catch (err) {
      console.error("Failed to fetch teams", err);
    }
  };

  const createSession = async (e) => {
    e.preventDefault();
    if (!sessionName.trim() || !selectedTeam) return;

    try {
      const res = await api.post("/sessions/create", {
        name: sessionName,
        teamId: selectedTeam,
      });
      // Navigate immediately to whiteboard
      navigate(`/whiteboard/${res.data.roomId}`, { state: { sessionName: res.data.name } });
    } catch (err) {
      console.error("Failed to create session", err);
    }
  };

  const joinSession = (e) => {
    if (e) e.preventDefault();
    if (joinId.trim()) {
      navigate(`/whiteboard/${joinId}`);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Room ID copied to clipboard!");
  };

  return (
    <div
      style={{
        height: "100%",
        padding: 32,
        // backgroundColor/color removed to inherit from WorkspaceLayout (Teams style)
        // backgroundColor: isDark ? "#0f172a" : "#f8fafc",
        // color: isDark ? "#e2e8f0" : "#1e293b",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 8px" }}>Sessions</h1>
          <p style={{ margin: 0, color: isDark ? "#94a3b8" : "#64748b" }}>
            Real-time collaborative whiteboards for your teams
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => setView("join")}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: `1px solid ${isDark ? "#334155" : "#cbd5e1"}`,
              background: "transparent",
              color: isDark ? "#e2e8f0" : "#334155",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Join via ID
          </button>
          <button
            onClick={() => setView("create")}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              background: "#2563eb",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Plus size={18} /> New Session
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {view === "menu" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {activeSessions.length === 0 ? (
              <div
                style={{
                  gridColumn: "1 / -1",
                  textAlign: "center",
                  padding: 40,
                  color: isDark ? "#64748b" : "#94a3b8",
                  border: `2px dashed ${isDark ? "#1e293b" : "#e2e8f0"}`,
                  borderRadius: 12,
                }}
              >
                No active sessions found. Create one to get started!
              </div>
            ) : (
              activeSessions.map((session) => (
                <div
                  key={session._id}
                  style={{
                    backgroundColor: "#111827",
                    borderRadius: 16,
                    padding: 24,
                    border: "1px solid #1f2937",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600, color: "#f3f4f6" }}>{session.name}</h3>
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 8px",
                          borderRadius: 99,
                          backgroundColor: "rgba(34, 197, 94, 0.1)",
                          color: "#4ade80",
                          border: "1px solid rgba(34, 197, 94, 0.2)",
                          fontWeight: 500,
                        }}
                      >
                        {session.team?.name || "Team Session"}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>
                      Created by {session.createdBy?.username || "Unknown"}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 14,
                      color: session.activeParticipants > 0 ? "#22c55e" : (isDark ? "#94a3b8" : "#64748b"),
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: session.activeParticipants > 0 ? "#22c55e" : "#94a3b8",
                      }}
                    />
                    {session.activeParticipants > 0
                      ? `${session.activeParticipants} Online`
                      : "No active members"}
                  </div>

                  <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
                    <button
                      onClick={() =>
                        navigate(`/whiteboard/${session.roomId}`, { state: { sessionName: session.name } })
                      }
                      style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: 8,
                        border: "1px solid #374151",
                        backgroundColor: "transparent",
                        color: "#e5e7eb",
                        fontSize: 13,
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: 14,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6
                      }}
                    >
                      {session.activeParticipants > 0 ? "Join Session" : "Start Session"}
                    </button>
                    <button
                      onClick={() => copyToClipboard(session.roomId)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid #374151",
                        background: "transparent",
                        color: "#e5e7eb",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      title="Copy Room ID"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {view === "create" && (
          <div style={{ maxWidth: 480, margin: "40px auto" }}>
            <h2 style={{ marginBottom: 24 }}>Create New Session</h2>
            <form onSubmit={createSession} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
                  Session Name
                </label>
                <input
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="e.g. Design Sprint Week 4"
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: 8,
                    border: `1px solid ${isDark ? "#334155" : "#cbd5e1"}`,
                    backgroundColor: isDark ? "#1e293b" : "#fff",
                    color: isDark ? "#fff" : "#0f172a",
                    fontSize: 15,
                    boxSizing: "border-box"
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
                  Select Team
                </label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: 8,
                    border: `1px solid ${isDark ? "#334155" : "#cbd5e1"}`,
                    backgroundColor: isDark ? "#1e293b" : "#fff",
                    color: isDark ? "#fff" : "#0f172a",
                    fontSize: 15,
                    boxSizing: "border-box"
                  }}
                >
                  {teams.map((team) => (
                    <option key={team._id} value={team._id}>
                      {team.name}
                    </option>
                  ))}
                  {teams.length === 0 && <option value="" disabled>No teams found</option>}
                </select>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setView("menu")}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: 8,
                    border: `1px solid ${isDark ? "#334155" : "#cbd5e1"}`,
                    background: "transparent",
                    color: isDark ? "#cbd5e1" : "#64748b",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!sessionName.trim() || !selectedTeam}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: 8,
                    border: "none",
                    background: "#2563eb",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: 600,
                    opacity: (!sessionName.trim() || !selectedTeam) ? 0.5 : 1,
                  }}
                >
                  Create Session
                </button>
              </div>
            </form>
          </div>
        )}

        {view === "join" && (
          <div style={{ maxWidth: 480, margin: "40px auto" }}>
            <h2 style={{ marginBottom: 24 }}>Join Existing Session</h2>
            <form onSubmit={joinSession} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
                  Room ID
                </label>
                <input
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value)}
                  placeholder="Paste Room ID here..."
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: 8,
                    border: `1px solid ${isDark ? "#334155" : "#cbd5e1"}`,
                    backgroundColor: isDark ? "#1e293b" : "#fff",
                    color: isDark ? "#fff" : "#0f172a",
                    fontSize: 15,
                    boxSizing: "border-box"
                  }}
                  autoFocus
                />
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setView("menu")}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: 8,
                    border: `1px solid ${isDark ? "#334155" : "#cbd5e1"}`,
                    background: "transparent",
                    color: isDark ? "#cbd5e1" : "#64748b",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!joinId.trim()}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: 8,
                    border: "none",
                    background: "#22c55e",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: 600,
                    opacity: !joinId.trim() ? 0.5 : 1,
                  }}
                >
                  Join Session
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
