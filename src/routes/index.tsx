import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  component: IndexComponent,
});

function IndexComponent() {
  const navigate = useNavigate();

  useEffect(() => {
    const u = localStorage.getItem("eb_user");
    navigate({ to: u ? "/dashboard" : "/login", replace: true });
  }, [navigate]);

  return null;
}

