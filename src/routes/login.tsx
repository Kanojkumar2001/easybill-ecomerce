import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { api } from "@/lib/api";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — EasyBill" }] }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@easybill.in");
  const [pass, setPass] = useState("admin123");
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pass) {
      setErr("Email and password are required");
      return;
    }
    try {
      setErr("");
      const data = await api.auth.login(email, pass);
      localStorage.setItem("eb_user", JSON.stringify(data));
      nav({ to: "/dashboard" });
    } catch (error: any) {
      setErr(error.message || "Invalid credentials. Please register first.");
    }
  };

  return (
    <div className="eb-auth">
      <form className="eb-auth-card" onSubmit={submit}>
        <h1>
          Easy<span style={{ color: "var(--c-primary-2)" }}>Bill</span>
        </h1>
        <p className="eb-auth-sub">Sign in to your billing dashboard</p>
        {err && (
          <div
            className="eb-badge eb-badge-danger"
            style={{ display: "block", padding: ".5rem", marginBottom: "1rem" }}
          >
            {err}
          </div>
        )}
        <div className="eb-form-row">
          <label className="eb-label">Email</label>
          <input
            className="eb-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="eb-form-row">
          <label className="eb-label">Password</label>
          <input
            className="eb-input"
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
        </div>
        <button
          className="eb-btn eb-btn-primary"
          type="submit"
          style={{ width: "100%", justifyContent: "center" }}
        >
          Sign in
        </button>
        <div className="eb-auth-foot">
          <Link to="/forgot">Forgot password?</Link> · <Link to="/register">Create account</Link>
        </div>
      </form>
    </div>
  );
}
