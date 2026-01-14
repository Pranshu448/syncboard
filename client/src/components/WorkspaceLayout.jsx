import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function WorkspaceLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const menuItemStyle = (isActive) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 56,
    borderRadius: 12,
    marginBottom: 8,
    cursor: "pointer",
    border: isActive
      ? isDark
        ? "1px solid #facc15"
        : "1px solid rgba(37,99,235,0.55)"
      : "1px solid transparent",
    backgroundColor: isActive
      ? isDark
        ? "#a16207"
        : "rgba(37,99,235,0.10)"
      : "transparent",
    color: isActive
      ? isDark
        ? "#ffffff"
        : "#0f172a"
      : isDark
        ? "#e5e7eb"
        : "#0f172a",
    fontSize: 13,
    textDecoration: "none",
    transition: "background-color 0.15s ease, border-color 0.15s ease",
  });

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        backgroundColor: isDark ? "#020617" : "#f3f4f6",
        color: isDark ? "#e5e7eb" : "#0f172a",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: 88,
          padding: 16,
          borderRight: isDark ? "1px solid #1f2937" : "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          backgroundColor: isDark ? "#030712" : "#ffffff",
        }}
      >
        <NavLink
          to="/"
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "radial-gradient(circle at 30% 0, #22c55e, #2563eb)",
            marginBottom: 18,
            textDecoration: "none",
            color: "#e5e7eb",
            fontWeight: 800,
            letterSpacing: "0.06em",
            border: "1px solid rgba(148, 163, 184, 0.35)",
          }}
          title="Home"
        >
          H
        </NavLink>

        <NavLink
          to="/"
          style={({ isActive }) => menuItemStyle(isActive)}
        >
          Home
        </NavLink>

        <NavLink
          to="/workspace/teams"
          style={({ isActive }) => menuItemStyle(isActive)}
        >
          Team
        </NavLink>

        <button
          type="button"
          onClick={() => navigate("/chat")}
          style={menuItemStyle(false)}
        >
          Chat
        </button>

        <NavLink
          to="/workspace/session"
          style={({ isActive }) => menuItemStyle(isActive)}
        >
          Session
        </NavLink>

        <NavLink
          to="/workspace/settings"
          style={({ isActive }) => menuItemStyle(isActive)}
        >
          Settings
        </NavLink>

        <div style={{ flex: 1 }} />

        <NavLink
          to="/workspace/profile"
          style={({ isActive }) => ({
            width: 40,
            height: 40,
            borderRadius: 999,
            border: isActive ? "2px solid #facc15" : "2px solid #4b5563",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            textDecoration: "none",
            background:
              "radial-gradient(circle at 30% 0, rgba(99,102,241,0.55), rgba(2,6,23,1))",
          })}
        >
          <span style={{ fontSize: 16, fontWeight: 700 }}>
            {user?.username?.[0]?.toUpperCase() || "U"}
          </span>
        </NavLink>
      </aside>

      {/* Main area */}
      <main
        style={{
          flex: 1,
          backgroundColor: isDark ? "#020617" : "#f9fafb",
          color: isDark ? "#e5e7eb" : "#0f172a",
          overflow: "hidden",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}

