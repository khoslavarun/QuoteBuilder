import type { CalculationOutput } from "../api/types";

type Props = {
  output: CalculationOutput;
};

const rows: { label: string; key: keyof CalculationOutput["scenarios"][number]; format?: (v: number) => string }[] =
  [
    { label: "Advance % of invoice", key: "advance_pct", format: (v) => `${(v * 100).toFixed(0)}%` },
    { label: "Invoice value – USD", key: "invoice_value_usd", format: (v) => v.toFixed(2) },
    { label: "Selling price per unit – USD/unit", key: "selling_price_per_unit_usd", format: (v) => v.toFixed(6) },
    { label: "Advance received – USD", key: "advance_received_usd", format: (v) => v.toFixed(2) },
    { label: "Balance received after credit period – USD", key: "balance_received_usd", format: (v) => v.toFixed(2) },
    { label: "Total shipment cost (landed) – USD", key: "total_shipment_cost_usd", format: (v) => v.toFixed(2) },
    { label: "Cash gap to finance – USD", key: "cash_gap_usd", format: (v) => v.toFixed(2) },
    { label: "Financing cost – USD", key: "financing_cost_usd", format: (v) => v.toFixed(2) },
    { label: "Financing cost per unit – USD/unit", key: "financing_cost_per_unit_usd", format: (v) => v.toFixed(6) },
    { label: "Gross profit (Invoice – Cost) – USD", key: "gross_profit_usd", format: (v) => v.toFixed(2) },
    { label: "Gross profit % on cost", key: "gross_profit_pct_on_cost", format: (v) => `${(v * 100).toFixed(2)}%` },
    { label: "Net profit (after financing) – USD", key: "net_profit_usd", format: (v) => v.toFixed(2) },
    { label: "Net profit % on cost", key: "net_profit_pct_on_cost", format: (v) => `${(v * 100).toFixed(2)}%` },
    { label: "Gross profit per unit – USD", key: "gross_profit_per_unit_usd", format: (v) => v.toFixed(6) },
    { label: "Net profit per unit – USD", key: "net_profit_per_unit_usd", format: (v) => v.toFixed(6) },
  ];

export default function ResultsTable({ output }: Props) {
  return (
    <div className="card" style={{ overflowX: "auto" }}>
      <table className="table">
        <thead>
          <tr>
            <th>Metric</th>
            {output.scenarios.map((s) => (
              <th key={s.advance_pct}>{(s.advance_pct * 100).toFixed(0)}% advance</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td>{row.label}</td>
              {output.scenarios.map((s) => (
                <td key={`${row.key}-${s.advance_pct}`}>
                  {row.format ? row.format(s[row.key] as number) : s[row.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 8 }} className="muted">
        Landed cost per unit: {output.total_landed_cost_per_unit_usd.toFixed(6)} USD/unit | Financing
        factor: {(output.financing_factor * 100).toFixed(2)}%
      </div>
    </div>
  );
}
