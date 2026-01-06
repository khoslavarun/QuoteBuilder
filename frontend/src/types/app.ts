import { CalculationInputs } from "../api/types";

export type PageKey = "calculator" | "products" | "history";

export type CalculationInput = CalculationInputs & {
  product_id: number | null;
};
