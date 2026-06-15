// Simple localStorage "db" with seed data for EasyBill.

export type Customer = { id: string; name: string; phone: string; email: string; address: string };
export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  gst: number;
};
export type LineItem = { productId: string; name: string; qty: number; price: number; gst: number };
export type Quotation = {
  id: string;
  number: string;
  customerId: string;
  date: string;
  items: LineItem[];
  status: "Draft" | "Approved" | "Rejected";
  total: number;
};
export type Invoice = {
  id: string;
  number: string;
  customerId: string;
  date: string;
  items: LineItem[];
  status: "Paid" | "Pending" | "Overdue";
  total: number;
  cgst: number;
  sgst: number;
  subtotal: number;
};
export type Payment = {
  id: string;
  invoiceId: string;
  date: string;
  amount: number;
  method: "UPI" | "Cash" | "Bank Transfer" | "Credit Card";
  note?: string;
};
export type Expense = { id: string; date: string; category: string; amount: number; note?: string };
export type User = { name: string; email: string };

const K = {
  user: "eb_user",
  customers: "eb_customers",
  products: "eb_products",
  quotations: "eb_quotations",
  invoices: "eb_invoices",
  payments: "eb_payments",
  expenses: "eb_expenses",
  seeded: "eb_seeded_v1",
};

const isBrowser = () => typeof window !== "undefined";

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, val: T) {
  if (isBrowser()) localStorage.setItem(key, JSON.stringify(val));
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export function seedIfNeeded() {
  if (!isBrowser() || localStorage.getItem(K.seeded)) return;
  const customers: Customer[] = [
    {
      id: uid(),
      name: "Acme Corp",
      phone: "+91 98765 12345",
      email: "billing@acme.in",
      address: "Mumbai, MH",
    },
    {
      id: uid(),
      name: "Nova Traders",
      phone: "+91 99887 22110",
      email: "nova@traders.com",
      address: "Delhi, DL",
    },
    {
      id: uid(),
      name: "Bright Solutions",
      phone: "+91 91234 56780",
      email: "info@bright.io",
      address: "Bangalore, KA",
    },
  ];
  const products: Product[] = [
    { id: uid(), name: "Dell Inspiron 15", category: "Laptop", price: 55000, stock: 12, gst: 18 },
    { id: uid(), name: "HP Pavilion 14", category: "Laptop", price: 62000, stock: 8, gst: 18 },
    {
      id: uid(),
      name: "Logitech MX Master",
      category: "Accessory",
      price: 8500,
      stock: 35,
      gst: 18,
    },
    { id: uid(), name: "USB-C Hub", category: "Accessory", price: 1800, stock: 60, gst: 18 },
    {
      id: uid(),
      name: "Wireless Keyboard",
      category: "Accessory",
      price: 2200,
      stock: 25,
      gst: 18,
    },
  ];
  const invoices: Invoice[] = [];
  const today = new Date();
  for (let i = 0; i < 8; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i * 4);
    const p = products[i % products.length];
    const qty = (i % 3) + 1;
    const subtotal = p.price * qty;
    const cgst = (subtotal * p.gst) / 200;
    const sgst = cgst;
    invoices.push({
      id: uid(),
      number: `INV-${1001 + i}`,
      customerId: customers[i % customers.length].id,
      date: d.toISOString().slice(0, 10),
      items: [{ productId: p.id, name: p.name, qty, price: p.price, gst: p.gst }],
      subtotal,
      cgst,
      sgst,
      total: subtotal + cgst + sgst,
      status: i % 3 === 0 ? "Pending" : "Paid",
    });
  }
  const payments: Payment[] = invoices
    .filter((i) => i.status === "Paid")
    .map((inv) => ({
      id: uid(),
      invoiceId: inv.id,
      date: inv.date,
      amount: inv.total,
      method: "UPI",
    }));
  const expenses: Expense[] = [
    { id: uid(), date: today.toISOString().slice(0, 10), category: "Shop Rent", amount: 25000 },
    {
      id: uid(),
      date: today.toISOString().slice(0, 10),
      category: "Electricity Bill",
      amount: 4200,
    },
    {
      id: uid(),
      date: today.toISOString().slice(0, 10),
      category: "Internet Charges",
      amount: 1500,
    },
    { id: uid(), date: today.toISOString().slice(0, 10), category: "Salary", amount: 45000 },
  ];
  const quotations: Quotation[] = [
    {
      id: uid(),
      number: "QTN-501",
      customerId: customers[0].id,
      date: today.toISOString().slice(0, 10),
      items: [
        {
          productId: products[0].id,
          name: products[0].name,
          qty: 2,
          price: products[0].price,
          gst: 18,
        },
      ],
      status: "Approved",
      total: products[0].price * 2 * 1.18,
    },
  ];
  write(K.customers, customers);
  write(K.products, products);
  write(K.invoices, invoices);
  write(K.payments, payments);
  write(K.expenses, expenses);
  write(K.quotations, quotations);
  localStorage.setItem(K.seeded, "1");
}

export const db = {
  // auth
  getUser: (): User | null => read<User | null>(K.user, null),
  setUser: (u: User | null) => {
    if (u) write(K.user, u);
    else if (isBrowser()) localStorage.removeItem(K.user);
  },

  // generic
  customers: {
    list: () => read<Customer[]>(K.customers, []),
    save: (rows: Customer[]) => write(K.customers, rows),
  },
  products: {
    list: () => read<Product[]>(K.products, []),
    save: (rows: Product[]) => write(K.products, rows),
  },
  quotations: {
    list: () => read<Quotation[]>(K.quotations, []),
    save: (rows: Quotation[]) => write(K.quotations, rows),
  },
  invoices: {
    list: () => read<Invoice[]>(K.invoices, []),
    save: (rows: Invoice[]) => write(K.invoices, rows),
  },
  payments: {
    list: () => read<Payment[]>(K.payments, []),
    save: (rows: Payment[]) => write(K.payments, rows),
  },
  expenses: {
    list: () => read<Expense[]>(K.expenses, []),
    save: (rows: Expense[]) => write(K.expenses, rows),
  },
};

export const fmtINR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);
