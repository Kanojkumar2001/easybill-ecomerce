import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { fmtINR } from "@/lib/db";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_app/taxes")({
  head: () => ({ meta: [{ title: "Taxes (GST) — EasyBill" }] }),
  component: TaxesPage,
});

type Invoice = {
  _id: string;
  number: string;
  date: string;
  customer: { _id: string; name: string } | string;
  subtotal: number;
  cgst: number;
  sgst: number;
  total: number;
};

function TaxesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.invoices
      .list()
      .then((data) => { setInvoices(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const getCustomerName = (inv: Invoice) => {
    if (typeof inv.customer === "object" && inv.customer !== null) return inv.customer.name;
    return "—";
  };

  const cgstTotal = invoices.reduce((s, i) => s + i.cgst, 0);
  const sgstTotal = invoices.reduce((s, i) => s + i.sgst, 0);
  const gstTotal = cgstTotal + sgstTotal;
  const taxableTotal = invoices.reduce((s, i) => s + i.subtotal, 0);

  return (
    <div>
      <div className="eb-grid eb-grid-4" style={{ marginBottom: "1.25rem" }}>
        <div className="eb-stat">
          <div className="eb-stat-label">Taxable Value</div>
          <div className="eb-stat-value">{fmtINR(taxableTotal)}</div>
        </div>
        <div className="eb-stat">
          <div className="eb-stat-label">CGST</div>
          <div className="eb-stat-value">{fmtINR(cgstTotal)}</div>
        </div>
        <div className="eb-stat">
          <div className="eb-stat-label">SGST</div>
          <div className="eb-stat-value">{fmtINR(sgstTotal)}</div>
        </div>
        <div className="eb-stat">
          <div className="eb-stat-label">Total GST</div>
          <div className="eb-stat-value">{fmtINR(gstTotal)}</div>
        </div>
      </div>

      <div className="eb-card">
        <div className="eb-card-head">
          <h2>GST Summary by Invoice</h2>
        </div>
        <div className="eb-table-wrap">
          <table className="eb-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Taxable</th>
                <th>CGST</th>
                <th>SGST</th>
                <th>Total Tax</th>
                <th>Invoice Total</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="eb-empty">Loading GST data...</td>
                </tr>
              )}
              {!loading && invoices.map((i) => (
                <tr key={i._id}>
                  <td>
                    <strong>{i.number}</strong>
                  </td>
                  <td>{getCustomerName(i)}</td>
                  <td>{i.date}</td>
                  <td>{fmtINR(i.subtotal)}</td>
                  <td>{fmtINR(i.cgst)}</td>
                  <td>{fmtINR(i.sgst)}</td>
                  <td>
                    <strong>{fmtINR(i.cgst + i.sgst)}</strong>
                  </td>
                  <td>{fmtINR(i.total)}</td>
                </tr>
              ))}
              {!loading && !invoices.length && (
                <tr>
                  <td colSpan={8} className="eb-empty">No tax data yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
