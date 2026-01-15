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
    gap: 12,
    width: "100%",
    padding: "12px 16px",
    borderRadius: 8,
    marginBottom: 4,
    cursor: "pointer",
    border: "none",
    backgroundColor: isActive
      ? isDark
        ? "rgba(59, 130, 246, 0.2)" // Light blue background when active
        : "rgba(59, 130, 246, 0.15)"
      : "transparent",
    color: isActive
      ? "#ffffff" // White text when active
      : isDark
        ? "#e5e7eb"
        : "#0f172a",
    fontSize: 14,
    textDecoration: "none",
    transition: "background-color 0.15s ease",
  });

  const homeItemStyle = (isActive) => ({
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    padding: "12px 16px",
    borderRadius: 8,
    marginBottom: 4,
    cursor: "pointer",
    border: "none",
    backgroundColor: isActive
      ? "rgba(59, 130, 246, 0.3)" // Light blue rectangular background when active - spans full width
      : "transparent",
    color: isActive
      ? "#ffffff" // White text and icon when active
      : isDark
        ? "#e5e7eb"
        : "#0f172a",
    fontSize: 14,
    fontWeight: isActive ? 500 : 400,
    textDecoration: "none",
    transition: "background-color 0.15s ease",
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
          width: 240,
          padding: "20px 16px",
          borderRight: isDark ? "1px solid #1f2937" : "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          backgroundColor: isDark ? "#030712" : "#ffffff",
        }}
      >
        {/* Nexus Branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 24,
            paddingLeft: 4,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #2563eb, #22c55e)",
              fontSize: 18,
            }}
          >
            ⚡
          </div>
          <span
            style={{
              fontWeight: 700,
              fontSize: 18,
              letterSpacing: "0.02em",
              color: isDark ? "#e5e7eb" : "#0f172a",
            }}
          >
            Nexus
          </span>
        </div>

        {/* Main Navigation */}
        <NavLink
          to="/workspace"
          style={({ isActive }) => homeItemStyle(isActive)}
        >
          <span style={{ fontSize: 18 }}>🏠</span>
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/workspace/chat"
          style={({ isActive }) => menuItemStyle(isActive)}
        >
          <span style={{ fontSize: 18 }}>💬</span>
          <span>Chat</span>
        </NavLink>

        <NavLink
          to="/workspace/teams"
          style={({ isActive }) => menuItemStyle(isActive)}
        >
          <span style={{ fontSize: 18 }}>👥</span>
          <span>Teams</span>
        </NavLink>

        <button
          type="button"
          onClick={() => navigate(`/whiteboard/${Date.now()}`)}
          style={menuItemStyle(false)}
        >
          <span style={{ fontSize: 18 }}>📋</span>
          <span>Whiteboard</span>
        </button>

        <NavLink
          to="/workspace/session"
          style={({ isActive }) => menuItemStyle(isActive)}
        >
          <span style={{ fontSize: 18 }}>📄</span>
          <span>Sessions</span>
        </NavLink>

        <div style={{ flex: 1 }} />

        {/* Divider */}
        <div
          style={{
            height: 1,
            backgroundColor: isDark ? "#1f2937" : "#e5e7eb",
            margin: "16px 0",
          }}
        />

        {/* User/App Settings */}
        <NavLink
          to="/workspace/profile"
          style={({ isActive }) => menuItemStyle(isActive)}
        >
          <span style={{ fontSize: 18 }}>👤</span>
          <span>Profile</span>
        </NavLink>

        <NavLink
          to="/workspace/settings"
          style={({ isActive }) => menuItemStyle(isActive)}
        >
          <span style={{ fontSize: 18 }}>⚙️</span>
          <span>Settings</span>
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

