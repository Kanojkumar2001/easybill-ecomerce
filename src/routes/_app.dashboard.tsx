import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fmtINR } from "@/lib/db";
import { api } from "@/lib/api";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — EasyBill" }] }),
  component: Dashboard,
});

function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard.get()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="eb-empty">Loading dashboard analytics...</div>;
  }

  if (!data) {
    return <div className="eb-empty">Failed to load dashboard data.</div>;
  }

  const role = data.role || "admin";

  if (role === "customer") {
    const customerStats = [
      { label: "Outstanding Balance", value: fmtINR(data.pendingAmount), icon: "⏳", color: "var(--c-danger)" },
      { label: "Total Paid Transactions", value: fmtINR(data.paymentsReceived), icon: "✓", color: "var(--c-success)" },
      { label: "Active Quotations", value: data.activeQuotationsCount, icon: "📝", color: "var(--c-primary)" },
      { label: "Total Invoices", value: data.invoicesCount, icon: "🧾", color: "var(--c-info)" },
    ];

    return (
      <div>
        <div className="eb-grid eb-grid-4" style={{ marginBottom: "1.5rem" }}>
          {customerStats.map((s) => (
            <div className="eb-stat" key={s.label}>
              <div className="eb-stat-icon" style={{ color: s.color }}>{s.icon}</div>
              <div className="eb-stat-label">{s.label}</div>
              <div className="eb-stat-value">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="eb-grid eb-grid-2" style={{ marginBottom: "1.5rem" }}>
          <div className="eb-card">
            <div className="eb-card-head">
              <h2>Recent Received Invoices</h2>
            </div>
            <div className="eb-table-wrap">
              <table className="eb-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentInvoices.map((i: any) => (
                    <tr key={i.id}>
                      <td><strong>{i.number}</strong></td>
                      <td>{i.date}</td>
                      <td>{fmtINR(i.total)}</td>
                      <td>
                        <span className={`eb-badge ${i.status === "Paid" ? "eb-badge-success" : "eb-badge-warn"}`}>
                          {i.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!data.recentInvoices.length && (
                    <tr>
                      <td colSpan={4} className="eb-empty">No invoices found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="eb-card">
            <div className="eb-card-head">
              <h2>Recent Received Quotations</h2>
            </div>
            <div className="eb-table-wrap">
              <table className="eb-table">
                <thead>
                  <tr>
                    <th>Quotation #</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentQuotations.map((q: any) => (
                    <tr key={q.id}>
                      <td><strong>{q.number}</strong></td>
                      <td>{q.date}</td>
                      <td>{fmtINR(q.total)}</td>
                      <td>
                        <span className={`eb-badge ${q.status === "Approved" ? "eb-badge-success" : q.status === "Rejected" ? "eb-badge-danger" : "eb-badge-info"}`}>
                          {q.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!data.recentQuotations.length && (
                    <tr>
                      <td colSpan={4} className="eb-empty">No quotations found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="eb-card">
          <div className="eb-card-head">
            <h2>Payment History</h2>
          </div>
          <div className="eb-table-wrap">
            <table className="eb-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Invoice Number</th>
                  <th>Method</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.recentPayments.map((p: any) => (
                  <tr key={p.id}>
                    <td>{p.date}</td>
                    <td><strong>{p.invoiceNumber}</strong></td>
                    <td>{p.method}</td>
                    <td><strong>{fmtINR(p.amount)}</strong></td>
                  </tr>
                ))}
                {!data.recentPayments.length && (
                  <tr>
                    <td colSpan={4} className="eb-empty">No payments made yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (role === "employee") {
    const employeeStats = [
      { label: "Outstanding Dues", value: fmtINR(data.pendingPaymentsTotal), icon: "⏳", color: "var(--c-danger)" },
      { label: "Today's Collections", value: fmtINR(data.paymentCollections), icon: "✓", color: "var(--c-success)" },
      { label: "Today's Invoices", value: data.todayInvoicesCount, icon: "🧾", color: "var(--c-primary)" },
      { label: "Today's Quotations", value: data.todayQuotationsCount, icon: "📝", color: "var(--c-info)" },
    ];

    return (
      <div>
        <div className="eb-grid eb-grid-4" style={{ marginBottom: "1.5rem" }}>
          {employeeStats.map((s) => (
            <div className="eb-stat" key={s.label}>
              <div className="eb-stat-icon" style={{ color: s.color }}>{s.icon}</div>
              <div className="eb-stat-label">{s.label}</div>
              <div className="eb-stat-value">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="eb-card">
          <div className="eb-card-head">
            <h2>Invoices Generated Today</h2>
          </div>
          <div className="eb-table-wrap">
            <table className="eb-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentInvoices.map((i: any) => (
                  <tr key={i.id}>
                    <td><strong>{i.number}</strong></td>
                    <td>{i.date}</td>
                    <td>{fmtINR(i.total)}</td>
                    <td>
                      <span className={`eb-badge ${i.status === "Paid" ? "eb-badge-success" : "eb-badge-warn"}`}>
                        {i.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {!data.recentInvoices.length && (
                  <tr>
                    <td colSpan={4} className="eb-empty">No invoices created today yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Admin Dashboard (original view)
  const COLORS = ["#10b981", "#f59e0b", "#ef4444"];

  const stats = [
    { label: "Total Sales", value: fmtINR(data.totalSales), icon: "₹" },
    { label: "Customers", value: data.totalCustomers, icon: "👥" },
    { label: "Invoices", value: data.totalInvoices, icon: "🧾" },
    { label: "Payments Received", value: fmtINR(data.paymentsReceived), icon: "✓" },
    { label: "Pending Payments", value: fmtINR(data.pendingPayments), icon: "⏳" },
    { label: "Total Expenses", value: fmtINR(data.totalExpenses), icon: "💸" },
    { label: "Business Profit", value: fmtINR(data.businessProfit), icon: "📈" },
    {
      label: "Avg Invoice",
      value: data.totalInvoices ? fmtINR(data.totalSales / data.totalInvoices) : "—",
      icon: "Σ",
    },
  ];

  return (
    <div>
      <div className="eb-grid eb-grid-4" style={{ marginBottom: "1.25rem" }}>
        {stats.map((s) => (
          <div className="eb-stat" key={s.label}>
            <div className="eb-stat-icon">{s.icon}</div>
            <div className="eb-stat-label">{s.label}</div>
            <div className="eb-stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="eb-grid eb-grid-2" style={{ marginBottom: "1.25rem" }}>
        <div className="eb-card">
          <div className="eb-card-head">
            <h2>Monthly Revenue</h2>
          </div>
          <div className="eb-card-pad">
            <div className="eb-chart">
              <ResponsiveContainer>
                <BarChart data={data.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="eb-card">
          <div className="eb-card-head">
            <h2>Sales vs Expenses</h2>
          </div>
          <div className="eb-card-pad">
            <div className="eb-chart">
              <ResponsiveContainer>
                <LineChart data={data.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sales" stroke="#1e3a8a" strokeWidth={2} />
                  <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="eb-grid eb-grid-2">
        <div className="eb-card">
          <div className="eb-card-head">
            <h2>Payment Status</h2>
          </div>
          <div className="eb-card-pad">
            <div className="eb-chart">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={data.statusData} dataKey="value" nameKey="name" outerRadius={90} label>
                    {data.statusData.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="eb-card">
          <div className="eb-card-head">
            <h2>Recent Invoices</h2>
          </div>
          <div className="eb-table-wrap">
            <table className="eb-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentInvoices.map((i: any) => (
                  <tr key={i.id}>
                    <td>{i.number}</td>
                    <td>{i.date}</td>
                    <td>{fmtINR(i.total)}</td>
                    <td>
                      <span
                        className={`eb-badge ${i.status === "Paid" ? "eb-badge-success" : i.status === "Pending" ? "eb-badge-warn" : "eb-badge-danger"}`}
                      >
                        {i.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {!data.recentInvoices.length && (
                  <tr>
                    <td colSpan={4} className="eb-empty">
                      No invoices yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
