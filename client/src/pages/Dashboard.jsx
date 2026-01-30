import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useEffect, useState } from "react";
import api from "../utils/axios";
import { getMyTeams } from "../api/teams";

import { formatDistanceToNow } from "date-fns";
import { Zap, Users, MessageSquare, PenTool, TrendingUp, Clock } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [stats, setStats] = useState({
    activeSessions: 0,
    teamMembers: 0,
    messages: 0,
    sessionsToday: 0,
    messagesToday: 0,
  });
  const [recentSessions, setRecentSessions] = useState([]);
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, teamRes] = await Promise.all([
          api.get("/users/dashboard"),
          getMyTeams()
        ]);

        setStats(statsRes.data.stats);
        setRecentSessions(statsRes.data.recentSessions);
        setTeams(teamRes.data || []);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      }
    };
    fetchData();
  }, []);

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: isDark ? "#0b0c15" : "#f8fafc",
        color: isDark ? "#e5e7eb" : "#0f172a",
        overflowY: "auto",
        overflowX: "hidden",
        boxSizing: "border-box",
        position: "relative"
      }}
    >
      {/* Ambient Background Glow Effect */}
      {isDark && (
        <div
          style={{
            position: "absolute",
            top: "-20%",
            right: "-10%",
            width: "50%",
            height: "50%",
            background: "radial-gradient(circle, rgba(0, 212, 255, 0.15) 0%, rgba(168, 85, 247, 0.05) 40%, transparent 70%)",
            filter: "blur(60px)",
            zIndex: 0,
            pointerEvents: "none"
          }}
        />
      )}

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          padding: "40px",
          maxWidth: 1600,
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
          position: "relative",
          zIndex: 1
        }}
        className="p-mobile-4 animate-fade-in"
      >
        {/* Welcome Section */}
        <section style={{ marginBottom: 48 }}>
          <div className="animate-fade-in">
            <h1
              style={{
                fontSize: 48,
                fontWeight: 800,
                marginBottom: 16,
                lineHeight: 1.1,
                letterSpacing: "-0.03em"
              }}
              className="text-4xl-mobile"
            >
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, <br />
              <span className="text-gradient-primary">
                {user?.username || "Creator"}
              </span>
            </h1>
            <p
              style={{
                fontSize: 18,
                color: isDark ? "#94a3b8" : "#64748b",
                maxWidth: 600,
                lineHeight: 1.6
              }}
            >
              Ready to build something extraordinary today? Your workspace is synced and live.
            </p>
          </div>
        </section>

        {/* Bento Grid Layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 24,
            marginBottom: 48
          }}
        >
          {/* Quick Action: New Chat */}
          <div
            onClick={() => navigate("/workspace/chat")}
            className={`hover-lift ${isDark ? "glass-panel" : "glass-panel-light"}`}
            style={{
              padding: 24,
              borderRadius: 24,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: 200,
              position: "relative",
              overflow: "hidden"
            }}
          >
            <div style={{
              position: "absolute", top: -20, right: -20, opacity: 0.1,
              transform: "rotate(-15deg)"
            }}>
              <MessageSquare size={120} />
            </div>

            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: "linear-gradient(135deg, #3b82f6, #2563eb)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", boxShadow: "0 8px 16px -4px rgba(59, 130, 246, 0.5)"
            }}>
              <MessageSquare size={24} />
            </div>

            <div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>New Chat</h3>
              <p style={{ fontSize: 14, color: isDark ? "#94a3b8" : "#64748b", margin: 0 }}>
                Start a new conversation with your AI assistant or team.
              </p>
            </div>
          </div>

          {/* Quick Action: Whiteboard */}
          <div
            onClick={() => navigate(`/whiteboard/${Date.now()}`)}
            className={`hover-lift ${isDark ? "glass-panel" : "glass-panel-light"}`}
            style={{
              padding: 24,
              borderRadius: 24,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: 200,
              position: "relative",
              overflow: "hidden"
            }}
          >
            <div style={{
              position: "absolute", top: -20, right: -20, opacity: 0.1,
              transform: "rotate(15deg)"
            }}>
              <PenTool size={120} />
            </div>

            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: "linear-gradient(135deg, #a855f7, #9333ea)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", boxShadow: "0 8px 16px -4px rgba(168, 85, 247, 0.5)"
            }}>
              <PenTool size={24} />
            </div>

            <div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Whiteboard</h3>
              <p style={{ fontSize: 14, color: isDark ? "#94a3b8" : "#64748b", margin: 0 }}>
                Brainstorm ideas on an infinite canvas.
              </p>
            </div>
          </div>

          {/* Quick Action: Create Team */}
          <div
            onClick={() => navigate("/workspace/teams")}
            className={`hover-lift ${isDark ? "glass-panel" : "glass-panel-light"}`}
            style={{
              padding: 24,
              borderRadius: 24,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: 200,
              position: "relative",
              overflow: "hidden"
            }}
          >
            <div style={{
              position: "absolute", top: -20, right: -20, opacity: 0.1,
              transform: "rotate(-10deg)"
            }}>
              <Users size={120} />
            </div>

            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: "linear-gradient(135deg, #10b981, #059669)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", boxShadow: "0 8px 16px -4px rgba(16, 185, 129, 0.5)"
            }}>
              <Users size={24} />
            </div>

            <div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Create Team</h3>
              <p style={{ fontSize: 14, color: isDark ? "#94a3b8" : "#64748b", margin: 0 }}>
                Invite members and collaborate securely.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <section className="animate-fade-in delay-100" style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
            <TrendingUp size={20} className="icon-glow" color="#00d4ff" />
            Overview
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 24
            }}
          >
            {/* Stat 1 */}
            <div className={`hover-lift ${isDark ? "glass-panel" : "glass-panel-light"}`} style={{ padding: 24, borderRadius: 20, display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: isDark ? "rgba(0, 212, 255, 0.1)" : "#e0f2fe",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#00d4ff"
              }}>
                <Zap size={24} />
              </div>
              <div>
                <div style={{ fontSize: 32, fontWeight: 800 }}>{stats.activeSessions}</div>
                <div style={{ fontSize: 14, color: isDark ? "#94a3b8" : "#64748b", fontWeight: 500 }}>Active Sessions</div>
              </div>
            </div>

            {/* Stat 2 */}
            <div className={`hover-lift ${isDark ? "glass-panel" : "glass-panel-light"}`} style={{ padding: 24, borderRadius: 20, display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: isDark ? "rgba(168, 85, 247, 0.1)" : "#f3e8ff",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#a855f7"
              }}>
                <Users size={24} />
              </div>
              <div>
                <div style={{ fontSize: 32, fontWeight: 800 }}>{stats.teamMembers}</div>
                <div style={{ fontSize: 14, color: isDark ? "#94a3b8" : "#64748b", fontWeight: 500 }}>Total Members</div>
              </div>
            </div>

            {/* Stat 3 */}
            <div className={`hover-lift ${isDark ? "glass-panel" : "glass-panel-light"}`} style={{ padding: 24, borderRadius: 20, display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: isDark ? "rgba(34, 197, 94, 0.1)" : "#dcfce7",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#22c55e"
              }}>
                <MessageSquare size={24} />
              </div>
              <div>
                <div style={{ fontSize: 32, fontWeight: 800 }}>{stats.messages}</div>
                <div style={{ fontSize: 14, color: isDark ? "#94a3b8" : "#64748b", fontWeight: 500 }}>Messages Sent</div>
              </div>
            </div>
          </div>
        </section>

        {/* Recent & Teams Split */}
        <div
          className="grid-responsive animate-fade-in delay-200"
          style={{ gridTemplateColumns: "2fr 1fr", alignItems: "start" }}
        >
          {/* Recent Sessions List */}
          <section>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
                <Clock size={20} className="icon-glow" color="#f59e0b" />
                Recent Activity
              </h2>
              <Link to="/workspace/session" style={{ fontSize: 14, color: "inherit", opacity: 0.7, textDecoration: "none" }}>View all</Link>
            </div>

            <div className={isDark ? "glass-panel" : "glass-panel-light"} style={{ borderRadius: 24, overflow: "hidden", padding: 8 }}>
              {recentSessions.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center", color: isDark ? "#94a3b8" : "#64748b" }}>
                  No recent activity to show.
                </div>
              ) : (
                recentSessions.map((session, i) => (
                  <div
                    key={i}
                    onClick={() => navigate(`/whiteboard/${session.roomId}`)}
                    style={{
                      padding: "16px 20px",
                      borderRadius: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      transition: "background 0.2s",
                      marginBottom: 4
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: session.activeParticipants ? "rgba(34, 197, 94, 0.1)" : isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: session.activeParticipants ? "#22c55e" : "inherit"
                      }}>
                        <Clock size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{session.name}</div>
                        <div style={{ fontSize: 13, color: isDark ? "#94a3b8" : "#64748b" }}>
                          {session.team?.name || "Personal Workspace"} • {formatDistanceToNow(new Date(session.updatedAt))} ago
                        </div>
                      </div>
                    </div>
                    <div style={{ opacity: 0.5 }}>→</div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Teams List */}
          <section>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
                <Users size={20} className="icon-glow" color="#ec4899" />
                Your Teams
              </h2>
              <Link to="/workspace/teams" style={{ fontSize: 14, color: "inherit", opacity: 0.7, textDecoration: "none" }}>Manage</Link>
            </div>

            <div className={isDark ? "glass-panel" : "glass-panel-light"} style={{ borderRadius: 24, padding: "20px" }}>
              {teams.slice(0, 3).map(team => (
                <div
                  key={team._id}
                  onClick={() => navigate("/workspace/teams")}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px", borderRadius: 12, marginBottom: 8,
                    cursor: "pointer", border: "1px solid transparent",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.05)" : "#f8fafc";
                    e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.borderColor = "transparent";
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: isDark ? "linear-gradient(135deg, #1e293b, #0f172a)" : "#eff6ff",
                    color: isDark ? "#fff" : "#2563eb",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: 14,
                    border: isDark ? "1px solid rgba(255,255,255,0.1)" : "none"
                  }}>
                    {team.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{team.name}</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>{team.members.length} members</div>
                  </div>
                </div>
              ))}

              <button
                onClick={() => navigate("/workspace/teams")}
                style={{
                  width: "100%", padding: "12px", marginTop: 8,
                  borderRadius: 12, border: "1px dashed rgba(255,255,255,0.2)",
                  background: "transparent", color: "inherit",
                  fontSize: 14, fontWeight: 500, cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "#00d4ff";
                  e.currentTarget.style.color = "#00d4ff";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                  e.currentTarget.style.color = "inherit";
                }}
              >
                + Create New Team
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
