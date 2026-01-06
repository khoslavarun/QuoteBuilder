from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, Field


class ProductBase(BaseModel):
    name: str
    default_cost_inr_per_unit: float
    unit_label: str = Field(default="unit")
    notes: Optional[str] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    default_cost_inr_per_unit: Optional[float] = None
    unit_label: Optional[str] = None
    notes: Optional[str] = None


class Product(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class CalculationInputs(BaseModel):
    quantity: float
    cost_inr_per_unit: float
    fx_rate_inr_per_usd: float
    freight_usd: float
    insurance_usd: float
    other_costs_usd: float = 0.0
    financing_rate_annual: float
    credit_period_months: float
    pricing_mode: str
    target_net_profit_pct_on_cost: Optional[float] = None
    fixed_invoice_value_usd: Optional[float] = None
    fixed_selling_price_per_unit_usd: Optional[float] = None
    advance_scenarios: List[float]


class ScenarioResult(BaseModel):
    advance_pct: float
    invoice_value_usd: float
    selling_price_per_unit_usd: float
    advance_received_usd: float
    balance_received_usd: float
    total_shipment_cost_usd: float
    cash_gap_usd: float
    financing_cost_usd: float
    financing_cost_per_unit_usd: float
    gross_profit_usd: float
    gross_profit_pct_on_cost: float
    net_profit_usd: float
    net_profit_pct_on_cost: float
    gross_profit_per_unit_usd: float
    net_profit_per_unit_usd: float


class CalculationOutput(BaseModel):
    product_cost_usd_per_unit: float
    per_unit_addon_usd: float
    total_landed_cost_per_unit_usd: float
    total_shipment_cost_usd: float
    financing_factor: float
    scenarios: List[ScenarioResult]
    explanation: Any


class QuoteRunBase(BaseModel):
    run_name: str
    product_id: Optional[int] = None
    inputs: CalculationInputs
    outputs: CalculationOutput


class QuoteRunCreate(QuoteRunBase):
    pass


class QuoteRun(QuoteRunBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True
