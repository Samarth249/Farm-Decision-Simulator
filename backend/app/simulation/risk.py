from typing import List
from app.schemas.scenario import ScenarioCreate
from app.schemas.simulation import ScientificOutputs, EconomicsOutput, RiskOutput

class RiskEngine:
    """
    Model-derived composite risk score calculator (0-100 index).
    
    Sub-component Weights:
    1. Water Stress Deficit Risk (Weight: 40%): derived from 1 - ETa / ETm.
    2. Rainfall Deficit Risk (Weight: 30%): max(0, 1 - rainfall_mm / reference_ETm).
    3. Cost Exposure Risk (Weight: 30%): total_cost / expected_revenue.
    """

    def calculate(
        self,
        scenario: ScenarioCreate,
        scientific: ScientificOutputs,
        economics: EconomicsOutput
    ) -> RiskOutput:
        risk_factors: List[str] = []

        # 1. Water Stress Deficit Risk (Weight: 40%)
        water_stress = scientific.water_output.water_stress_index
        water_risk_score = water_stress * 100.0
        if water_stress > 0.35:
            risk_factors.append(f"High crop water deficit ({round(water_stress * 100, 1)}% deficit)")
        elif water_stress > 0.15:
            risk_factors.append(f"Moderate water stress ({round(water_stress * 100, 1)}% deficit)")

        # 2. Rainfall Deficit Risk (Weight: 30%)
        # Explicit reference_rainfall = ETm (crop potential water requirement)
        reference_rainfall = scientific.water_output.crop_water_req_mm
        actual_rainfall = max(0.0, scenario.water.available)  # rainfall_mm
        
        rain_deficit_ratio = max(0.0, 1.0 - (actual_rainfall / reference_rainfall if reference_rainfall > 0 else 1.0))
        rainfall_risk_score = min(100.0, rain_deficit_ratio * 100.0)
        
        if rain_deficit_ratio > 0.5:
            risk_factors.append(f"High rainfall deficit (received {actual_rainfall}mm vs {reference_rainfall}mm requirement)")

        # 3. Cost Exposure Risk (Weight: 30%)
        cost_ratio = (economics.total_cost / economics.revenue) if economics.revenue > 0 else 1.0
        cost_risk_score = min(100.0, cost_ratio * 100.0)
        if cost_ratio > 0.75:
            risk_factors.append("High financial cost exposure relative to expected revenue")
        if economics.profit < 0:
            risk_factors.append("Projected financial net loss")

        # Composite score calculation (0-100 integer index)
        composite_score = int(round(
            0.40 * water_risk_score +
            0.30 * rainfall_risk_score +
            0.30 * cost_risk_score
        ))
        composite_score = max(0, min(100, composite_score))

        if composite_score < 35:
            level = "Low"
        elif composite_score <= 65:
            level = "Medium"
        else:
            level = "High"

        if not risk_factors:
            risk_factors.append("Optimal water supply and favorable financial margins")

        return RiskOutput(
            score=composite_score,
            level=level,
            factors=risk_factors
        )
