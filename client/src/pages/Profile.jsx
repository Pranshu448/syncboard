import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getMyTeams } from "../api/teams";
import { useTheme } from "../context/ThemeContext";

export default function Profile() {
  const { user } = useAuth();
  const [bio, setBio] = useState("");
  const [teamInfo, setTeamInfo] = useState(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

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

  const saveBio = () => {
    if (!user) return;
    localStorage.setItem(`profile-bio:${user._id}`, bio);
  };

  if (!user) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#e5e7eb",
        }}
      >
        Loading profile...
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "24px 32px",
        backgroundColor: isDark ? "#020617" : "#f3f4f6",
        color: isDark ? "#e5e7eb" : "#0f172a",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          marginBottom: 24,
          borderBottom: isDark ? "1px solid #111827" : "1px solid #e5e7eb",
          paddingBottom: 16,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "999px",
            border: isDark
              ? "1px solid rgba(148, 163, 184, 0.5)"
              : "1px solid rgba(129,140,248,0.7)",
            background: isDark
              ? "radial-gradient(circle at 30% 0, rgba(99,102,241,0.75), rgba(2,6,23,1))"
              : "radial-gradient(circle at 30% 0, #6366f1, #e0f2fe)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 26,
            fontWeight: 800,
            color: "#e5e7eb",
          }}
        >
          {(user.username || "U")[0]?.toUpperCase()}
        </div>
        <div>
          <h1
            style={{
              margin: 0,
              marginBottom: 4,
              fontSize: 24,
            }}
          >
            {user.username || "Your profile"}
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: isDark ? "#9ca3af" : "#6b7280",
            }}
          >
            {user.email}
          </p>
        </div>
      </header>

      <section style={{ maxWidth: 640 }}>
        {teamInfo?.code && (
          <div
            style={{
              marginBottom: 16,
              padding: "10px 14px",
              borderRadius: 12,
              border: isDark
                ? "1px dashed rgba(148,163,184,0.6)"
                : "1px dashed rgba(148,163,184,0.8)",
              backgroundColor: isDark ? "rgba(15,23,42,0.8)" : "#ffffff",
              fontSize: 13,
              color: isDark ? "#cbd5f5" : "#1e293b",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Team ID</div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <span style={{ letterSpacing: "0.12em" }}>{teamInfo.code}</span>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(teamInfo.code)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: isDark
                    ? "1px solid rgba(148,163,184,0.8)"
                    : "1px solid rgba(129,140,248,0.8)",
                  background: isDark ? "transparent" : "#eff6ff",
                  color: isDark ? "#e5e7eb" : "#1e293b",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Copy
              </button>
            </div>
          </div>
        )}

        <h2
          style={{
            fontSize: 16,
            marginBottom: 8,
          }}
        >
          Bio
        </h2>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Add a short bio about what you do and how you like to work..."
          rows={8}
          style={{
            width: "100%",
            backgroundColor: isDark ? "#020617" : "#ffffff",
            color: isDark ? "#e5e7eb" : "#0f172a",
            borderRadius: 16,
            border: isDark ? "1px solid #374151" : "1px solid #cbd5f5",
            padding: 14,
            fontSize: 14,
            resize: "vertical",
            outline: "none",
          }}
        />
        <div style={{ marginTop: 12 }}>
          <button
            type="button"
            onClick={saveBio}
            style={{
              padding: "10px 22px",
              borderRadius: 999,
              border: "none",
              background:
                "linear-gradient(135deg, #2563eb, #4f46e5)",
              color: "white",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Save bio
          </button>
        </div>
      </section>
    </div>
  );
}

