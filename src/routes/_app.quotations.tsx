import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { fmtINR } from "@/lib/db";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_app/quotations")({
  head: () => ({ meta: [{ title: "Quotations — EasyBill" }] }),
  component: QuotationsPage,
});

type LineItem = {
  productId: string;
  name: string;
  qty: number;
  price: number;
  gst: number;
};

type Customer = { _id: string; name: string; email: string; phone: string; address: string };
type Product = { _id: string; name: string; price: number; gst: number; category: string; stock: number };

type Quotation = {
  _id: string;
  number: string;
  customer: Customer | string;
  date: string;
  items: LineItem[];
  status: "Draft" | "Approved" | "Rejected";
  total: number;
};

function QuotationsPage() {
  const [rows, setRows] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.quotations.list(), api.customers.list(), api.products.list()])
      .then(([qts, custs, prods]) => {
        setRows(qts);
        setCustomers(custs);
        setProducts(prods);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getCustomer = (q: Quotation): Customer | undefined => {
    if (typeof q.customer === "object" && q.customer !== null) return q.customer as Customer;
    return customers.find((c) => c._id === q.customer);
  };

  const create = async (q: Omit<Quotation, "_id">) => {
    try {
      const created = await api.quotations.create(q);
      setRows((prev) => [created, ...prev]);
      setShowNew(false);
    } catch (err: any) {
      alert(err.message || "Failed to create quotation");
    }
  };

  const setStatus = async (id: string, status: Quotation["status"]) => {
    try {
      const updated = await api.quotations.updateStatus(id, status);
      setRows((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    }
  };

  const convert = async (q: Quotation) => {
    try {
      const subtotal = q.items.reduce((s, i) => s + i.qty * i.price, 0);
      const gstAmt = q.items.reduce((s, i) => s + (i.qty * i.price * i.gst) / 100, 0);
      const customerId = typeof q.customer === "object" ? (q.customer as Customer)._id : q.customer;
      const allInvoices = await api.invoices.list();
      const invData = {
        number: `INV-${1000 + allInvoices.length + 1}`,
        customer: customerId,
        date: new Date().toISOString().slice(0, 10),
        items: q.items,
        subtotal,
        cgst: gstAmt / 2,
        sgst: gstAmt / 2,
        total: subtotal + gstAmt,
        status: "Pending",
      };
      const inv = await api.invoices.create(invData);
      alert(`Quotation converted to invoice ${inv.number}`);
    } catch (err: any) {
      alert(err.message || "Failed to convert quotation");
    }
  };

  return (
    <div>
      <div className="eb-toolbar">
        <div>
          <strong>{rows.length}</strong>{" "}
          <span style={{ color: "var(--c-text-muted)" }}>quotations</span>
        </div>
        <button className="eb-btn eb-btn-primary" onClick={() => setShowNew(true)}>
          + New Quotation
        </button>
      </div>
      <div className="eb-card">
        <div className="eb-table-wrap">
          <table className="eb-table">
            <thead>
              <tr>
                <th>Quote #</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="eb-empty">Loading quotations...</td>
                </tr>
              )}
              {!loading && rows.map((q) => (
                <tr key={q._id}>
                  <td>
                    <strong>{q.number}</strong>
                  </td>
                  <td>{getCustomer(q)?.name ?? "—"}</td>
                  <td>{q.date}</td>
                  <td>{fmtINR(q.total)}</td>
                  <td>
                    <select
                      className="eb-select"
                      style={{ width: 120, padding: ".25rem .5rem" }}
                      value={q.status}
                      onChange={(e) => setStatus(q._id, e.target.value as Quotation["status"])}
                    >
                      <option>Draft</option>
                      <option>Approved</option>
                      <option>Rejected</option>
                    </select>
                  </td>
                  <td>
                    <button
                      className="eb-btn eb-btn-outline eb-btn-sm"
                      onClick={() => convert(q)}
                    >
                      → Convert to Invoice
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && !rows.length && (
                <tr>
                  <td colSpan={6} className="eb-empty">No quotations yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showNew && (
        <QuoteForm
          customers={customers}
          products={products}
          nextNumber={`QTN-${500 + rows.length + 1}`}
          onClose={() => setShowNew(false)}
          onSave={create}
        />
      )}
    </div>
  );
}

function QuoteForm({
  customers,
  products,
  nextNumber,
  onClose,
  onSave,
}: {
  customers: Customer[];
  products: Product[];
  nextNumber: string;
  onClose: () => void;
  onSave: (q: any) => void;
}) {
  const [customerId, setCustomerId] = useState(customers[0]?._id ?? "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<LineItem[]>([]);

  const addItem = () => {
    if (!products[0]) return;
    const p = products[0];
    setItems([
      ...items,
      { productId: p._id, name: p.name, qty: 1, price: p.price, gst: p.gst },
    ]);
  };

  const upd = (idx: number, patch: Partial<LineItem>) =>
    setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const rem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const pickProduct = (idx: number, pid: string) => {
    const p = products.find((x) => x._id === pid);
    if (p) upd(idx, { productId: p._id, name: p.name, price: p.price, gst: p.gst });
  };

  const total = items.reduce((s, i) => s + i.qty * i.price * (1 + i.gst / 100), 0);

  return (
    <div className="eb-modal-back" onClick={onClose}>
      <div className="eb-modal eb-modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="eb-modal-head">
          <h2>New Quotation — {nextNumber}</h2>
          <button className="eb-btn eb-btn-ghost" onClick={onClose}>✕</button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (customerId && items.length)
              onSave({
                number: nextNumber,
                customer: customerId,
                date,
                items,
                status: "Draft",
                total,
              });
          }}
        >
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
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
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
            <table className="eb-table" style={{ marginTop: "1rem" }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>GST%</th>
                  <th>Amount</th>
                  <th></th>
                </tr>
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
                          <option key={p._id} value={p._id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        className="eb-input"
                        style={{ width: 70 }}
                        type="number"
                        min={1}
                        value={it.qty}
                        onChange={(e) => upd(idx, { qty: +e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        className="eb-input"
                        style={{ width: 100 }}
                        type="number"
                        value={it.price}
                        onChange={(e) => upd(idx, { price: +e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        className="eb-input"
                        style={{ width: 70 }}
                        type="number"
                        value={it.gst}
                        onChange={(e) => upd(idx, { gst: +e.target.value })}
                      />
                    </td>
                    <td>{fmtINR(it.qty * it.price * (1 + it.gst / 100))}</td>
                    <td>
                      <button
                        type="button"
                        className="eb-btn eb-btn-ghost eb-btn-sm"
                        onClick={() => rem(idx)}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
                {!items.length && (
                  <tr>
                    <td colSpan={6} className="eb-empty">No items added</td>
                  </tr>
                )}
              </tbody>
            </table>
            <button
              type="button"
              className="eb-btn eb-btn-outline eb-btn-sm"
              style={{ marginTop: ".5rem" }}
              onClick={addItem}
            >
              + Add Item
            </button>
            <div style={{ textAlign: "right", marginTop: "1rem", fontSize: "1.1rem" }}>
              Total:{" "}
              <strong style={{ color: "var(--c-primary)" }}>{fmtINR(total)}</strong>
            </div>
          </div>
          <div className="eb-modal-foot">
            <button type="button" className="eb-btn eb-btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="eb-btn eb-btn-primary">
              Save Quotation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
