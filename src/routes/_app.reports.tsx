import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { fmtINR } from "@/lib/db";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({ meta: [{ title: "Reports — EasyBill" }] }),
  component: ReportsPage,
});

type Report = "sales" | "payments" | "expenses" | "profit";

function ReportsPage() {
  const [active, setActive] = useState<Report>("sales");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = async (r: Report = active) => {
    setLoading(true);
    try {
      let result;
      if (r === "sales") result = await api.reports.sales(from, to);
      else if (r === "payments") result = await api.reports.payments(from, to);
      else if (r === "expenses") result = await api.reports.expenses(from, to);
      else result = await api.reports.profit(from, to);
      setData(result);
    } catch (err: any) {
      alert(err.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (r: Report) => {
    setActive(r);
    setData(null);
    setTimeout(() => {
      setActive(r);
      void (async () => {
        setLoading(true);
        try {
          let result;
          if (r === "sales") result = await api.reports.sales(from, to);
          else if (r === "payments") result = await api.reports.payments(from, to);
          else if (r === "expenses") result = await api.reports.expenses(from, to);
          else result = await api.reports.profit(from, to);
          setData(result);
        } catch {
          // ignore
        } finally {
          setLoading(false);
        }
      })();
    }, 0);
  };

  const exportCSV = (rows: Record<string, unknown>[], name: string) => {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="eb-card eb-card-pad" style={{ marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
          {(["sales", "payments", "expenses", "profit"] as Report[]).map((r) => (
            <button
              key={r}
              className={`eb-btn ${active === r ? "eb-btn-primary" : "eb-btn-outline"}`}
              onClick={() => switchTab(r)}
            >
              {r[0].toUpperCase() + r.slice(1)} Report
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <input
            className="eb-input"
            style={{ width: 160 }}
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <input
            className="eb-input"
            style={{ width: 160 }}
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <button className="eb-btn eb-btn-outline" onClick={() => load(active)}>
            Apply Filter
          </button>
        </div>
      </div>

      {loading && <div className="eb-empty">Loading report...</div>}

      {!loading && !data && (
        <div className="eb-empty">Select a report type and click "Apply Filter" to load data.</div>
      )}

      {!loading && data && active === "sales" && (
        <div className="eb-card">
          <div className="eb-card-head">
            <h2>Sales Report — {fmtINR(data.totalSales)}</h2>
            <button
              className="eb-btn eb-btn-outline eb-btn-sm"
              onClick={() => exportCSV(data.invoices as Record<string, unknown>[], "sales")}
            >
              Export CSV
            </button>
          </div>
          <div className="eb-table-wrap">
            <table className="eb-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Subtotal</th>
                  <th>GST</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.invoices.map((i: any) => (
                  <tr key={i.id}>
                    <td>{i.number}</td>
                    <td>{i.date}</td>
                    <td>{i.customerName}</td>
                    <td>{fmtINR(i.subtotal)}</td>
                    <td>{fmtINR(i.gst)}</td>
                    <td>
                      <strong>{fmtINR(i.total)}</strong>
                    </td>
                    <td>{i.status}</td>
                  </tr>
                ))}
                {!data.invoices.length && (
                  <tr>
                    <td colSpan={7} className="eb-empty">No data</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && data && active === "payments" && (
        <div className="eb-card">
          <div className="eb-card-head">
            <h2>
              Payments — Paid {fmtINR(data.totalPaid)} · Pending{" "}
              {fmtINR(data.totalPending)}
            </h2>
            <button
              className="eb-btn eb-btn-outline eb-btn-sm"
              onClick={() => exportCSV(data.payments as Record<string, unknown>[], "payments")}
            >
              Export CSV
            </button>
          </div>
          <div className="eb-table-wrap">
            <table className="eb-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Invoice</th>
                  <th>Method</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.payments.map((p: any) => (
                  <tr key={p.id}>
                    <td>{p.date}</td>
                    <td>{p.invoiceNumber}</td>
                    <td>{p.method}</td>
                    <td>
                      <strong>{fmtINR(p.amount)}</strong>
                    </td>
                  </tr>
                ))}
                {!data.payments.length && (
                  <tr>
                    <td colSpan={4} className="eb-empty">No data</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && data && active === "expenses" && (
        <div className="eb-card">
          <div className="eb-card-head">
            <h2>Expenses — {fmtINR(data.totalExpenses)}</h2>
            <button
              className="eb-btn eb-btn-outline eb-btn-sm"
              onClick={() => exportCSV(data.expenses as Record<string, unknown>[], "expenses")}
            >
              Export CSV
            </button>
          </div>
          <div className="eb-table-wrap">
            <table className="eb-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {data.expenses.map((e: any) => (
                  <tr key={e._id}>
                    <td>{e.date}</td>
                    <td>{e.category}</td>
                    <td>
                      <strong>{fmtINR(e.amount)}</strong>
                    </td>
                    <td>{e.note ?? "—"}</td>
                  </tr>
                ))}
                {!data.expenses.length && (
                  <tr>
                    <td colSpan={4} className="eb-empty">No data</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && data && active === "profit" && (
        <div className="eb-grid eb-grid-3">
          <div className="eb-stat">
            <div className="eb-stat-label">Total Sales</div>
            <div className="eb-stat-value">{fmtINR(data.sales)}</div>
          </div>
          <div className="eb-stat">
            <div className="eb-stat-label">Total Expenses</div>
            <div className="eb-stat-value" style={{ color: "var(--c-danger)" }}>
              {fmtINR(data.expenses)}
            </div>
          </div>
          <div className="eb-stat">
            <div className="eb-stat-label">Net Profit</div>
            <div
              className="eb-stat-value"
              style={{ color: data.profit >= 0 ? "var(--c-success)" : "var(--c-danger)" }}
            >
              {fmtINR(data.profit)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
