import { useEffect, useMemo, useState } from "react";
import Calculator from "./components/Calculator";
import Products from "./components/Products";
import History from "./components/History";
import { api, get } from "./api/client";
import type { CalculationInput, PageKey } from "./types/app";
import type { CalculationOutput, Product, QuoteRun } from "./api/types";

const defaultInputs: CalculationInput = {
  quantity: 1000,
  cost_inr_per_unit: 250,
  fx_rate_inr_per_usd: 82,
  freight_usd: 400,
  insurance_usd: 150,
  other_costs_usd: 50,
  financing_rate_annual: 12,
  credit_period_months: 4,
  pricing_mode: "A",
  target_net_profit_pct_on_cost: 0.25,
  fixed_invoice_value_usd: null,
  fixed_selling_price_per_unit_usd: null,
  advance_scenarios: [0, 0.25, 0.3, 0.4, 1],
  product_id: null,
};

export default function App() {
  const [activePage, setActivePage] = useState<PageKey>("calculator");
  const [products, setProducts] = useState<Product[]>([]);
  const [inputs, setInputs] = useState<CalculationInput>(defaultInputs);
  const [output, setOutput] = useState<CalculationOutput | null>(null);
  const [history, setHistory] = useState<QuoteRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const pricingMode = inputs.pricing_mode;

  useEffect(() => {
    refreshProducts();
    refreshHistory();
  }, []);

  const refreshProducts = async () => {
    const data = await get<Product[]>("/products");
    setProducts(data);
  };

  const refreshHistory = async () => {
    const data = await get<QuoteRun[]>("/history");
    setHistory(data);
  };

  const handleCalculate = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const payload = { ...inputs };
      const { data } = await api.post<CalculationOutput>("/calculate", payload);
      setOutput(data);
      setMessage("Calculation updated");
    } catch (err: any) {
      setMessage(err?.response?.data?.detail ?? "Calculation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (runName: string) => {
    if (!output) {
      setMessage("Calculate first before saving.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/history", {
        run_name: runName,
        product_id: inputs.product_id,
        inputs: {
          ...inputs,
          pricing_mode: pricingMode,
        },
        outputs: output,
      });
      setMessage("Saved to history");
      await refreshHistory();
    } catch (err: any) {
      setMessage(err?.response?.data?.detail ?? "Save failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadRun = (run: QuoteRun) => {
    setInputs({ ...run.inputs, product_id: run.product_id ?? null });
    setOutput(run.outputs);
    setActivePage("calculator");
    setMessage(`Loaded ${run.run_name}`);
  };

  const navButtons: { key: PageKey; label: string }[] = useMemo(
    () => [
      { key: "calculator", label: "Calculator" },
      { key: "products", label: "Products" },
      { key: "history", label: "History & Compare" },
    ],
    [],
  );

  return (
    <div className="app-shell">
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Quote Calculator</h1>
        <p className="muted">Build export quotations quickly across payment scenarios.</p>
      </header>

      <div className="nav">
        {navButtons.map((btn) => (
          <button
            key={btn.key}
            className={`btn ${activePage === btn.key ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setActivePage(btn.key)}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {message && (
        <div className="card" style={{ marginBottom: 12, borderLeft: "4px solid #2563eb" }}>
          <div style={{ fontWeight: 600 }}>{message}</div>
        </div>
      )}

      {activePage === "calculator" && (
        <Calculator
          inputs={inputs}
          onInputsChange={setInputs}
          output={output}
          onCalculate={handleCalculate}
          onSave={handleSave}
          loading={loading}
          products={products}
          refreshProducts={refreshProducts}
        />
      )}
      {activePage === "products" && (
        <Products products={products} refresh={refreshProducts} setMessage={setMessage} runs={history} />
      )}
      {activePage === "history" && (
        <History runs={history} onRefresh={refreshHistory} onLoadRun={handleLoadRun} />
      )}
    </div>
  );
}
