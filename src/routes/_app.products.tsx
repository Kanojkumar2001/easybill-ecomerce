import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fmtINR } from "@/lib/db";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_app/products")({
  head: () => ({ meta: [{ title: "Products — EasyBill" }] }),
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

  useEffect(() => {
    api.products
      .list()
      .then((data) => { setRows(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

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
