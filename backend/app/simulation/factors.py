import copy
from typing import List, Dict, Any
from app.schemas.scenario import ScenarioCreate
from app.schemas.simulation import SimulationResult, FactorContribution
from app.services.simulation_service import SimulationService

class FactorAttributionEngine:
    """
    Factor Attribution Engine using controlled single-variable perturbation.
    Provides model-based estimated contribution percentages for why outcomes changed.
    """

    def __init__(self, simulation_service: SimulationService = None):
        self.sim_service = simulation_service or SimulationService()

    def analyze(
        self,
        baseline: ScenarioCreate,
        alternative: ScenarioCreate,
        base_result: SimulationResult,
        alt_result: SimulationResult
    ) -> List[FactorContribution]:
        contributions: List[FactorContribution] = []

        # Identify changed variables between baseline and alternative
        changed_vars: Dict[str, Any] = {}

        # Water checks
        if baseline.water.available != alternative.water.available:
            changed_vars["water.available"] = ("Water Availability", alternative.water.available)
        if baseline.water.irrigation != alternative.water.irrigation:
            changed_vars["water.irrigation"] = ("Irrigation Allocation", alternative.water.irrigation)
        if baseline.water.method != alternative.water.method:
            changed_vars["water.method"] = ("Irrigation Method", alternative.water.method)

        # Planting date check
        if baseline.planting_date != alternative.planting_date:
            changed_vars["planting_date"] = ("Planting Date", alternative.planting_date)

        # Crop check
        if baseline.crop != alternative.crop:
            changed_vars["crop"] = ("Crop Selection", alternative.crop)

        # Farm area check
        if abs(baseline.farm_area_ha - alternative.farm_area_ha) > 1e-4:
            changed_vars["farm_area_ha"] = ("Farm Area", alternative.farm_area_ha)

        # Financial inputs check
        base_inputs_total = (
            baseline.inputs.seed_cost + baseline.inputs.fertilizer_cost +
            baseline.inputs.labor_cost + baseline.inputs.machinery_cost + baseline.inputs.other_cost
        )
        alt_inputs_total = (
            alternative.inputs.seed_cost + alternative.inputs.fertilizer_cost +
            alternative.inputs.labor_cost + alternative.inputs.machinery_cost + alternative.inputs.other_cost
        )
        if abs(base_inputs_total - alt_inputs_total) > 1.0:
            changed_vars["inputs"] = ("Input Expenditure", alt_inputs_total)

        if not changed_vars:
            return [
                FactorContribution(
                    factor="Unchanged Operational Parameters",
                    impact=0.0,
                    metric="yield",
                    direction="neutral",
                    contribution_pct=0.0
                )
            ]

        # Calculate primary metric delta (Estimated Yield)
        total_yield_delta = alt_result.yield_data.estimated_t_ha - base_result.yield_data.estimated_t_ha

        # Perturbation step per changed variable
        variable_impacts: List[Dict[str, Any]] = []
        sum_abs_impacts = 0.0

        for var_key, (var_label, new_val) in changed_vars.items():
            # Create single-variable perturbed scenario from baseline
            perturbed_scenario = copy.deepcopy(baseline)

            if var_key == "water.available":
                perturbed_scenario.water.available = new_val
            elif var_key == "water.irrigation":
                perturbed_scenario.water.irrigation = new_val
            elif var_key == "water.method":
                perturbed_scenario.water.method = new_val
            elif var_key == "planting_date":
                perturbed_scenario.planting_date = new_val
            elif var_key == "crop":
                perturbed_scenario.crop = new_val
            elif var_key == "farm_area_ha":
                perturbed_scenario.farm_area_ha = new_val
            elif var_key == "inputs":
                perturbed_scenario.inputs = copy.deepcopy(alternative.inputs)

            # Run single-variable perturbation simulation
            perturbed_result = self.sim_service.run_simulation(perturbed_scenario)

            # Measure yield impact & financial cost impact
            part_yield_delta = perturbed_result.yield_data.estimated_t_ha - base_result.yield_data.estimated_t_ha
            part_cost_delta = perturbed_result.economics_data.total_cost - base_result.economics_data.total_cost

            if abs(part_yield_delta) > 1e-4:
                metric = "yield"
                impact = part_yield_delta
                abs_impact = abs(part_yield_delta)
            elif abs(part_cost_delta) > 1.0:
                metric = "cost"
                impact = part_cost_delta
                # Scale financial cost impact to equivalent attribution weight
                abs_impact = abs(part_cost_delta) / 1000.0
            else:
                metric = "model"
                impact = 0.0
                abs_impact = 0.0

            sum_abs_impacts += abs_impact
            direction = "positive" if impact > 0 else ("negative" if impact < 0 else "neutral")

            variable_impacts.append({
                "factor": var_label,
                "impact": round(impact, 2),
                "metric": metric,
                "direction": direction,
                "abs_impact": abs_impact
            })

        # Normalize contribution percentages
        for item in variable_impacts:
            if sum_abs_impacts > 1e-4:
                pct = round((item["abs_impact"] / sum_abs_impacts) * 100.0, 1)
            else:
                # If no variable produced a measurable output delta, set contribution to 0.0%
                pct = 0.0

            contributions.append(
                FactorContribution(
                    factor=item["factor"],
                    impact=item["impact"],
                    metric=item["metric"],
                    direction=item["direction"],
                    contribution_pct=pct
                )
            )

        # Sort by contribution percentage descending
        contributions.sort(key=lambda x: x.contribution_pct, reverse=True)
        return contributions
