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

const getNavItems = (role: string) => {
  if (role === "employee") {
    return [
      { to: "/dashboard", label: "Dashboard", icon: "▦" },
      { to: "/customers", label: "Customers", icon: "👥" },
      { to: "/products", label: "Products", icon: "📦" },
      { to: "/quotations", label: "Quotations", icon: "📝" },
      { to: "/invoices", label: "Invoices", icon: "🧾" },
      { to: "/payments", label: "Payments", icon: "💳" },
      { to: "/settings", label: "Settings", icon: "⚙" },
    ];
  }
  if (role === "customer") {
    return [
      { to: "/dashboard", label: "Dashboard", icon: "▦" },
      { to: "/products", label: "Shop", icon: "🛒" },
      { to: "/invoices", label: "Invoices", icon: "🧾" },
      { to: "/payments", label: "Payments", icon: "💳" },
      { to: "/settings", label: "Settings", icon: "⚙" },
    ];
  }
  return [
    { to: "/dashboard", label: "Dashboard", icon: "▦" },
    { to: "/customers", label: "Customers", icon: "👥" },
    { to: "/products", label: "Products", icon: "📦" },
    { to: "/quotations", label: "Quotations", icon: "📝" },
    { to: "/invoices", label: "Invoices", icon: "🧾" },
    { to: "/payments", label: "Payments", icon: "💳" },
    { to: "/expenses", label: "Expenses", icon: "💸" },
    { to: "/taxes", label: "Taxes (GST)", icon: "%" },
    { to: "/reports", label: "Reports", icon: "📊" },
    { to: "/employees", label: "Employees", icon: "🤝" },
    { to: "/settings", label: "Settings", icon: "⚙" },
  ];
};

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

  const role = user?.role || "admin";
  const navItems = getNavItems(role);

  // Route shielding: redirect if navigating to a restricted path
  useEffect(() => {
    if (user && pathname !== "/login" && pathname !== "/register" && pathname !== "/forgot") {
      const isAllowed = navItems.some((item) => pathname.startsWith(item.to));
      if (!isAllowed && pathname !== "/" && pathname !== "/_app") {
        nav({ to: "/dashboard", replace: true });
      }
    }
  }, [user, pathname, navItems, nav]);

  const current =
    navItems.find((n) => pathname.startsWith(n.to))?.label ?? "Dashboard";

  const logout = () => {
    localStorage.removeItem("eb_user");
    nav({ to: "/login" });
  };

  const getRoleBadge = () => {
    if (role === "admin") return "Owner";
    if (role === "employee") return "Staff";
    return "Customer";
  };

  const getBrandText = () => {
    if (role === "admin") return <>Easy<span>Admin</span></>;
    if (role === "employee") return <>Easy<span>Staff</span></>;
    return <>Easy<span>Store</span></>;
  };

  return (
    <div className={`eb-app eb-platform-${role}`}>
      <aside className="eb-sidebar">
        <div className="eb-brand">
          {getBrandText()}
        </div>
        <nav className="eb-nav">
          {navItems.map((item) => (
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
            <span 
              className={`eb-badge ${role === "admin" ? "eb-badge-success" : role === "employee" ? "eb-badge-warn" : "eb-badge-info"}`}
              style={{ fontSize: ".75rem", padding: ".15rem .4rem" }}
            >
              {getRoleBadge()}
            </span>
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
