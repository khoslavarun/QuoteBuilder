import type { CalculationOutput } from "../api/types";
import type { CalculationInput } from "../types/app";

type Props = {
  output: CalculationOutput;
  inputs: CalculationInput;
};

export default function ExplainBox({ output, inputs }: Props) {
  return (
    <div className="card" style={{ marginTop: 12 }}>
      <h4 style={{ marginTop: 0 }}>Explain calculations</h4>
      <p className="muted">
        Financing factor = financing rate × (months ÷ 12). Cash gap = max(0, total shipment cost –
        advance). Financing cost = cash gap × financing factor.
      </p>
      <div className="grid-two">
        <div>
          <strong>Base math</strong>
          <ul>
            <li>Product cost in USD/unit = INR cost ÷ FX = {output.product_cost_usd_per_unit.toFixed(6)}</li>
            <li>
              Per-unit add-on = (freight + insurance + other) ÷ quantity = {output.per_unit_addon_usd.toFixed(6)}
            </li>
            <li>Total landed cost per unit = {output.total_landed_cost_per_unit_usd.toFixed(6)}</li>
            <li>Total shipment cost = {output.total_shipment_cost_usd.toFixed(2)} USD</li>
          </ul>
        </div>
        <div>
          <strong>Pricing mode</strong>
          {inputs.pricing_mode === "A" ? (
            <p>
              Mode A – Solve invoice so that net profit % on cost ={" "}
              {(inputs.target_net_profit_pct_on_cost ?? 0) * 100}% considering financing impact.
            </p>
          ) : (
            <p>Mode B – Use the fixed invoice or unit price and show profit impact per advance.</p>
          )}
          <p>Financing factor: {(output.financing_factor * 100).toFixed(2)}%</p>
        </div>
      </div>
    </div>
  );
}
