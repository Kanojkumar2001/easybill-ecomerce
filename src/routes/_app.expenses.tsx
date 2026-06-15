import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fmtINR } from "@/lib/db";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_app/expenses")({
  head: () => ({ meta: [{ title: "Expenses — EasyBill" }] }),
  component: ExpensesPage,
});

const CATEGORIES = [
  "Shop Rent",
  "Electricity Bill",
  "Internet Charges",
  "Salary",
  "Maintenance",
  "Other",
];

type Expense = {
  _id: string;
  date: string;
  category: string;
  amount: number;
  note?: string;
};

function ExpensesPage() {
  const [rows, setRows] = useState<Expense[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.expenses
      .list()
      .then((data) => { setRows(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const add = async (e: Omit<Expense, "_id">) => {
    try {
      const created = await api.expenses.create(e);
      setRows((prev) => [created, ...prev]);
      setOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to add expense");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete?")) return;
    try {
      await api.expenses.delete(id);
      setRows((prev) => prev.filter((r) => r._id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete expense");
    }
  };

  const total = rows.reduce((s, e) => s + e.amount, 0);
  const byCat = CATEGORIES.map((c) => ({
    c,
    sum: rows.filter((r) => r.category === c).reduce((s, r) => s + r.amount, 0),
  })).filter((x) => x.sum > 0);

  return (
    <div>
      <div className="eb-toolbar">
        <div>
          Total expenses: <strong>{fmtINR(total)}</strong>
        </div>
        <button className="eb-btn eb-btn-primary" onClick={() => setOpen(true)}>
          + Add Expense
        </button>
      </div>

      <div className="eb-grid eb-grid-3" style={{ marginBottom: "1.25rem" }}>
        {byCat.slice(0, 3).map((b) => (
          <div className="eb-stat" key={b.c}>
            <div className="eb-stat-label">{b.c}</div>
            <div className="eb-stat-value">{fmtINR(b.sum)}</div>
          </div>
        ))}
      </div>

      <div className="eb-card">
        <div className="eb-table-wrap">
          <table className="eb-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Note</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="eb-empty">Loading expenses...</td>
                </tr>
              )}
              {!loading && rows.map((e) => (
                <tr key={e._id}>
                  <td>{e.date}</td>
                  <td>
                    <span className="eb-badge eb-badge-info">{e.category}</span>
                  </td>
                  <td>
                    <strong>{fmtINR(e.amount)}</strong>
                  </td>
                  <td>{e.note ?? "—"}</td>
                  <td>
                    <button
                      className="eb-btn eb-btn-ghost eb-btn-sm"
                      style={{ color: "var(--c-danger)" }}
                      onClick={() => remove(e._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && !rows.length && (
                <tr>
                  <td colSpan={5} className="eb-empty">No expenses recorded</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {open && <ExpenseForm onClose={() => setOpen(false)} onSave={add} />}
    </div>
  );
}

function ExpenseForm({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (e: Omit<Expense, "_id">) => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState("");

  return (
    <div className="eb-modal-back" onClick={onClose}>
      <div className="eb-modal" onClick={(e) => e.stopPropagation()}>
        <div className="eb-modal-head">
          <h2>Add Expense</h2>
          <button className="eb-btn eb-btn-ghost" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ date, category, amount, note }); }}>
          <div className="eb-modal-body">
            <div className="eb-form-grid">
              <div className="eb-form-row">
                <label className="eb-label">Date</label>
                <input
                  className="eb-input"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="eb-form-row">
                <label className="eb-label">Category</label>
                <select
                  className="eb-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="eb-form-row">
                <label className="eb-label">Amount</label>
                <input
                  className="eb-input"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(+e.target.value)}
                  required
                />
              </div>
              <div className="eb-form-row">
                <label className="eb-label">Note</label>
                <input
                  className="eb-input"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="eb-modal-foot">
            <button type="button" className="eb-btn eb-btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="eb-btn eb-btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
