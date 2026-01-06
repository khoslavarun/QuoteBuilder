import { useState } from "react";
import { api } from "../api/client";
import type { Product } from "../api/types";

type Props = {
  products: Product[];
  refresh: () => Promise<void>;
  setMessage: (msg: string) => void;
  runs: { product_id?: number | null; created_at: string }[];
};

export default function Products({ products, refresh, setMessage, runs }: Props) {
  const [editing, setEditing] = useState<Record<number, Partial<Product>>>({});

  const lastUsed = (productId: number) => {
    const matches = runs.filter((r) => r.product_id === productId);
    if (!matches.length) return "—";
    const latest = matches.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0];
    return new Date(latest.created_at).toLocaleString();
  };

  const updateField = (id: number, key: keyof Product, value: any) => {
    setEditing((prev) => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
  };

  const saveProduct = async (id: number) => {
    const payload = editing[id];
    await api.put(`/products/${id}`, payload);
    setMessage("Product updated");
    await refresh();
  };

  const removeProduct = async (id: number) => {
    await api.delete(`/products/${id}`);
    setMessage("Product deleted");
    await refresh();
  };

  const duplicate = async (id: number) => {
    await api.post(`/products/${id}/duplicate`);
    setMessage("Product duplicated");
    await refresh();
  };

  return (
    <div className="card">
      <h3 className="section-title">Products</h3>
      <p className="muted">Manage and reuse common items. Duplicates help spin variants quickly.</p>
      <div style={{ overflowX: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Cost (INR/unit)</th>
              <th>Unit</th>
              <th>Notes</th>
              <th>Last used</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>
                  <input
                    className="input"
                    value={editing[p.id]?.name ?? p.name}
                    onChange={(e) => updateField(p.id, "name", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className="input"
                    type="number"
                    value={editing[p.id]?.default_cost_inr_per_unit ?? p.default_cost_inr_per_unit}
                    onChange={(e) =>
                      updateField(p.id, "default_cost_inr_per_unit", Number(e.target.value))
                    }
                  />
                </td>
                <td>
                  <input
                    className="input"
                    value={editing[p.id]?.unit_label ?? p.unit_label}
                    onChange={(e) => updateField(p.id, "unit_label", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className="input"
                    value={editing[p.id]?.notes ?? p.notes ?? ""}
                    onChange={(e) => updateField(p.id, "notes", e.target.value)}
                  />
                </td>
                <td>{lastUsed(p.id)}</td>
                <td>
                  <div className="flex">
                    <button className="btn btn-primary" onClick={() => saveProduct(p.id)}>
                      Save
                    </button>
                    <button className="btn btn-ghost" onClick={() => duplicate(p.id)}>
                      Duplicate
                    </button>
                    <button className="btn btn-ghost" onClick={() => removeProduct(p.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
