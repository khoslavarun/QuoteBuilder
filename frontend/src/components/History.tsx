import { useMemo, useState } from "react";
import type { QuoteRun } from "../api/types";

type Props = {
  runs: QuoteRun[];
  onRefresh: () => Promise<void>;
  onLoadRun: (run: QuoteRun) => void;
};

const formatDate = (iso: string) => new Date(iso).toLocaleString();

export default function History({ runs, onRefresh, onLoadRun }: Props) {
  const [search, setSearch] = useState("");
  const [compareA, setCompareA] = useState<number | "">("");
  const [compareB, setCompareB] = useState<number | "">("");

  const filtered = useMemo(() => {
    return runs.filter((r) => r.run_name.toLowerCase().includes(search.toLowerCase()));
  }, [runs, search]);

  const runA = typeof compareA === "number" ? runs.find((r) => r.id === compareA) : undefined;
  const runB = typeof compareB === "number" ? runs.find((r) => r.id === compareB) : undefined;

  const renderRun = (run?: QuoteRun) => {
    if (!run) return null;
    const firstScenario = run.outputs.scenarios[0];
    const lastScenario = run.outputs.scenarios[run.outputs.scenarios.length - 1];
    return (
      <div className="card" style={{ marginTop: 8 }}>
        <h4 style={{ marginTop: 0 }}>{run.run_name}</h4>
        <p className="muted">
          Mode {run.inputs.pricing_mode} • Qty {run.inputs.quantity} • Financing{" "}
          {run.inputs.financing_rate_annual}% p.a. for {run.inputs.credit_period_months} months
        </p>
        <div className="grid-two">
          <div>
            <strong>Lowest advance</strong>
            <div>Advance: {(firstScenario.advance_pct * 100).toFixed(0)}%</div>
            <div>Invoice: {firstScenario.invoice_value_usd.toFixed(2)} USD</div>
            <div>Net profit: {firstScenario.net_profit_usd.toFixed(2)} USD</div>
          </div>
          <div>
            <strong>Highest advance</strong>
            <div>Advance: {(lastScenario.advance_pct * 100).toFixed(0)}%</div>
            <div>Invoice: {lastScenario.invoice_value_usd.toFixed(2)} USD</div>
            <div>Net profit: {lastScenario.net_profit_usd.toFixed(2)} USD</div>
          </div>
        </div>
        <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => onLoadRun(run)}>
          Load into calculator
        </button>
      </div>
    );
  };

  return (
    <div className="card">
      <div className="flex" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h3 className="section-title" style={{ marginBottom: 0 }}>
          History
        </h3>
        <button className="btn btn-ghost" onClick={onRefresh}>
          Refresh
        </button>
      </div>
      <input
        className="input"
        placeholder="Search by run name"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ margin: "8px 0" }}
      />
      <div style={{ display: "grid", gap: 8 }}>
        {filtered.map((run) => (
          <div key={run.id} className="card">
            <div className="flex" style={{ justifyContent: "space-between" }}>
              <div>
                <strong>{run.run_name}</strong>
                <div className="muted">
                  Created {formatDate(run.created_at)} • Mode {run.inputs.pricing_mode}
                </div>
              </div>
              <button className="btn btn-primary" onClick={() => onLoadRun(run)}>
                Load into calculator
              </button>
            </div>
            <details style={{ marginTop: 6 }}>
              <summary>Show results snapshot</summary>
              <div className="grid-two" style={{ marginTop: 8 }}>
                <div>
                  <div>Quantity: {run.inputs.quantity}</div>
                  <div>FX: {run.inputs.fx_rate_inr_per_usd}</div>
                  <div>Financing: {run.inputs.financing_rate_annual}% p.a.</div>
                </div>
                <div>
                  <div>Advance options: {run.inputs.advance_scenarios.map((p) => `${(p * 100).toFixed(0)}%`).join(", ")}</div>
                  <div>
                    Net profit range:{" "}
                    {run.outputs.scenarios[0].net_profit_usd.toFixed(2)} →{" "}
                    {run.outputs.scenarios[run.outputs.scenarios.length - 1].net_profit_usd.toFixed(2)} USD
                  </div>
                </div>
              </div>
            </details>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h4 style={{ marginTop: 0 }}>Compare two runs</h4>
        <div className="grid-two">
          <select
            className="input"
            value={compareA}
            onChange={(e) => setCompareA(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">Select Run A</option>
            {runs.map((r) => (
              <option key={r.id} value={r.id}>
                {r.run_name}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={compareB}
            onChange={(e) => setCompareB(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">Select Run B</option>
            {runs.map((r) => (
              <option key={r.id} value={r.id}>
                {r.run_name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid-two" style={{ marginTop: 10 }}>
          {renderRun(runA)}
          {renderRun(runB)}
        </div>
      </div>
    </div>
  );
}
