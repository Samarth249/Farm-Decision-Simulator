from app.schemas.scenario import ScenarioCreate
from app.schemas.simulation import ScientificOutputs, EconomicsOutput

# Cost of irrigation pumping/operation per mm per hectare (₹)
IRRIGATION_COST_PER_MM_PER_HA = 20.0

class CostEngine:
    """Transparent economic cost and revenue calculator."""

    def calculate(self, scenario: ScenarioCreate, scientific: ScientificOutputs) -> EconomicsOutput:
        # Inputs cost total
        inputs_cost = (
            scenario.inputs.seed_cost
            + scenario.inputs.fertilizer_cost
            + scenario.inputs.machinery_cost
            + scenario.inputs.other_cost
        )
        labor_cost = scenario.inputs.labor_cost

        # Irrigation operating cost based on effective water applied
        irrigation_cost = (
            scientific.water_output.irrigation_applied_mm
            * IRRIGATION_COST_PER_MM_PER_HA
            * scenario.farm_area_ha
        )

        total_cost = round(inputs_cost + labor_cost + irrigation_cost, 2)

        # Gross Revenue: Yield (t/ha) * Area (ha) * Market Price (₹/t)
        total_tonnes = scientific.yield_output.estimated_t_ha * scenario.farm_area_ha
        revenue = round(total_tonnes * scenario.economics.market_price, 2)

        profit = round(revenue - total_cost, 2)

        roi_pct = round((profit / total_cost * 100.0) if total_cost > 0 else 0.0, 2)

        return EconomicsOutput(
            input_cost=round(inputs_cost, 2),
            irrigation_cost=round(irrigation_cost, 2),
            labor_cost=round(labor_cost, 2),
            total_cost=total_cost,
            revenue=revenue,
            profit=profit,
            roi_percentage=roi_pct
        )
