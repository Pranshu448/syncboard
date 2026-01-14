import { useTheme } from "../context/ThemeContext";

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        boxSizing: "border-box",
        backgroundColor: isDark ? "#020617" : "#f3f4f6",
        color: isDark ? "#e5e7eb" : "#0f172a",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          borderRadius: 20,
          padding: 20,
          boxSizing: "border-box",
          border: isDark
            ? "1px solid rgba(148,163,184,0.28)"
            : "1px solid rgba(148,163,184,0.35)",
          backgroundColor: isDark ? "rgba(15,23,42,0.95)" : "#ffffff",
          boxShadow: isDark
            ? "0 22px 60px rgba(15,23,42,0.85)"
            : "0 18px 45px rgba(15,23,42,0.18)",
        }}
      >
        <h2
          style={{
            margin: 0,
            marginBottom: 8,
            fontSize: 20,
          }}
        >
          Appearance
        </h2>
        <p
          style={{
            margin: 0,
            marginBottom: 16,
            fontSize: 13,
            color: isDark ? "#94a3b8" : "#6b7280",
          }}
        >
          Switch between light and dark themes for your workspace.
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 12,
            borderRadius: 14,
            backgroundColor: isDark ? "#020617" : "#f9fafb",
            border: "1px solid rgba(148,163,184,0.3)",
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>
              {isDark ? "Dark mode" : "Light mode"}
            </div>
            <div
              style={{
                fontSize: 12,
                color: isDark ? "#9ca3af" : "#6b7280",
              }}
            >
              {isDark ? "Best for low‑light environments." : "Clean look for bright spaces."}
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            style={{
              width: 70,
              height: 32,
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              padding: 3,
              boxSizing: "border-box",
              background: isDark
                ? "linear-gradient(135deg, #2563eb, #4f46e5)"
                : "linear-gradient(135deg, #e5e7eb, #cbd5f5)",
              display: "flex",
              alignItems: "center",
              justifyContent: isDark ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                backgroundColor: isDark ? "#0f172a" : "#ffffff",
                boxShadow: "0 2px 6px rgba(15,23,42,0.4)",
              }}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

