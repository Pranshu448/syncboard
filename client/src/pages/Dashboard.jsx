import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useEffect, useState } from "react";
import api from "../utils/axios";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [stats, setStats] = useState({
    activeSessions: 12,
    teamMembers: 24,
    messages: 156,
  });
  const [recentSessions, setRecentSessions] = useState([]);
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    // Load dashboard data
    // TODO: Replace with actual API calls
  }, []);

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: isDark ? "#020617" : "#f9fafb",
        color: isDark ? "#e5e7eb" : "#0f172a",
        overflowY: "auto",
      }}
    >
      {/* Top Header Bar */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 32px",
          borderBottom: isDark ? "1px solid #1f2937" : "1px solid #e5e7eb",
          backgroundColor: isDark ? "#030712" : "#ffffff",
        }}
      >
        {/* Search Bar */}
        <div
          style={{
            flex: 1,
            maxWidth: 600,
            margin: "0 auto",
            position: "relative",
          }}
        >
          <input
            type="text"
            placeholder="Search anything..."
            style={{
              width: "100%",
              padding: "10px 16px 10px 40px",
              borderRadius: 8,
              border: isDark ? "1px solid #374151" : "1px solid #d1d5db",
              backgroundColor: isDark ? "#111827" : "#f9fafb",
              color: isDark ? "#e5e7eb" : "#0f172a",
              fontSize: 14,
              outline: "none",
            }}
          />
          <span
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 11,
              color: isDark ? "#6b7280" : "#9ca3af",
              backgroundColor: isDark ? "#1f2937" : "#e5e7eb",
              padding: "2px 6px",
              borderRadius: 4,
            }}
          >
            ⌘K
          </span>
        </div>

        {/* User Status & Notifications */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              color: isDark ? "#9ca3af" : "#6b7280",
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#22c55e",
              }}
            />
            Connected
          </div>
          <button
            type="button"
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "none",
              backgroundColor: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isDark ? "#e5e7eb" : "#0f172a",
            }}
          >
            🔔
          </button>
          <div
            style={{
              position: "relative",
              width: 36,
              height: 36,
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 30% 0, rgba(99,102,241,0.55), rgba(2,6,23,1))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `2px solid ${isDark ? "#1f2937" : "#e5e7eb"}`,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: "#ffffff" }}>
              {user?.username?.[0]?.toUpperCase() || "U"}
            </span>
            <div
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: "#22c55e",
                border: `2px solid ${isDark ? "#030712" : "#ffffff"}`,
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          padding: "32px",
          maxWidth: 1400,
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Welcome Section */}
        <section style={{ marginBottom: 40 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 12px",
                borderRadius: 999,
                backgroundColor: isDark ? "rgba(37,99,235,0.15)" : "rgba(37,99,235,0.1)",
                fontSize: 12,
                fontWeight: 500,
                color: isDark ? "#60a5fa" : "#2563eb",
              }}
            >
              <span>⚡</span>
              <span>Your Workspace</span>
            </div>
          </div>
          <h1
            style={{
              fontSize: 36,
              fontWeight: 700,
              marginBottom: 12,
              lineHeight: 1.2,
            }}
          >
            Welcome back,{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #2563eb, #a855f7)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {user?.username || "User"}
            </span>
          </h1>
          <p
            style={{
              fontSize: 16,
              color: isDark ? "#94a3b8" : "#64748b",
              marginBottom: 24,
              maxWidth: 600,
            }}
          >
            Pick up where you left off or start something new. Your team is ready
            to collaborate.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => navigate("/workspace/chat")}
              style={{
                padding: "12px 20px",
                borderRadius: 8,
                border: "none",
                backgroundColor: isDark ? "#1e40af" : "#2563eb",
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>💬</span>
              <span>New Chat</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/workspace/teams")}
              style={{
                padding: "12px 20px",
                borderRadius: 8,
                border: isDark ? "1px solid #374151" : "1px solid #d1d5db",
                backgroundColor: isDark ? "#111827" : "#ffffff",
                color: isDark ? "#e5e7eb" : "#0f172a",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>👥</span>
              <span>Create Team</span>
            </button>
            <button
              type="button"
              onClick={() => navigate(`/whiteboard/${Date.now()}`)}
              style={{
                padding: "12px 20px",
                borderRadius: 8,
                border: isDark ? "1px solid #374151" : "1px solid #d1d5db",
                backgroundColor: isDark ? "#111827" : "#ffffff",
                color: isDark ? "#e5e7eb" : "#0f172a",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>📋</span>
              <span>Whiteboard</span>
            </button>
          </div>
        </section>

        {/* Summary Cards */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              padding: 24,
              borderRadius: 12,
              backgroundColor: isDark ? "#111827" : "#ffffff",
              border: isDark ? "1px solid #1f2937" : "1px solid #e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  marginBottom: 4,
                  color: isDark ? "#e5e7eb" : "#0f172a",
                }}
              >
                {stats.activeSessions}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: isDark ? "#9ca3af" : "#6b7280",
                  marginBottom: 4,
                }}
              >
                Active Sessions
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#22c55e",
                }}
              >
                +3 today
              </div>
            </div>
            <div
              style={{
                fontSize: 32,
                color: "#2563eb",
              }}
            >
              ⚡
            </div>
          </div>

          <div
            style={{
              padding: 24,
              borderRadius: 12,
              backgroundColor: isDark ? "#111827" : "#ffffff",
              border: isDark ? "1px solid #1f2937" : "1px solid #e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  marginBottom: 4,
                  color: isDark ? "#e5e7eb" : "#0f172a",
                }}
              >
                {stats.teamMembers}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: isDark ? "#9ca3af" : "#6b7280",
                  marginBottom: 4,
                }}
              >
                Team Members
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#22c55e",
                }}
              >
                +2 this week
              </div>
            </div>
            <div
              style={{
                fontSize: 32,
                color: "#2563eb",
              }}
            >
              👥
            </div>
          </div>

          <div
            style={{
              padding: 24,
              borderRadius: 12,
              backgroundColor: isDark ? "#111827" : "#ffffff",
              border: isDark ? "1px solid #1f2937" : "1px solid #e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  marginBottom: 4,
                  color: isDark ? "#e5e7eb" : "#0f172a",
                }}
              >
                {stats.messages}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: isDark ? "#9ca3af" : "#6b7280",
                  marginBottom: 4,
                }}
              >
                Messages
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#22c55e",
                }}
              >
                +48 today
              </div>
            </div>
            <div
              style={{
                fontSize: 32,
                color: "#2563eb",
              }}
            >
              💬
            </div>
          </div>
        </section>

        {/* Recent Sessions */}
        <section style={{ marginBottom: 40 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              <span>🕐</span>
              <span>Recent Sessions</span>
            </div>
            <Link
              to="/workspace/session"
              style={{
                fontSize: 14,
                color: isDark ? "#60a5fa" : "#2563eb",
                textDecoration: "none",
              }}
            >
              View All →
            </Link>
          </div>
          <div
            style={{
              backgroundColor: isDark ? "#111827" : "#ffffff",
              border: isDark ? "1px solid #1f2937" : "1px solid #e5e7eb",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            {[
              {
                name: "Design Sprint Q1",
                participants: 4,
                time: "2 min ago",
                status: "active",
                color: "#22c55e",
              },
              {
                name: "Product Roadmap",
                participants: 6,
                time: "1 hour ago",
                status: "idle",
                color: "#facc15",
              },
              {
                name: "Team Standup",
                participants: 8,
                time: "Yesterday",
                status: "completed",
                color: "#6b7280",
              },
            ].map((session, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  borderBottom:
                    idx < 2
                      ? isDark
                        ? "1px solid #1f2937"
                        : "1px solid #e5e7eb"
                      : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      backgroundColor: session.color,
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 500,
                        marginBottom: 4,
                      }}
                    >
                      {session.name}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: isDark ? "#9ca3af" : "#6b7280",
                      }}
                    >
                      {session.participants} participants • {session.time}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    padding: "4px 10px",
                    borderRadius: 999,
                    backgroundColor: `${session.color}20`,
                    color: session.color,
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  {session.status}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Your Teams */}
        <section>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              <span>👥</span>
              <span>Your Teams</span>
            </div>
            <button
              type="button"
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: isDark ? "1px solid #374151" : "1px solid #d1d5db",
                backgroundColor: isDark ? "#111827" : "#ffffff",
                color: isDark ? "#e5e7eb" : "#0f172a",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
              onClick={() => navigate("/workspace/teams")}
            >
              +
            </button>
          </div>
          <div
            style={{
              backgroundColor: isDark ? "#111827" : "#ffffff",
              border: isDark ? "1px solid #1f2937" : "1px solid #e5e7eb",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            {[
              { name: "Engineering", initial: "E", members: 12 },
              { name: "Design", initial: "D", members: 6 },
              { name: "Marketing", initial: "M", members: 8 },
            ].map((team, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "16px 20px",
                  borderBottom:
                    idx < 2
                      ? isDark
                        ? "1px solid #1f2937"
                        : "1px solid #e5e7eb"
                      : "none",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    backgroundColor: isDark
                      ? "rgba(37,99,235,0.2)"
                      : "rgba(37,99,235,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#2563eb",
                  }}
                >
                  {team.initial}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 500,
                      marginBottom: 4,
                    }}
                  >
                    {team.name}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: isDark ? "#9ca3af" : "#6b7280",
                    }}
                  >
                    {team.members} members
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => navigate("/workspace/teams")}
            style={{
              marginTop: 16,
              padding: "12px 20px",
              borderRadius: 8,
              border: isDark ? "1px solid #374151" : "1px solid #d1d5db",
              backgroundColor: isDark ? "#111827" : "#ffffff",
              color: isDark ? "#e5e7eb" : "#0f172a",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              width: "100%",
            }}
          >
            + Create Team
          </button>
        </section>
      </main>
    </div>
  );
}
