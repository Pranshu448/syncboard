import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Zap, Shield, Users, MessageSquare, Lock, Layout, MousePointer2, Video, PenTool, Key, Eye, CheckCircle, Server } from "lucide-react";

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Lovable Design Colors
  const colors = {
    bg: isDark ? "#0a0b10" : "#ffffff",
    primary: "#00d4ff",
    secondary: "#7c3aed",
    textMain: isDark ? "#f0f2f5" : "#111827",
    textMuted: isDark ? "#94a3b8" : "#64748b",
    border: isDark ? "#272935" : "#e2e8f0",
  };

  const noiseBg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: colors.bg,
        color: colors.textMain,
        fontFamily: "'Inter', system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Noise Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: noiseBg,
          opacity: isDark ? 0.4 : 0.2, // increased opacity for visibility
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Floating Blobs */}
      {isDark && (
        <>
          <div
            style={{
              position: "absolute",
              top: "20%",
              left: "15%",
              width: "500px",
              height: "500px",
              background: `radial-gradient(circle, ${colors.primary} 0%, transparent 70%)`,
              opacity: 0.08,
              filter: "blur(80px)",
              zIndex: 0,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "10%",
              right: "10%",
              width: "600px",
              height: "600px",
              background: `radial-gradient(circle, ${colors.secondary} 0%, transparent 70%)`,
              opacity: 0.06,
              filter: "blur(100px)",
              zIndex: 0,
            }}
          />
        </>
      )}

      {/* Top navigation */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 32px",
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(12px)",
          backgroundColor: isDark ? "rgba(10, 11, 16, 0.6)" : "rgba(255, 255, 255, 0.7)",
          borderBottom: `1px solid ${isDark ? "rgba(39, 41, 53, 0.5)" : "rgba(226, 232, 240, 0.6)"}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: colors.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 0 15px ${colors.primary}66`, // Neon glow
            }}
          >
            <Zap size={20} color="#0a0b10" fill="#0a0b10" />
          </div>
          <span
            style={{
              fontWeight: 800,
              className: "tracking-tight", // simulates tracking-tight
              letterSpacing: "-0.025em",
              fontSize: 18,
              color: colors.textMain,
            }}
          >
            SYNCBOARD
          </span>
        </div>

        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: 32,
            fontSize: 14,
            fontWeight: 500,
            color: colors.textMuted,
          }}
        >
          {/* Hidden on small screens normally, but we keep it simple */}
          {["Features", "Collaboration", "Security"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              style={{
                textDecoration: "none",
                color: "inherit",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = colors.textMain)}
              onMouseLeave={(e) => (e.currentTarget.style.color = colors.textMuted)}
            >
              {item}
            </a>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {user ? (
            <>
              <Link
                to="/workspace/teams"
                style={{
                  textDecoration: "none",
                  color: colors.textMain,
                  fontSize: 14,
                  fontWeight: 500
                }}
              >
                Open Workspace
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  backgroundColor: "transparent",
                  color: colors.textMuted,
                  fontSize: 14,
                  cursor: "pointer",
                  border: "none"
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
                  textDecoration: "none",
                  color: colors.textMuted,
                  fontSize: 14,
                  fontWeight: 500,
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = colors.textMain)}
                onMouseLeave={(e) => (e.currentTarget.style.color = colors.textMuted)}
              >
                Log in
              </Link>
              <Link
                to="/register"
                style={{
                  padding: "8px 20px",
                  borderRadius: 10,
                  border: "none",
                  background: colors.primary,
                  color: "#0a0b10",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: 14,
                  boxShadow: `0 4px 12px ${colors.primary}40`,
                  transition: "all 0.2s",
                }}
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero section */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "64px 24px 80px",
          zIndex: 1,
        }}
      >
        <section
          style={{
            width: "100%",
            maxWidth: 1200,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 64,
            alignItems: "center",
          }}
        >
          {/* Left column: copy */}
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                borderRadius: 999,
                backgroundColor: isDark ? "rgba(0, 212, 255, 0.1)" : "rgba(0, 212, 255, 0.05)",
                border: `1px solid ${colors.primary}33`,
                marginBottom: 24,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: colors.primary, boxShadow: `0 0 8px ${colors.primary}` }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: colors.primary, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Real-time teamwork hub
              </span>
            </div>

            <h1
              style={{
                fontSize: 56,
                lineHeight: 1.1,
                fontWeight: 800,
                letterSpacing: "-0.03em",
                marginBottom: 20,
                color: colors.textMain,
              }}
            >
              Chat, create & plan in one <span style={{ color: colors.textMuted }}>shared workspace.</span>
            </h1>

            <p
              style={{
                fontSize: 18,
                lineHeight: 1.6,
                color: colors.textMuted,
                maxWidth: 480,
                marginBottom: 32,
              }}
            >
              Bring your team together with lightning-fast messaging and powerful collaboration tools. Everything stays in sync, instantly.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 40 }}>
              <Link
                to={user ? "/workspace/teams" : "/register"}
                style={{
                  padding: "14px 28px",
                  borderRadius: 12,
                  border: "none",
                  background: colors.primary,
                  color: "#0a0b10",
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: 15,
                  boxShadow: `0 0 20px ${colors.primary}50`,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {user ? "Go to workspace" : "Create your workspace"}
                <Zap size={18} fill="#0a0b10" />
              </Link>

              {!user && (
                <Link
                  to="/login"
                  style={{
                    padding: "14px 28px",
                    borderRadius: 12,
                    border: `1px solid ${colors.border}`,
                    color: colors.textMain,
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: 15,
                    backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
                  }}
                >
                  Sign in
                </Link>
              )}
            </div>

            <div
              style={{
                display: "flex",
                gap: 24,
                fontSize: 13,
                color: colors.textMuted,
              }}
            >
              <div style={{ display: "flex", gap: 8 }}>
                <CheckIcon color={colors.primary} />
                <span>Instant messaging</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <CheckIcon color={colors.primary} />
                <span>Live whiteboard</span>
              </div>
            </div>
          </div>

          {/* Right column: Glass Card Preview */}
          <div
            style={{
              position: "relative",
            }}
          >
            {/* Glow backing */}
            <div
              style={{
                position: "absolute",
                inset: -20,
                background: `radial-gradient(closest-side, ${colors.primary}33, transparent)`,
                filter: "blur(40px)",
                zIndex: 0,
              }}
            />

            <div
              style={{
                position: "relative",
                borderRadius: 24,
                backgroundColor: isDark ? "rgba(20, 22, 30, 0.6)" : "rgba(255, 255, 255, 0.8)",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"}`,
                padding: 24,
                backdropFilter: "blur(20px)",
                boxShadow: isDark ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)" : "0 20px 40px -10px rgba(0,0,0,0.1)",
                zIndex: 1,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                  paddingBottom: 20,
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#eab308" }} />
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e" }} />
                </div>
                <div style={{ fontSize: 12, color: colors.textMuted, display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e" }} />
                  Live Session
                </div>
              </div>

              <div style={{ display: "flex", gap: 20 }}>
                {/* Sidebar Mock */}
                <div style={{ width: 60, display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${colors.primary}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <MessageSquare size={18} color={colors.primary} />
                  </div>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Layout size={18} color={colors.textMuted} />
                  </div>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Users size={18} color={colors.textMuted} />
                  </div>
                </div>

                {/* Content Mock */}
                <div style={{ flex: 1, backgroundColor: isDark ? "#0a0b10" : "#f1f5f9", borderRadius: 16, padding: 16, border: `1px solid ${colors.border}` }}>
                  <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #f472b6, #db2777)" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 8, width: "40%", background: colors.textMain, borderRadius: 4, marginBottom: 6, opacity: 0.2 }} />
                      <div style={{ height: 6, width: "70%", background: colors.textMuted, borderRadius: 4, opacity: 0.2 }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                      <div style={{ height: 8, width: "50%", background: colors.primary, borderRadius: 4, marginBottom: 6, opacity: 0.8 }} />
                      <div style={{ height: 6, width: "30%", background: colors.textMuted, borderRadius: 4, opacity: 0.2 }} />
                    </div>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #60a5fa, #3b82f6)" }} />
                  </div>

                  {/* Cursor Mock */}
                  <div style={{ position: "absolute", bottom: 40, right: 80, display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderBottom: `10px solid ${colors.primary}`, transform: "rotate(-45deg)" }} />
                    <span style={{ fontSize: 10, background: colors.primary, color: "#000", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>Sarah</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature strip (Cards) */}
        <section
          id="features"
          style={{
            width: "100%",
            maxWidth: 1200,
            marginTop: 120,
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 32,
          }}
        >
          {[
            { title: "Real-time Sync", icon: Zap, desc: "Changes happen instantly across all devices. No refresh needed." },
            { title: "Team Channels", icon: Users, desc: "Organized spaces for every project and department." },
            { title: "Enterprise Security", icon: Shield, desc: "Bank-grade encryption and advanced permission controls." },
          ].map((feature, i) => (
            <div
              key={i}
              style={{
                padding: 32,
                borderRadius: 20,
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.6)",
                border: `1px solid ${colors.border}`,
                backdropFilter: "blur(10px)",
                transition: "transform 0.2s",
                cursor: "default"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: isDark ? "rgba(0, 212, 255, 0.1)" : "rgba(0, 212, 255, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
                color: colors.primary
              }}>
                <feature.icon size={24} />
              </div>
              <h3 style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 600, color: colors.textMain }}>
                {feature.title}
              </h3>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: colors.textMuted }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </section>

        {/* Collaboration Section */}
        <section
          id="collaboration"
          style={{
            width: "100%",
            maxWidth: 1200,
            marginTop: 160,
            marginBottom: 80,
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: 80,
            alignItems: "center",
          }}
        >
          {/* Left: Visual Board Mock */}
          <div style={{ position: "relative" }}>
            {/* Glow effect behind */}
            <div
              style={{
                position: "absolute",
                inset: -20,
                background: `radial-gradient(closest-side, ${colors.primary}20, transparent)`,
                filter: "blur(60px)",
                zIndex: 0,
              }}
            />

            <div
              style={{
                position: "relative",
                borderRadius: 24,
                backgroundColor: isDark ? "#111218" : "#ffffff",
                border: `1px solid ${colors.border}`,
                aspectRatio: "16/10",
                overflow: "hidden",
                boxShadow: isDark ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)" : "0 20px 40px -10px rgba(0,0,0,0.1)",
                zIndex: 1,
              }}
            >
              {/* Grid Background */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: `linear-gradient(${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} 1px, transparent 1px)`,
                  backgroundSize: "40px 40px",
                  opacity: 0.5,
                }}
              />

              {/* Online Badge */}
              <div
                style={{
                  position: "absolute",
                  top: 20,
                  right: 20,
                  backgroundColor: colors.primary,
                  color: "#0a0b10",
                  padding: "4px 12px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  boxShadow: `0 0 10px ${colors.primary}66`,
                }}
              >
                3 online
              </div>

              {/* Board Elements */}
              <div style={{ position: "absolute", top: "25%", left: "15%", width: 100, height: 60, border: `2px solid ${colors.primary}`, borderRadius: 12, boxShadow: `0 0 15px ${colors.primary}33` }} />

              <div style={{ position: "absolute", top: "35%", left: "40%" }}>
                <svg width="60" height="20" viewBox="0 0 60 20" fill="none" stroke={colors.textMuted} strokeWidth="2">
                  <path d="M0 10 H50 M45 5 L50 10 L45 15" />
                </svg>
              </div>

              <div style={{ position: "absolute", top: "25%", right: "15%", width: 80, height: 80, border: "2px solid #a855f7", borderRadius: "50%", boxShadow: "0 0 15px rgba(168, 85, 247, 0.3)" }} />

              <div style={{ position: "absolute", bottom: "35%", left: "30%", width: 120, height: 40, border: "2px solid #ec4899", borderRadius: 20, boxShadow: "0 0 15px rgba(236, 72, 153, 0.3)" }} />

              {/* Cursors */}
              <div style={{ position: "absolute", top: "25%", right: "25%" }}>
                <MousePointer2 size={24} fill="#22c55e" color="#0a0b10" style={{ transform: "rotate(-15deg)" }} />
                <div style={{ marginLeft: 16, marginTop: -4, backgroundColor: "#22c55e", color: "#000", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700 }}>Alex</div>
              </div>

              <div style={{ position: "absolute", bottom: "38%", left: "28%" }}>
                <MousePointer2 size={24} fill="#3b82f6" color="#0a0b10" style={{ transform: "rotate(-15deg)" }} />
                <div style={{ marginLeft: 16, marginTop: -4, backgroundColor: "#3b82f6", color: "#fff", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700 }}>Sam</div>
              </div>

              {/* Toolbar */}
              <div
                style={{
                  position: "absolute",
                  bottom: 24,
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  gap: 8,
                  padding: "8px 16px",
                  borderRadius: 16,
                  backgroundColor: isDark ? "rgba(30,32,40,0.8)" : "rgba(255,255,255,0.9)",
                  border: `1px solid ${colors.border}`,
                  backdropFilter: "blur(8px)",
                }}
              >
                {[Video, MessageSquare, PenTool, Users].map((Icon, i) => (
                  <div key={i} style={{ padding: 8, borderRadius: 8, cursor: "pointer", color: colors.textMuted }}>
                    <Icon size={18} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Content */}
          <div>
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: colors.primary,
                marginBottom: 16,
              }}
            >
              Collaboration
            </p>
            <h2
              style={{
                fontSize: 40,
                lineHeight: 1.1,
                fontWeight: 800,
                color: colors.textMain,
                marginBottom: 24,
                letterSpacing: "-0.02em",
              }}
            >
              Work together like you're in <br />
              <span style={{ color: colors.textMuted }}>the same room</span>
            </h2>
            <p
              style={{
                fontSize: 16,
                lineHeight: 1.6,
                color: colors.textMuted,
                marginBottom: 40,
              }}
            >
              See who's online, follow their cursor in real-time, and collaborate on the same canvas. No more version conflicts or waiting for updates to sync.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              {[
                { title: "Real-time cursors", desc: "See exactly where your teammates are working with live cursor tracking." },
                { title: "Instant sync", desc: "Every change is synced in milliseconds. What you see is what everyone sees." },
                { title: "Presence awareness", desc: "Know who's online and what they're working on at a glance." }
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 20 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      fontWeight: 700,
                      color: colors.primary,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <h4 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 600, color: colors.textMain }}>{item.title}</h4>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: colors.textMuted }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section
          id="security"
          style={{
            width: "100%",
            maxWidth: 1200,
            marginBottom: 160,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 64,
            alignItems: "center",
          }}
        >
          {/* Left: Content & Grid Cards */}
          <div>
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: colors.primary,
                marginBottom: 16,
              }}
            >
              Security
            </p>
            <h2
              style={{
                fontSize: 40,
                lineHeight: 1.1,
                fontWeight: 800,
                color: colors.textMain,
                marginBottom: 24,
                letterSpacing: "-0.02em",
              }}
            >
              Built with security <br />
              <span style={{ color: colors.textMuted }}>at its core</span>
            </h2>
            <p
              style={{
                fontSize: 16,
                lineHeight: 1.6,
                color: colors.textMuted,
                marginBottom: 40,
                maxWidth: 480,
              }}
            >
              Your data is protected with industry-standard practices. We take privacy seriously so you can focus on building.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {[
                { title: "Secure Auth", desc: "JWT-based stateless authentication.", icon: Lock },
                { title: "Role-based Access", desc: "Fine-grained team permissions.", icon: Key },
                { title: "Private Spaces", desc: "Isolated team environments.", icon: Layout },
                { title: "Data Protection", desc: "Encrypted data transmission.", icon: Shield },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    padding: 24,
                    borderRadius: 16,
                    backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.6)",
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <item.icon size={24} color={colors.primary} style={{ marginBottom: 16 }} />
                  <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 600, color: colors.textMain }}>{item.title}</h3>
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: colors.textMuted }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Security Dashboard Mock */}
          <div style={{ position: "relative" }}>
            <div
              style={{
                position: "absolute",
                inset: -20,
                background: `radial-gradient(closest-side, ${colors.primary}15, transparent)`,
                filter: "blur(60px)",
                zIndex: 0,
              }}
            />

            <div
              style={{
                position: "relative",
                borderRadius: 24,
                backgroundColor: isDark ? "#111218" : "#ffffff",
                border: `1px solid ${colors.border}`,
                padding: 32,
                boxShadow: isDark ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)" : "0 20px 40px -10px rgba(0,0,0,0.1)",
                zIndex: 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: isDark ? "rgba(0, 212, 255, 0.1)" : "rgba(0, 212, 255, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Shield size={24} color={colors.primary} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: colors.textMain }}>Security Dashboard</h3>
                  <p style={{ margin: 0, fontSize: 13, color: colors.textMuted }}>All systems operational</p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
                {[
                  { label: "Data Encryption", status: "Active", color: "#22c55e" },
                  { label: "Secure Authentication", status: "Enabled", color: "#22c55e" },
                  { label: "Socket Connection", status: "Secured", color: "#22c55e" },
                  { label: "System Status", status: "Online", color: colors.textMuted },
                ].map((row, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "16px 20px",
                      borderRadius: 12,
                      backgroundColor: isDark ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.03)",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <CheckCircle size={16} color={row.color === colors.textMuted ? row.color : "#22c55e"} />
                      <span style={{ fontSize: 14, color: colors.textMain, fontWeight: 500 }}>{row.label}</span>
                    </div>
                    <span style={{ fontSize: 13, color: row.color, fontWeight: 600 }}>{row.status}</span>
                  </div>
                ))}
              </div>

              <div style={{ paddingTop: 20, borderTop: `1px solid ${colors.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: colors.textMuted }}>Overall security score</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#22c55e" }}>98/100</span>
                </div>
                <div style={{ height: 6, width: "100%", backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: "98%", backgroundColor: "#22c55e", borderRadius: 999 }} />
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* CTA Section */}
        <section
          style={{
            width: "100%",
            maxWidth: 1000,
            margin: "0 auto",
            marginBottom: 100,
            padding: "80px 24px",
            textAlign: "center",
            position: "relative",
          }}
        >
          {/* Glow Effect */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "60%",
              height: "100%",
              background: `radial-gradient(circle, ${colors.primary}15 0%, transparent 60%)`,
              filter: "blur(60px)",
              zIndex: 0,
            }}
          />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 18,
                backgroundColor: isDark ? "rgba(0, 212, 255, 0.1)" : "rgba(0, 212, 255, 0.1)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 32,
                boxShadow: `0 0 30px ${colors.primary}33`,
              }}
            >
              <Zap size={32} color={colors.primary} fill={colors.primary} />
            </div>

            <h2
              style={{
                fontSize: 48,
                fontWeight: 800,
                color: colors.textMain,
                marginBottom: 24,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
              }}
            >
              Ready to transform how your <br />
              team works?
            </h2>

            <p
              style={{
                fontSize: 18,
                lineHeight: 1.6,
                color: colors.textMuted,
                marginBottom: 40,
                maxWidth: 600,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              Join thousands of teams already using Workspace to collaborate more effectively. Start free, upgrade when you're ready.
            </p>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <Link
                to={user ? "/workspace/teams" : "/register"}
                style={{
                  padding: "16px 32px",
                  borderRadius: 12,
                  border: "none",
                  background: colors.primary,
                  color: "#0a0b10",
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: 16,
                  boxShadow: `0 0 25px ${colors.primary}66`,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "transform 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                Get started for free
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>

              <p style={{ fontSize: 13, color: colors.textMuted, opacity: 0.8 }}>
                Free plan includes unlimited users · No credit card required
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer
        style={{
          padding: "40px",
          borderTop: `1px solid ${colors.border}`,
          fontSize: 14,
          color: colors.textMuted,
          textAlign: "center",
          backgroundColor: isDark ? "#0a0b10" : "#ffffff",
        }}
      >
        <span>© {new Date().getFullYear()} Syncboard Inc.</span>
      </footer>
    </div >
  );
}

function CheckIcon({ color }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
