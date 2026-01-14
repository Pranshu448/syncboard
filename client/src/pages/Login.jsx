import { useState } from "react";
import { loginUser } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
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
      const res = await loginUser(form);

      // save user + token in AuthContext
      login(res.data);

      // After login, land on teams
      navigate("/workspace/teams");
    } catch (err) {
      setError(err.response?.data?.msg || "Login failed");
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
          maxWidth: 420,
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
            <div style={{ fontSize: 18, fontWeight: 700 }}>Welcome back</div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>
              Log in to open your workspace.
            </div>
          </div>
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

        <label style={{ fontSize: 12, color: "#94a3b8" }}>Email</label>
        <input
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
          placeholder="••••••••"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          style={{
            width: "100%",
            boxSizing: "border-box",
            marginTop: 6,
            marginBottom: 14,
            padding: "10px 12px",
            borderRadius: 999,
            border: "1px solid rgba(148,163,184,0.35)",
            backgroundColor: "#020617",
            color: "#e5e7eb",
            outline: "none",
          }}
        />

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: 999,
            border: "none",
            cursor: "pointer",
            background: "linear-gradient(135deg, #2563eb, #4f46e5)",
            color: "#f8fafc",
            fontWeight: 600,
            opacity: isLoading ? 0.75 : 1,
          }}
        >
          {isLoading ? "Signing in..." : "Login"}
        </button>

        <div style={{ marginTop: 12, fontSize: 13, color: "#94a3b8" }}>
          New here?{" "}
          <Link to="/register" style={{ color: "#a5b4fc", textDecoration: "none" }}>
            Create a workspace
          </Link>
        </div>
      </form>
    </div>
  );
}
