from typing import List, Dict, Any
from app.schemas.simulation import FactorContribution
from app.schemas.comparison import MetricDelta

class DeterministicExplainer:
    """
    100% reliable rule-based explanation engine.
    Translates factor attribution and metric deltas into structured human explanations.
    Does not depend on external AI APIs.
    """

    def explain(
        self,
        baseline_name: str,
        alt_name: str,
        deltas: List[MetricDelta],
        factors: List[FactorContribution]
    ) -> str:
        # Locate key metric deltas
        delta_map = {d.metric: d for d in deltas}

        yield_delta = delta_map.get("yield")
        profit_delta = delta_map.get("profit")
        risk_delta = delta_map.get("risk")
        water_delta = delta_map.get("water")

        paragraphs: List[str] = []

        # 1. Primary Yield & Economic Summary
        if yield_delta and yield_delta.abs_diff != 0:
            direction_str = "increased" if yield_delta.abs_diff > 0 else "decreased"
            abs_val = abs(yield_delta.abs_diff)
            pct_val = abs(yield_delta.pct_change)
            
            p1 = (
                f"Comparing '{alt_name}' against baseline '{baseline_name}': "
                f"Estimated yield {direction_str} by {abs_val} t/ha ({pct_val}%)."
            )
            if profit_delta:
                prof_dir = "increased" if profit_delta.abs_diff > 0 else "decreased"
                p1 += f" Net profit {prof_dir} by INR {abs(profit_delta.abs_diff):,.2f}."
            paragraphs.append(p1)

        # 2. Factor Attribution Breakdown
        if factors:
            top_factor = factors[0]
            if top_factor.contribution_pct > 0:
                p2 = (
                    f"The change is primarily attributed to {top_factor.factor.lower()} "
                    f"(estimated model contribution: {top_factor.contribution_pct}%)."
                )
                if len(factors) > 1 and factors[1].contribution_pct > 15:
                    p2 += f" Secondary factor: {factors[1].factor.lower()} ({factors[1].contribution_pct}%)."
                paragraphs.append(p2)

        # 3. Water & Risk Assessment
        if risk_delta or water_delta:
            risk_text = ""
            if risk_delta and risk_delta.abs_diff != 0:
                r_dir = "higher" if risk_delta.abs_diff > 0 else "lower"
                risk_text = f"Composite risk score is {r_dir} by {abs(risk_delta.abs_diff)} points."
            
            water_text = ""
            if water_delta and water_delta.abs_diff != 0:
                w_dir = "lower" if water_delta.abs_diff < 0 else "higher"
                water_text = f" Water consumption is {w_dir} by {abs(water_delta.abs_diff)} mm."

            paragraphs.append(f"{risk_text}{water_text}".strip())

        if not paragraphs:
            return "Both scenarios produce identical operational and financial outcomes."

        return "\n\n".join(paragraphs)
