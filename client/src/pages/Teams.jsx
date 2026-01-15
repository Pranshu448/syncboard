import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/axios";
import { fetchUsers } from "../api/users";
import { useTheme } from "../context/ThemeContext";

export default function Teams() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchUsers();
        setUsers(res.data || []);
      } catch (err) {
        console.error("Failed to load users", err);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    );
  }, [query, users]);

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: isDark ? "#020617" : "#f3f4f6",
      }}
    >
      {/* Search row */}
      <div
        style={{
          padding: "16px 24px",
          borderBottom: isDark ? "1px solid #111827" : "1px solid #e5e7eb",
          display: "flex",
          gap: 12,
          alignItems: "center",
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search team members..."
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 999,
            border: isDark ? "1px solid #374151" : "1px solid #cbd5f5",
            backgroundColor: isDark ? "#020617" : "#ffffff",
            color: isDark ? "#e5e7eb" : "#0f172a",
            fontSize: 14,
            outline: "none",
          }}
        />
        <button
          type="button"
          style={{
            padding: "10px 20px",
            borderRadius: 999,
            border: isDark ? "1px solid #f3f4f6" : "1px solid #cbd5f5",
            backgroundColor: isDark ? "transparent" : "#ffffff",
            color: isDark ? "#e5e7eb" : "#0f172a",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          Search
        </button>
      </div>

      {/* List of users */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          width: "100%",
        }}
      >
        {filtered.map((user) => (
          <div
            key={user._id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 24px",
              borderBottom: isDark ? "1px solid #111827" : "1px solid #e5e7eb",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "999px",
                  border: isDark
                    ? "1px solid rgba(148, 163, 184, 0.55)"
                    : "1px solid rgba(148,163,184,0.5)",
                  background: isDark
                    ? "radial-gradient(circle at 30% 0, rgba(34,197,94,0.7), rgba(2,6,23,1))"
                    : "radial-gradient(circle at 30% 0, #22c55e, #e0f2fe)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  color: "#e5e7eb",
                }}
              >
                {(user.username || "U")[0]?.toUpperCase()}
              </div>
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 600 }}>
                    {user.username}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: isDark ? "#9ca3af" : "#64748b",
                    }}
                  >
                    {user.email}
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: isDark ? "#9ca3af" : "#6b7280",
                    maxWidth: 520,
                  }}
                >
                  {user.bio}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await api.post("/chats/create", {
                    otherUserId: user._id,
                  });
                  const chat = res.data;
                  navigate("/workspace/chat", { state: { openChatId: chat._id } });
                } catch (err) {
                  console.error("Failed to open chat from team list", err);
                  navigate("/workspace/chat");
                }
              }}
              style={{
                padding: "8px 18px",
                borderRadius: 999,
                border: isDark ? "1px solid #e5e7eb" : "1px solid #2563eb",
                backgroundColor: isDark ? "transparent" : "#2563eb",
                color: isDark ? "#e5e7eb" : "#ffffff",
                fontSize: 13,
                cursor: "pointer",
                minWidth: 100,
              }}
            >
              Message
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

