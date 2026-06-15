import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { api } from "@/lib/api";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Register — EasyBill" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !pass) return;
    try {
      setErr("");
      const data = await api.auth.register(name, email, pass);
      localStorage.setItem("eb_user", JSON.stringify(data));
      nav({ to: "/dashboard" });
    } catch (error: any) {
      setErr(error.message || "Registration failed");
    }
  };

  return (
    <div className="eb-auth">
      <form className="eb-auth-card" onSubmit={submit}>
        <h1>Create account</h1>
        <p className="eb-auth-sub">Start managing your billing in minutes</p>
        {err && (
          <div
            className="eb-badge eb-badge-danger"
            style={{ display: "block", padding: ".5rem", marginBottom: "1rem", textAlign: "center" }}
          >
            {err}
          </div>
        )}
        <div className="eb-form-row">
          <label className="eb-label">Full name</label>
          <input className="eb-input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
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
          Create account
        </button>
        <div className="eb-auth-foot">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </form>
    </div>
  );
}
