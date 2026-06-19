import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fmtINR } from "@/lib/db";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_app/products")({
  head: () => ({ meta: [{ title: "Shop & Products — EasyBill" }] }),
  component: ProductsPage,
});

type Product = {
  _id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  gst: number;
};

const emptyProduct: Product = {
  _id: "",
  name: "",
  category: "Laptop",
  price: 0,
  stock: 0,
  gst: 18,
};

function ProductsPage() {
  const [rows, setRows] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Customer purchase state
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [checkoutQty, setCheckoutQty] = useState(1);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "Cash">("UPI");
  const [paymentNote, setPaymentNote] = useState("");
  const [paying, setPaying] = useState(false);

  const loadProducts = () => {
    setLoading(true);
    api.products
      .list()
      .then((data) => {
        setRows(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    const u = localStorage.getItem("eb_user");
    if (u) {
      try {
        setUser(JSON.parse(u));
      } catch (e) {
        console.error(e);
      }
    }
    loadProducts();
  }, []);

  const role = user?.role || "admin";

  const filtered = rows.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase()),
  );

  const save = async (p: Product) => {
    try {
      if (p._id) {
        const updated = await api.products.update(p._id, p);
        setRows((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
      } else {
        const created = await api.products.create(p);
        setRows((prev) => [created, ...prev]);
      }
      setEditing(null);
    } catch (err: any) {
      alert(err.message || "Failed to save product");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete product?")) return;
    try {
      await api.products.delete(id);
      setRows((prev) => prev.filter((r) => r._id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete product");
    }
  };

  // Customer purchase flow
  const handleQtyChange = (prodId: string, val: number) => {
    setQuantities((prev) => ({
      ...prev,
      [prodId]: Math.max(1, val),
    }));
  };

  const openCheckout = (prod: Product) => {
    const qty = quantities[prod._id] || 1;
    if (prod.stock < qty) {
      alert(`Insufficient stock. Only ${prod.stock} items left.`);
      return;
    }
    setCheckoutProduct(prod);
    setCheckoutQty(qty);
  };

  const submitOrder = async () => {
    if (!checkoutProduct) return;
    setPlacingOrder(true);
    try {
      // Creates pending invoice and depresses stock on backend
      const invoice = await api.invoices.create({
        items: [{ productId: checkoutProduct._id, qty: checkoutQty }],
      });
      setCreatedInvoice(invoice);
      setPlacingOrder(false);
    } catch (err: any) {
      alert(err.message || "Failed to place order");
      setPlacingOrder(false);
      setCheckoutProduct(null);
    }
  };

  const processPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdInvoice) return;
    setPaying(true);
    try {
      await api.payments.create({
        invoiceId: createdInvoice._id,
        date: new Date().toISOString().slice(0, 10),
        amount: createdInvoice.total,
        method: paymentMethod,
        note: paymentNote || `Self-checkout purchase via ${paymentMethod}`,
      });
      alert("Purchase completed successfully! Thank you.");
      setCreatedInvoice(null);
      setCheckoutProduct(null);
      setPaymentNote("");
      loadProducts(); // Refresh stocks
    } catch (err: any) {
      alert(err.message || "Failed to process payment");
    } finally {
      setPaying(false);
    }
  };

  const getCategoryEmoji = (cat: string) => {
    switch (cat) {
      case "Laptop":
        return "💻";
      case "Accessory":
        return "🔌";
      case "Desktop":
        return "🖥";
      case "Service":
        return "🛠";
      default:
        return "📦";
    }
  };

  if (role === "customer") {
    return (
      <div>
        <div className="eb-toolbar">
          <input
            className="eb-input eb-search"
            placeholder="Search store items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div style={{ color: "var(--c-text-muted)", fontSize: ".9rem" }}>
            EasyBill Premium Storefront
          </div>
        </div>

        {loading ? (
          <div className="eb-empty">Loading store catalog...</div>
        ) : (
          <div className="eb-store-grid">
            {filtered.map((p) => {
              const selectedQty = quantities[p._id] || 1;
              const isOutOfStock = p.stock <= 0;

              return (
                <div className="eb-product-card" key={p._id}>
                  <div className="eb-product-img">
                    {getCategoryEmoji(p.category)}
                  </div>
                  <div className="eb-product-body">
                    <div className="eb-product-meta">
                      <span className="eb-badge eb-badge-info">{p.category}</span>
                      <span
                        className={`eb-badge ${
                          p.stock <= 0
                            ? "eb-badge-danger"
                            : p.stock < 5
                              ? "eb-badge-warn"
                              : "eb-badge-success"
                        }`}
                      >
                        {p.stock <= 0
                          ? "Out of Stock"
                          : p.stock < 5
                            ? `Only ${p.stock} Left`
                            : "In Stock"}
                      </span>
                    </div>
                    <h3 className="eb-product-title">{p.name}</h3>
                    <div className="eb-product-price">{fmtINR(p.price)}</div>
                    <div
                      style={{
                        fontSize: ".8rem",
                        color: "var(--c-text-muted)",
                        marginBottom: "1rem",
                      }}
                    >
                      Price excludes {p.gst}% GST
                    </div>

                    <div className="eb-product-actions">
                      <input
                        type="number"
                        className="eb-input eb-qty-input"
                        min={1}
                        max={p.stock}
                        disabled={isOutOfStock}
                        value={selectedQty}
                        onChange={(e) => handleQtyChange(p._id, +e.target.value)}
                      />
                      <button
                        className="eb-btn eb-btn-primary"
                        style={{ flex: 1 }}
                        disabled={isOutOfStock}
                        onClick={() => openCheckout(p)}
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {!filtered.length && (
              <div className="eb-empty" style={{ gridColumn: "1/-1" }}>
                No products found matching your search.
              </div>
            )}
          </div>
        )}

        {/* Checkout Modal */}
        {checkoutProduct && !createdInvoice && (
          <div className="eb-modal-back" onClick={() => setCheckoutProduct(null)}>
            <div className="eb-modal" onClick={(e) => e.stopPropagation()}>
              <div className="eb-modal-head">
                <h2>Confirm Checkout</h2>
                <button
                  className="eb-btn eb-btn-ghost"
                  onClick={() => setCheckoutProduct(null)}
                >
                  ✕
                </button>
              </div>
              <div className="eb-modal-body">
                <div style={{ marginBottom: "1.25rem" }}>
                  <div
                    style={{
                      fontSize: ".85rem",
                      color: "var(--c-text-muted)",
                      textTransform: "uppercase",
                    }}
                  >
                    Product
                  </div>
                  <strong style={{ fontSize: "1.1rem" }}>
                    {checkoutProduct.name}
                  </strong>
                </div>
                <div className="eb-form-grid" style={{ marginBottom: "1.25rem" }}>
                  <div>
                    <span style={{ color: "var(--c-text-muted)" }}>Unit Price:</span>{" "}
                    <strong>{fmtINR(checkoutProduct.price)}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--c-text-muted)" }}>Quantity:</span>{" "}
                    <strong>{checkoutQty}</strong>
                  </div>
                </div>
                <hr style={{ border: "none", borderTop: "1px solid var(--c-border)", margin: "1rem 0" }} />
                <div style={{ textAlign: "right" }}>
                  <div>
                    Subtotal:{" "}
                    <strong>{fmtINR(checkoutProduct.price * checkoutQty)}</strong>
                  </div>
                  <div>
                    GST ({checkoutProduct.gst}%):{" "}
                    <strong>
                      {fmtINR(
                        checkoutProduct.price *
                          checkoutQty *
                          (checkoutProduct.gst / 100),
                      )}
                    </strong>
                  </div>
                  <div style={{ fontSize: "1.2rem", marginTop: ".5rem" }}>
                    Total Amount:{" "}
                    <strong style={{ color: "var(--c-primary)" }}>
                      {fmtINR(
                        checkoutProduct.price *
                          checkoutQty *
                          (1 + checkoutProduct.gst / 100),
                      )}
                    </strong>
                  </div>
                </div>
              </div>
              <div className="eb-modal-foot">
                <button
                  className="eb-btn eb-btn-outline"
                  onClick={() => setCheckoutProduct(null)}
                >
                  Cancel
                </button>
                <button
                  className="eb-btn eb-btn-primary"
                  onClick={submitOrder}
                  disabled={placingOrder}
                >
                  {placingOrder ? "Placing Order..." : "Confirm & Pay"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {createdInvoice && (
          <div className="eb-modal-back">
            <div className="eb-modal" onClick={(e) => e.stopPropagation()}>
              <div className="eb-modal-head">
                <h2>Complete Payment</h2>
                <button
                  className="eb-btn eb-btn-ghost"
                  onClick={() => {
                    setCreatedInvoice(null);
                    setCheckoutProduct(null);
                    loadProducts();
                  }}
                >
                  ✕
                </button>
              </div>
              <form onSubmit={processPayment}>
                <div className="eb-modal-body">
                  <div
                    className="eb-card eb-card-pad"
                    style={{
                      background: "var(--c-primary-soft)",
                      textAlign: "center",
                      marginBottom: "1.25rem",
                    }}
                  >
                    <div style={{ fontSize: ".85rem", color: "var(--c-text-muted)" }}>
                      Invoice Generated: <strong>{createdInvoice.number}</strong>
                    </div>
                    <div
                      style={{
                        fontSize: "1.75rem",
                        fontWeight: 700,
                        color: "var(--c-primary)",
                        marginTop: ".25rem",
                      }}
                    >
                      {fmtINR(createdInvoice.total)}
                    </div>
                  </div>

                  <div className="eb-form-row">
                    <label className="eb-label">Payment Method</label>
                    <div style={{ display: "flex", gap: "1rem", marginTop: ".25rem" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: ".35rem", cursor: "pointer" }}>
                        <input
                          type="radio"
                          name="storePayMethod"
                          checked={paymentMethod === "UPI"}
                          onChange={() => setPaymentMethod("UPI")}
                        />
                        UPI / QR Code
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: ".35rem", cursor: "pointer" }}>
                        <input
                          type="radio"
                          name="storePayMethod"
                          checked={paymentMethod === "Cash"}
                          onChange={() => setPaymentMethod("Cash")}
                        />
                        Cash
                      </label>
                    </div>
                  </div>

                  {paymentMethod === "UPI" && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        padding: "1rem",
                        background: "#fff",
                        border: "1px dashed var(--c-border)",
                        borderRadius: 8,
                        marginBottom: "1rem",
                      }}
                    >
                      {/* Simple mock QR code */}
                      <div
                        style={{
                          width: 150,
                          height: 150,
                          background: "#000",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: ".8rem",
                          fontWeight: "bold",
                          marginBottom: ".5rem",
                        }}
                      >
                        [ UPI QR CODE ]
                      </div>
                      <div style={{ fontSize: ".8rem", color: "var(--c-text-muted)" }}>
                        Scan using GPay, PhonePe, or Paytm
                      </div>
                    </div>
                  )}

                  <div className="eb-form-row">
                    <label className="eb-label">Notes (Optional)</label>
                    <input
                      className="eb-input"
                      placeholder="e.g. Paid from wallet, reference number"
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                    />
                  </div>
                </div>
                <div className="eb-modal-foot">
                  <button
                    type="button"
                    className="eb-btn eb-btn-outline"
                    onClick={() => {
                      setCreatedInvoice(null);
                      setCheckoutProduct(null);
                      loadProducts();
                    }}
                  >
                    Pay Later
                  </button>
                  <button
                    type="submit"
                    className="eb-btn eb-btn-primary"
                    disabled={paying}
                  >
                    {paying ? "Processing..." : "Confirm Payment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Admin / Employee view (Existing inventory management table)
  return (
    <div>
      <div className="eb-toolbar">
        <input
          className="eb-input eb-search"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="eb-btn eb-btn-primary" onClick={() => setEditing({ ...emptyProduct })}>
          + Add Product
        </button>
      </div>
      <div className="eb-card">
        <div className="eb-table-wrap">
          <table className="eb-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>GST</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="eb-empty">Loading products...</td>
                </tr>
              )}
              {!loading && filtered.map((p) => (
                <tr key={p._id}>
                  <td>
                    <strong>{p.name}</strong>
                  </td>
                  <td>
                    <span className="eb-badge eb-badge-info">{p.category}</span>
                  </td>
                  <td>{fmtINR(p.price)}</td>
                  <td>
                    <span
                      className={
                        p.stock < 5
                          ? "eb-badge eb-badge-danger"
                          : p.stock < 15
                            ? "eb-badge eb-badge-warn"
                            : "eb-badge eb-badge-success"
                      }
                    >
                      {p.stock}
                    </span>
                  </td>
                  <td>{p.gst}%</td>
                  <td>
                    <div className="eb-row-actions">
                      <button
                        className="eb-btn eb-btn-ghost eb-btn-sm"
                        onClick={() => setEditing(p)}
                      >
                        Edit
                      </button>
                      <button
                        className="eb-btn eb-btn-ghost eb-btn-sm"
                        style={{ color: "var(--c-danger)" }}
                        onClick={() => remove(p._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !filtered.length && (
                <tr>
                  <td colSpan={6} className="eb-empty">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="eb-modal-back" onClick={() => setEditing(null)}>
          <div className="eb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="eb-modal-head">
              <h2>{editing._id ? "Edit" : "Add"} Product</h2>
              <button className="eb-btn eb-btn-ghost" onClick={() => setEditing(null)}>✕</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); save(editing); }}>
              <div className="eb-modal-body">
                <div className="eb-form-row">
                  <label className="eb-label">Product Name</label>
                  <input
                    className="eb-input"
                    value={editing.name}
                    required
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  />
                </div>
                <div className="eb-form-grid">
                  <div className="eb-form-row">
                    <label className="eb-label">Category</label>
                    <select
                      className="eb-select"
                      value={editing.category}
                      onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                    >
                      <option>Laptop</option>
                      <option>Accessory</option>
                      <option>Desktop</option>
                      <option>Service</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="eb-form-row">
                    <label className="eb-label">Price (₹)</label>
                    <input
                      className="eb-input"
                      type="number"
                      value={editing.price}
                      onChange={(e) => setEditing({ ...editing, price: +e.target.value })}
                    />
                  </div>
                  <div className="eb-form-row">
                    <label className="eb-label">Stock</label>
                    <input
                      className="eb-input"
                      type="number"
                      value={editing.stock}
                      onChange={(e) => setEditing({ ...editing, stock: +e.target.value })}
                    />
                  </div>
                  <div className="eb-form-row">
                    <label className="eb-label">GST %</label>
                    <input
                      className="eb-input"
                      type="number"
                      value={editing.gst}
                      onChange={(e) => setEditing({ ...editing, gst: +e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="eb-modal-foot">
                <button type="button" className="eb-btn eb-btn-outline" onClick={() => setEditing(null)}>
                  Cancel
                </button>
                <button type="submit" className="eb-btn eb-btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
