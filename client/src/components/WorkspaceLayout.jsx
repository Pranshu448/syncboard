import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  LayoutGrid,
  MessageSquare,
  Users,
  PenTool,
  Layers,
  User,
  Settings,
  LogOut,
  Zap,
  Menu
} from "lucide-react";

export default function WorkspaceLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setIsSidebarOpen(false), [location.pathname]);

  // Color Palette containing the new Cyan
  const colors = {
    primary: "#00d4ff",
    activeBg: isDark ? "rgba(0, 212, 255, 0.1)" : "rgba(0, 212, 255, 0.1)",
    textActive: "#00d4ff",
    textInactive: isDark ? "#94a3b8" : "#64748b",
    hoverBg: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
    bg: isDark ? "#020617" : "#f3f4f6",
    sidebarBg: isDark ? "#0b0c15" : "#ffffff",
    border: isDark ? "#1e293b" : "#e2e8f0",
  };

  const MenuItem = ({ to, icon: Icon, label, isButton = false, onClick }) => {
    const isActive = !isButton && location.pathname === to;

    // Style for the container
    const style = {
      display: "flex",
      alignItems: "center",
      gap: 12,
      width: "100%",
      padding: "12px 16px",
      borderRadius: 8,
      marginBottom: 4,
      cursor: "pointer",
      border: "none",
      backgroundColor: isActive ? colors.activeBg : "transparent",
      color: isActive ? colors.textActive : colors.textInactive,
      fontSize: 14,
      fontWeight: isActive ? 600 : 500,
      textDecoration: "none",
      transition: "all 0.2s ease",
      position: "relative",
    };

    const content = (
      <>
        {isActive && (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: "50%",
              transform: "translateY(-50%)",
              height: "60%",
              width: 3,
              backgroundColor: colors.primary,
              borderRadius: "0 4px 4px 0"
            }}
          />
        )}
        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
        <span>{label}</span>
      </>
    );

    if (isButton) {
      return (
        <button
          type="button"
          onClick={onClick}
          style={style}
          onMouseEnter={(e) => !isActive && (e.currentTarget.style.backgroundColor = colors.hoverBg)}
          onMouseLeave={(e) => !isActive && (e.currentTarget.style.backgroundColor = "transparent")}
        >
          {content}
        </button>
      );
    }

    return (
      <NavLink
        to={to}
        style={style}
        onMouseEnter={(e) => !isActive && (e.currentTarget.style.backgroundColor = colors.hoverBg)}
        onMouseLeave={(e) => !isActive && (e.currentTarget.style.backgroundColor = "transparent")}
      >
        {content}
      </NavLink>
    );
  };

  return (
    <div
      className="workspace-container"
      style={{
        backgroundColor: colors.bg,
        color: isDark ? "#e5e7eb" : "#0f172a",
      }}
    >
      {/* Mobile Header */}
      <div
        className="mobile-header hidden-desktop"
        style={{
          backgroundColor: colors.sidebarBg,
          borderBottom: `1px solid ${colors.border}`
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => setIsSidebarOpen(true)}
            style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", display: "flex" }}
          >
            <Menu size={24} />
          </button>
          <span style={{ fontWeight: 800, fontSize: 18 }}>Syncboard</span>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="sidebar-overlay hidden-desktop"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar ${isSidebarOpen ? "open" : ""}`}
        style={{
          backgroundColor: colors.sidebarBg,
          borderRight: `1px solid ${colors.border}`,
          padding: "24px 16px",
        }}
      >
        {/* Branding - Hidden on mobile if we want, or keep it. Let's keep it for context inside drawer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 32,
            paddingLeft: 8,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: "#00d4ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 15px rgba(0, 212, 255, 0.4)"
            }}
          >
            <Zap size={20} color="#0a0b10" fill="#0a0b10" strokeWidth={3} />
          </div>
          <span
            style={{
              fontWeight: 800,
              fontSize: 20,
              letterSpacing: "-0.02em",
              color: isDark ? "#f8fafc" : "#0f172a",
              background: isDark ? "linear-gradient(to right, #fff, #94a3b8)" : "none",
              WebkitBackgroundClip: isDark ? "text" : "none",
              WebkitTextFillColor: isDark ? "transparent" : "initial",
            }}
          >
            Syncboard
          </span>

          {/* Close button for mobile */}
          <button
            className="hidden-desktop"
            onClick={() => setIsSidebarOpen(false)}
            style={{
              marginLeft: "auto",
              background: "transparent",
              border: "none",
              color: colors.textInactive
            }}
          >
            X
          </button>
        </div>

        {/* Main Navigation */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <MenuItem to="/workspace" icon={LayoutGrid} label="Dashboard" />
          <MenuItem to="/workspace/chat" icon={MessageSquare} label="Chat" />
          <MenuItem to="/workspace/teams" icon={Users} label="Teams" />
          <MenuItem
            to="#"
            icon={PenTool}
            label="Whiteboard"
            isButton
            onClick={() => navigate(`/whiteboard/${Date.now()}`)}
          />
          <MenuItem to="/workspace/session" icon={Layers} label="Sessions" />
        </div>

        <div style={{ flex: 1 }} />

        {/* Divider */}
        <div
          style={{
            height: 1,
            backgroundColor: colors.border,
            margin: "16px 8px",
          }}
        />

        {/* User/App Settings */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <MenuItem to="/workspace/profile" icon={User} label="Profile" />
          <MenuItem to="/workspace/settings" icon={Settings} label="Settings" />

          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/login");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              width: "100%",
              padding: "12px 16px",
              borderRadius: 8,
              cursor: "pointer",
              border: "none",
              backgroundColor: "transparent",
              color: isDark ? "#94a3b8" : "#64748b",
              fontSize: 14,
              fontWeight: 500,
              transition: "color 0.2s",
              marginTop: 4,
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"}
            onMouseLeave={(e) => e.currentTarget.style.color = isDark ? "#94a3b8" : "#64748b"}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <main
        className="main-content"
        style={{
          backgroundColor: colors.bg,
          color: isDark ? "#e5e7eb" : "#0f172a",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}

