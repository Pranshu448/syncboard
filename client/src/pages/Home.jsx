import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useEffect } from "react";

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Redirect logged-in users to dashboard
  useEffect(() => {
    if (user) {
      navigate("/workspace", { replace: true });
    }
  }, [user, navigate]);

  // Show loading or nothing while redirecting
  if (user) {
    return null;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: isDark
          ? "radial-gradient(circle at top left, rgba(37,99,235,0.45), transparent 55%), radial-gradient(circle at top right, rgba(34,197,94,0.25), transparent 50%), linear-gradient(180deg, #020617, #030712)"
          : "radial-gradient(circle at top left, rgba(59,130,246,0.15), transparent 55%), radial-gradient(circle at top right, rgba(34,197,94,0.12), transparent 50%), linear-gradient(180deg, #f9fafb, #e5e7eb)",
        color: isDark ? "#e5e7eb" : "#0f172a",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Top navigation */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 32px",
          borderBottom: "1px solid rgba(148, 163, 184, 0.18)",
          backdropFilter: "blur(8px)",
          position: "sticky",
          top: 0,
          zIndex: 10,
          backgroundColor: isDark
          ? "rgba(2,6,23,0.7)"
          : "rgba(255,255,255,0.75)",
          boxShadow: isDark
          ? "none"
          : "0 4px 20px rgba(15,23,42,0.06)",


        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "999px",
              background:
                "linear-gradient(135deg, #2563eb, #22c55e)",
            }}
          />
          <span
            style={{
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              fontSize: 13,
              color: isDark ? "#e5e7eb" : "#0f172a",
            }}
          >
            WorkSpace
          </span>
        </div>

        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 14,
            color: isDark ? "#94a3b8" : "#64748b",
          }}
        >
          <a href="#features" style={{ textDecoration: "none", color: "inherit" }}>
            Features
          </a>
          <a href="#collaboration" style={{ textDecoration: "none", color: "inherit" }}>
            Collaboration
          </a>
          <a href="#security" style={{ textDecoration: "none", color: "inherit" }}>
            Security
          </a>

          {user ? (
            <>
              <Link
                to="/workspace/teams"
                style={{
                  padding: "8px 16px",
                  borderRadius: 999,
                  border: "1px solid rgba(148, 163, 184, 0.35)",
                  color: isDark ? "#e5e7eb" : "#0f172a",
                  textDecoration: "none",
                  fontWeight: 500,
                  marginLeft: 8,
                  background:
                    "linear-gradient(135deg, rgba(37,99,235,0.55), rgba(79,70,229,0.55))",
                }}
              >
                Open workspace
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                style={{
                  padding: "8px 14px",
                  borderRadius: 999,
                  border: "1px solid rgba(148,163,184,0.4)",
                  backgroundColor: isDark ? "transparent" : "#ffffff",
                  color: isDark ? "#e5e7eb" : "#0f172a",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                style={{
                  padding: "8px 16px",
                  borderRadius: 999,
                  border: "1px solid transparent",
                  color: isDark ? "#e5e7eb" : "#0f172a",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                Log in
              </Link>
              <Link
                to="/register"
                style={{
                  padding: "8px 18px",
                  borderRadius: 999,
                  border: "none",
                  background:
                    "linear-gradient(135deg, #2563eb, #4f46e5)",
                  color: "#ffffff",
                  textDecoration: "none",
                  fontWeight: 600,
                  boxShadow: "0 10px 20px rgba(37, 99, 235, 0.25)",
                }}
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero section */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "48px 16px 80px",
        }}
      >
        <section
          style={{
            width: "100%",
            maxWidth: 1120,
            display: "grid",
            gridTemplateColumns: "minmax(0, 2fr) minmax(0, 3fr)",
            gap: 40,
            alignItems: "center",
          }}
        >
          {/* Left column: copy */}
          <div>
            <p
              style={{
                fontSize: 13,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: isDark ? "#a5b4fc" : "#6366f1",
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              Real‑time teamwork hub
            </p>

            <h1
              style={{
                fontSize: 44,
                lineHeight: 1.1,
                marginBottom: 16,
                color: isDark ? "#f8fafc" : "#0f172a",
              }}
            >
              Chat, create & plan in one shared workspace.
            </h1>

            <p
              style={{
                fontSize: 15,
                lineHeight: 1.6,
                color: isDark ? "#94a3b8" : "#4b5563",
                maxWidth: 460,
                marginBottom: 24,
              }}
            >
              Bring your team, clients and projects together with fast messaging
              and a collaborative whiteboard designed for deep work. Everything
              stays in sync, so no one misses the details.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
              <Link
                to={user ? "/workspace/teams" : "/register"}
                style={{
                  padding: "12px 24px",
                  borderRadius: 999,
                  border: "none",
                  background:
                    "linear-gradient(135deg, #2563eb, #4f46e5)",
                  color: "white",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: 15,
                  boxShadow: "0 18px 40px rgba(37, 99, 235, 0.35)",
                }}
              >
                {user ? "Go to your workspace" : "Create your workspace"}
              </Link>

              {!user && (
                <Link
                  to="/login"
                  style={{
                    padding: "12px 20px",
                    borderRadius: 999,
                    border: "1px solid rgba(148, 163, 184, 0.7)",
                    color: isDark ? "#e5e7eb" : "#0f172a",
                    textDecoration: "none",
                    fontWeight: 500,
                    fontSize: 14,
                    backgroundColor: isDark ? "rgba(2,6,23,0.6)" : "#ffffff",
                  }}
                >
                  I already have an account
                </Link>
              )}
            </div>

            <div
              style={{
                display: "flex",
                gap: 16,
                fontSize: 12,
                color: isDark ? "#94a3b8" : "#64748b",
              }}
            >
              <div>
                <strong style={{ color: isDark ? "#e5e7eb" : "#0f172a" }}>
                  Instant messaging
                </strong>
                <p style={{ marginTop: 4 }}>
                  Threaded conversations that keep decisions and context together.
                </p>
              </div>
              <div>
                <strong style={{ color: isDark ? "#e5e7eb" : "#0f172a" }}>
                  Live whiteboard
                </strong>
                <p style={{ marginTop: 4 }}>
                  Sketch ideas together in real time from anywhere.
                </p>
              </div>
            </div>
          </div>

          {/* Right column: visual mock of app */}
          <div
            style={{
              position: "relative",
              padding: 20,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 32,
                background:
                  "radial-gradient(circle at top left, rgba(59,130,246,0.2), transparent 60%)",
                filter: "blur(20px)",
                opacity: 0.9,
              }}
            />
            <div
              style={{
                position: "relative",
                borderRadius: 24,
                border: "1px solid rgba(148, 163, 184, 0.4)",
                backgroundColor: "rgba(15,23,42,0.98)",
                padding: 18,
                boxShadow:
                  "0 24px 60px rgba(15, 23, 42, 0.7)",
                color: "white",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <div style={{ display: "flex", gap: 6 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      backgroundColor: "#f97316",
                    }}
                  />
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      backgroundColor: "#22c55e",
                    }}
                  />
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      backgroundColor: "#6366f1",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 11,
                    color: "#9ca3af",
                  }}
                >
                  Live session · 4 collaborators
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "120px 1fr",
                  gap: 16,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    borderRight: "1px solid rgba(75,85,99,0.7)",
                    paddingRight: 12,
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.18em",
                      color: "#9ca3af",
                      marginBottom: 8,
                    }}
                  >
                    Channels
                  </p>
                  <ul
                    style={{
                      listStyle: "none",
                      margin: 0,
                      padding: 0,
                      fontSize: 12,
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <li style={{ color: "#e5e7eb" }}>💬 team-chat</li>
                    <li style={{ color: "#9ca3af" }}>📌 standup-notes</li>
                    <li style={{ color: "#9ca3af" }}>🎨 whiteboard</li>
                    <li style={{ color: "#9ca3af" }}>📁 project-files</li>
                  </ul>
                </div>

                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "999px",
                          background:
                            "linear-gradient(135deg, #22c55e, #14b8a6)",
                        }}
                      />
                      <div>
                        <p style={{ margin: 0, fontSize: 13 }}>Product sync</p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 11,
                            color: "#9ca3af",
                          }}
                        >
                          Today · 3:00 PM
                        </p>
                      </div>
                    </div>
                    <span
                      style={{
                        borderRadius: 999,
                        padding: "2px 8px",
                        backgroundColor: "rgba(34,197,94,0.14)",
                        color: "#bbf7d0",
                        fontSize: 10,
                      }}
                    >
                      Live
                    </span>
                  </div>

                  <div
                    style={{
                      borderRadius: 14,
                      backgroundColor: "rgba(15,23,42,0.9)",
                      border: "1px solid rgba(55,65,81,0.9)",
                      padding: 10,
                      minHeight: 120,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      fontSize: 12,
                    }}
                  >
                    <div
                      style={{
                        alignSelf: "flex-start",
                        padding: "6px 10px",
                        borderRadius: 999,
                        backgroundColor: "rgba(31,41,55,1)",
                      }}
                    >
                      Let's use the whiteboard to sketch flows before we commit.
                    </div>
                    <div
                      style={{
                        alignSelf: "flex-end",
                        padding: "6px 10px",
                        borderRadius: 999,
                        background:
                          "linear-gradient(135deg, #6366f1, #0ea5e9)",
                      }}
                    >
                      Agreed — I’ll open a room and drop the link here.
                    </div>
                    <div
                      style={{
                        alignSelf: "flex-start",
                        padding: "6px 10px",
                        borderRadius: 999,
                        backgroundColor: "rgba(31,41,55,1)",
                      }}
                    >
                      Perfect, capture final decisions as checklists.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature strip */}
        <section
          id="features"
          style={{
            width: "100%",
            maxWidth: 1120,
            marginTop: 64,
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 24,
          }}
        >
          <div
            style={{
              padding: 20,
              borderRadius: 16,
              backgroundColor: isDark
                ? "rgba(2,6,23,0.65)"
                : "rgba(255,255,255,0.85)",
              border: isDark
                ? "1px solid rgba(148, 163, 184, 0.18)"
                : "1px solid rgba(15,23,42,0.08)",
              boxShadow: isDark
                ? "none"
                : "0 10px 30px rgba(15,23,42,0.06)",

            }}
          >
            <h3 style={{ margin: 0, marginBottom: 8, fontSize: 16 }}>
              Centralized conversations
            </h3>
            <p style={{ margin: 0, fontSize: 14, color: isDark ? "#94a3b8" : "#475569"}}>
              Keep project updates, decisions and context in one place instead of
              scattered across tools.
            </p>
          </div>

          <div
            id="collaboration"
            style={{
              padding: 20,
              borderRadius: 16,
              backgroundColor: isDark
                ? "rgba(2,6,23,0.65)"
                : "rgba(255,255,255,0.85)",
              border: isDark
                ? "1px solid rgba(148, 163, 184, 0.18)"
                : "1px solid rgba(15,23,42,0.08)",
              boxShadow: isDark
                ? "none"
                : "0 10px 30px rgba(15,23,42,0.06)",

            }}
          >
            <h3 style={{ margin: 0, marginBottom: 8, fontSize: 16 }}>
              Real‑time collaboration
            </h3>
            <p style={{ margin: 0, fontSize: 14, color: isDark ? "#94a3b8" : "#475569" }}>
              Chat and whiteboard updates are synced instantly, so remote teams
              feel co‑located.
            </p>
          </div>

          <div
            id="security"
            style={{
              padding: 20,
              borderRadius: 16,
              backgroundColor: isDark
                ? "rgba(2,6,23,0.65)"
                : "rgba(255,255,255,0.85)",
              border: isDark
                ? "1px solid rgba(148, 163, 184, 0.18)"
                : "1px solid rgba(15,23,42,0.08)",
              boxShadow: isDark
                ? "none"
                : "0 10px 30px rgba(15,23,42,0.06)",

            }}
          >
            <h3 style={{ margin: 0, marginBottom: 8, fontSize: 16 }}>
              Secure by design
            </h3>
            <p style={{ margin: 0, fontSize: 14, color: isDark ? "#94a3b8" : "#475569" }}>
              Authenticated access, private rooms and role‑based control keep
              your work where it belongs.
            </p>
          </div>
        </section>
      </main>

      <footer
        style={{
          padding: "16px 24px 24px",
          borderTop: "1px solid rgba(148, 163, 184, 0.18)",
          fontSize: 12,
          color: isDark ? "#9ca3af" : "#64748b",
          textAlign: "center",
          backgroundColor: isDark
            ? "rgba(2,6,23,0.65)"
            : "rgba(248,250,252,0.9)",
          backdropFilter: "blur(6px)",

        }}
      >
        <span>© {new Date().getFullYear()} WorkSpace · Built for modern teams.</span>
      </footer>
    </div>
  );
}
