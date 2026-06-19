import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — EasyBill" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const nav = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("profile");

  // Profile fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");

  // Password fields
  const [currPass, setCurrPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confPass, setConfPass] = useState("");

  // Notification prefs (mocked)
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(false);

  // Status/Error messages
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const u = localStorage.getItem("eb_user");
    if (u) {
      try {
        const parsed = JSON.parse(u);
        setUser(parsed);
        setName(parsed.name || "");
        setEmail(parsed.email || "");
        setMobile(parsed.mobile || "");
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");
    setLoading(true);

    try {
      const data = await api.settings.updateProfile(name, email, mobile);
      // Update local storage user profile
      const updatedUser = {
        ...user,
        name: data.name,
        email: data.email,
        mobile: data.mobile,
        token: data.token || user.token,
      };
      localStorage.setItem("eb_user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setSuccessMsg("Profile updated successfully!");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (newPass !== confPass) {
      setErrorMsg("New passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await api.settings.changePassword(currPass, newPass);
      setSuccessMsg("Password changed successfully!");
      setCurrPass("");
      setNewPass("");
      setConfPass("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotificationPrefs = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("Notification preferences saved successfully!");
  };

  const logout = () => {
    localStorage.removeItem("eb_user");
    nav({ to: "/login" });
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      {successMsg && (
        <div className="eb-badge eb-badge-success" style={{ display: "block", padding: ".75rem 1rem", marginBottom: "1rem", borderRadius: "8px" }}>
          ✓ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="eb-badge eb-badge-danger" style={{ display: "block", padding: ".75rem 1rem", marginBottom: "1rem", borderRadius: "8px" }}>
          ✕ {errorMsg}
        </div>
      )}

      <div className="eb-card" style={{ display: "flex", flexDirection: "row", overflow: "hidden", minHeight: "450px" }}>
        {/* Settings Sidebar */}
        <div style={{ width: "220px", borderRight: "1px solid #eef2f7", padding: "1rem", background: "#fbfcfd" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
            <button
              onClick={() => { setActiveTab("profile"); setSuccessMsg(""); setErrorMsg(""); }}
              className={`eb-btn ${activeTab === "profile" ? "eb-btn-primary" : "eb-btn-ghost"}`}
              style={{ justifyContent: "flex-start", width: "100%" }}
            >
              👤 Profile Settings
            </button>
            <button
              onClick={() => { setActiveTab("password"); setSuccessMsg(""); setErrorMsg(""); }}
              className={`eb-btn ${activeTab === "password" ? "eb-btn-primary" : "eb-btn-ghost"}`}
              style={{ justifyContent: "flex-start", width: "100%" }}
            >
              🔒 Change Password
            </button>
            <button
              onClick={() => { setActiveTab("notifications"); setSuccessMsg(""); setErrorMsg(""); }}
              className={`eb-btn ${activeTab === "notifications" ? "eb-btn-primary" : "eb-btn-ghost"}`}
              style={{ justifyContent: "flex-start", width: "100%" }}
            >
              🔔 Notifications
            </button>
            <hr style={{ border: "none", borderTop: "1px solid #eef2f7", margin: ".75rem 0" }} />
            <button
              onClick={logout}
              className="eb-btn eb-btn-outline"
              style={{ justifyContent: "flex-start", width: "100%", color: "var(--c-danger)", borderColor: "var(--c-danger)" }}
            >
              🚪 Sign Out
            </button>
          </div>
        </div>

        {/* Settings Pane */}
        <div style={{ flex: 1, padding: "1.5rem" }}>
          {activeTab === "profile" && (
            <form onSubmit={handleUpdateProfile}>
              <h2 style={{ marginBottom: "1.25rem" }}>Update Profile Information</h2>
              
              <div className="eb-form-row">
                <label className="eb-label">Full Name</label>
                <input
                  type="text"
                  className="eb-input"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                />
              </div>

              <div className="eb-form-row">
                <label className="eb-label">Email Address</label>
                <input
                  type="email"
                  className="eb-input"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                />
              </div>

              <div className="eb-form-row">
                <label className="eb-label">Mobile Number</label>
                <input
                  type="tel"
                  className="eb-input"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="Enter mobile number"
                />
              </div>

              <div className="eb-form-row">
                <label className="eb-label">Account Role</label>
                <input
                  type="text"
                  className="eb-input"
                  disabled
                  value={user?.role?.toUpperCase() || "ADMIN"}
                  style={{ background: "#f1f5f9", cursor: "not-allowed" }}
                />
              </div>

              <button type="submit" disabled={loading} className="eb-btn eb-btn-primary" style={{ marginTop: "1rem" }}>
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          )}

          {activeTab === "password" && (
            <form onSubmit={handleChangePassword}>
              <h2 style={{ marginBottom: "1.25rem" }}>Change Account Password</h2>

              <div className="eb-form-row">
                <label className="eb-label">Current Password</label>
                <input
                  type="password"
                  className="eb-input"
                  required
                  value={currPass}
                  onChange={(e) => setCurrPass(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>

              <div className="eb-form-row">
                <label className="eb-label">New Password</label>
                <input
                  type="password"
                  className="eb-input"
                  required
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>

              <div className="eb-form-row">
                <label className="eb-label">Confirm New Password</label>
                <input
                  type="password"
                  className="eb-input"
                  required
                  value={confPass}
                  onChange={(e) => setConfPass(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>

              <button type="submit" disabled={loading} className="eb-btn eb-btn-primary" style={{ marginTop: "1rem" }}>
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          )}

          {activeTab === "notifications" && (
            <form onSubmit={handleSaveNotificationPrefs}>
              <h2 style={{ marginBottom: "1.25rem" }}>Notification Preferences</h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
                  <input
                    type="checkbox"
                    id="email_notifs"
                    checked={emailNotifs}
                    onChange={(e) => setEmailNotifs(e.target.checked)}
                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  <label htmlFor="email_notifs" style={{ cursor: "pointer" }}>
                    <strong>Email Notifications</strong>
                    <div style={{ fontSize: ".85rem", color: "var(--c-text-muted)" }}>Receive payment confirmations and invoices by email</div>
                  </label>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
                  <input
                    type="checkbox"
                    id="sms_notifs"
                    checked={smsNotifs}
                    onChange={(e) => setSmsNotifs(e.target.checked)}
                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  <label htmlFor="sms_notifs" style={{ cursor: "pointer" }}>
                    <strong>SMS / WhatsApp Notifications</strong>
                    <div style={{ fontSize: ".85rem", color: "var(--c-text-muted)" }}>Receive instant payment confirmation links on mobile</div>
                  </label>
                </div>
              </div>

              <button type="submit" className="eb-btn eb-btn-primary" style={{ marginTop: "1.5rem" }}>
                Save Preferences
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
