import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="eb-auth">
      <div className="eb-auth-card" style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "3rem", margin: 0 }}>404</h1>
        <p className="eb-auth-sub">The page you're looking for doesn't exist.</p>
        <a href="/" className="eb-btn eb-btn-primary" style={{ display: "inline-flex" }}>
          Go home
        </a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="eb-auth">
      <div className="eb-auth-card" style={{ textAlign: "center" }}>
        <h1>Something went wrong</h1>
        <p className="eb-auth-sub">{error.message}</p>
        <div style={{ display: "flex", gap: ".5rem", justifyContent: "center" }}>
          <button
            className="eb-btn eb-btn-primary"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Try again
          </button>
          <a className="eb-btn eb-btn-outline" href="/">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "EasyBill — Billing Software" },
      {
        name: "description",
        content: "Manage customers, quotations, invoices, payments, expenses and GST.",
      },
      { property: "og:title", content: "EasyBill — Billing Software" },
      { property: "og:description", content: "All-in-one billing for small businesses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
