import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
  useRouterState,
  redirect,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_app")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !localStorage.getItem("eb_user")) {
      throw redirect({ to: "/login" });
    }
  },
  component: AppLayout,
});

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: "▦" },
  { to: "/customers", label: "Customers", icon: "👥" },
  { to: "/products", label: "Products", icon: "📦" },
  { to: "/quotations", label: "Quotations", icon: "📝" },
  { to: "/invoices", label: "Invoices", icon: "🧾" },
  { to: "/payments", label: "Payments", icon: "💳" },
  { to: "/expenses", label: "Expenses", icon: "💸" },
  { to: "/taxes", label: "Taxes (GST)", icon: "%" },
  { to: "/reports", label: "Reports", icon: "📊" },
] as const;

function AppLayout() {
  const nav = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const u = localStorage.getItem("eb_user");
    if (!u) {
      nav({ to: "/login", replace: true });
    } else {
      try {
        setUser(JSON.parse(u));
      } catch (e) {
        setUser(null);
        nav({ to: "/login", replace: true });
      }
    }
  }, [nav]);

  const current =
    NAV.find((n) => pathname.startsWith(n.to))?.label ?? "Dashboard";

  const logout = () => {
    localStorage.removeItem("eb_user");
    nav({ to: "/login" });
  };

  return (
    <div className="eb-app">
      <aside className="eb-sidebar">
        <div className="eb-brand">
          Easy<span>Bill</span>
        </div>
        <nav className="eb-nav">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={pathname.startsWith(item.to) ? "active" : ""}
            >
              <span className="eb-nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="eb-sidebar-foot">© {new Date().getFullYear()} EasyBill</div>
      </aside>
      <div className="eb-main">
        <header className="eb-topbar">
          <h1>{current}</h1>
          <div className="eb-user">
            <span style={{ color: "var(--c-text-muted)", fontSize: ".85rem" }}>{user?.email}</span>
            <div className="eb-avatar">{(user?.name?.[0] ?? "U").toUpperCase()}</div>
            <button className="eb-btn eb-btn-outline eb-btn-sm" onClick={logout}>
              Logout
            </button>
          </div>
        </header>
        <main className="eb-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
