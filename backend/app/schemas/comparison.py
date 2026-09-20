from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.scenario import ScenarioCreate
from app.schemas.simulation import SimulationResult, FactorContribution

class ScenarioComparisonItem(BaseModel):
    scenario_id: Optional[str] = None
    name: str
    scenario: ScenarioCreate
    result: SimulationResult

class MetricDelta(BaseModel):
    metric: str = Field(..., description="Key identifier of target metric (e.g. yield, water, cost, profit, risk)")
    metric_label: str = Field(..., description="Human readable label")
    baseline_value: float = Field(..., description="Metric value in baseline scenario")
    alternative_value: float = Field(..., description="Metric value in alternative scenario")
    abs_diff: float = Field(..., description="Absolute numeric difference (Alternative - Baseline)")
    pct_change: float = Field(..., description="Percentage change relative to baseline (%)")
    favorable: bool = Field(..., description="Whether this delta represents an advantageous outcome")

class ComparisonRequest(BaseModel):
    baseline_scenario: ScenarioCreate = Field(..., description="The baseline farming scenario")
    alternative_scenarios: List[ScenarioCreate] = Field(..., min_length=1, max_length=4, description="List of alternative scenarios to compare against baseline")

class ComparisonResult(BaseModel):
    baseline: ScenarioComparisonItem
    alternatives: List[ScenarioComparisonItem]
    deltas: Dict[str, List[MetricDelta]] = Field(..., description="Keyed by alternative scenario name or ID")
    key_differences: List[str] = Field(default_factory=list, description="Bullet point summary of significant differences")
    dominant_factors: List[FactorContribution] = Field(default_factory=list, description="Model-based estimated factor attribution")
    explanation: str = Field(..., description="Deterministic human-readable explanation")
