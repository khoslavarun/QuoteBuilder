import math

from backend.calc import compute_calculation
from backend.schemas import CalculationInputs


def base_inputs(**overrides):
    data = dict(
        quantity=1000,
        cost_inr_per_unit=200,
        fx_rate_inr_per_usd=80,
        freight_usd=500,
        insurance_usd=200,
        other_costs_usd=100,
        financing_rate_annual=12,
        credit_period_months=4,
        pricing_mode="A",
        target_net_profit_pct_on_cost=0.3,
        fixed_invoice_value_usd=None,
        fixed_selling_price_per_unit_usd=None,
        advance_scenarios=[0, 1],
    )
    data.update(overrides)
    return CalculationInputs(**data)


def test_full_advance_has_zero_financing():
    inputs = base_inputs(advance_scenarios=[1])
    result = compute_calculation(inputs)
    scenario = result.scenarios[0]
    assert math.isclose(scenario.financing_cost_usd, 0.0, abs_tol=1e-6)


def test_mode_a_invoice_value_decreases_with_higher_advance():
    inputs = base_inputs(advance_scenarios=[0, 1])
    result = compute_calculation(inputs)
    zero_advance = result.scenarios[0].invoice_value_usd
    full_advance = result.scenarios[1].invoice_value_usd
    assert zero_advance > full_advance


def test_mode_b_net_profit_improves_with_more_advance():
    inputs = base_inputs(
        pricing_mode="B",
        fixed_invoice_value_usd=5000,
        target_net_profit_pct_on_cost=None,
        advance_scenarios=[0, 0.5, 1],
    )
    result = compute_calculation(inputs)
    profits = [s.net_profit_usd for s in result.scenarios]
    assert profits[1] > profits[0]
    assert profits[2] > profits[1]
