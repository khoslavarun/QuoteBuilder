export type Product = {
  id: number;
  name: string;
  default_cost_inr_per_unit: number;
  unit_label: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
};

export type CalculationInputs = {
  quantity: number;
  cost_inr_per_unit: number;
  fx_rate_inr_per_usd: number;
  freight_usd: number;
  insurance_usd: number;
  other_costs_usd: number;
  financing_rate_annual: number;
  credit_period_months: number;
  pricing_mode: "A" | "B";
  target_net_profit_pct_on_cost?: number | null;
  fixed_invoice_value_usd?: number | null;
  fixed_selling_price_per_unit_usd?: number | null;
  advance_scenarios: number[];
};

export type ScenarioResult = {
  advance_pct: number;
  invoice_value_usd: number;
  selling_price_per_unit_usd: number;
  advance_received_usd: number;
  balance_received_usd: number;
  total_shipment_cost_usd: number;
  cash_gap_usd: number;
  financing_cost_usd: number;
  financing_cost_per_unit_usd: number;
  gross_profit_usd: number;
  gross_profit_pct_on_cost: number;
  net_profit_usd: number;
  net_profit_pct_on_cost: number;
  gross_profit_per_unit_usd: number;
  net_profit_per_unit_usd: number;
};

export type CalculationOutput = {
  product_cost_usd_per_unit: number;
  per_unit_addon_usd: number;
  total_landed_cost_per_unit_usd: number;
  total_shipment_cost_usd: number;
  financing_factor: number;
  scenarios: ScenarioResult[];
  explanation: any;
};

export type QuoteRun = {
  id: number;
  run_name: string;
  product_id?: number | null;
  inputs: CalculationInputs;
  outputs: CalculationOutput;
  created_at: string;
};
