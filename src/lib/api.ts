const API_URL = "http://localhost:5000/api";

const getHeaders = () => {
  if (typeof window === "undefined") return {};
  const u = localStorage.getItem("eb_user");
  if (!u) return { "Content-Type": "application/json" };
  try {
    const user = JSON.parse(u);
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${user.token}`,
    };
  } catch {
    return { "Content-Type": "application/json" };
  }
};

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "An error occurred");
  }
  return res.json();
};

export const api = {
  auth: {
    login: async (email: string, pass: string) => {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      return handleResponse(res);
    },
    register: async (name: string, email: string, pass: string) => {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password: pass }),
      });
      return handleResponse(res);
    },
  },
  customers: {
    list: async () => {
      const res = await fetch(`${API_URL}/customers`, { headers: getHeaders() });
      return handleResponse(res);
    },
    create: async (customer: any) => {
      const res = await fetch(`${API_URL}/customers`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(customer),
      });
      return handleResponse(res);
    },
    update: async (id: string, customer: any) => {
      const res = await fetch(`${API_URL}/customers/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(customer),
      });
      return handleResponse(res);
    },
    delete: async (id: string) => {
      const res = await fetch(`${API_URL}/customers/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
  },
  products: {
    list: async () => {
      const res = await fetch(`${API_URL}/products`, { headers: getHeaders() });
      return handleResponse(res);
    },
    create: async (product: any) => {
      const res = await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(product),
      });
      return handleResponse(res);
    },
    update: async (id: string, product: any) => {
      const res = await fetch(`${API_URL}/products/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(product),
      });
      return handleResponse(res);
    },
    delete: async (id: string) => {
      const res = await fetch(`${API_URL}/products/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
  },
  quotations: {
    list: async () => {
      const res = await fetch(`${API_URL}/quotations`, { headers: getHeaders() });
      return handleResponse(res);
    },
    create: async (quotation: any) => {
      const res = await fetch(`${API_URL}/quotations`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(quotation),
      });
      return handleResponse(res);
    },
    updateStatus: async (id: string, status: string) => {
      const res = await fetch(`${API_URL}/quotations/${id}/status`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ status }),
      });
      return handleResponse(res);
    },
    delete: async (id: string) => {
      const res = await fetch(`${API_URL}/quotations/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
  },
  invoices: {
    list: async () => {
      const res = await fetch(`${API_URL}/invoices`, { headers: getHeaders() });
      return handleResponse(res);
    },
    create: async (invoice: any) => {
      const res = await fetch(`${API_URL}/invoices`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(invoice),
      });
      return handleResponse(res);
    },
    updateStatus: async (id: string, status: string) => {
      const res = await fetch(`${API_URL}/invoices/${id}/status`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ status }),
      });
      return handleResponse(res);
    },
    delete: async (id: string) => {
      const res = await fetch(`${API_URL}/invoices/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
  },
  payments: {
    list: async () => {
      const res = await fetch(`${API_URL}/payments`, { headers: getHeaders() });
      return handleResponse(res);
    },
    create: async (payment: any) => {
      const res = await fetch(`${API_URL}/payments`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payment),
      });
      return handleResponse(res);
    },
  },
  expenses: {
    list: async () => {
      const res = await fetch(`${API_URL}/expenses`, { headers: getHeaders() });
      return handleResponse(res);
    },
    create: async (expense: any) => {
      const res = await fetch(`${API_URL}/expenses`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(expense),
      });
      return handleResponse(res);
    },
    delete: async (id: string) => {
      const res = await fetch(`${API_URL}/expenses/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
  },
  dashboard: {
    get: async () => {
      const res = await fetch(`${API_URL}/dashboard`, { headers: getHeaders() });
      return handleResponse(res);
    },
  },
  reports: {
    sales: async (from?: string, to?: string) => {
      const res = await fetch(`${API_URL}/reports/sales?from=${from || ""}&to=${to || ""}`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    payments: async (from?: string, to?: string) => {
      const res = await fetch(`${API_URL}/reports/payments?from=${from || ""}&to=${to || ""}`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    expenses: async (from?: string, to?: string) => {
      const res = await fetch(`${API_URL}/reports/expenses?from=${from || ""}&to=${to || ""}`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    profit: async (from?: string, to?: string) => {
      const res = await fetch(`${API_URL}/reports/profit?from=${from || ""}&to=${to || ""}`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
  },
};
