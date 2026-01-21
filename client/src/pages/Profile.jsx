import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getMyTeams } from "../api/teams";
import { useTheme } from "../context/ThemeContext";
import { User, Mail, Save, Loader2 } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const [bio, setBio] = useState("");
  const [teamInfo, setTeamInfo] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Theme Colors
  const colors = {
    bg: isDark ? "#0a0b10" : "#f8fafc",
    textMain: isDark ? "#f8fafc" : "#0f172a",
    textMuted: isDark ? "#94a3b8" : "#64748b",
    primary: "#00d4ff",
    secondary: "#7c3aed",
    border: isDark ? "#1e293b" : "#e2e8f0",
    cardBg: isDark ? "rgba(30, 41, 59, 0.5)" : "#ffffff",
    inputBg: isDark ? "#0f172a" : "#f1f5f9",
    inputBorder: isDark ? "#334155" : "#cbd5e1"
  };

  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem(`profile-bio:${user._id}`);
    if (stored) {
      setBio(stored);
    }

    const loadTeam = async () => {
      try {
        const res = await getMyTeams();
        // Just show the first team for now in the profile
        setTeamInfo(res.data[0] || null);
      } catch (err) {
        console.error("Failed to load team info", err);
      }
    };
    loadTeam();
  }, [user]);

  const saveBio = async () => {
    if (!user) return;
    setIsSaving(true);
    // Simulate API call delay for smoother UX
    await new Promise(resolve => setTimeout(resolve, 600));
    localStorage.setItem(`profile-bio:${user._id}`, bio);
    setIsSaving(false);
  };

  if (!user) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: colors.textMuted,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Loader2 size={24} className="animate-spin" />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "32px 40px",
        backgroundColor: colors.bg,
        color: colors.textMain,
        boxSizing: "border-box",
        fontFamily: "'Inter', sans-serif"
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          marginBottom: 40,
          borderBottom: `1px solid ${colors.border}`,
          paddingBottom: 32,
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 32,
            border: `2px solid ${colors.border}`,
            background: isDark
              ? "radial-gradient(circle at 30% 0, rgba(99,102,241,0.3), rgba(2,6,23,1))"
              : "radial-gradient(circle at 30% 0, rgba(99,102,241,0.2), #ffffff)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 36,
            fontWeight: 800,
            color: colors.primary,
            boxShadow: `0 0 40px ${colors.primary}20`
          }}
        >
          {(user.username || "U")[0]?.toUpperCase()}
        </div>
        <div>
          <h1
            style={{
              margin: 0,
              marginBottom: 8,
              fontSize: 32,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: colors.textMain
            }}
          >
            {user.username || "Your profile"}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: colors.textMuted }}>
            <Mail size={16} />
            <p style={{ margin: 0, fontSize: 15 }}>{user.email}</p>
          </div>
        </div>
      </header>

      <section style={{ maxWidth: 800 }}>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 600,
            marginBottom: 16,
            color: colors.textMain,
            display: "flex",
            alignItems: "center",
            gap: 10
          }}
        >
          <User size={20} color={colors.primary} />
          About Me
        </h2>

        <div style={{ position: "relative" }}>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Add a short bio about what you do and how you like to work..."
            rows={8}
            style={{
              width: "100%",
              backgroundColor: colors.inputBg,
              color: colors.textMain,
              borderRadius: 16,
              border: `1px solid ${colors.inputBorder}`,
              padding: "20px",
              fontSize: 15,
              resize: "vertical",
              outline: "none",
              lineHeight: 1.6,
              transition: "all 0.2s"
            }}
            onFocus={(e) => {
              e.target.style.borderColor = colors.primary;
              e.target.style.boxShadow = `0 0 0 4px ${colors.primary}20`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = colors.inputBorder;
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={saveBio}
            disabled={isSaving}
            style={{
              padding: "12px 28px",
              borderRadius: 12,
              border: "none",
              background: colors.primary,
              color: "#0a0b10",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              opacity: isSaving ? 0.8 : 1,
              transition: "transform 0.1s",
              boxShadow: `0 0 20px ${colors.primary}40`
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.97)"}
            onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isSaving ? "Saving..." : "Save Bio"}
          </button>
        </div>
      </section>
    </div>
  );
}

