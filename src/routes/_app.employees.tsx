import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_app/employees")({
  head: () => ({ meta: [{ title: "Employees — EasyBill" }] }),
  component: EmployeesPage,
});

type Employee = {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  isActive: boolean;
  permissions: string[];
};

type Activity = {
  _id: string;
  employeeName: string;
  action: string;
  details: string;
  createdAt: string;
};

const defaultPermissions = [
  { value: "read_customers", label: "View Customers" },
  { value: "create_quotations", label: "Create Quotations" },
  { value: "create_invoices", label: "Create Invoices" },
  { value: "record_payments", label: "Record Payments" },
];

function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState("list");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [permissions, setPermissions] = useState<string[]>(["read_customers", "create_quotations", "create_invoices", "record_payments"]);

  const loadData = async () => {
    setLoading(true);
    try {
      const emps = await api.employees.list();
      setEmployees(emps);
      const acts = await api.employees.activities();
      setActivities(acts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditing(null);
    setName("");
    setEmail("");
    setPassword("");
    setMobile("");
    setPermissions(["read_customers", "create_quotations", "create_invoices", "record_payments"]);
    setModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditing(emp);
    setName(emp.name);
    setEmail(emp.email);
    setPassword("");
    setMobile(emp.mobile || "");
    setPermissions(emp.permissions || []);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        const payload: any = { name, permissions, mobile };
        if (password) payload.password = password;
        const updated = await api.employees.update(editing._id, payload);
        setEmployees(employees.map(emp => emp._id === updated._id ? updated : emp));
      } else {
        const created = await api.employees.create({ name, email, password, permissions, mobile });
        setEmployees([created, ...employees]);
      }
      setModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to save employee");
    }
  };

  const handleToggleActive = async (emp: Employee) => {
    try {
      const updated = await api.employees.update(emp._id, { isActive: !emp.isActive });
      setEmployees(employees.map(e => e._id === emp._id ? updated : e));
    } catch (err: any) {
      alert(err.message || "Failed to toggle status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;
    try {
      await api.employees.delete(id);
      setEmployees(employees.filter(e => e._id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete employee");
    }
  };

  const handleTogglePermission = (perm: string) => {
    setPermissions(prev => 
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        {/* Tab Switcher */}
        <div style={{ display: "flex", gap: ".5rem" }}>
          <button 
            onClick={() => setActiveTab("list")} 
            className={`eb-btn ${activeTab === "list" ? "eb-btn-primary" : "eb-btn-ghost"}`}
          >
            👥 Staff Members ({employees.length})
          </button>
          <button 
            onClick={() => setActiveTab("logs")} 
            className={`eb-btn ${activeTab === "logs" ? "eb-btn-primary" : "eb-btn-ghost"}`}
          >
            📋 Employee Activity Logs
          </button>
        </div>

        {activeTab === "list" && (
          <button className="eb-btn eb-btn-primary" onClick={openAddModal}>
            + Add Employee
          </button>
        )}
      </div>

      {loading ? (
        <div className="eb-empty">Loading employee dashboard...</div>
      ) : activeTab === "list" ? (
        <div className="eb-card">
          <div className="eb-table-wrap">
            <table className="eb-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>Permissions</th>
                  <th>Status</th>
                  <th style={{ width: 180 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp._id}>
                    <td><strong>{emp.name}</strong></td>
                    <td>{emp.email}</td>
                    <td>{emp.mobile || "—"}</td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: ".25rem" }}>
                        {emp.permissions?.map(p => {
                          const label = defaultPermissions.find(dp => dp.value === p)?.label || p;
                          return (
                            <span key={p} className="eb-badge" style={{ fontSize: ".7rem", padding: ".1rem .3rem" }}>
                              {label}
                            </span>
                          );
                        })}
                        {!emp.permissions?.length && (
                          <span style={{ color: "var(--c-text-muted)", fontSize: ".85rem" }}>No permissions</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`eb-badge ${emp.isActive ? "eb-badge-success" : "eb-badge-danger"}`}>
                        {emp.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td>
                      <div className="eb-row-actions">
                        <button className="eb-btn eb-btn-ghost eb-btn-sm" onClick={() => openEditModal(emp)}>
                          Edit
                        </button>
                        <button 
                          className="eb-btn eb-btn-ghost eb-btn-sm" 
                          style={{ color: emp.isActive ? "var(--c-warn)" : "var(--c-primary)" }}
                          onClick={() => handleToggleActive(emp)}
                        >
                          {emp.isActive ? "Disable" : "Enable"}
                        </button>
                        <button 
                          className="eb-btn eb-btn-ghost eb-btn-sm" 
                          style={{ color: "var(--c-danger)" }}
                          onClick={() => handleDelete(emp._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!employees.length && (
                  <tr>
                    <td colSpan={6} className="eb-empty">No employees registered yet. Click "+ Add Employee" to get started.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="eb-card">
          <div className="eb-table-wrap">
            <table className="eb-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Employee</th>
                  <th>Action</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {activities.map(act => (
                  <tr key={act._id}>
                    <td style={{ fontSize: ".85rem", color: "var(--c-text-muted)" }}>
                      {new Date(act.createdAt).toLocaleString()}
                    </td>
                    <td><strong>{act.employeeName}</strong></td>
                    <td>
                      <span className="eb-badge eb-badge-info" style={{ textTransform: "uppercase", fontSize: ".75rem" }}>
                        {act.action}
                      </span>
                    </td>
                    <td>{act.details}</td>
                  </tr>
                ))}
                {!activities.length && (
                  <tr>
                    <td colSpan={4} className="eb-empty">No logged employee activities yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="eb-modal-back" onClick={() => setModalOpen(false)}>
          <div className="eb-modal" onClick={e => e.stopPropagation()}>
            <div className="eb-modal-head">
              <h2>{editing ? "Edit Employee" : "Add New Employee"}</h2>
              <button className="eb-btn eb-btn-ghost" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="eb-modal-body">
                <div className="eb-form-row">
                  <label className="eb-label">Full Name</label>
                  <input 
                    className="eb-input" 
                    required 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="Enter name"
                  />
                </div>

                <div className="eb-form-row">
                  <label className="eb-label">Email Address</label>
                  <input 
                    className="eb-input" 
                    type="email" 
                    required 
                    disabled={!!editing}
                    style={editing ? { background: "#f1f5f9", cursor: "not-allowed" } : {}}
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="Enter email"
                  />
                </div>

                <div className="eb-form-row">
                  <label className="eb-label">Password {editing && "(Leave blank to keep current)"}</label>
                  <input 
                    className="eb-input" 
                    type="password" 
                    required={!editing}
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="Enter password"
                  />
                </div>

                <div className="eb-form-row">
                  <label className="eb-label">Mobile Number</label>
                  <input 
                    className="eb-input" 
                    type="tel"
                    value={mobile} 
                    onChange={e => setMobile(e.target.value)} 
                    placeholder="Enter mobile number"
                  />
                </div>

                <div className="eb-form-row">
                  <label className="eb-label" style={{ marginBottom: ".5rem" }}>Assign Access Permissions</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: ".5rem", background: "#f8fafc", padding: ".75rem", borderRadius: "6px" }}>
                    {defaultPermissions.map(dp => (
                      <div key={dp.value} style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                        <input 
                          type="checkbox" 
                          id={`perm_${dp.value}`} 
                          checked={permissions.includes(dp.value)}
                          onChange={() => handleTogglePermission(dp.value)}
                        />
                        <label htmlFor={`perm_${dp.value}`} style={{ cursor: "pointer" }}>{dp.label}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="eb-modal-foot">
                <button type="button" className="eb-btn eb-btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="eb-btn eb-btn-primary">Save Member</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
