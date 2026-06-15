import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/forgot")({
  head: () => ({ meta: [{ title: "Forgot password — EasyBill" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <div className="eb-auth">
      <form
        className="eb-auth-card"
        onSubmit={(e) => {
          e.preventDefault();
          setSent(true);
        }}
      >
        <h1>Reset password</h1>
        <p className="eb-auth-sub">Enter your email and we'll send a reset link</p>
        {sent ? (
          <div
            className="eb-badge eb-badge-success"
            style={{ display: "block", padding: ".75rem", textAlign: "center" }}
          >
            If an account exists for {email}, a reset link has been sent.
          </div>
        ) : (
          <>
            <div className="eb-form-row">
              <label className="eb-label">Email</label>
              <input
                className="eb-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button
              className="eb-btn eb-btn-primary"
              type="submit"
              style={{ width: "100%", justifyContent: "center" }}
            >
              Send reset link
            </button>
          </>
        )}
        <div className="eb-auth-foot">
          <Link to="/login">← Back to sign in</Link>
        </div>
      </form>
    </div>
  );
}
