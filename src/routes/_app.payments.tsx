import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { fmtINR } from "@/lib/db";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_app/payments")({
  head: () => ({ meta: [{ title: "Payments — EasyBill" }] }),
  component: PaymentsPage,
});

type Invoice = {
  _id: string;
  number: string;
  total: number;
  status: string;
  customer?: { name: string };
};

type Payment = {
  _id: string;
  invoiceId: Invoice | string;
  date: string;
  amount: number;
  method: string;
  note?: string;
};

function PaymentsPage() {
  const [rows, setRows] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.payments.list(), api.invoices.list()])
      .then(([pays, invs]) => {
        setRows(pays);
        setInvoices(invs);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const invMap = useMemo(
    () => Object.fromEntries(invoices.map((i) => [i._id, i])),
    [invoices],
  );

  const add = async (p: { invoiceId: string; date: string; amount: number; method: string; note: string }) => {
    try {
      const created = await api.payments.create(p);
      setRows((prev) => [created, ...prev]);
      // Update invoice status in local list
      setInvoices((prev) =>
        prev.map((i) => (i._id === p.invoiceId ? { ...i, status: "Paid" } : i)),
      );
      setOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to record payment");
    }
  };

  const getInvoice = (p: Payment): Invoice | undefined => {
    if (typeof p.invoiceId === "object" && p.invoiceId !== null) return p.invoiceId as Invoice;
    return invMap[p.invoiceId as string];
  };

  return (
    <div>
      <div className="eb-toolbar">
        <div>
          Total received:{" "}
          <strong>{fmtINR(rows.reduce((s, p) => s + p.amount, 0))}</strong>
        </div>
        <button className="eb-btn eb-btn-primary" onClick={() => setOpen(true)}>
          + Record Payment
        </button>
      </div>
      <div className="eb-card">
        <div className="eb-table-wrap">
          <table className="eb-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Invoice</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="eb-empty">Loading payments...</td>
                </tr>
              )}
              {!loading && rows.map((p) => {
                const inv = getInvoice(p);
                return (
                  <tr key={p._id}>
                    <td>{p.date}</td>
                    <td>
                      <strong>{inv?.number ?? "—"}</strong>
                    </td>
                    <td>
                      <span className="eb-badge eb-badge-info">{p.method}</span>
                    </td>
                    <td>
                      <strong>{fmtINR(p.amount)}</strong>
                    </td>
                    <td>{p.note ?? "—"}</td>
                  </tr>
                );
              })}
              {!loading && !rows.length && (
                <tr>
                  <td colSpan={5} className="eb-empty">No payments recorded</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <PaymentForm invoices={invoices} onClose={() => setOpen(false)} onSave={add} />
      )}
    </div>
  );
}

function PaymentForm({
  invoices,
  onClose,
  onSave,
}: {
  invoices: Invoice[];
  onClose: () => void;
  onSave: (p: { invoiceId: string; date: string; amount: number; method: string; note: string }) => void;
}) {
  const pending = invoices.filter((i) => i.status !== "Paid");
  const [invoiceId, setInvoiceId] = useState(pending[0]?._id ?? "");
  const [amount, setAmount] = useState(pending[0]?.total ?? 0);
  const [method, setMethod] = useState("UPI");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  return (
    <div className="eb-modal-back" onClick={onClose}>
      <div className="eb-modal" onClick={(e) => e.stopPropagation()}>
        <div className="eb-modal-head">
          <h2>Record Payment</h2>
          <button className="eb-btn eb-btn-ghost" onClick={onClose}>✕</button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (invoiceId) onSave({ invoiceId, amount, method, date, note });
          }}
        >
          <div className="eb-modal-body">
            <div className="eb-form-row">
              <label className="eb-label">Invoice</label>
              <select
                className="eb-select"
                value={invoiceId}
                onChange={(e) => {
                  setInvoiceId(e.target.value);
                  const inv = invoices.find((i) => i._id === e.target.value);
                  if (inv) setAmount(inv.total);
                }}
                required
              >
                <option value="">Select pending invoice</option>
                {pending.map((i) => (
                  <option key={i._id} value={i._id}>
                    {i.number} — {fmtINR(i.total)}
                  </option>
                ))}
              </select>
            </div>
            <div className="eb-form-grid">
              <div className="eb-form-row">
                <label className="eb-label">Amount</label>
                <input
                  className="eb-input"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(+e.target.value)}
                />
              </div>
              <div className="eb-form-row">
                <label className="eb-label">Method</label>
                <select
                  className="eb-select"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                >
                  <option>UPI</option>
                  <option>Cash</option>
                  <option>Bank Transfer</option>
                  <option>Credit Card</option>
                </select>
              </div>
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
            <button type="button" className="eb-btn eb-btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="eb-btn eb-btn-primary">Save Payment</button>
          </div>
        </form>
      </div>
    </div>
  );
}
