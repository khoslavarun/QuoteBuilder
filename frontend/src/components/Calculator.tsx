import { useMemo, useState } from "react";
import { api } from "../api/client";
import type { CalculationOutput, Product } from "../api/types";
import type { CalculationInput } from "../types/app";
import ResultsTable from "./ResultsTable";
import ExplainBox from "./ExplainBox";

type Props = {
  inputs: CalculationInput;
  onInputsChange: (val: CalculationInput) => void;
  output: CalculationOutput | null;
  onCalculate: () => void;
  onSave: (runName: string) => void;
  loading: boolean;
  products: Product[];
  refreshProducts: () => Promise<void>;
};

export default function Calculator({
  inputs,
  onInputsChange,
  output,
  onCalculate,
  onSave,
  loading,
  products,
  refreshProducts,
}: Props) {
  const [newProduct, setNewProduct] = useState({
    name: "",
    default_cost_inr_per_unit: "",
    unit_label: "unit",
    notes: "",
  });
  const [addingProduct, setAddingProduct] = useState(false);
  const [explain, setExplain] = useState(false);
  const [runName, setRunName] = useState("");
  const [customAdvance, setCustomAdvance] = useState("");

  const updateField = (key: keyof CalculationInput, value: any) => {
    onInputsChange({ ...inputs, [key]: value });
  };

  const handleProductSelect = (id: string) => {
    if (id === "") {
      updateField("product_id", null);
      return;
    }
    const product = products.find((p) => p.id === Number(id));
    if (product) {
      onInputsChange({
        ...inputs,
        product_id: product.id,
        cost_inr_per_unit: product.default_cost_inr_per_unit,
      });
    }
  };

  const handleAddScenario = () => {
    const pct = Number(customAdvance);
    if (Number.isNaN(pct)) return;
    const next = Array.from(new Set([...inputs.advance_scenarios, pct])).sort((a, b) => a - b);
    updateField("advance_scenarios", next);
    setCustomAdvance("");
  };

  const handleRemoveScenario = (pct: number) => {
    const next = inputs.advance_scenarios.filter((v) => v !== pct);
    updateField("advance_scenarios", next);
  };

  const handleCreateProduct = async () => {
    if (!newProduct.name.trim()) return;
    setAddingProduct(true);
    try {
      await api.post("/products", {
        ...newProduct,
        default_cost_inr_per_unit: Number(newProduct.default_cost_inr_per_unit || 0),
      });
      await refreshProducts();
      setNewProduct({ name: "", default_cost_inr_per_unit: "", unit_label: "unit", notes: "" });
    } finally {
      setAddingProduct(false);
    }
  };

  const handleExportCsv = () => {
    if (!output) return;
    const headers = ["Metric", ...output.scenarios.map((s) => `${(s.advance_pct * 100).toFixed(0)}%`)];
    const rows: string[][] = [];
    const addRow = (label: string, getter: (s: any) => number | string) => {
      rows.push([label, ...output.scenarios.map((s) => String(getter(s)))]);
    };
    addRow("Advance % of invoice", (s) => `${(s.advance_pct * 100).toFixed(0)}%`);
    addRow("Invoice value – USD", (s) => s.invoice_value_usd.toFixed(2));
    addRow("Selling price per unit – USD/unit", (s) => s.selling_price_per_unit_usd.toFixed(6));
    addRow("Advance received – USD", (s) => s.advance_received_usd.toFixed(2));
    addRow("Balance received after credit period – USD", (s) => s.balance_received_usd.toFixed(2));
    addRow("Total shipment cost (landed) – USD", (s) => s.total_shipment_cost_usd.toFixed(2));
    addRow("Cash gap to finance – USD", (s) => s.cash_gap_usd.toFixed(2));
    addRow("Financing cost – USD", (s) => s.financing_cost_usd.toFixed(2));
    addRow("Financing cost per unit – USD/unit", (s) => s.financing_cost_per_unit_usd.toFixed(6));
    addRow("Gross profit (Invoice – Cost) – USD", (s) => s.gross_profit_usd.toFixed(2));
    addRow("Gross profit % on cost", (s) => (s.gross_profit_pct_on_cost * 100).toFixed(2) + "%");
    addRow("Net profit (after financing) – USD", (s) => s.net_profit_usd.toFixed(2));
    addRow("Net profit % on cost", (s) => (s.net_profit_pct_on_cost * 100).toFixed(2) + "%");

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "quote-calculator.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const modeFields = useMemo(() => {
    if (inputs.pricing_mode === "A") {
      return (
        <label>
          Target net profit % on cost
          <input
            className="input"
            type="number"
            step="0.01"
            value={inputs.target_net_profit_pct_on_cost ?? ""}
            onChange={(e) => updateField("target_net_profit_pct_on_cost", Number(e.target.value))}
          />
        </label>
      );
    }
    return (
      <div className="grid-two">
        <label>
          Fixed invoice value – USD
          <input
            className="input"
            type="number"
            value={inputs.fixed_invoice_value_usd ?? ""}
            onChange={(e) =>
              updateField(
                "fixed_invoice_value_usd",
                e.target.value === "" ? null : Number(e.target.value),
              )
            }
          />
        </label>
        <label>
          Fixed selling price per unit – USD
          <input
            className="input"
            type="number"
            value={inputs.fixed_selling_price_per_unit_usd ?? ""}
            onChange={(e) =>
              updateField(
                "fixed_selling_price_per_unit_usd",
                e.target.value === "" ? null : Number(e.target.value),
              )
            }
          />
        </label>
      </div>
    );
  }, [inputs]);

  return (
    <div className="card">
      <div className="layout">
        <div>
          <h3 className="section-title">Inputs</h3>
          <div className="grid-two" style={{ marginBottom: 12 }}>
            <label>
              Product
              <select
                className="input"
                value={inputs.product_id ?? ""}
                onChange={(e) => handleProductSelect(e.target.value)}
              >
                <option value="">One-off</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Cost – INR/{inputs.product_id ? products.find((p) => p.id === inputs.product_id)?.unit_label ?? "unit" : "unit"}
              <input
                className="input"
                type="number"
                value={inputs.cost_inr_per_unit}
                onChange={(e) => updateField("cost_inr_per_unit", Number(e.target.value))}
              />
            </label>
          </div>

          <div className="grid-three" style={{ marginBottom: 12 }}>
            <label>
              Quantity
              <input
                className="input"
                type="number"
                value={inputs.quantity}
                onChange={(e) => updateField("quantity", Number(e.target.value))}
              />
            </label>
            <label>
              FX rate – INR per USD
              <input
                className="input"
                type="number"
                step="0.01"
                value={inputs.fx_rate_inr_per_usd}
                onChange={(e) => updateField("fx_rate_inr_per_usd", Number(e.target.value))}
              />
            </label>
            <label>
              Unit label
              <input
                className="input"
                type="text"
                value={
                  inputs.product_id
                    ? products.find((p) => p.id === inputs.product_id)?.unit_label ?? "unit"
                    : "unit"
                }
                readOnly
              />
            </label>
          </div>

          <div className="grid-three" style={{ marginBottom: 12 }}>
            <label>
              Freight – USD
              <input
                className="input"
                type="number"
                value={inputs.freight_usd}
                onChange={(e) => updateField("freight_usd", Number(e.target.value))}
              />
            </label>
            <label>
              Insurance – USD
              <input
                className="input"
                type="number"
                value={inputs.insurance_usd}
                onChange={(e) => updateField("insurance_usd", Number(e.target.value))}
              />
            </label>
            <label>
              Other costs – USD
              <input
                className="input"
                type="number"
                value={inputs.other_costs_usd}
                onChange={(e) => updateField("other_costs_usd", Number(e.target.value))}
              />
            </label>
          </div>

          <div className="grid-two" style={{ marginBottom: 12 }}>
            <label>
              Financing rate % p.a.
              <input
                className="input"
                type="number"
                value={inputs.financing_rate_annual}
                onChange={(e) => updateField("financing_rate_annual", Number(e.target.value))}
              />
            </label>
            <label>
              Credit period – months
              <input
                className="input"
                type="number"
                value={inputs.credit_period_months}
                onChange={(e) => updateField("credit_period_months", Number(e.target.value))}
              />
            </label>
          </div>

          <div className="card" style={{ padding: 12, marginBottom: 12 }}>
            <div className="flex" style={{ alignItems: "center", justifyContent: "space-between" }}>
              <strong>Pricing mode</strong>
              <div className="flex" style={{ gap: 6 }}>
                <button
                  className={`btn ${inputs.pricing_mode === "A" ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => updateField("pricing_mode", "A")}
                >
                  Mode A – Target net profit
                </button>
                <button
                  className={`btn ${inputs.pricing_mode === "B" ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => updateField("pricing_mode", "B")}
                >
                  Mode B – Fixed selling price
                </button>
              </div>
            </div>
            <div style={{ marginTop: 10 }}>{modeFields}</div>
          </div>

          <div className="card" style={{ padding: 12, marginBottom: 12 }}>
            <div className="flex" style={{ alignItems: "center", justifyContent: "space-between" }}>
              <strong>Advance scenarios</strong>
              <div className="flex">
                <input
                  className="input"
                  style={{ width: 120 }}
                  placeholder="0.5 = 50%"
                  value={customAdvance}
                  onChange={(e) => setCustomAdvance(e.target.value)}
                  type="number"
                  step="0.05"
                />
                <button className="btn btn-primary" onClick={handleAddScenario}>
                  Add
                </button>
              </div>
            </div>
            <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8 }}>
              {inputs.advance_scenarios.map((pct) => (
                <span key={pct} className="pill">
                  {(pct * 100).toFixed(0)}%
                  <button
                    onClick={() => handleRemoveScenario(pct)}
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      color: "#0f172a",
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex" style={{ marginBottom: 12 }}>
            <button className="btn btn-primary" onClick={onCalculate} disabled={loading}>
              {loading ? "Working..." : "Calculate"}
            </button>
            <button className="btn btn-ghost" onClick={() => onSave(runName)} disabled={loading}>
              Save to history
            </button>
            <input
              className="input"
              placeholder="Run name (for history)"
              value={runName}
              onChange={(e) => setRunName(e.target.value)}
            />
          </div>

          <div className="card" style={{ padding: 12 }}>
            <strong>Add new product</strong>
            <div className="grid-three" style={{ marginTop: 10, gap: 8 }}>
              <input
                className="input"
                placeholder="Name"
                value={newProduct.name}
                onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
              />
              <input
                className="input"
                placeholder="Cost INR/unit"
                type="number"
                value={newProduct.default_cost_inr_per_unit}
                onChange={(e) =>
                  setNewProduct((p) => ({ ...p, default_cost_inr_per_unit: e.target.value }))
                }
              />
              <input
                className="input"
                placeholder="Unit label"
                value={newProduct.unit_label}
                onChange={(e) => setNewProduct((p) => ({ ...p, unit_label: e.target.value }))}
              />
            </div>
            <textarea
              className="input"
              style={{ marginTop: 8, minHeight: 60 }}
              placeholder="Notes"
              value={newProduct.notes}
              onChange={(e) => setNewProduct((p) => ({ ...p, notes: e.target.value }))}
            />
            <button
              className="btn btn-primary"
              style={{ marginTop: 8 }}
              onClick={handleCreateProduct}
              disabled={addingProduct}
            >
              {addingProduct ? "Saving..." : "Add product"}
            </button>
          </div>
        </div>

        <div>
          <h3 className="section-title">Results</h3>
          {output ? (
            <>
              <div className="flex" style={{ justifyContent: "flex-end", marginBottom: 8 }}>
                <button className="btn btn-ghost" onClick={handleExportCsv}>
                  Export CSV
                </button>
                <label className="pill">
                  <input
                    type="checkbox"
                    checked={explain}
                    onChange={(e) => setExplain(e.target.checked)}
                    style={{ marginRight: 6 }}
                  />
                  Explain calculations
                </label>
              </div>
              <ResultsTable output={output} />
              {explain && <ExplainBox output={output} inputs={inputs} />}
            </>
          ) : (
            <div className="card" style={{ marginTop: 8 }}>
              <p className="muted">Enter inputs and click Calculate to see results.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
