from typing import Dict, List

from .schemas import CalculationInputs, CalculationOutput, ScenarioResult


def _round_currency(value: float) -> float:
    return round(value + 1e-9, 2)


def _round_unit(value: float) -> float:
    return round(value + 1e-9, 6)


def compute_calculation(inputs: CalculationInputs) -> CalculationOutput:
    quantity = inputs.quantity
    fx_rate = inputs.fx_rate_inr_per_usd
    product_cost_usd_per_unit = inputs.cost_inr_per_unit / fx_rate if fx_rate else 0.0

    total_addons_usd = inputs.freight_usd + inputs.insurance_usd + inputs.other_costs_usd
    per_unit_addon_usd = total_addons_usd / quantity if quantity else 0.0
    total_landed_cost_per_unit = product_cost_usd_per_unit + per_unit_addon_usd
    total_shipment_cost_usd = total_landed_cost_per_unit * quantity

    financing_factor = inputs.financing_rate_annual * (inputs.credit_period_months / 12) / 100

    scenarios: List[ScenarioResult] = []
    explain_rows: List[Dict[str, str]] = []

    for advance_pct in inputs.advance_scenarios:
        if inputs.pricing_mode == "A":
            target_pct = inputs.target_net_profit_pct_on_cost or 0.0
            if advance_pct >= 1.0:
                invoice_value = total_shipment_cost_usd * (1 + target_pct)
                financing_cost = 0.0
            else:
                numerator = total_shipment_cost_usd * (1 + target_pct + financing_factor)
                denominator = 1 + advance_pct * financing_factor
                invoice_value = numerator / denominator if denominator else 0.0
                cash_gap = max(0.0, total_shipment_cost_usd - advance_pct * invoice_value)
                financing_cost = cash_gap * financing_factor
        elif inputs.pricing_mode == "B":
            if inputs.fixed_invoice_value_usd is not None:
                invoice_value = inputs.fixed_invoice_value_usd
            elif inputs.fixed_selling_price_per_unit_usd is not None:
                invoice_value = inputs.fixed_selling_price_per_unit_usd * quantity
            else:
                raise ValueError("Mode B requires invoice value or selling price per unit.")
            cash_gap = max(0.0, total_shipment_cost_usd - advance_pct * invoice_value)
            financing_cost = cash_gap * financing_factor
        else:
            raise ValueError("Invalid pricing mode.")

        selling_price_per_unit = invoice_value / quantity if quantity else 0.0
        advance_received = advance_pct * invoice_value
        balance_received = invoice_value - advance_received
        gross_profit = invoice_value - total_shipment_cost_usd
        net_profit = gross_profit - financing_cost

        scenario_result = ScenarioResult(
            advance_pct=advance_pct,
            invoice_value_usd=_round_currency(invoice_value),
            selling_price_per_unit_usd=_round_unit(selling_price_per_unit),
            advance_received_usd=_round_currency(advance_received),
            balance_received_usd=_round_currency(balance_received),
            total_shipment_cost_usd=_round_currency(total_shipment_cost_usd),
            cash_gap_usd=_round_currency(max(0.0, total_shipment_cost_usd - advance_received)),
            financing_cost_usd=_round_currency(financing_cost),
            financing_cost_per_unit_usd=_round_unit(financing_cost / quantity if quantity else 0.0),
            gross_profit_usd=_round_currency(gross_profit),
            gross_profit_pct_on_cost=_round_unit(
                gross_profit / total_shipment_cost_usd if total_shipment_cost_usd else 0.0
            ),
            net_profit_usd=_round_currency(net_profit),
            net_profit_pct_on_cost=_round_unit(
                net_profit / total_shipment_cost_usd if total_shipment_cost_usd else 0.0
            ),
            gross_profit_per_unit_usd=_round_unit(gross_profit / quantity if quantity else 0.0),
            net_profit_per_unit_usd=_round_unit(net_profit / quantity if quantity else 0.0),
        )
        scenarios.append(scenario_result)

        explain_rows.append(
            {
                "advance_pct": f"{advance_pct*100:.0f}%",
                "invoice_value": f"Invoice = Cost × (1 + target + factor) ÷ (1 + advance×factor)",
                "financing_cost": f"Financing = max(0, Cost – Advance×Invoice) × {financing_factor:.4f}",
            }
        )

    explanation = {
        "base": {
            "product_cost_usd_per_unit": product_cost_usd_per_unit,
            "per_unit_addon_usd": per_unit_addon_usd,
            "total_landed_cost_per_unit": total_landed_cost_per_unit,
            "total_shipment_cost_usd": total_shipment_cost_usd,
        },
        "financing_factor": financing_factor,
        "rows": explain_rows,
    }

    return CalculationOutput(
        product_cost_usd_per_unit=_round_unit(product_cost_usd_per_unit),
        per_unit_addon_usd=_round_unit(per_unit_addon_usd),
        total_landed_cost_per_unit_usd=_round_unit(total_landed_cost_per_unit),
        total_shipment_cost_usd=_round_currency(total_shipment_cost_usd),
        financing_factor=_round_unit(financing_factor),
        scenarios=scenarios,
        explanation=explanation,
    )
