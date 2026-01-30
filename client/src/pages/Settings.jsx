import { useTheme } from "../context/ThemeContext";
import { Moon, Sun, Palette } from "lucide-react";

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
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
    cardBorder: isDark ? "#334155" : "#e2e8f0",
    toggleBg: isDark ? "#1e293b" : "#e2e8f0",
    toggleActive: isDark ? "#00d4ff" : "#ffffff"
  };

  return (
    <div
      className="p-mobile-4"
      style={{
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
        boxSizing: "border-box",
        backgroundColor: colors.bg,
        color: colors.textMain,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        className="p-mobile-4"
        style={{
          width: "100%",
          maxWidth: 500,
          borderRadius: 24,
          padding: 32,
          boxSizing: "border-box",
          border: `1px solid ${colors.cardBorder}`,
          backgroundColor: colors.cardBg,
          boxShadow: isDark
            ? "0 22px 60px rgba(0, 0, 0, 0.5)"
            : "0 18px 45px rgba(0, 0, 0, 0.05)",
          backdropFilter: "blur(12px)"
        }}
      >
        <div style={{ marginBottom: 32 }}>
          <h2
            style={{
              margin: "0 0 12px",
              fontSize: 24,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: colors.textMain
            }}
          >
            <Palette size={24} color={colors.primary} />
            Appearance
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: 15,
              color: colors.textMuted,
              lineHeight: 1.5
            }}
          >
            Customize your workspace appearance. Choose between light and dark themes to suit your environment.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 20,
            borderRadius: 16,
            backgroundColor: isDark ? "#0f172a" : "#f1f5f9",
            border: `1px solid ${colors.border}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `1px solid ${colors.border}`,
                color: colors.primary
              }}
            >
              {isDark ? <Moon size={22} /> : <Sun size={22} />}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>
                {isDark ? "Dark Mode" : "Light Mode"}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: colors.textMuted,
                  marginTop: 2
                }}
              >
                {isDark ? "Easy on the eyes" : "Bright and clear"}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            style={{
              width: 56,
              height: 30,
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              padding: 3,
              boxSizing: "border-box",
              background: isDark ? colors.primary : "#cbd5e1",
              display: "flex",
              alignItems: "center",
              justifyContent: isDark ? "flex-end" : "flex-start",
              transition: "background 0.3s ease",
              boxShadow: isDark ? `0 0 15px ${colors.primary}50` : "none"
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                backgroundColor: "#ffffff",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              }}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

