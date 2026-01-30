import { useState } from "react";
import { registerUser, loginUser } from "../api/auth";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { joinTeam } from "../api/teams";
import { useTheme } from "../context/ThemeContext";
import { Zap, Mail, Lock, ArrowRight, User, Users, X } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get("inviteCode");
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Color Palette containing the new Cyan
  const colors = {
    primary: "#00d4ff",
    bg: isDark ? "#020617" : "#ffffff",
    textMain: isDark ? "#e5e7eb" : "#0f172a",
    textMuted: isDark ? "#94a3b8" : "#64748b",
    border: isDark ? "#1e293b" : "#e2e8f0",
  };

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setIsLoading(true);
      await registerUser(form);

      // Auto-login after register
      const loginRes = await loginUser({ email: form.email, password: form.password });
      login(loginRes.data);

      if (inviteCode) {
        try {
          await joinTeam({ code: inviteCode });
        } catch (joinErr) {
          console.error("Auto-join failed:", joinErr);
        }
        navigate("/workspace/teams");
      } else {
        navigate("/workspace");
      }
    } catch (err) {
      console.error("REGISTER ERROR:", err.response?.data);
      setError(err.response?.data?.msg || err.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="flex-col-mobile"
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        backgroundColor: colors.bg,
        color: colors.textMain,
        overflow: "hidden",
      }}
    >
      {/* Left Pane - Branding (Hidden on Mobile) */}
      <div
        className="hidden-mobile"
        style={{
          flex: 1,
          backgroundColor: isDark ? "#0b0c15" : "#f8fafc",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          position: "relative",
          overflow: "hidden",
          borderRight: `1px solid ${colors.border}`,
        }}
      >
        {/* ... same branding content as login ... */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `radial-gradient(circle at 10% 20%, ${colors.primary}10 0%, transparent 20%), radial-gradient(circle at 90% 80%, ${colors.primary}10 0%, transparent 20%)`,
          }}
        />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 480 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: colors.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 40,
              boxShadow: `0 0 20px ${colors.primary}66`,
            }}
          >
            <Zap size={28} color="#0a0b10" fill="#0a0b10" />
          </div>

          <h1 style={{ fontSize: 48, fontWeight: 800, marginBottom: 24, lineHeight: 1.1, color: colors.textMain }}>
            Join the future of work.
          </h1>

          <p style={{ fontSize: 18, lineHeight: 1.6, color: colors.textMuted }}>
            Create an account to start collaborating with your team in real-time. Unlimited possibilities await.
          </p>
        </div>
      </div>

      {/* Right Pane - Form */}
      <div
        className="w-full-mobile p-mobile-4"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "40px",
          position: "relative",
          overflowY: "auto",
          backgroundColor: colors.bg,
        }}
      >
        <button
          onClick={() => navigate("/")}
          style={{
            position: "absolute",
            top: 24,
            right: 24,
            background: "transparent",
            border: "none",
            color: colors.textMuted,
            cursor: "pointer",
            zIndex: 10,
            padding: 8,
            borderRadius: "50%",
            transition: "background-color 0.2s, color 0.2s"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";
            e.currentTarget.style.color = colors.textMain;
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = colors.textMuted;
          }}
        >
          <X size={24} />
        </button>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ marginBottom: 32, textAlign: "center" }}>
            {/* Show Logo on mobile only since left pane is hidden */}
            <div
              className="hidden-desktop"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: colors.primary,
                marginBottom: 24,
                boxShadow: `0 0 20px ${colors.primary}66`,
              }}
            >
              <Zap size={24} color="#0a0b10" fill="#0a0b10" />
            </div>

            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: colors.textMain }}>Sign up</h2>
            <p style={{ color: colors.textMuted, fontSize: 14 }}>
              Already have an account?{" "}
              <Link to="/login" style={{ color: colors.primary, textDecoration: "none", fontWeight: 600 }}>
                Sign in
              </Link>
            </p>
          </div>

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {error && (
              <div style={{ padding: "12px", borderRadius: 8, backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", fontSize: 14, border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: colors.textMuted }}>Username</label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: colors.textMuted }}>
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px 16px 12px 40px",
                    borderRadius: 10,
                    border: `1px solid ${colors.border}`,
                    backgroundColor: "rgba(255,255,255,0.03)",
                    color: colors.textMain,
                    fontSize: 15,
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  placeholder="johndoe"
                  onFocus={(e) => e.target.style.borderColor = colors.primary}
                  onBlur={(e) => e.target.style.borderColor = colors.border}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: colors.textMuted }}>Email Address</label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: colors.textMuted }}>
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px 16px 12px 40px",
                    borderRadius: 10,
                    border: `1px solid ${colors.border}`,
                    backgroundColor: "rgba(255,255,255,0.03)",
                    color: colors.textMain,
                    fontSize: 15,
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  placeholder="name@company.com"
                  onFocus={(e) => e.target.style.borderColor = colors.primary}
                  onBlur={(e) => e.target.style.borderColor = colors.border}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: colors.textMuted }}>Password</label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: colors.textMuted }}>
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px 16px 12px 40px",
                    borderRadius: 10,
                    border: `1px solid ${colors.border}`,
                    backgroundColor: "rgba(255,255,255,0.03)",
                    color: colors.textMain,
                    fontSize: 15,
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  placeholder="••••••••"
                  onFocus={(e) => e.target.style.borderColor = colors.primary}
                  onBlur={(e) => e.target.style.borderColor = colors.border}
                />
              </div>
            </div>

            {inviteCode ? (
              <div style={{ padding: 12, background: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9", borderRadius: 8, fontSize: 13, color: colors.textMuted, textAlign: "center" }}>
                Joining team with code: <strong style={{ color: colors.textMain }}>{inviteCode}</strong>
              </div>
            ) : (
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: colors.textMuted }}>Invite Code (Optional)</label>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: colors.textMuted }}>
                    <Users size={18} />
                  </div>
                  <input
                    type="text"
                    value={inviteCode || ""}
                    onChange={(e) => { }}
                    readOnly={!!inviteCode}
                    style={{
                      width: "100%",
                      padding: "12px 16px 12px 40px",
                      borderRadius: 10,
                      border: `1px solid ${colors.border}`,
                      backgroundColor: "rgba(255,255,255,0.03)",
                      color: colors.textMain,
                      fontSize: 15,
                      outline: "none",
                      transition: "border-color 0.2s",
                    }}
                    placeholder="Enter code to join a team"
                    onFocus={(e) => e.target.style.borderColor = colors.primary}
                    onBlur={(e) => e.target.style.borderColor = colors.border}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: 8,
                padding: "14px",
                borderRadius: 10,
                border: "none",
                backgroundColor: colors.primary,
                color: "#0a0b10",
                fontSize: 15,
                fontWeight: 600,
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "transform 0.1s",
              }}
              onMouseDown={(e) => !isLoading && (e.currentTarget.style.transform = "scale(0.98)")}
              onMouseUp={(e) => !isLoading && (e.currentTarget.style.transform = "scale(1)")}
            >
              {isLoading ? "Creating account..." : (inviteCode ? "Register & Join Team" : "Sign Up")}
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
