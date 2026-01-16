import { useState } from "react";
import { registerUser, loginUser } from "../api/auth";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createTeam, joinTeam } from "../api/teams";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [mode, setMode] = useState("create"); // 'create' | 'join'
  const [teamCode, setTeamCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setIsLoading(true);
      await registerUser(form);

      // Auto-login after register so we can create/join team immediately
      const loginRes = await loginUser({ email: form.email, password: form.password });
      login(loginRes.data);

      if (mode === "create") {
        await createTeam({ name: `${form.username || "My"}'s Team` });
        navigate("/workspace/teams");
      } else {
        await joinTeam({ code: teamCode });
        navigate("/workspace/teams");
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
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at top left, rgba(37,99,235,0.4), transparent 55%), radial-gradient(circle at top right, rgba(34,197,94,0.22), transparent 50%), linear-gradient(180deg, #020617, #030712)",
        padding: 16,
        color: "#e5e7eb",
      }}
    >
      <form
        onSubmit={submit}
        style={{
          width: "100%",
          maxWidth: 460,
          boxSizing: "border-box",
          borderRadius: 18,
          border: "1px solid rgba(148,163,184,0.25)",
          backgroundColor: "rgba(2,6,23,0.72)",
          padding: 18,
          boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              background: "linear-gradient(135deg, #2563eb, #22c55e)",
            }}
          />
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {mode === "create" ? "Create your workspace" : "Join a workspace"}
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>
              Register first, then {mode === "create" ? "get a Team ID" : "enter a Team ID"}.
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 12,
            backgroundColor: "#020617",
            border: "1px solid rgba(148,163,184,0.25)",
            borderRadius: 999,
            padding: 4,
          }}
        >
          <button
            type="button"
            onClick={() => setMode("create")}
            style={{
              flex: 1,
              padding: "8px 10px",
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              background: mode === "create" ? "rgba(99,102,241,0.35)" : "transparent",
              color: "#e5e7eb",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            Create workspace
          </button>
          <button
            type="button"
            onClick={() => setMode("join")}
            style={{
              flex: 1,
              padding: "8px 10px",
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              background: mode === "join" ? "rgba(34,197,94,0.25)" : "transparent",
              color: "#e5e7eb",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            Join workspace
          </button>
        </div>

        {error && (
          <div
            style={{
              marginBottom: 10,
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(248,113,113,0.35)",
              backgroundColor: "rgba(127,29,29,0.25)",
              color: "#fecaca",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <label style={{ fontSize: 12, color: "#94a3b8" }}>Name</label>
        <input
          placeholder="Your name"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          style={{
            width: "100%",
            boxSizing: "border-box",
            marginTop: 6,
            marginBottom: 12,
            padding: "10px 12px",
            borderRadius: 999,
            border: "1px solid rgba(148,163,184,0.35)",
            backgroundColor: "#020617",
            color: "#e5e7eb",
            outline: "none",
          }}
        />

        <label style={{ fontSize: 12, color: "#94a3b8" }}>Email</label>
        <input
          type="email"
          placeholder="you@company.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          style={{
            width: "100%",
            boxSizing: "border-box",
            marginTop: 6,
            marginBottom: 12,
            padding: "10px 12px",
            borderRadius: 999,
            border: "1px solid rgba(148,163,184,0.35)",
            backgroundColor: "#020617",
            color: "#e5e7eb",
            outline: "none",
          }}
        />

        <label style={{ fontSize: 12, color: "#94a3b8" }}>Password</label>
        <input
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          style={{
            width: "100%",
            boxSizing: "border-box",
            marginTop: 6,
            marginBottom: 12,
            padding: "10px 12px",
            borderRadius: 999,
            border: "1px solid rgba(148,163,184,0.35)",
            backgroundColor: "#020617",
            color: "#e5e7eb",
            outline: "none",
          }}
        />

        {mode === "join" && (
          <>
            <label style={{ fontSize: 12, color: "#94a3b8" }}>Team ID</label>
            <input
              placeholder="Enter Team ID (e.g. A3F9BC)"
              value={teamCode}
              onChange={(e) => setTeamCode(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                marginTop: 6,
                marginBottom: 12,
                padding: "10px 12px",
                borderRadius: 999,
                border: "1px solid rgba(148,163,184,0.35)",
                backgroundColor: "#020617",
                color: "#e5e7eb",
                outline: "none",
              }}
            />
          </>
        )}

        <button
          type="submit"
          disabled={isLoading || (mode === "join" && !teamCode.trim())}
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: 999,
            border: "none",
            cursor: "pointer",
            background: "linear-gradient(135deg, #2563eb, #4f46e5)",
            color: "#f8fafc",
            fontWeight: 600,
            opacity: isLoading || (mode === "join" && !teamCode.trim()) ? 0.75 : 1,
          }}
        >
          {isLoading
            ? "Creating account..."
            : mode === "create"
              ? "Register & create Team ID"
              : "Register & join workspace"}
        </button>

        <div style={{ marginTop: 12, fontSize: 13, color: "#94a3b8" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#a5b4fc", textDecoration: "none" }}>
            Login
          </Link>
        </div>
      </form>
    </div>
  );
}
