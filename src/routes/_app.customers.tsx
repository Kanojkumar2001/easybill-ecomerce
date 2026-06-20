import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_app/customers")({
  head: () => ({ meta: [{ title: "Customers — EasyBill" }] }),
  component: CustomersPage,
});

type Customer = {
  _id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  password?: string;
};

const emptyCustomer = { _id: "", name: "", phone: "", email: "", address: "", password: "" };

function CustomersPage() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const perPage = 8;

  const load = () => {
    setLoading(true);
    api.customers
      .list()
      .then((data) => {
        setRows(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = rows.filter((r) =>
    [r.name, r.email, r.phone].some((v) =>
      (v || "").toLowerCase().includes(search.toLowerCase()),
    ),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const view = filtered.slice((page - 1) * perPage, page * perPage);

  const save = async (c: Customer) => {
    try {
      if (c._id) {
        const updated = await api.customers.update(c._id, c);
        setRows((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
      } else {
        const created = await api.customers.create(c);
        setRows((prev) => [created, ...prev]);
      }
      setEditing(null);
    } catch (err: any) {
      alert(err.message || "Failed to save customer");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this customer?")) return;
    try {
      await api.customers.delete(id);
      setRows((prev) => prev.filter((r) => r._id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete customer");
    }
  };

  return (
    <div>
      <div className="eb-toolbar">
        <input
          className="eb-input eb-search"
          placeholder="Search customers..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <button className="eb-btn eb-btn-primary" onClick={() => setEditing({ ...emptyCustomer })}>
          + Add Customer
        </button>
      </div>
      <div className="eb-card">
        <div className="eb-table-wrap">
          <table className="eb-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Address</th>
                <th style={{ width: 140 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="eb-empty">
                    Loading customers...
                  </td>
                </tr>
              )}
              {!loading &&
                view.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <strong>{c.name}</strong>
                    </td>
                    <td>{c.phone}</td>
                    <td>{c.email}</td>
                    <td>{c.address}</td>
                    <td>
                      <div className="eb-row-actions">
                        <button
                          className="eb-btn eb-btn-ghost eb-btn-sm"
                          onClick={() => setEditing(c)}
                        >
                          Edit
                        </button>
                        <button
                          className="eb-btn eb-btn-ghost eb-btn-sm"
                          style={{ color: "var(--c-danger)" }}
                          onClick={() => remove(c._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              {!loading && !view.length && (
                <tr>
                  <td colSpan={5} className="eb-empty">
                    No customers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {pages > 1 && (
        <div className="eb-pag">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            ‹ Prev
          </button>
          {Array.from({ length: pages }).map((_, i) => (
            <button
              key={i}
              className={page === i + 1 ? "active" : ""}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button disabled={page === pages} onClick={() => setPage((p) => p + 1)}>
            Next ›
          </button>
        </div>
      )}

      {editing && (
        <CustomerModal initial={editing} onClose={() => setEditing(null)} onSave={save} />
      )}
    </div>
  );
}

function CustomerModal({
  initial,
  onClose,
  onSave,
}: {
  initial: Customer;
  onClose: () => void;
  onSave: (c: Customer) => void;
}) {
  const [c, setC] = useState<Customer>(initial);
  const update = <K extends keyof Customer>(k: K, v: Customer[K]) =>
    setC((prev) => ({ ...prev, [k]: v }));
  return (
    <div className="eb-modal-back" onClick={onClose}>
      <div className="eb-modal" onClick={(e) => e.stopPropagation()}>
        <div className="eb-modal-head">
          <h2>{initial._id ? "Edit" : "Add"} Customer</h2>
          <button className="eb-btn eb-btn-ghost" onClick={onClose}>
            ✕
          </button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(c); }}>
          <div className="eb-modal-body">
            <div className="eb-form-row">
              <label className="eb-label">Name</label>
              <input
                className="eb-input"
                value={c.name}
                required
                onChange={(e) => update("name", e.target.value)}
              />
            </div>
            <div className="eb-form-grid">
              <div className="eb-form-row">
                <label className="eb-label">Phone (Mobile Number)</label>
                <input
                  className="eb-input"
                  required
                  value={c.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="Enter mobile number"
                />
              </div>
              <div className="eb-form-row">
                <label className="eb-label">Email Address</label>
                <input
                  className="eb-input"
                  type="email"
                  required
                  value={c.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
            </div>
            <div className="eb-form-row">
              <label className="eb-label">Password {initial._id && "(Leave blank to keep current)"}</label>
              <input
                className="eb-input"
                type="password"
                required={!initial._id}
                value={c.password || ""}
                onChange={(e) => update("password", e.target.value)}
                placeholder={initial._id ? "Enter new password if changing" : "Enter password"}
              />
            </div>
            <div className="eb-form-row">
              <label className="eb-label">Address</label>
              <textarea
                className="eb-textarea"
                value={c.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="Enter customer address"
              />
            </div>
          </div>
          <div className="eb-modal-foot">
            <button type="button" className="eb-btn eb-btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="eb-btn eb-btn-primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
