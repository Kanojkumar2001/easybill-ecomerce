import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { fmtINR } from "@/lib/db";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_app/invoices")({
  head: () => ({ meta: [{ title: "Invoices — EasyBill" }] }),
  component: InvoicesPage,
});

type LineItem = { productId: string; name: string; qty: number; price: number; gst: number };
type Customer = { _id: string; name: string; email: string; phone: string; address: string };
type Product = { _id: string; name: string; price: number; gst: number; category: string; stock: number };
type Invoice = {
  _id: string;
  number: string;
  customer: Customer | string;
  date: string;
  items: LineItem[];
  status: "Paid" | "Pending" | "Overdue";
  subtotal: number;
  cgst: number;
  sgst: number;
  total: number;
};

function InvoicesPage() {
  const [rows, setRows] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [viewInv, setViewInv] = useState<Invoice | null>(null);
  const [payingInv, setPayingInv] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const u = localStorage.getItem("eb_user");
    if (u) {
      try {
        setUser(JSON.parse(u));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const role = user?.role || "admin";

  const loadData = () => {
    setLoading(true);
    const fetches = [api.invoices.list()];
    if (role !== "customer") {
      fetches.push(api.customers.list(), api.products.list());
    }

    Promise.all(fetches)
      .then(([invs, custs = [], prods = []]) => {
        setRows(invs);
        setCustomers(custs);
        setProducts(prods);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [role]);

  const cmap = useMemo(
    () => Object.fromEntries(customers.map((c) => [c._id, c])),
    [customers],
  );

  const getCustomer = (inv: Invoice): Customer | undefined => {
    if (typeof inv.customer === "object" && inv.customer !== null) return inv.customer as Customer;
    return cmap[inv.customer as string];
  };

  const create = async (inv: any) => {
    try {
      const created = await api.invoices.create(inv);
      setRows((prev) => [created, ...prev]);
      setShowNew(false);
    } catch (err: any) {
      alert(err.message || "Failed to create invoice");
    }
  };

  const setStatus = async (id: string, status: Invoice["status"]) => {
    try {
      const updated = await api.invoices.updateStatus(id, status);
      setRows((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this invoice?")) return;
    try {
      await api.invoices.delete(id);
      setRows((prev) => prev.filter((r) => r._id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete invoice");
    }
  };

  const handlePay = async (method: "UPI" | "Cash", note: string) => {
    if (!payingInv) return;
    try {
      await api.payments.create({
        invoiceId: payingInv._id,
        date: new Date().toISOString().slice(0, 10),
        amount: payingInv.total,
        method,
        note: note || `Customer payment via ${method}`,
      });
      alert("Payment recorded successfully! Thank you.");
      setPayingInv(null);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to process payment");
    }
  };

  return (
    <div>
      <div className="eb-toolbar">
        <div>
          <strong>{rows.length}</strong>{" "}
          <span style={{ color: "var(--c-text-muted)" }}>invoices</span>
        </div>
        {role !== "customer" && (
          <button className="eb-btn eb-btn-primary" onClick={() => setShowNew(true)}>
            + New Invoice
          </button>
        )}
      </div>
      <div className="eb-card">
        <div className="eb-table-wrap">
          <table className="eb-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>{role === "customer" ? "From Business" : "Customer"}</th>
                <th>Date</th>
                <th>Subtotal</th>
                <th>GST</th>
                <th>Total</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="eb-empty">Loading invoices...</td>
                </tr>
              )}
              {!loading && rows.map((i: any) => (
                <tr key={i._id}>
                  <td>
                    <strong>{i.number}</strong>
                  </td>
                  <td>
                    {role === "customer"
                      ? (i.user?.name ?? "—")
                      : (getCustomer(i)?.name ?? "—")
                    }
                  </td>
                  <td>{i.date}</td>
                  <td>{fmtINR(i.subtotal)}</td>
                  <td>{fmtINR(i.cgst + i.sgst)}</td>
                  <td>
                    <strong>{fmtINR(i.total)}</strong>
                  </td>
                  <td>
                    {role === "customer" ? (
                      <span className={`eb-badge ${i.status === "Paid" ? "eb-badge-success" : i.status === "Pending" ? "eb-badge-warn" : "eb-badge-danger"}`}>
                        {i.status}
                      </span>
                    ) : (
                      <select
                        className="eb-select"
                        style={{ width: 120, padding: ".25rem .5rem" }}
                        value={i.status}
                        onChange={(e) => setStatus(i._id, e.target.value as Invoice["status"])}
                      >
                        <option>Paid</option>
                        <option>Pending</option>
                        <option>Overdue</option>
                      </select>
                    )}
                  </td>
                  <td>
                    <div className="eb-row-actions">
                      <button
                        className="eb-btn eb-btn-ghost eb-btn-sm"
                        onClick={() => setViewInv(i)}
                      >
                        View
                      </button>
                      {role === "customer" && i.status !== "Paid" && (
                        <button
                          className="eb-btn eb-btn-primary eb-btn-sm"
                          style={{ padding: ".25rem .5rem", fontSize: ".8rem" }}
                          onClick={() => setPayingInv(i)}
                        >
                          Pay Now
                        </button>
                      )}
                      {role !== "customer" && (
                        <button
                          className="eb-btn eb-btn-ghost eb-btn-sm"
                          style={{ color: "var(--c-danger)" }}
                          onClick={() => remove(i._id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !rows.length && (
                <tr>
                  <td colSpan={8} className="eb-empty">No invoices yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showNew && (
        <InvoiceForm
          customers={customers}
          products={products}
          onClose={() => setShowNew(false)}
          onSave={create}
          nextNumber={`INV-${1000 + rows.length + 1}`}
        />
      )}
      {viewInv && (
        <InvoiceViewer
          invoice={viewInv}
          customer={getCustomer(viewInv)}
          onClose={() => setViewInv(null)}
        />
      )}
      {payingInv && (
        <PaymentPortalModal
          invoice={payingInv}
          onClose={() => setPayingInv(null)}
          onPay={handlePay}
        />
      )}
    </div>
  );
}

function InvoiceForm({
  customers,
  products,
  onClose,
  onSave,
  nextNumber,
}: {
  customers: Customer[];
  products: Product[];
  onClose: () => void;
  onSave: (i: any) => void;
  nextNumber: string;
}) {
  const [customerId, setCustomerId] = useState(customers[0]?._id ?? "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<LineItem[]>([]);

  const addItem = () => {
    if (!products[0]) return;
    const p = products[0];
    setItems([...items, { productId: p._id, name: p.name, qty: 1, price: p.price, gst: p.gst }]);
  };
  const updateItem = (idx: number, patch: Partial<LineItem>) =>
    setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const pickProduct = (idx: number, pid: string) => {
    const p = products.find((x) => x._id === pid);
    if (p) updateItem(idx, { productId: p._id, name: p.name, price: p.price, gst: p.gst });
  };

  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const gstAmt = items.reduce((s, i) => s + (i.qty * i.price * i.gst) / 100, 0);
  const cgst = gstAmt / 2, sgst = gstAmt / 2;
  const total = subtotal + gstAmt;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !items.length) return;
    onSave({ number: nextNumber, customer: customerId, date, items, subtotal, cgst, sgst, total, status: "Pending" });
  };

  return (
    <div className="eb-modal-back" onClick={onClose}>
      <div className="eb-modal eb-modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="eb-modal-head">
          <h2>New Invoice — {nextNumber}</h2>
          <button className="eb-btn eb-btn-ghost" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="eb-modal-body">
            <div className="eb-form-grid">
              <div className="eb-form-row">
                <label className="eb-label">Customer</label>
                <select
                  className="eb-select"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  required
                >
                  <option value="">Select customer</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
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
            </div>
            <h3 style={{ marginTop: "1rem" }}>Items</h3>
            <div className="eb-table-wrap">
              <table className="eb-table">
                <thead>
                  <tr><th>Product</th><th>Qty</th><th>Price</th><th>GST%</th><th>Amount</th><th></th></tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={idx}>
                      <td>
                        <select
                          className="eb-select"
                          value={it.productId}
                          onChange={(e) => pickProduct(idx, e.target.value)}
                        >
                          {products.map((p) => (
                            <option key={p._id} value={p._id}>{p.name}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input className="eb-input" style={{ width: 70 }} type="number" min={1} value={it.qty} onChange={(e) => updateItem(idx, { qty: +e.target.value })} />
                      </td>
                      <td>
                        <input className="eb-input" style={{ width: 100 }} type="number" value={it.price} onChange={(e) => updateItem(idx, { price: +e.target.value })} />
                      </td>
                      <td>
                        <input className="eb-input" style={{ width: 70 }} type="number" value={it.gst} onChange={(e) => updateItem(idx, { gst: +e.target.value })} />
                      </td>
                      <td>{fmtINR(it.qty * it.price * (1 + it.gst / 100))}</td>
                      <td>
                        <button type="button" className="eb-btn eb-btn-ghost eb-btn-sm" onClick={() => removeItem(idx)}>✕</button>
                      </td>
                    </tr>
                  ))}
                  {!items.length && (
                    <tr><td colSpan={6} className="eb-empty">Click "+ Add Item" to begin</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <button type="button" className="eb-btn eb-btn-outline eb-btn-sm" style={{ marginTop: ".5rem" }} onClick={addItem}>
              + Add Item
            </button>
            <div style={{ marginTop: "1.25rem", textAlign: "right" }}>
              <div>Subtotal: <strong>{fmtINR(subtotal)}</strong></div>
              <div>CGST: <strong>{fmtINR(cgst)}</strong></div>
              <div>SGST: <strong>{fmtINR(sgst)}</strong></div>
              <div style={{ fontSize: "1.15rem", marginTop: ".4rem" }}>Total: <strong style={{ color: "var(--c-primary)" }}>{fmtINR(total)}</strong></div>
            </div>
          </div>
          <div className="eb-modal-foot">
            <button type="button" className="eb-btn eb-btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="eb-btn eb-btn-primary">Create Invoice</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InvoiceViewer({
  invoice,
  customer,
  onClose,
}: {
  invoice: Invoice;
  customer?: Customer;
  onClose: () => void;
}) {
  const printIt = () => window.print();
  return (
    <div className="eb-modal-back" onClick={onClose}>
      <div className="eb-modal eb-modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="eb-modal-head">
          <h2>{invoice.number}</h2>
          <button className="eb-btn eb-btn-ghost" onClick={onClose}>✕</button>
        </div>
        <div className="eb-modal-body">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
            <div>
              <h3 style={{ color: "var(--c-primary)" }}>EasyBill</h3>
              <div style={{ color: "var(--c-text-muted)", fontSize: ".85rem" }}>Tax Invoice</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div><strong>Date:</strong> {invoice.date}</div>
              <div><strong>Status:</strong> {invoice.status}</div>
            </div>
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <strong>Bill To:</strong><br />
            {customer?.name}<br />
            <span style={{ color: "var(--c-text-muted)" }}>
              {customer?.address}<br />
              {customer?.phone} · {customer?.email}
            </span>
          </div>
          <table className="eb-table">
            <thead>
              <tr><th>Item</th><th>Qty</th><th>Price</th><th>GST</th><th>Amount</th></tr>
            </thead>
            <tbody>
              {invoice.items.map((it, i) => (
                <tr key={i}>
                  <td>{it.name}</td>
                  <td>{it.qty}</td>
                  <td>{fmtINR(it.price)}</td>
                  <td>{it.gst}%</td>
                  <td>{fmtINR(it.qty * it.price * (1 + it.gst / 100))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ textAlign: "right", marginTop: "1rem" }}>
            <div>Subtotal: {fmtINR(invoice.subtotal)}</div>
            <div>CGST: {fmtINR(invoice.cgst)} · SGST: {fmtINR(invoice.sgst)}</div>
            <div style={{ fontSize: "1.2rem", marginTop: ".4rem" }}>
              <strong>Total: {fmtINR(invoice.total)}</strong>
            </div>
          </div>
        </div>
        <div className="eb-modal-foot">
          <button className="eb-btn eb-btn-outline" onClick={onClose}>Close</button>
          <button className="eb-btn eb-btn-primary" onClick={printIt}>Print / Save PDF</button>
        </div>
      </div>
    </div>
  );
}

function PaymentPortalModal({
  invoice,
  onClose,
  onPay,
}: {
  invoice: any;
  onClose: () => void;
  onPay: (method: "UPI" | "Cash", note: string) => void;
}) {
  const [method, setMethod] = useState<"UPI" | "Cash">("UPI");
  const [note, setNote] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onPay(method, note);
  };

  return (
    <div className="eb-modal-back" onClick={onClose}>
      <div className="eb-modal" onClick={(e) => e.stopPropagation()}>
        <div className="eb-modal-head">
          <h2>Pay Invoice {invoice.number}</h2>
          <button className="eb-btn eb-btn-ghost" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="eb-modal-body">
            <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "1.1rem", color: "var(--c-text-muted)" }}>Amount to Pay</div>
              <div style={{ fontSize: "2.25rem", fontWeight: "bold", color: "var(--c-primary)", margin: ".25rem 0" }}>
                {fmtINR(invoice.total)}
              </div>
            </div>

            <div className="eb-form-row">
              <label className="eb-label">Select Payment Method</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".5rem" }}>
                <button
                  type="button"
                  onClick={() => setMethod("UPI")}
                  className={`eb-btn ${method === "UPI" ? "eb-btn-primary" : "eb-btn-outline"}`}
                  style={{ justifyContent: "center" }}
                >
                  📱 UPI
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("Cash")}
                  className={`eb-btn ${method === "Cash" ? "eb-btn-primary" : "eb-btn-outline"}`}
                  style={{ justifyContent: "center" }}
                >
                  💵 Cash
                </button>
              </div>
            </div>

            {method === "UPI" ? (
              <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "8px", border: "1px dashed #cbd5e1", textAlign: "center", margin: "1rem 0" }}>
                <div style={{ fontSize: ".85rem", color: "var(--c-text-muted)", marginBottom: ".5rem" }}>Scan QR code using GooglePay, PhonePe, or Paytm</div>
                {/* Mock QR Code in CSS */}
                <div style={{ width: "160px", height: "160px", margin: "0 auto 1rem", background: "#fff", border: "1px solid #e2e8f0", padding: ".75rem", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div style={{ width: "35px", height: "35px", border: "8px solid #0f172a" }}></div>
                    <div style={{ width: "35px", height: "35px", border: "8px solid #0f172a" }}></div>
                  </div>
                  <div style={{ fontSize: ".5rem", opacity: .4 }}>EasyBill UPI Portal Mock QR</div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div style={{ width: "35px", height: "35px", border: "8px solid #0f172a" }}></div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px", width: "35px", height: "35px" }}>
                      <div style={{ background: "#0f172a" }}></div>
                      <div></div>
                      <div></div>
                      <div style={{ background: "#0f172a" }}></div>
                    </div>
                  </div>
                </div>
                <div>
                  <strong>UPI ID:</strong> <code style={{ background: "#e2e8f0", padding: ".2rem .4rem", borderRadius: "4px" }}>pay@easybill</code>
                </div>
              </div>
            ) : (
              <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "8px", border: "1px dashed #cbd5e1", margin: "1rem 0" }}>
                <strong>Cash Payment Recording</strong>
                <p style={{ fontSize: ".85rem", color: "var(--c-text-muted)", marginTop: ".25rem" }}>
                  Please hand over cash of <strong>{fmtINR(invoice.total)}</strong> to the merchant/owner. Once paid, click "Record Payment" to clear the dues.
                </p>
              </div>
            )}

            <div className="eb-form-row">
              <label className="eb-label">Payment Reference/Note (Optional)</label>
              <input
                className="eb-input"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Enter transaction ref number or note"
              />
            </div>
          </div>
          <div className="eb-modal-foot">
            <button type="button" className="eb-btn eb-btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="eb-btn eb-btn-primary">
              Record {method} Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
