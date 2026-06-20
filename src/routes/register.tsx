import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Register — EasyBill" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const nav = useNavigate();
  useEffect(() => {
    nav({ to: "/login" });
  }, [nav]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [mobile, setMobile] = useState("");
  const [role, setRole] = useState("admin");
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !pass) return;
    try {
      setErr("");
      const data = await api.auth.register(name, email, pass, role, mobile);
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
          <input className="eb-input" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="eb-form-row">
          <label className="eb-label">Email</label>
          <input
            className="eb-input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="eb-form-row">
          <label className="eb-label">Mobile Number</label>
          <input
            className="eb-input"
            type="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
          />
        </div>
        <div className="eb-form-row">
          <label className="eb-label">I am registering as</label>
          <select
            className="eb-select"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="admin">Business Owner (Admin)</option>
            <option value="customer">Client (Customer)</option>
          </select>
        </div>
        <div className="eb-form-row">
          <label className="eb-label">Password</label>
          <input
            className="eb-input"
            type="password"
            required
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
