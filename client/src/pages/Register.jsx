import { useState } from "react";
import { registerUser, loginUser } from "../api/auth";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { joinTeam } from "../api/teams";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get("inviteCode");

  const [form, setForm] = useState({
    username: "",
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
      await registerUser(form);

      // Auto-login after register
      const loginRes = await loginUser({ email: form.email, password: form.password });
      login(loginRes.data);

      if (inviteCode) {
        try {
          await joinTeam({ code: inviteCode });
        } catch (joinErr) {
          console.error("Auto-join failed:", joinErr);
        }
        navigate("/workspace/teams");
      } else {
        navigate("/workspace");
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
          maxWidth: 400,
          boxSizing: "border-box",
          borderRadius: 18,
          border: "1px solid rgba(148,163,184,0.25)",
          backgroundColor: "rgba(2,6,23,0.72)",
          padding: 24,
          boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "linear-gradient(135deg, #2563eb, #22c55e)",
              margin: "0 auto 12px",
            }}
          />
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
            {inviteCode ? "Join the Team" : "Get Started"}
          </h2>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "#94a3b8" }}>
            {inviteCode ? "Register to accept your invitation" : "Create an account to continue"}
          </p>
        </div>

        {error && (
          <div
            style={{
              marginBottom: 16,
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
          {isLoading ? "Creating account..." : (inviteCode ? "Register & Join Team" : "Sign Up")}
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
