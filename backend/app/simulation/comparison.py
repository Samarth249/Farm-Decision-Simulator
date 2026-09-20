from typing import List, Dict
from app.schemas.scenario import ScenarioCreate
from app.schemas.comparison import (
    ComparisonRequest,
    ComparisonResult,
    ScenarioComparisonItem,
    MetricDelta
)
from app.services.simulation_service import SimulationService
from app.simulation.factors import FactorAttributionEngine
from app.ai.explainer import DeterministicExplainer

class ComparisonEngine:
    """Multi-scenario comparison engine with factor attribution and rule-based explanations."""

    def __init__(self, simulation_service: SimulationService = None):
        self.sim_service = simulation_service or SimulationService()
        self.attribution_engine = FactorAttributionEngine(self.sim_service)
        self.explainer = DeterministicExplainer()

    def compare(self, request: ComparisonRequest) -> ComparisonResult:
        # 1. Simulate Baseline
        base_scenario = request.baseline_scenario
        base_result = self.sim_service.run_simulation(base_scenario)
        base_item = ScenarioComparisonItem(
            scenario_id=base_result.scenario_id,
            name=base_scenario.name,
            scenario=base_scenario,
            result=base_result
        )

        alt_items: List[ScenarioComparisonItem] = []
        deltas_map: Dict[str, List[MetricDelta]] = {}
        all_key_differences: List[str] = []
        primary_factors = []
        explanations: List[str] = []

        # 2. Simulate & Compare each Alternative Scenario
        for alt_scenario in request.alternative_scenarios:
            alt_result = self.sim_service.run_simulation(alt_scenario)
            alt_item = ScenarioComparisonItem(
                scenario_id=alt_result.scenario_id,
                name=alt_scenario.name,
                scenario=alt_scenario,
                result=alt_result
            )
            alt_items.append(alt_item)

            # Compute Metric Deltas
            scenario_deltas = self._calculate_deltas(base_result, alt_result)
            deltas_map[alt_scenario.name] = scenario_deltas

            # Compute Factor Attribution
            factors = self.attribution_engine.analyze(
                base_scenario, alt_scenario, base_result, alt_result
            )
            if not primary_factors:
                primary_factors = factors

            # Generate key differences summary bullets
            diff_bullets = self._generate_key_differences(base_scenario.name, alt_scenario.name, scenario_deltas)
            all_key_differences.extend(diff_bullets)

            # Generate narrative explanation
            exp = self.explainer.explain(base_scenario.name, alt_scenario.name, scenario_deltas, factors)
            explanations.append(exp)

        combined_explanation = "\n\n".join(explanations)

        return ComparisonResult(
            baseline=base_item,
            alternatives=alt_items,
            deltas=deltas_map,
            key_differences=all_key_differences,
            dominant_factors=primary_factors,
            explanation=combined_explanation
        )

    def _calculate_deltas(self, base_res, alt_res) -> List[MetricDelta]:
        metrics = [
            ("yield", "Estimated Yield (t/ha)", base_res.yield_data.estimated_t_ha, alt_res.yield_data.estimated_t_ha, True),
            ("water", "Water Consumed (mm)", base_res.water_data.consumed_mm, alt_res.water_data.consumed_mm, False),
            ("cost", "Total Production Cost (INR)", base_res.economics_data.total_cost, alt_res.economics_data.total_cost, False),
            ("revenue", "Gross Revenue (INR)", base_res.economics_data.revenue, alt_res.economics_data.revenue, True),
            ("profit", "Net Profit (INR)", base_res.economics_data.profit, alt_res.economics_data.profit, True),
            ("risk", "Risk Score (0-100)", float(base_res.risk_data.score), float(alt_res.risk_data.score), False)
        ]

        deltas: List[MetricDelta] = []
        for key, label, b_val, a_val, higher_is_better in metrics:
            abs_diff = round(a_val - b_val, 2)
            pct = round(((a_val - b_val) / b_val * 100.0) if b_val != 0 else 0.0, 1)
            
            favorable = (abs_diff >= 0) if higher_is_better else (abs_diff <= 0)

            deltas.append(
                MetricDelta(
                    metric=key,
                    metric_label=label,
                    baseline_value=b_val,
                    alternative_value=a_val,
                    abs_diff=abs_diff,
                    pct_change=pct,
                    favorable=favorable
                )
            )

        return deltas

    def _generate_key_differences(self, base_name: str, alt_name: str, deltas: List[MetricDelta]) -> List[str]:
        bullets = []
        delta_map = {d.metric: d for d in deltas}

        yd = delta_map.get("yield")
        if yd and yd.abs_diff != 0:
            word = "higher" if yd.abs_diff > 0 else "lower"
            bullets.append(f"'{alt_name}' has {abs(yd.abs_diff)} t/ha {word} yield than '{base_name}' ({yd.pct_change:+}%).")

        pd = delta_map.get("profit")
        if pd and pd.abs_diff != 0:
            word = "higher" if pd.abs_diff > 0 else "lower"
            bullets.append(f"'{alt_name}' yields INR {abs(pd.abs_diff):,.2f} {word} profit ({pd.pct_change:+}%).")

        wd = delta_map.get("water")
        if wd and wd.abs_diff != 0:
            word = "more" if wd.abs_diff > 0 else "less"
            bullets.append(f"'{alt_name}' consumes {abs(wd.abs_diff)} mm {word} water than '{base_name}'.")

        rd = delta_map.get("risk")
        if rd and rd.abs_diff != 0:
            word = "higher" if rd.abs_diff > 0 else "lower"
            bullets.append(f"'{alt_name}' carries {word} water & financial risk (Risk Score: {rd.alternative_value} vs {rd.baseline_value}).")

        return bullets
